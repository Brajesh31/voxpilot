// International Phone Number Utilities for VoxPilot

export const SUPPORTED_COUNTRY_CODES = [
  { code: '+1', name: 'United States & Canada', dialCode: '1', flag: '🇺🇸' },
  { code: '+91', name: 'India', dialCode: '91', flag: '🇮🇳' },
  { code: '+44', name: 'United Kingdom', dialCode: '44', flag: '🇬🇧' },
  { code: '+61', name: 'Australia', dialCode: '61', flag: '🇦🇺' },
  { code: '+49', name: 'Germany', dialCode: '49', flag: '🇩🇪' },
  { code: '+33', name: 'France', dialCode: '33', flag: '🇫🇷' },
  { code: '+81', name: 'Japan', dialCode: '81', flag: '🇯🇵' },
  { code: '+971', name: 'United Arab Emirates', dialCode: '971', flag: '🇦🇪' },
  { code: '+65', name: 'Singapore', dialCode: '65', flag: '🇸🇬' },
];

/**
 * Strip all non-digit characters from input
 * @param {string} raw
 * @returns {string}
 */
export function extractDigits(raw) {
  if (typeof raw !== 'string') return '';
  return raw.replace(/\D/g, '');
}

/**
 * Normalize and construct E.164 international phone number format
 * @param {string} rawNumber - Subscriber digits (e.g. "9876543210")
 * @param {string} [countryCode="+91"] - Dial prefix (e.g. "+91" or "+1")
 * @returns {string} - Formatted E.164 string (e.g. "+919876543210")
 */
export function formatE164(rawNumber, countryCode = '+91') {
  const digits = extractDigits(rawNumber);
  const cleanPrefix = countryCode.startsWith('+') ? countryCode : `+${countryCode}`;
  
  // If the user already pasted the full international number starting with +
  if (typeof rawNumber === 'string' && rawNumber.trim().startsWith('+')) {
    return `+${digits}`;
  }

  return `${cleanPrefix}${digits}`;
}

/**
 * Validate an international phone number
 * @param {string} rawNumber
 * @param {string} [countryCode="+91"]
 * @returns {{ isValid: boolean, error?: string, formatted: string }}
 */
export function validatePhoneNumber(rawNumber, countryCode = '+91') {
  if (!rawNumber || typeof rawNumber !== 'string') {
    return { isValid: false, error: 'Phone number is required', formatted: '' };
  }

  const digits = extractDigits(rawNumber);

  if (digits.length === 0) {
    return { isValid: false, error: 'Please enter recipient phone number digits', formatted: '' };
  }

  if (digits.length < 7) {
    return { isValid: false, error: 'Phone number is too short (minimum 7 digits required)', formatted: '' };
  }

  if (digits.length > 15) {
    return { isValid: false, error: 'Phone number exceeds maximum length of 15 digits', formatted: '' };
  }

  const formatted = formatE164(rawNumber, countryCode);

  return {
    isValid: true,
    formatted,
  };
}

/**
 * Mask a phone number for safe display without exposing full digits
 * @param {string} raw
 * @returns {string} - e.g. "+91 ••••• ••789"
 */
export function maskPhoneNumber(raw) {
  if (!raw || typeof raw !== 'string') return '••••';
  const trimmed = raw.trim();
  if (trimmed.length <= 4) return trimmed;
  const tail = trimmed.slice(-4);
  const head = trimmed.startsWith('+') ? trimmed.slice(0, 3) : '';
  return `${head} •••• ••${tail}`;
}
