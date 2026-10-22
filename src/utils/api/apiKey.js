// API Key Verification Services
import { testApiKeyUrl } from '../config';
import { apiClient } from '../../services/api/apiClient';
import { getApiKey, markApiKeyValidated, removeApiKey, setApiKey } from '../apiKeyManager';

/**
 * Validate an API key by making a test request
 * @param {string} apiKey
 * @returns {Promise<{ isValid: boolean, message: string, data?: any, error?: string }>}
 */
export const validateApiKey = async (apiKey) => {
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    return {
      isValid: false,
      message: 'Please provide a valid API key.',
    };
  }

  try {
    const data = await apiClient.get(testApiKeyUrl, {
      headers: { 'x-api-key': apiKey.trim() },
    });

    return {
      isValid: true,
      data,
      message: 'API key validated successfully.',
    };
  } catch (error) {
    return {
      isValid: false,
      error: error.message,
      message: error.status === 401 
        ? 'Invalid or expired API key. Please check your credentials.' 
        : (error.message || 'Validation request failed.'),
    };
  }
};

/**
 * Validate the currently stored API key
 */
export const validateCurrentApiKey = async () => {
  const currentKey = getApiKey();
  if (!currentKey) {
    return {
      isValid: false,
      error: 'No API key found',
      message: 'Please set an API key first.',
    };
  }
  return validateApiKey(currentKey);
};

/**
 * Test an API key and update stored credentials on success
 * @param {string} apiKey
 */
export const testApiKey = async (apiKey) => {
  const result = await validateApiKey(apiKey);

  if (result.isValid) {
    setApiKey(apiKey);
    markApiKeyValidated();
  } else {
    removeApiKey();
  }

  return result;
};

/**
 * Check if the stored key should be re-validated (e.g. after 24 hours)
 * @returns {boolean}
 */
export const shouldRevalidateApiKey = () => {
  const validatedAt = localStorage.getItem('api-key-validated-at');
  if (!validatedAt) return true;

  const validationTime = new Date(validatedAt).getTime();
  const now = Date.now();
  const hoursSinceValidation = (now - validationTime) / (1000 * 60 * 60);

  return hoursSinceValidation > 24;
};