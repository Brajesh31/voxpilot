import { useState, useEffect } from 'react';
import { 
  Settings, 
  Key, 
  Cpu, 
  Palette, 
  Shield, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  LogOut, 
  Edit3, 
  ExternalLink,
  Lock,
  Mic,
  Server,
  Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  getMaskedApiKey, 
  setApiKey, 
  removeApiKey, 
  getApiKeyValidationTime 
} from '@/utils/apiKeyManager';
import { validateCurrentApiKey, validateApiKey } from '@/utils/api/apiKey';
import { baseBackendURL } from '@/utils/config';
import ThemeCustomizer from '@/components/ThemeCustomizer';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('api'); // 'api' | 'providers' | 'appearance' | 'privacy'
  const [maskedKey, setMaskedKey] = useState('');
  const [lastValidated, setLastValidated] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('unknown'); // 'connected' | 'checking' | 'failed'
  
  // Replace key modal
  const [isReplaceOpen, setIsReplaceOpen] = useState(false);
  const [newApiKey, setNewApiKey] = useState('');
  const [isTestingNewKey, setIsTestingNewKey] = useState(false);

  // Disconnect confirmation modal
  const [isDisconnectOpen, setIsDisconnectOpen] = useState(false);

  useEffect(() => {
    setMaskedKey(getMaskedApiKey());
    setLastValidated(getApiKeyValidationTime());
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setConnectionStatus('checking');
    try {
      const res = await validateCurrentApiKey();
      if (res.isValid) {
        setConnectionStatus('connected');
        setLastValidated(new Date().toISOString());
      } else {
        setConnectionStatus('failed');
      }
    } catch {
      setConnectionStatus('failed');
    }
  };

  const handleReplaceKey = async () => {
    if (!newApiKey.trim() || newApiKey.trim().length < 8) {
      toast.error('Invalid key length', {
        description: 'API key should be at least 8 characters long.',
      });
      return;
    }

    setIsTestingNewKey(true);
    try {
      const result = await validateApiKey(newApiKey.trim());
      if (result.isValid) {
        setApiKey(newApiKey.trim());
        setMaskedKey(getMaskedApiKey());
        setConnectionStatus('connected');
        setLastValidated(new Date().toISOString());
        setIsReplaceOpen(false);
        setNewApiKey('');
        toast.success('API credential updated and verified successfully');
      } else {
        toast.error('Validation Failed', {
          description: result.message || 'The specified key was rejected by the gateway.',
        });
      }
    } catch (err) {
      toast.error('Connection Error', {
        description: err.message || 'Failed to reach gateway validation service.',
      });
    } finally {
      setIsTestingNewKey(false);
    }
  };

  const handleDisconnect = () => {
    removeApiKey();
    toast.success('API key removed from local storage');
    setTimeout(() => {
      window.location.reload();
    }, 400);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-border">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          Settings & Configuration
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage API authentication, voice synthesis providers, application theme, and security settings.
        </p>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-border space-x-1 sm:space-x-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('api')}
          className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'api'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Key className="h-3.5 w-3.5" />
          API & Connectivity
        </button>

        <button
          onClick={() => setActiveTab('providers')}
          className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'providers'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Cpu className="h-3.5 w-3.5" />
          Supported Providers
        </button>

        <button
          onClick={() => setActiveTab('appearance')}
          className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'appearance'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Palette className="h-3.5 w-3.5" />
          Appearance & Themes
        </button>

        <button
          onClick={() => setActiveTab('privacy')}
          className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'privacy'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Shield className="h-3.5 w-3.5" />
          Privacy & Security
        </button>
      </div>

      {/* TAB 1: API & Connectivity */}
      {activeTab === 'api' && (
        <div className="space-y-5">
          {/* Connection Status Card */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Server className="h-4 w-4 text-primary" />
                  Voice Engine Gateway
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Authenticated connection to CallHQ / VoxPilot backend telephony services.
                </p>
              </div>

              <div>
                {connectionStatus === 'connected' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Connected & Verified
                  </span>
                )}
                {connectionStatus === 'checking' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Verifying...
                  </span>
                )}
                {connectionStatus === 'failed' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    <XCircle className="h-3.5 w-3.5" />
                    Validation Failed
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs">
              <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-1">
                <div className="text-muted-foreground text-[11px] font-semibold uppercase">Active API Key</div>
                <div className="font-mono font-bold text-foreground text-sm flex items-center justify-between">
                  <span>{maskedKey || 'No key installed'}</span>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => setIsReplaceOpen(true)}
                    className="h-6 text-xs gap-1"
                  >
                    <Edit3 className="h-3 w-3" />
                    Replace
                  </Button>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-1">
                <div className="text-muted-foreground text-[11px] font-semibold uppercase">Gateway Target</div>
                <div className="font-mono text-muted-foreground text-xs truncate">
                  {baseBackendURL}
                </div>
                {lastValidated && (
                  <div className="text-[10px] text-muted-foreground">
                    Last check: {new Date(lastValidated).toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={checkConnection}
                disabled={connectionStatus === 'checking'}
                className="gap-1.5 text-xs"
              >
                <RefreshCw className={`h-3 w-3 ${connectionStatus === 'checking' ? 'animate-spin' : ''}`} />
                Test Connection
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsReplaceOpen(true)}
                className="gap-1.5 text-xs"
              >
                <Edit3 className="h-3 w-3" />
                Change API Key
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDisconnectOpen(true)}
                className="gap-1.5 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-500/10 ml-auto"
              >
                <LogOut className="h-3 w-3" />
                Disconnect Key
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Supported Providers */}
      {activeTab === 'providers' && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-5 shadow-2xs space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Cpu className="h-4 w-4 text-primary" />
                Integrated Voice & AI Infrastructure
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                VoxPilot agents connect with enterprise voice, LLM, and transcription providers through the gateway.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* TTS Providers */}
              <div className="bg-muted/30 border border-border rounded-lg p-4 space-y-2">
                <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Voice Synthesis (TTS)
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Ultra-low latency speech synthesis with emotional nuance and custom voice clone IDs.
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['ElevenLabs', 'PlayHT', 'Azure Speech', 'Cartesia', 'OpenAI', 'Deepgram'].map((p) => (
                    <span key={p} className="px-2 py-0.5 rounded text-[10px] font-medium bg-card border border-border">
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              {/* LLM Providers */}
              <div className="bg-muted/30 border border-border rounded-lg p-4 space-y-2">
                <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  Language Models (LLM)
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  High-speed reasoning models supporting custom system instructions and tools.
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['GPT-4o', 'GPT-4o-mini', 'GPT-4-turbo', 'Llama 3 (Groq)', 'Anthropic'].map((p) => (
                    <span key={p} className="px-2 py-0.5 rounded text-[10px] font-medium bg-card border border-border">
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              {/* STT Providers */}
              <div className="bg-muted/30 border border-border rounded-lg p-4 space-y-2">
                <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-purple-500" />
                  Transcription (STT)
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Streaming audio transcription with multilingual detection and noise robustness.
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['Deepgram Nova-2', 'Whisper', 'Talkscriber'].map((p) => (
                    <span key={p} className="px-2 py-0.5 rounded text-[10px] font-medium bg-card border border-border">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Appearance */}
      {activeTab === 'appearance' && (
        <div className="bg-card border border-border rounded-xl p-5 shadow-2xs space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Palette className="h-4 w-4 text-primary" />
              Theme & Interface Customization
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Customize the workspace palette, light/dark modes, and corner radiuses.
            </p>
          </div>

          <div className="pt-2">
            <ThemeCustomizer />
          </div>
        </div>
      )}

      {/* TAB 4: Privacy & Security */}
      {activeTab === 'privacy' && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-5 shadow-2xs space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Data Privacy & Security Commitments
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Exact disclosures regarding local credential storage, browser microphone streams, and telephony records.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs">
              <div className="p-4 rounded-lg bg-muted/30 border border-border space-y-2">
                <div className="font-semibold text-foreground flex items-center gap-2">
                  <Lock className="h-4 w-4 text-emerald-500" />
                  Local Credential Isolation
                </div>
                <p className="text-muted-foreground leading-relaxed text-[11px]">
                  Your VoxPilot API key is stored strictly within your browser's local sandbox (<code className="text-primary font-mono">localStorage['x-api-key']</code>). Credentials are never transmitted to third-party trackers, analytics, or external logging servers.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-muted/30 border border-border space-y-2">
                <div className="font-semibold text-foreground flex items-center gap-2">
                  <Mic className="h-4 w-4 text-blue-500" />
                  Ephemeral Microphone Handling
                </div>
                <p className="text-muted-foreground leading-relaxed text-[11px]">
                  Microphone access is never requested on page load. It is activated exclusively upon user interaction in the Sandboxed Test Simulator. Every audio stream track (<code className="text-primary font-mono">MediaStreamTrack</code>) is immediately stopped when testing concludes or when navigating away.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-muted/30 border border-border space-y-2">
                <div className="font-semibold text-foreground flex items-center gap-2">
                  <Server className="h-4 w-4 text-purple-500" />
                  Telephony Data & Transcripts
                </div>
                <p className="text-muted-foreground leading-relaxed text-[11px]">
                  Phone logs and transcripts are retained in your authorized CallHQ telephony instance per organization retention policies. VoxPilot only queries records via authenticated REST APIs on demand.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-muted/30 border border-border space-y-2">
                <div className="font-semibold text-foreground flex items-center gap-2">
                  <Layers className="h-4 w-4 text-amber-500" />
                  Zero Fabricated Metrics
                </div>
                <p className="text-muted-foreground leading-relaxed text-[11px]">
                  All durations, success rates, and conversation logs reflect real backend executions. VoxPilot never displays artificial data or manufactured scores.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Replace API Key Dialog */}
      {isReplaceOpen && (
        <Dialog open={true} onOpenChange={setIsReplaceOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold">
                <Key className="h-4.5 w-4.5 text-primary" />
                Update API Credential
              </DialogTitle>
              <DialogDescription className="text-xs">
                Enter your new VoxPilot / CallHQ API key. It will be verified against the gateway before saving.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="space-y-1.5">
                <label className="font-medium text-foreground">API Key</label>
                <Input
                  type="password"
                  placeholder="Paste new API key..."
                  value={newApiKey}
                  onChange={(e) => setNewApiKey(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Your key will be validated via the <code className="font-mono text-primary">/api/api-keys/test</code> endpoint.
              </p>
            </div>

            <DialogFooter className="pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setIsReplaceOpen(false); setNewApiKey(''); }}
                disabled={isTestingNewKey}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleReplaceKey}
                disabled={isTestingNewKey || !newApiKey.trim()}
                className="text-xs gap-1.5"
              >
                {isTestingNewKey ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                {isTestingNewKey ? 'Verifying Key...' : 'Validate & Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Disconnect Confirmation Dialog */}
      {isDisconnectOpen && (
        <Dialog open={true} onOpenChange={setIsDisconnectOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold text-destructive">
                <LogOut className="h-4.5 w-4.5" />
                Disconnect API Key?
              </DialogTitle>
              <DialogDescription className="text-xs">
                Removing your API key will disconnect this browser session from the voice gateway. You will need to re-enter your key to manage agents and telephony.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDisconnectOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDisconnect}
                className="text-xs"
              >
                Yes, Disconnect
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
