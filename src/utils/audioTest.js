// Browser Microphone & Voice Simulation Engine for VoxPilot
// Safely manages Web Speech API and MediaStream lifecycle with strict cleanup

/**
 * Check if the current browser supports Speech Recognition
 * @returns {boolean}
 */
export function isSpeechRecognitionSupported() {
  if (typeof window === 'undefined') return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

/**
 * Check if the current browser supports Speech Synthesis
 * @returns {boolean}
 */
export function isSpeechSynthesisSupported() {
  if (typeof window === 'undefined') return false;
  return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

/**
 * Request microphone permission explicitly and release stream immediately
 * @returns {Promise<{ granted: boolean, error?: string }>}
 */
export async function requestMicrophonePermission() {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return {
      granted: false,
      error: 'Audio capture is not supported by your browser.',
    };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Immediately release tracks after confirming permission
    stream.getTracks().forEach((track) => track.stop());
    return { granted: true };
  } catch (err) {
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      return {
        granted: false,
        error: 'Microphone access was denied. Please allow microphone permissions in your browser address bar.',
      };
    }
    if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      return {
        granted: false,
        error: 'No microphone input device was found on your system.',
      };
    }
    return {
      granted: false,
      error: err.message || 'Unable to access microphone.',
    };
  }
}

/**
 * Create a managed speech recognition listener with error and termination callbacks
 * @param {Object} options
 * @param {(transcript: string) => void} options.onResult - Called with final transcribed text
 * @param {(state: 'listening' | 'processing' | 'idle') => void} options.onStateChange
 * @param {(error: string) => void} options.onError
 * @returns {{ start: () => void, stop: () => void }}
 */
export function createSpeechRecognizer({ onResult, onStateChange, onError }) {
  if (!isSpeechRecognitionSupported()) {
    onError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
    return { start: () => {}, stop: () => {} };
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  let isRunning = false;

  recognition.onstart = () => {
    isRunning = true;
    onStateChange('listening');
  };

  recognition.onresult = (event) => {
    onStateChange('processing');
    const lastResult = event.results[event.results.length - 1];
    if (lastResult && lastResult[0]) {
      const transcript = lastResult[0].transcript.trim();
      if (transcript) {
        onResult(transcript);
      }
    }
  };

  recognition.onerror = (event) => {
    isRunning = false;
    onStateChange('idle');
    if (event.error === 'not-allowed') {
      onError('Microphone permission was denied.');
    } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
      onError(`Speech recognition error: ${event.error}`);
    }
  };

  recognition.onend = () => {
    isRunning = false;
    onStateChange('idle');
  };

  return {
    start: () => {
      try {
        if (!isRunning) {
          recognition.start();
        }
      } catch {
        // Recognition already started or unavailable
      }
    },
    stop: () => {
      try {
        if (isRunning) {
          isRunning = false;
          recognition.abort();
        }
      } catch {
        // Recognition already aborted
      }
    },
  };
}

/**
 * Speak text response using browser SpeechSynthesis with cleanup
 * @param {string} text
 * @param {Object} [options]
 * @param {() => void} [options.onEnd]
 * @param {() => void} [options.onStart]
 */
export function speakText(text, options = {}) {
  if (!isSpeechSynthesisSupported() || !text) {
    if (options.onEnd) options.onEnd();
    return;
  }

  try {
    // Cancel any active speech utterance
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    if (options.onStart) {
      utterance.onstart = options.onStart;
    }

    utterance.onend = () => {
      if (options.onEnd) options.onEnd();
    };

    utterance.onerror = () => {
      if (options.onEnd) options.onEnd();
    };

    window.speechSynthesis.speak(utterance);
  } catch {
    if (options.onEnd) options.onEnd();
  }
}

/**
 * Stop any ongoing browser speech synthesis
 */
export function stopSpeaking() {
  if (isSpeechSynthesisSupported()) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignored
    }
  }
}
