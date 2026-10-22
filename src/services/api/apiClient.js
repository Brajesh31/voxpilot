// Centralized Production HTTP Client for VoxPilot
import { createApiHeaders } from '../../utils/apiKeyManager.js';

/**
 * Standardized API Error class for VoxPilot
 */
export class ApiError extends Error {
  constructor(message, status = 0, data = null, code = 'API_ERROR') {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.code = code;
  }
}

/**
 * Perform a fetch request with timeout, dynamic headers, request cancellation, and normalized error handling
 * @param {string} url
 * @param {RequestInit & { timeoutMs?: number }} options
 * @returns {Promise<any>}
 */
export async function apiClient(url, options = {}) {
  const { timeoutMs = 15000, headers = {}, body, signal: externalSignal, ...restOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  // Link external AbortSignal if caller provided one (for request cancellation on unmount)
  if (externalSignal) {
    if (externalSignal.aborted) {
      clearTimeout(timeoutId);
      throw new ApiError('Request was cancelled.', 499, null, 'ERR_CANCELLED');
    }
    externalSignal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  // Dynamic headers with fresh x-api-key
  const mergedHeaders = createApiHeaders(headers);

  // Automatically serialize objects to JSON strings
  let processedBody = body;
  if (body && typeof body === 'object' && !(body instanceof FormData) && !(body instanceof Blob)) {
    processedBody = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, {
      ...restOptions,
      headers: mergedHeaders,
      body: processedBody,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // 204 No Content
    if (response.status === 204) {
      return null;
    }

    // Parse JSON response body if present
    const contentType = response.headers.get('content-type') || '';
    let data = null;
    if (contentType.includes('application/json')) {
      data = await response.json().catch(() => null);
    } else {
      const text = await response.text().catch(() => '');
      data = text ? { message: text } : null;
    }

    if (!response.ok) {
      if (response.status === 401) {
        throw new ApiError(
          'Unauthorized: Your VoxPilot API key is invalid or has expired. Please re-enter your credential in Settings.',
          401,
          data,
          'ERR_UNAUTHORIZED'
        );
      }
      if (response.status === 403) {
        throw new ApiError(
          'Forbidden: You do not have permission to access or modify this resource.',
          403,
          data,
          'ERR_FORBIDDEN'
        );
      }
      if (response.status === 404) {
        throw new ApiError('Requested resource was not found on the voice gateway.', 404, data, 'ERR_NOT_FOUND');
      }
      if (response.status === 429) {
        throw new ApiError(
          'Rate limit exceeded. Please wait a few seconds before dispatching additional requests.',
          429,
          data,
          'ERR_RATE_LIMITED'
        );
      }
      if (response.status >= 500) {
        throw new ApiError(
          'The voice engine service encountered a server error. Please retry in a few moments.',
          response.status,
          data,
          'ERR_SERVER'
        );
      }

      const serverMsg = data?.message || data?.error || response.statusText || 'Operation failed';
      throw new ApiError(serverMsg, response.status, data, 'ERR_BAD_REQUEST');
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      if (externalSignal?.aborted) {
        throw new ApiError('Request was cancelled.', 499, null, 'ERR_CANCELLED');
      }
      throw new ApiError(
        `Request timed out after ${Math.round(timeoutMs / 1000)} seconds. Please check your network connection.`,
        408,
        null,
        'ERR_TIMEOUT'
      );
    }

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(error.message || 'Network connection failed. Please verify your connection.', 0, null, 'ERR_NETWORK');
  }
}

// Convenience HTTP method wrappers
apiClient.get = (url, options = {}) => apiClient(url, { ...options, method: 'GET' });
apiClient.post = (url, body, options = {}) => apiClient(url, { ...options, method: 'POST', body });
apiClient.patch = (url, body, options = {}) => apiClient(url, { ...options, method: 'PATCH', body });
apiClient.delete = (url, options = {}) => apiClient(url, { ...options, method: 'DELETE' });

export default apiClient;
