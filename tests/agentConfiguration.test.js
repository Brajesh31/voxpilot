import test from 'node:test';
import assert from 'node:assert/strict';

// Isolated unsaved changes detection function as used in AgentWorkspacePage
function detectUnsavedChanges(savedDetail, localState) {
  if (!savedDetail) return false;
  const savedPrompt = savedDetail.model?.messages?.[0]?.content || savedDetail.prompt || '';
  return (
    localState.name !== (savedDetail.name || '') ||
    localState.firstMessage !== (savedDetail.firstMessage || '') ||
    localState.prompt !== savedPrompt ||
    localState.firstMessageMode !== (savedDetail.firstMessageMode || 'assistant-speaks-first') ||
    Number(localState.silenceTimeout) !== (savedDetail.silenceTimeoutSeconds ?? 10) ||
    Number(localState.maxDuration) !== (savedDetail.maxDurationSeconds ?? 3600) ||
    localState.voiceId !== (savedDetail.voice?.voiceId || 'Priya') ||
    localState.llmModel !== (savedDetail.model?.model || 'gemini-2.0-flash') ||
    localState.temperature !== (savedDetail.model?.temperature ?? 0.5)
  );
}

// Agent creation validation helper
function validateNewAgentInput(name) {
  if (typeof name !== 'string') return { isValid: false, error: 'Name must be a string' };
  const trimmed = name.trim();
  if (trimmed.length === 0) return { isValid: false, error: 'Agent name is required' };
  if (trimmed.length > 64) return { isValid: false, error: 'Agent name must be under 64 characters' };
  return { isValid: true, sanitizedName: trimmed };
}

test('detectUnsavedChanges returns false when local state matches saved detail', () => {
  const saved = {
    name: 'Support Agent',
    firstMessage: 'Hi',
    prompt: 'You are helpful.',
    firstMessageMode: 'assistant-speaks-first',
    silenceTimeoutSeconds: 10,
    maxDurationSeconds: 3600,
    voice: { voiceId: 'Priya' },
    model: { model: 'gemini-2.0-flash', temperature: 0.5 },
  };

  const localState = {
    name: 'Support Agent',
    firstMessage: 'Hi',
    prompt: 'You are helpful.',
    firstMessageMode: 'assistant-speaks-first',
    silenceTimeout: 10,
    maxDuration: 3600,
    voiceId: 'Priya',
    llmModel: 'gemini-2.0-flash',
    temperature: 0.5,
  };

  assert.strictEqual(detectUnsavedChanges(saved, localState), false);
});

test('detectUnsavedChanges returns true when prompt or voice is edited', () => {
  const saved = {
    name: 'Support Agent',
    prompt: 'Original instruction',
    voice: { voiceId: 'Priya' },
  };

  const modifiedState = {
    name: 'Support Agent',
    prompt: 'Updated new instruction with more context',
    voiceId: 'Priya',
    firstMessage: '',
    firstMessageMode: 'assistant-speaks-first',
    silenceTimeout: 10,
    maxDuration: 3600,
    llmModel: 'gemini-2.0-flash',
    temperature: 0.5,
  };

  assert.strictEqual(detectUnsavedChanges(saved, modifiedState), true);
});

test('validateNewAgentInput validates and sanitizes name inputs', () => {
  assert.deepStrictEqual(validateNewAgentInput('   '), {
    isValid: false,
    error: 'Agent name is required',
  });
  assert.deepStrictEqual(validateNewAgentInput(123), {
    isValid: false,
    error: 'Name must be a string',
  });
  assert.deepStrictEqual(validateNewAgentInput('a'.repeat(65)), {
    isValid: false,
    error: 'Agent name must be under 64 characters',
  });
  assert.deepStrictEqual(validateNewAgentInput('  Inbound Sales Rep  '), {
    isValid: true,
    sanitizedName: 'Inbound Sales Rep',
  });
});
