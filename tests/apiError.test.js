import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiError } from '../src/services/api/apiClient.js';

test('ApiError encapsulates message, status code, payload, and code', () => {
  const err = new ApiError('Unauthorized access', 401, { reason: 'expired_key' }, 'ERR_UNAUTHORIZED');
  assert.strictEqual(err.message, 'Unauthorized access');
  assert.strictEqual(err.status, 401);
  assert.deepStrictEqual(err.data, { reason: 'expired_key' });
  assert.strictEqual(err.code, 'ERR_UNAUTHORIZED');
  assert.strictEqual(err.name, 'ApiError');
});

test('ApiError defaults to status 0 and API_ERROR code when not specified', () => {
  const err = new ApiError('Generic network error');
  assert.strictEqual(err.status, 0);
  assert.strictEqual(err.data, null);
  assert.strictEqual(err.code, 'API_ERROR');
});

test('ApiError handles timeout and cancellation codes distinctly', () => {
  const timeoutErr = new ApiError('Request timed out', 408, null, 'ERR_TIMEOUT');
  const cancelErr = new ApiError('Request cancelled', 499, null, 'ERR_CANCELLED');
  assert.strictEqual(timeoutErr.status, 408);
  assert.strictEqual(timeoutErr.code, 'ERR_TIMEOUT');
  assert.strictEqual(cancelErr.status, 499);
  assert.strictEqual(cancelErr.code, 'ERR_CANCELLED');
});
