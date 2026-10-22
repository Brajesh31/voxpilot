import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  ArrowLeft, 
  Save, 
  PhoneCall, 
  Trash2, 
  Copy, 
  Check, 
  Loader2, 
  Bot, 
  Sparkles, 
  MessageSquare, 
  Volume2, 
  Cpu, 
  Mic, 
  Sliders, 
  Radio, 
  CheckCircle2, 
  AlertCircle,
  Play,
  Square,
  Send,
  User,
  ShieldAlert
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

import { 
  fetchAssistantDetail, 
  saveAssistantDetail, 
  deleteAssistant,
  appendToAssistantDetail,
  setCurrentAssistant 
} from '@/store/slices/assistantsSlice';
import { createSession } from '@/utils/api/sessionAPI';
import { chatApi } from '@/utils/api/chatApi';
import { calculateAgentReadiness } from '@/utils/readiness';
import { LLM_CONFIG } from '@/utils/llm_config';
import { TRANSCRIBER_CONFIG } from '@/utils/transcriber_config';
import { 
  requestMicrophonePermission, 
  createSpeechRecognizer, 
  speakText, 
  stopSpeaking
} from '@/utils/audioTest';

import ConfirmationDialog from '@/components/ConfirmationDialog';
import PlaceOutboundCall from '@/components/PlaceOutboundCall';

const VOICE_PRESETS = [
  { id: 'Priya', name: 'Priya', gender: 'Female', description: 'Professional & articulate outreach voice' },
  { id: 'Liam', name: 'Liam', gender: 'Male', description: 'Warm & conversational support specialist' },
  { id: 'Alex', name: 'Alex', gender: 'Neutral', description: 'Direct, neutral business representative' },
];

export default function AgentWorkspacePage({ defaultTab }) {
  const { id: routeAssistantId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const activeDetail = useSelector((state) => state.assistants?.activeDetail?.details || state.assistantsApp?.activeDetail?.details);
  const detailStatus = useSelector((state) => state.assistants?.detailStatus || state.assistantsApp?.detailStatus);

  const [activeTab, setActiveTab] = useState(
    defaultTab || (location.pathname.endsWith('/test') ? 'test' : 'overview')
  );
  const [agentName, setAgentName] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    } else if (location.pathname.endsWith('/test')) {
      setActiveTab('test');
    }
  }, [defaultTab, location.pathname]);

  // Local configuration states
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [promptContent, setPromptContent] = useState('');
  const [firstMessageMode, setFirstMessageMode] = useState('assistant-speaks-first');
  const [silenceTimeout, setSilenceTimeout] = useState(10);
  const [maxDuration, setMaxDuration] = useState(3600);
  const [backgroundSound, setBackgroundSound] = useState('office');

  // Voice states
  const [voiceId, setVoiceId] = useState('Priya');
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);

  // LLM states
  const [llmProvider, setLlmProvider] = useState('google');
  const [llmModel, setLlmModel] = useState('gemini-2.0-flash');
  const [temperature, setTemperature] = useState(0.5);
  const [maxTokens, setMaxTokens] = useState(250);

  // Transcriber states
  const [transcriberProvider, setTranscriberProvider] = useState('deepgram');
  const [transcriberModel, setTranscriberModel] = useState('nova-3');
  const [transcriberLanguage, setTranscriberLanguage] = useState('multi');
  const [backgroundDenoising, setBackgroundDenoising] = useState(true);
  const [lastSavedTime, setLastSavedTime] = useState(null);

  // Compute whether there are meaningful unsaved modifications compared to activeDetail
  const hasUnsavedChanges = useMemo(() => {
    if (!activeDetail) return false;
    const currentSavedPrompt = activeDetail.model?.messages?.[0]?.content || activeDetail.prompt || '';
    return (
      agentName !== (activeDetail.name || '') ||
      welcomeMessage !== (activeDetail.firstMessage || '') ||
      promptContent !== currentSavedPrompt ||
      firstMessageMode !== (activeDetail.firstMessageMode || 'assistant-speaks-first') ||
      Number(silenceTimeout) !== (activeDetail.silenceTimeoutSeconds ?? 10) ||
      Number(maxDuration) !== (activeDetail.maxDurationSeconds ?? 3600) ||
      backgroundSound !== (activeDetail.backgroundSound || 'office') ||
      voiceId !== (activeDetail.voice?.voiceId || 'Priya') ||
      voiceSpeed !== (activeDetail.voice?.speed ?? 1.0) ||
      llmProvider !== (activeDetail.model?.provider || 'google') ||
      llmModel !== (activeDetail.model?.model || 'gemini-2.0-flash') ||
      temperature !== (activeDetail.model?.temperature ?? 0.5) ||
      maxTokens !== (activeDetail.model?.maxTokens ?? 250) ||
      transcriberProvider !== (activeDetail.transcriber?.provider || 'deepgram') ||
      transcriberModel !== (activeDetail.transcriber?.model || 'nova-3') ||
      transcriberLanguage !== (activeDetail.transcriber?.language || 'multi') ||
      backgroundDenoising !== Boolean(activeDetail.backgroundDenoisingEnabled ?? true)
    );
  }, [
    activeDetail, agentName, welcomeMessage, promptContent, firstMessageMode,
    silenceTimeout, maxDuration, backgroundSound, voiceId, voiceSpeed,
    llmProvider, llmModel, temperature, maxTokens, transcriberProvider,
    transcriberModel, transcriberLanguage, backgroundDenoising
  ]);

  // Prevent accidental navigation when there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Test Simulator states
  const [simSession, setSimSession] = useState(null);
  const [simMessages, setSimMessages] = useState([]);
  const [simInput, setSimInput] = useState('');
  const [simLoading, setSimLoading] = useState(false);
  const [micState, setMicState] = useState('idle'); // 'idle' | 'listening' | 'processing' | 'speaking'
  const [isVoiceTesting, setIsVoiceTesting] = useState(false);
  const [micError, setMicError] = useState(null);

  const recognizerRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Load assistant by ID
  useEffect(() => {
    if (routeAssistantId) {
      dispatch(setCurrentAssistant(routeAssistantId));
      dispatch(fetchAssistantDetail(routeAssistantId));
    }
  }, [routeAssistantId, dispatch]);

  // Sync details from Redux into local inputs
  useEffect(() => {
    if (activeDetail) {
      setAgentName(activeDetail.name || '');
      setWelcomeMessage(activeDetail.firstMessage || '');
      setPromptContent(activeDetail.model?.messages?.[0]?.content || activeDetail.prompt || '');
      setFirstMessageMode(activeDetail.firstMessageMode || 'assistant-speaks-first');
      setSilenceTimeout(activeDetail.silenceTimeoutSeconds ?? 10);
      setMaxDuration(activeDetail.maxDurationSeconds ?? 3600);
      setBackgroundSound(activeDetail.backgroundSound || 'office');

      if (activeDetail.voice) {
        setVoiceId(activeDetail.voice.voiceId || 'Priya');
        setVoiceSpeed(activeDetail.voice.speed ?? 1.0);
      }

      if (activeDetail.model) {
        setLlmProvider(activeDetail.model.provider || 'google');
        setLlmModel(activeDetail.model.model || 'gemini-2.0-flash');
        setTemperature(activeDetail.model.temperature ?? 0.5);
        setMaxTokens(activeDetail.model.maxTokens ?? 250);
      }

      if (activeDetail.transcriber) {
        setTranscriberProvider(activeDetail.transcriber.provider || 'deepgram');
        setTranscriberModel(activeDetail.transcriber.model || 'nova-3');
        setTranscriberLanguage(activeDetail.transcriber.language || 'multi');
      }
      setBackgroundDenoising(Boolean(activeDetail.backgroundDenoisingEnabled ?? true));
    }
  }, [activeDetail]);

  // Sync staged edits into Redux updateData
  useEffect(() => {
    const formattedData = {
      name: agentName,
      firstMessage: welcomeMessage,
      firstMessageMode,
      silenceTimeoutSeconds: Number(silenceTimeout),
      maxDurationSeconds: Number(maxDuration),
      backgroundSound,
      backgroundDenoisingEnabled: backgroundDenoising,
      voice: {
        provider: 'CallHQ',
        voiceId,
        speed: voiceSpeed,
      },
      model: {
        provider: llmProvider,
        model: llmModel,
        temperature,
        maxTokens,
        emotionRecognitionEnabled: false,
        messages: [
          {
            role: 'system',
            content: promptContent,
          },
        ],
      },
      transcriber: {
        provider: transcriberProvider,
        model: transcriberModel,
        language: transcriberLanguage,
      },
    };

    dispatch(appendToAssistantDetail(formattedData));
  }, [
    agentName,
    welcomeMessage,
    firstMessageMode,
    silenceTimeout,
    maxDuration,
    backgroundSound,
    backgroundDenoising,
    voiceId,
    voiceSpeed,
    llmProvider,
    llmModel,
    temperature,
    maxTokens,
    promptContent,
    transcriberProvider,
    transcriberModel,
    transcriberLanguage,
    dispatch,
  ]);

  // Clean up audio tests on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
      if (recognizerRef.current) {
        recognizerRef.current.stop();
      }
    };
  }, []);

  const readiness = calculateAgentReadiness({
    name: agentName,
    firstMessage: welcomeMessage,
    prompt: promptContent,
    voice: { voiceId },
    model: { model: llmModel },
    transcriber: { model: transcriberModel },
    silenceTimeoutSeconds: silenceTimeout,
  });

  const handleCopyId = () => {
    if (!routeAssistantId) return;
    navigator.clipboard.writeText(routeAssistantId);
    setIsCopied(true);
    toast.success('Agent ID copied to clipboard');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSaveConfiguration = async () => {
    if (!routeAssistantId || isSaving) return;
    setIsSaving(true);
    try {
      await dispatch(saveAssistantDetail({ assistantId: routeAssistantId })).unwrap();
      setLastSavedTime(new Date());
      toast.success('Configuration saved', {
        description: 'All settings have been synchronized with the voice engine.',
      });
    } catch (err) {
      toast.error('Failed to save configuration', {
        description: err?.message || 'Please check your inputs and try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!routeAssistantId) return;
    setIsDeleting(true);
    try {
      await dispatch(deleteAssistant(routeAssistantId)).unwrap();
      toast.success('Agent removed', {
        description: `"${agentName}" has been permanently deleted.`,
      });
      navigate('/agents');
    } catch (err) {
      toast.error('Failed to delete agent', {
        description: err?.message || 'Server error occurred during deletion.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Test Simulator session initialization
  const initTestSession = async () => {
    if (simSession) return simSession;
    try {
      const payload = {
        name: agentName || 'VoxPilot Sandbox',
        assistantId: routeAssistantId,
      };
      const response = await createSession(payload);
      setSimSession(response.session);
      return response.session;
    } catch (err) {
      toast.error('Unable to initialize simulator session', {
        description: err.message || 'Check voice engine connection.',
      });
      throw err;
    }
  };

  const handleSendMessage = async (userText) => {
    const textToSend = userText || simInput.trim();
    if (!textToSend || simLoading) return;

    const userMessage = { role: 'user', content: textToSend };
    const nextMessages = [...simMessages, userMessage];
    setSimMessages(nextMessages);
    setSimInput('');
    setSimLoading(true);

    try {
      const session = await initTestSession();
      const chatPayload = {
        sessionId: session.id,
        input: textToSend,
        assistantOverrides: {
          model: {
            provider: llmProvider,
            model: llmModel,
          },
        },
      };

      const response = await chatApi(chatPayload);
      const assistantText = response?.chat?.output?.[0]?.content || 'Message acknowledged.';
      
      const assistantMessage = { role: 'assistant', content: assistantText };
      setSimMessages([...nextMessages, assistantMessage]);

      // If voice testing is active, speak the response
      if (isVoiceTesting) {
        setMicState('speaking');
        speakText(assistantText, {
          onEnd: () => {
            if (isVoiceTesting) {
              setMicState('listening');
              if (recognizerRef.current) recognizerRef.current.start();
            } else {
              setMicState('idle');
            }
          },
        });
      }
    } catch {
      setSimMessages([
        ...nextMessages,
        { role: 'assistant', content: 'Simulation Error: Failed to receive model response from sandbox gateway.' },
      ]);
    } finally {
      setSimLoading(false);
    }
  };

  const handleToggleVoiceTesting = async () => {
    if (isVoiceTesting) {
      // Stop Voice Testing
      setIsVoiceTesting(false);
      setMicState('idle');
      stopSpeaking();
      if (recognizerRef.current) {
        recognizerRef.current.stop();
      }
      return;
    }

    setMicError(null);

    // Request permissions first
    const permResult = await requestMicrophonePermission();
    if (!permResult.granted) {
      setMicError(permResult.error || 'Microphone access denied');
      toast.error('Microphone access required', {
        description: permResult.error,
      });
      return;
    }

    setIsVoiceTesting(true);
    setMicState('listening');

    // Create speech recognizer
    const recognizer = createSpeechRecognizer({
      onResult: (transcript) => {
        handleSendMessage(transcript);
      },
      onStateChange: (newState) => {
        if (newState === 'listening') setMicState('listening');
        if (newState === 'processing') setMicState('processing');
      },
      onError: (err) => {
        setMicError(err);
        setMicState('idle');
        setIsVoiceTesting(false);
      },
    });

    recognizerRef.current = recognizer;
    recognizer.start();
  };

  if (detailStatus === 'loading' && !activeDetail) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">Loading voice agent workspace...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background">
      {/* Top Workspace Header */}
      <div className="border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-20 px-4 sm:px-6 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 max-w-7xl mx-auto w-full">
          {/* Breadcrumbs & Title */}
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/agents">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>

            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="Enter agent name"
                  className="text-base sm:text-lg font-bold bg-transparent border-none outline-none focus:ring-2 focus:ring-primary/20 rounded px-1.5 py-0.5 text-foreground max-w-xs truncate"
                />
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
                  title="Copy Agent ID"
                >
                  {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground pl-1.5">
                <span>Status:</span>
                <span className={`font-semibold px-2 py-0.2 rounded-full ${
                  readiness.isReady 
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                }`}>
                  {readiness.isReady ? 'Ready to Call' : 'Draft'}
                </span>
                <span>•</span>
                <span>Score: {readiness.score}%</span>
              </div>
            </div>
          </div>

          {/* Action Buttons & Save UX */}
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {/* Real Save State Indicator */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-muted/60 border border-border">
              {isSaving ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin text-primary" />
                  <span className="text-muted-foreground font-medium">Saving...</span>
                </>
              ) : hasUnsavedChanges ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-amber-600 dark:text-amber-400 font-medium">Unsaved changes</span>
                </>
              ) : lastSavedTime ? (
                <>
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    Saved {lastSavedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </>
              ) : (
                <>
                  <Check className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground font-medium">Saved</span>
                </>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCallModal(true)}
              className="text-xs h-8"
              disabled={!readiness.isReady}
              title={readiness.isReady ? "Dispatch outbound phone call" : "Complete configuration before dispatching calls"}
            >
              <PhoneCall className="h-3.5 w-3.5 mr-1.5 text-primary" />
              <span>Dispatch Call</span>
            </Button>

            <Button
              size="sm"
              onClick={handleSaveConfiguration}
              disabled={isSaving}
              className={`text-xs h-8 shadow-xs ${hasUnsavedChanges ? 'ring-1 ring-primary' : ''}`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  {hasUnsavedChanges ? 'Save Changes' : 'Saved'}
                </>
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDeleteDialog(true)}
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              title="Delete Agent"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Workspace Tabs */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
          <TabsList className="bg-muted/70 p-1 rounded-xl flex flex-wrap h-auto gap-1">
            <TabsTrigger value="overview" className="text-xs font-medium py-1.5 px-3">
              Overview & Readiness
            </TabsTrigger>
            <TabsTrigger value="prompt" className="text-xs font-medium py-1.5 px-3">
              Instructions & Persona
            </TabsTrigger>
            <TabsTrigger value="behavior" className="text-xs font-medium py-1.5 px-3">
              Conversation Behavior
            </TabsTrigger>
            <TabsTrigger value="voice" className="text-xs font-medium py-1.5 px-3">
              Voice Studio
            </TabsTrigger>
            <TabsTrigger value="llm" className="text-xs font-medium py-1.5 px-3">
              LLM Engine
            </TabsTrigger>
            <TabsTrigger value="transcriber" className="text-xs font-medium py-1.5 px-3">
              Speech Recognition
            </TabsTrigger>
            <TabsTrigger value="test" className="text-xs font-medium py-1.5 px-3 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Test Simulator
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: OVERVIEW & READINESS */}
          <TabsContent value="overview" className="space-y-6 outline-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="md:col-span-2 p-5 shadow-xs space-y-4">
                <div className="space-y-1">
                  <h2 className="text-base font-semibold text-foreground">Configuration Checklist</h2>
                  <p className="text-xs text-muted-foreground">
                    Required and recommended parameters to ensure high conversational reliability before placing calls.
                  </p>
                </div>

                <div className="divide-y divide-border">
                  {readiness.checks.map((item) => (
                    <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        {item.passed ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                        )}
                        <div>
                          <p className="font-medium text-foreground">{item.label}</p>
                          <p className="text-[11px] text-muted-foreground">{item.description}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        item.passed 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                          : item.severity === 'required' 
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' 
                            : 'bg-muted text-muted-foreground'
                      }`}>
                        {item.passed ? 'Configured' : item.severity === 'required' ? 'Required' : 'Optional'}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Status summary card */}
              <Card className="p-5 shadow-xs space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <h2 className="text-base font-semibold text-foreground">Readiness Assessment</h2>
                  <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-2 text-center">
                    <span className="text-3xl font-black font-mono text-primary">{readiness.score}%</span>
                    <p className="text-xs font-semibold text-foreground">
                      {readiness.isReady ? 'Ready for Outbound Calls' : 'Incomplete Configuration'}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {readiness.isReady 
                        ? 'All mandatory voice, prompt, and model settings are complete.' 
                        : `Please configure: ${readiness.missingRequired.join(', ')}.`}
                    </p>
                  </div>
                </div>

                <Button 
                  onClick={() => setActiveTab('test')}
                  className="w-full text-xs shadow-xs"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  Launch Sandboxed Test
                </Button>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 2: INSTRUCTIONS & PERSONA */}
          <TabsContent value="prompt" className="space-y-4 outline-hidden max-w-4xl">
            <Card className="p-5 shadow-xs space-y-4">
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-foreground">System Persona Instructions</h2>
                <p className="text-xs text-muted-foreground">
                  The primary prompt guiding the conversational AI voice representative.
                </p>
              </div>

              {/* Guidelines callout */}
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Best Practices for Voice Agents:
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] pl-1">
                  <li><strong>Identity:</strong> Clearly declare the agent persona, role, and organization name.</li>
                  <li><strong>Tone:</strong> Specify concise conversational turn-taking (keep spoken answers to 1-2 sentences).</li>
                  <li><strong>Guardrails:</strong> State what the agent must NEVER say or assume during calls.</li>
                  <li><strong>Variables:</strong> Use <code className="font-mono bg-muted px-1 rounded">&#123;&#123;customer_name&#125;&#125;</code> for call interpolation.</li>
                </ul>
              </div>

              <Textarea
                value={promptContent}
                onChange={(e) => setPromptContent(e.target.value)}
                placeholder="You are an appointment confirmation assistant at Modern Clinic. Your goal is to..."
                className="min-h-[300px] font-mono text-xs leading-relaxed resize-y"
              />
            </Card>
          </TabsContent>

          {/* TAB 3: CONVERSATION BEHAVIOR */}
          <TabsContent value="behavior" className="space-y-4 outline-hidden max-w-3xl">
            <Card className="p-5 shadow-xs space-y-5">
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-foreground">Turn-Taking & Acoustic Behavior</h2>
                <p className="text-xs text-muted-foreground">Controls how the assistant begins and maintains conversational flow</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Speaker Precedence</Label>
                  <Select value={firstMessageMode} onValueChange={setFirstMessageMode}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="assistant-speaks-first">Assistant speaks first (Fixed welcome phrase)</SelectItem>
                      <SelectItem value="assistant-speaks-first-with-model-generated-message">Assistant speaks first (Dynamic model greeting)</SelectItem>
                      <SelectItem value="assistant-waits-for-user">Assistant waits for caller to speak</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Welcome Greeting Phrase</Label>
                  <Input
                    value={welcomeMessage}
                    onChange={(e) => setWelcomeMessage(e.target.value)}
                    placeholder="Hello! This is Priya calling from VoxPilot Support. Am I speaking with {{customer_name}}?"
                    className="text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">Spoken immediately after call pickup when using fixed greeting mode.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Silence Timeout (Seconds)</Label>
                    <Input
                      type="number"
                      value={silenceTimeout}
                      onChange={(e) => setSilenceTimeout(Math.max(3, Number(e.target.value)))}
                      min={3}
                      max={60}
                      className="text-xs font-mono"
                    />
                    <p className="text-[11px] text-muted-foreground">Seconds of silence before agent checks in.</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Max Call Duration Cap (Seconds)</Label>
                    <Input
                      type="number"
                      value={maxDuration}
                      onChange={(e) => setMaxDuration(Math.max(60, Number(e.target.value)))}
                      min={60}
                      max={7200}
                      className="text-xs font-mono"
                    />
                    <p className="text-[11px] text-muted-foreground">Hard stop cap (default: 3600s = 1hr).</p>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* TAB 4: VOICE STUDIO */}
          <TabsContent value="voice" className="space-y-4 outline-hidden max-w-3xl">
            <Card className="p-5 shadow-xs space-y-5">
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-foreground">Voice Character & Timbre</h2>
                <p className="text-xs text-muted-foreground">Select the speech synthesis character and modulation settings</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Available Voice Characters</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {VOICE_PRESETS.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setVoiceId(item.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          voiceId === item.id 
                            ? 'border-primary bg-primary/10 text-primary font-medium' 
                            : 'border-border hover:bg-muted/50 text-foreground'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-sm">{item.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{item.gender}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-2">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-border">
                  <div className="flex justify-between text-xs">
                    <Label className="text-xs font-medium">Speaking Speed Multiplier</Label>
                    <span className="font-mono text-primary font-semibold">{voiceSpeed}x</span>
                  </div>
                  <Slider
                    value={[voiceSpeed]}
                    onValueChange={([val]) => setVoiceSpeed(val)}
                    min={0.7}
                    max={1.5}
                    step={0.05}
                    className="w-full"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>0.7x (Deliberate)</span>
                    <span>1.0x (Natural)</span>
                    <span>1.5x (Brisk)</span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-border">
                  <Label className="text-xs font-medium">Background Sound Ambiance</Label>
                  <Select value={backgroundSound} onValueChange={setBackgroundSound}>
                    <SelectTrigger className="w-full sm:max-w-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="office">Professional Office Ambiance</SelectItem>
                      <SelectItem value="cafe">Coffee Shop Quiet Murmur</SelectItem>
                      <SelectItem value="quiet">Studio Silence (No Background)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* TAB 5: LLM ENGINE */}
          <TabsContent value="llm" className="space-y-4 outline-hidden max-w-3xl">
            <Card className="p-5 shadow-xs space-y-5">
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-foreground">Language Model Configuration</h2>
                <p className="text-xs text-muted-foreground">The reasoning engine processing caller context and generating replies</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Provider</Label>
                  <Select value={llmProvider} onValueChange={(val) => {
                    setLlmProvider(val);
                    const models = Object.keys(LLM_CONFIG[val]?.models || {});
                    if (models.length > 0) setLlmModel(models[0]);
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(LLM_CONFIG).map((p) => (
                        <SelectItem key={p} value={p}>
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Model</Label>
                  <Select value={llmModel} onValueChange={setLlmModel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(LLM_CONFIG[llmProvider]?.models || {}).map(([display, id]) => (
                        <SelectItem key={id} value={id}>
                          {display}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex justify-between text-xs">
                  <Label className="text-xs font-medium">Sampling Temperature</Label>
                  <span className="font-mono text-primary font-semibold">{temperature.toFixed(2)}</span>
                </div>
                <Slider
                  value={[temperature]}
                  onValueChange={([val]) => setTemperature(val)}
                  min={0.0}
                  max={1.0}
                  step={0.01}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>0.0 (Deterministic)</span>
                  <span>0.5 (Balanced)</span>
                  <span>1.0 (Creative)</span>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-border">
                <Label className="text-xs font-medium">Max Response Tokens Cap</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(Math.max(50, Math.min(4000, Number(e.target.value))))}
                    min={50}
                    max={4000}
                    className="w-32 text-xs font-mono"
                  />
                  <span className="text-xs text-muted-foreground">Tokens (Recommended: 150-350 for telephony)</span>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* TAB 6: TRANSCRIBER */}
          <TabsContent value="transcriber" className="space-y-4 outline-hidden max-w-3xl">
            <Card className="p-5 shadow-xs space-y-5">
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-foreground">Speech Recognition Engine</h2>
                <p className="text-xs text-muted-foreground">Transcribes caller speech into text streams in real-time</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Provider</Label>
                  <Select value={transcriberProvider} onValueChange={(val) => {
                    setTranscriberProvider(val);
                    const models = TRANSCRIBER_CONFIG[val]?.models || [];
                    const langs = TRANSCRIBER_CONFIG[val]?.languages || [];
                    if (models.length > 0) setTranscriberModel(models[0]);
                    if (langs.length > 0) setTranscriberLanguage(langs[0]);
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(TRANSCRIBER_CONFIG).map((p) => (
                        <SelectItem key={p} value={p}>
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Model</Label>
                  <Select value={transcriberModel} onValueChange={setTranscriberModel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(TRANSCRIBER_CONFIG[transcriberProvider]?.models || []).map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5 max-w-xs">
                <Label className="text-xs font-medium">Acoustic Spoken Language</Label>
                <Select value={transcriberLanguage} onValueChange={setTranscriberLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(TRANSCRIBER_CONFIG[transcriberProvider]?.languages || []).map((l) => (
                      <SelectItem key={l} value={l}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs font-medium">Background Noise Cancellation</Label>
                  <p className="text-[11px] text-muted-foreground">Suppresses microphone hum and room echo during speech</p>
                </div>
                <Switch checked={backgroundDenoising} onCheckedChange={setBackgroundDenoising} />
              </div>
            </Card>
          </TabsContent>

          {/* TAB 7: SANDBOXED TEST SIMULATOR */}
          <TabsContent value="test" className="space-y-4 outline-hidden max-w-4xl">
            <Card className="p-5 shadow-xs space-y-4 border-primary/30">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border">
                <div>
                  <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Interactive Agent Sandbox
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Simulate real conversational turn-taking via text chat or microphone speech.
                  </p>
                </div>

                {/* Voice Testing Button */}
                <div className="flex items-center gap-2">
                  <Button
                    variant={isVoiceTesting ? "destructive" : "outline"}
                    size="sm"
                    onClick={handleToggleVoiceTesting}
                    className="text-xs h-8"
                  >
                    {isVoiceTesting ? (
                      <>
                        <Square className="h-3.5 w-3.5 mr-1.5" />
                        Stop Microphone
                      </>
                    ) : (
                      <>
                        <Mic className="h-3.5 w-3.5 mr-1.5 text-primary" />
                        Start Voice Test
                      </>
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSimMessages([]);
                      setSimSession(null);
                    }}
                    className="text-xs h-8 text-muted-foreground"
                  >
                    Reset Chat
                  </Button>
                </div>
              </div>

              {/* Status Bar */}
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/60 text-xs">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    micState === 'listening' 
                      ? 'bg-red-500 animate-ping' 
                      : micState === 'speaking' 
                        ? 'bg-emerald-500 animate-pulse' 
                        : 'bg-emerald-500'
                  }`} />
                  <span className="font-medium text-foreground">
                    {micState === 'listening' ? 'Listening to Microphone...' : micState === 'speaking' ? 'Agent Speaking Response...' : micState === 'processing' ? 'Processing Voice...' : 'Ready for test input'}
                  </span>
                </div>
                <span className="text-muted-foreground text-[11px] font-mono">
                  Engine: {llmModel} • Voice: {voiceId}
                </span>
              </div>

              {micError && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
                  <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{micError}</span>
                </div>
              )}

              {/* Message History */}
              <ScrollArea className="h-[320px] rounded-xl border border-border p-4 bg-card">
                <div className="space-y-3">
                  {simMessages.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground space-y-1">
                      <Bot className="h-8 w-8 mx-auto opacity-50 mb-2" />
                      <p className="text-xs font-medium text-foreground">Session ready</p>
                      <p className="text-[11px]">Type a greeting or click "Start Voice Test" to talk with {agentName || 'your agent'}.</p>
                    </div>
                  )}

                  {simMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-xl px-3.5 py-2 text-xs leading-relaxed ${
                        msg.role === 'user' 
                          ? 'bg-primary text-primary-foreground font-normal' 
                          : 'bg-muted border border-border text-foreground'
                      }`}>
                        <div className="flex items-center gap-1.5 mb-1 text-[10px] font-semibold opacity-80 uppercase">
                          {msg.role === 'user' ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3 text-primary" />}
                          <span>{msg.role === 'user' ? 'You' : agentName || 'Agent'}</span>
                        </div>
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      </div>
                    </div>
                  ))}

                  {simLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-xl px-3 py-2 text-xs text-muted-foreground flex items-center gap-2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                        <span>Thinking...</span>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input row */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex gap-2"
              >
                <Input
                  value={simInput}
                  onChange={(e) => setSimInput(e.target.value)}
                  placeholder={`Say or type something to ${agentName || 'agent'}...`}
                  disabled={simLoading || isVoiceTesting}
                  className="text-xs h-9.5"
                />
                <Button 
                  type="submit" 
                  disabled={!simInput.trim() || simLoading || isVoiceTesting}
                  className="h-9.5 px-4 text-xs shadow-xs"
                >
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                  Send
                </Button>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Voice Agent"
        description={`Are you sure you want to permanently delete "${agentName}"? This action cannot be undone.`}
        confirmText="Delete Agent"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
      />

      {/* Outbound Call Modal */}
      {showCallModal && (
        <PlaceOutboundCall
          activeAssistantId={routeAssistantId}
          onClose={() => setShowCallModal(false)}
        />
      )}
    </div>
  );
}
