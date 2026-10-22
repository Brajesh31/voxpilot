import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateAgentReadiness } from '../src/utils/readiness.js';

test('calculateAgentReadiness reports ready for fully configured assistant', () => {
  const completeAssistant = {
    name: 'Support Agent',
    firstMessage: 'Hello, how can I help you?',
    prompt: 'You are a customer support agent for TechCorp. Be polite and helpful.',
    voice: { provider: 'CallHQ', voiceId: 'Priya' },
    model: { provider: 'google', model: 'gemini-2.0-flash' },
    transcriber: { provider: 'deepgram', model: 'nova-3' },
    silenceTimeoutSeconds: 10,
  };

  const result = calculateAgentReadiness(completeAssistant);
  assert.strictEqual(result.isReady, true);
  assert.strictEqual(result.status, 'ready');
  assert.strictEqual(result.score, 100);
  assert.strictEqual(result.missingRequired.length, 0);
});

test('calculateAgentReadiness detects missing instructions and voice', () => {
  const incompleteAssistant = {
    name: 'Draft Agent',
    firstMessage: 'Hello',
    prompt: '', // Missing prompt
    voice: {}, // Missing voice
    model: { model: 'gemini-2.0-flash' },
    transcriber: { model: 'nova-3' },
  };

  const result = calculateAgentReadiness(incompleteAssistant);
  assert.strictEqual(result.isReady, false);
  assert.notStrictEqual(result.status, 'ready');
  assert.ok(result.missingRequired.includes('System Instructions'));
  assert.ok(result.missingRequired.includes('Voice Assignment'));
  assert.ok(result.score < 100);
});

test('calculateAgentReadiness handles null and empty configs gracefully', () => {
  const result = calculateAgentReadiness(null);
  assert.strictEqual(result.isReady, false);
  assert.strictEqual(result.score, 0);
  assert.strictEqual(result.status, 'draft');
});
