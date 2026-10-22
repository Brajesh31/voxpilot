// Agent Readiness Evaluation Engine for VoxPilot

/**
 * @typedef {Object} ReadinessCheck
 * @property {string} id
 * @property {string} label
 * @property {string} description
 * @property {boolean} passed
 * @property {'required' | 'recommended'} severity
 */

/**
 * @typedef {Object} ReadinessResult
 * @property {boolean} isReady - True if all required checks pass
 * @property {number} score - Overall readiness percentage (0 to 100)
 * @property {'ready' | 'draft' | 'needs_attention'} status
 * @property {string[]} missingRequired - Labels of failed required checks
 * @property {ReadinessCheck[]} checks - Detailed checklist
 */

/**
 * Evaluate an assistant configuration against real requirements
 * @param {Record<string, any>} assistant
 * @returns {ReadinessResult}
 */
export function calculateAgentReadiness(assistant) {
  if (!assistant || typeof assistant !== 'object') {
    return {
      isReady: false,
      score: 0,
      status: 'draft',
      missingRequired: ['Valid Configuration'],
      checks: [],
    };
  }

  const details = assistant.details || assistant;
  const name = details.name?.trim() || '';
  const firstMessage = details.firstMessage?.trim() || '';
  const prompt = details.model?.messages?.[0]?.content?.trim() || details.prompt?.trim() || '';
  const voiceId = details.voice?.voiceId || '';
  const model = details.model?.model || '';
  const transcriberModel = details.transcriber?.model || '';

  const checks = [
    {
      id: 'name',
      label: 'Agent Name',
      description: 'A recognizable name for identifying the agent',
      passed: name.length >= 2,
      severity: 'required',
    },
    {
      id: 'instructions',
      label: 'System Instructions',
      description: 'System prompt defining agent persona and guidelines',
      passed: prompt.length >= 15,
      severity: 'required',
    },
    {
      id: 'greeting',
      label: 'Welcome Greeting',
      description: 'Initial utterance spoken when connection begins',
      passed: firstMessage.length >= 2,
      severity: 'required',
    },
    {
      id: 'voice',
      label: 'Voice Assignment',
      description: 'Assigned voice synthesis character and timbre',
      passed: Boolean(voiceId),
      severity: 'required',
    },
    {
      id: 'llm',
      label: 'Language Model',
      description: 'Foundation model configured for reasoning and responses',
      passed: Boolean(model),
      severity: 'required',
    },
    {
      id: 'transcriber',
      label: 'Speech Transcriber',
      description: 'Acoustic speech-to-text transcription engine',
      passed: Boolean(transcriberModel),
      severity: 'required',
    },
    {
      id: 'timeout',
      label: 'Silence Timeout Cap',
      description: 'Maximum idle seconds before re-prompting caller',
      passed: typeof details.silenceTimeoutSeconds === 'number' && details.silenceTimeoutSeconds > 0,
      severity: 'recommended',
    },
  ];

  const requiredChecks = checks.filter((c) => c.severity === 'required');
  const passedRequired = requiredChecks.filter((c) => c.passed);
  const totalPassed = checks.filter((c) => c.passed).length;

  const isReady = passedRequired.length === requiredChecks.length;
  const score = Math.round((totalPassed / checks.length) * 100);
  const missingRequired = requiredChecks.filter((c) => !c.passed).map((c) => c.label);

  let status = 'draft';
  if (isReady) {
    status = 'ready';
  } else if (score >= 40) {
    status = 'needs_attention';
  }

  return {
    isReady,
    score,
    status,
    missingRequired,
    checks,
  };
}
