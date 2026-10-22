import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
  Bot, 
  PhoneCall, 
  Hash, 
  CheckCircle2, 
  Plus, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  Radio,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchAssistants } from '@/store/slices/assistantsSlice';
import { getAllPhoneNumber } from '@/utils/api/phoneNumberAPI';
import { getCallStats } from '@/utils/api/callAPI';
import { calculateAgentReadiness } from '@/utils/readiness';
import CreateAssistantDialog from '@/components/CreateAssistantDialog';
import PlaceOutboundCall from '@/components/PlaceOutboundCall';

export default function OverviewPage() {
  const dispatch = useDispatch();
  const { assistants, status: assistantsStatus } = useSelector((state) => state.assistants);
  
  const [phoneNumbers, setPhoneNumbers] = useState([]);
  const [callStats, setCallStats] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [selectedAgentForCall, setSelectedAgentForCall] = useState(null);

  useEffect(() => {
    dispatch(fetchAssistants());

    getAllPhoneNumber()
      .then((data) => {
        const nums = data?.phoneNumbers || (Array.isArray(data) ? data : []);
        setPhoneNumbers(nums);
      })
      .catch(() => setPhoneNumbers([]));

    getCallStats()
      .then((data) => {
        if (data?.stats) setCallStats(data.stats);
      })
      .catch(() => setCallStats(null));
  }, [dispatch]);

  const readyAgentsCount = assistants.filter((a) => calculateAgentReadiness(a).isReady).length;
  const recentAgents = assistants.slice(0, 4);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Workspace Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-card via-card to-primary/5 p-6 border border-border shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">Overview</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">Workspace Status</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Welcome to VoxPilot Studio
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Configure natural language prompts, assign speech synthesis timbres, and initiate conversational telephony calls from one unified workspace.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 shrink-0">
          <Button 
            onClick={() => setIsCreateOpen(true)}
            size="sm"
            className="shadow-xs font-medium"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Create Agent
          </Button>
          <Button 
            variant="outline"
            onClick={() => {
              if (assistants.length > 0) {
                setSelectedAgentForCall(assistants[0].id);
              }
              setIsCallOpen(true);
            }}
            size="sm"
            disabled={assistants.length === 0}
          >
            <PhoneCall className="h-4 w-4 mr-1.5 text-primary" />
            Dispatch Call
          </Button>
        </div>
      </div>

      {/* Primary Metrics Grid (Real Data) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Agents
            </CardTitle>
            <Bot className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold tracking-tight text-foreground">{assistants.length}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {assistantsStatus === 'loading' ? 'Loading agents...' : `${readyAgentsCount} ready to test`}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Ready for Calls
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold tracking-tight text-foreground">{readyAgentsCount}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              All required fields configured
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Caller ID Numbers
            </CardTitle>
            <Hash className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold tracking-tight text-foreground">{phoneNumbers.length}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {phoneNumbers.length > 0 ? 'Active DIDs provisioned' : 'No numbers provisioned'}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Completed Calls
            </CardTitle>
            <PhoneCall className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {callStats?.totalCalls ?? callStats?.completedCalls ?? 0}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {callStats ? 'Telephony session logs' : 'No calls dispatched yet'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Launch & Workflow Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 shadow-xs border-border flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <h2 className="text-sm font-semibold text-foreground">1. Design Agent Prompts</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Define the role, business knowledge, and rules for your AI agent. Customize greeting utterances and turn-taking behavior.
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full text-xs justify-between"
            onClick={() => setIsCreateOpen(true)}
          >
            <span>Create New Agent</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Card>

        <Card className="p-5 shadow-xs border-border flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Radio className="h-5 w-5" />
            </div>
            <h2 className="text-sm font-semibold text-foreground">2. Sandboxed Simulation</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Test conversational logic via interactive chat simulation and browser speech recognition before placing real telephone calls.
            </p>
          </div>
          <Link to="/agents" className="w-full">
            <Button variant="outline" size="sm" className="w-full text-xs justify-between">
              <span>Explore Agent Catalog</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </Card>

        <Card className="p-5 shadow-xs border-border flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h2 className="text-sm font-semibold text-foreground">3. Dispatch & Telephony</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Initiate outbound calls with dynamic template interpolation (`&#123;&#123;customer_name&#125;&#125;`) through registered international caller DIDs.
            </p>
          </div>
          <Link to="/phone-numbers" className="w-full">
            <Button variant="outline" size="sm" className="w-full text-xs justify-between">
              <span>View Phone Numbers</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </Card>
      </div>

      {/* Recent Agents Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">Active Voice Agents</h2>
            <p className="text-xs text-muted-foreground">Select an agent to enter its dedicated configuration workspace</p>
          </div>
          <Link to="/agents">
            <Button variant="ghost" size="sm" className="text-xs text-primary">
              View All ({assistants.length})
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </Link>
        </div>

        {assistants.length === 0 ? (
          <Card className="p-8 text-center space-y-3 border-dashed">
            <Bot className="h-10 w-10 text-muted-foreground/60 mx-auto" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">No voice agents created yet</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Create your first agent to configure persona prompts, speech recognition, and language models.
              </p>
            </div>
            <Button onClick={() => setIsCreateOpen(true)} size="sm" className="mt-2 text-xs">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Create First Agent
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {recentAgents.map((agent) => {
              const readiness = calculateAgentReadiness(agent);
              return (
                <Card key={agent.id} className="p-4 shadow-xs hover:border-primary/50 transition-colors flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="p-1.5 rounded-md bg-primary/10 text-primary shrink-0">
                          <Bot className="h-4 w-4" />
                        </div>
                        <h3 className="text-sm font-semibold text-foreground truncate">{agent.name || 'Unnamed Agent'}</h3>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                        readiness.isReady 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      }`}>
                        {readiness.isReady ? 'Ready' : 'Draft'}
                      </span>
                    </div>

                    <div className="text-[11px] text-muted-foreground space-y-1">
                      <p className="truncate">Model: <span className="text-foreground font-medium">{agent.model?.model || 'Gemini 2.0 Flash'}</span></p>
                      <p className="truncate">Voice: <span className="text-foreground font-medium">{agent.voice?.voiceId || 'Priya'}</span></p>
                    </div>

                    {/* Readiness Progress Bar */}
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Readiness</span>
                        <span className="font-mono">{readiness.score}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${readiness.isReady ? 'bg-emerald-500' : 'bg-primary'}`} 
                          style={{ width: `${readiness.score}%` }} 
                        />
                      </div>
                    </div>
                  </div>

                  <Link to={`/agents/${agent.id}`} className="w-full pt-1">
                    <Button variant="outline" size="sm" className="w-full text-xs h-7.5">
                      Open Workspace
                    </Button>
                  </Link>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateAssistantDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />

      {isCallOpen && (
        <PlaceOutboundCall
          activeAssistantId={selectedAgentForCall || assistants[0]?.id}
          onClose={() => setIsCallOpen(false)}
        />
      )}
    </div>
  );
}
