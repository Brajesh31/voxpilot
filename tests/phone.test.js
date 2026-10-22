import test from 'node:test';
import assert from 'node:assert/strict';
import { extractDigits, formatE164, validatePhoneNumber, maskPhoneNumber } from '../src/utils/phone.js';

test('extractDigits strips non-numeric characters', () => {
  assert.strictEqual(extractDigits('+91 (987) 654-3210'), '919876543210');
  assert.strictEqual(extractDigits('abc123xyz'), '123');
  assert.strictEqual(extractDigits(''), '');
  assert.strictEqual(extractDigits(null), '');
});

test('formatE164 standardizes international format with prefix', () => {
  assert.strictEqual(formatE164('9876543210', '+91'), '+919876543210');
  assert.strictEqual(formatE164('4155552671', '+1'), '+14155552671');
  // Handles already prefixed inputs
  assert.strictEqual(formatE164('+919876543210', '+91'), '+919876543210');
});

test('validatePhoneNumber validates length and format', () => {
  // Valid numbers
  const validIndia = validatePhoneNumber('9876543210', '+91');
  assert.strictEqual(validIndia.isValid, true);
  assert.strictEqual(validIndia.formatted, '+919876543210');

  const validUS = validatePhoneNumber('4155552671', '+1');
  assert.strictEqual(validUS.isValid, true);
  assert.strictEqual(validUS.formatted, '+14155552671');

  // Too short
  const tooShort = validatePhoneNumber('12345', '+91');
  assert.strictEqual(tooShort.isValid, false);
  assert.match(tooShort.error, /too short/i);

  // Too long (>15 digits)
  const tooLong = validatePhoneNumber('1234567890123456', '+91');
  assert.strictEqual(tooLong.isValid, false);
  assert.match(tooLong.error, /exceeds maximum length/i);

  // Empty
  const empty = validatePhoneNumber('', '+91');
  assert.strictEqual(empty.isValid, false);
});

test('maskPhoneNumber masks digits safely', () => {
  assert.strictEqual(maskPhoneNumber('+919876543210'), '+91 •••• ••3210');
  assert.strictEqual(maskPhoneNumber('1234'), '1234');
  assert.strictEqual(maskPhoneNumber(''), '••••');
});
