// API Key Management Utilities for VoxPilot

const API_KEY_STORAGE_KEY = 'x-api-key';
const VALIDATED_FLAG_KEY = 'api-key-validated';
const VALIDATED_AT_KEY = 'api-key-validated-at';

/**
 * Store the API key in localStorage
 * @param {string} apiKey
 */
export const setApiKey = (apiKey) => {
  if (typeof apiKey === 'string') {
    localStorage.setItem(API_KEY_STORAGE_KEY, apiKey.trim());
  }
};

/**
 * Retrieve the current API key from localStorage dynamically
 * @returns {string}
 */
export const getApiKey = () => {
  try {
    return localStorage.getItem(API_KEY_STORAGE_KEY)?.trim() || '';
  } catch {
    return '';
  }
};

/**
 * Remove the API key and associated validation metadata
 */
export const removeApiKey = () => {
  try {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    localStorage.removeItem(VALIDATED_FLAG_KEY);
    localStorage.removeItem(VALIDATED_AT_KEY);
  } catch {
    // Storage access restricted in sandboxed iframe or private mode
  }
};

/**
 * Check if an API key exists in storage
 * @returns {boolean}
 */
export const hasApiKey = () => {
  return Boolean(getApiKey());
};

/**
 * Check if the stored API key has been validated by backend
 * @returns {boolean}
 */
export const isApiKeyValidated = () => {
  try {
    return localStorage.getItem(VALIDATED_FLAG_KEY) === 'true';
  } catch {
    return false;
  }
};

/**
 * Mark the API key as validated with timestamp
 */
export const markApiKeyValidated = () => {
  try {
    localStorage.setItem(VALIDATED_FLAG_KEY, 'true');
    localStorage.setItem(VALIDATED_AT_KEY, new Date().toISOString());
  } catch {
    // Storage access restricted
  }
};

/**
 * Get API key validation timestamp
 * @returns {string|null}
 */
export const getApiKeyValidationTime = () => {
  try {
    return localStorage.getItem(VALIDATED_AT_KEY);
  } catch {
    return null;
  }
};

/**
 * Create request headers with x-api-key dynamically evaluated
 * @param {Record<string, string>} additionalHeaders
 * @returns {Record<string, string>}
 */
export const createApiHeaders = (additionalHeaders = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...additionalHeaders,
  };

  const key = getApiKey();
  if (key) {
    headers['x-api-key'] = key;
  }

  return headers;
};

/**
 * Validate basic API key format
 * @param {unknown} apiKey
 * @returns {boolean}
 */
export const isValidApiKey = (apiKey) => {
  return typeof apiKey === 'string' && apiKey.trim().length >= 8;
};

/**
 * Return a masked representation of the API key for safe display (e.g. "••••••••1234")
 * @returns {string}
 */
export const getMaskedApiKey = () => {
  const key = getApiKey();
  if (!key) return '';
  if (key.length <= 4) return '••••';
  const tail = key.slice(-4);
  return `••••••••${tail}`;
};
