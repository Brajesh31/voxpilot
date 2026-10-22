import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { 
  PhoneCall, 
  Search, 
  RefreshCw, 
  PhoneOutgoing, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Copy, 
  Check, 
  ChevronRight,
  Filter,
  Calendar,
  AlertCircle,
  FileText
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
import { getCallsList, getCallDetails, getCallStats, placeOutboundCall } from '@/utils/api/callAPI';
import { getAllPhoneNumber } from '@/utils/api/phoneNumberAPI';
import { SUPPORTED_COUNTRY_CODES, validatePhoneNumber, formatE164 } from '@/utils/phone';
import { toast } from 'sonner';

export default function CallsPage() {
  const assistants = useSelector((state) => state.assistants?.assistants || []);
  
  const [calls, setCalls] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [agentFilter, setAgentFilter] = useState('ALL');

  // Detail Modal
  const [selectedCall, setSelectedCall] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [copiedTranscript, setCopiedTranscript] = useState(false);

  // Outbound Dispatch Dialog State
  const [isDispatchOpen, setIsDispatchOpen] = useState(false);
  const [dispatchStep, setDispatchStep] = useState(1);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [rawPhone, setRawPhone] = useState('');
  const [selectedPhoneId, setSelectedPhoneId] = useState('');
  const [phoneNumbers, setPhoneNumbers] = useState([]);
  const [isDispatching, setIsDispatching] = useState(false);

  // Load Calls & Stats
  const fetchData = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const [callsRes, statsRes] = await Promise.allSettled([
        getCallsList({ limit: 50 }),
        getCallStats(),
      ]);

      if (callsRes.status === 'fulfilled') {
        const raw = callsRes.value;
        const list = Array.isArray(raw) 
          ? raw 
          : (raw?.calls || raw?.data || raw?.items || []);
        setCalls(list);
      } else {
        setCalls([]);
      }

      if (statsRes.status === 'fulfilled') {
        const rawStats = statsRes.value;
        setStats(rawStats?.stats || rawStats?.data || (rawStats?.totalCalls !== undefined ? rawStats : null));
      }
    } catch {
      setError('Failed to reach call activity service. Please check connection and try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch Caller IDs for Outbound Dispatch Dialog
  const openDispatchDialog = async (defaultAgentId = '') => {
    setDispatchStep(1);
    setSelectedAgentId(defaultAgentId || (assistants[0]?.id || ''));
    setRawPhone('');
    setIsDispatchOpen(true);

    try {
      const res = await getAllPhoneNumber();
      const list = Array.isArray(res) ? res : (res?.phoneNumbers || res?.data || []);
      setPhoneNumbers(list);
      if (list.length > 0 && !selectedPhoneId) {
        setSelectedPhoneId(list[0].id);
      }
    } catch {
      toast.error('Unable to retrieve registered caller IDs', {
        description: 'Verify your phone numbers configuration or CallHQ setup.',
      });
    }
  };

  // View Call Details
  const handleOpenCallDetail = async (call) => {
    setSelectedCall(call);
    if (!call?.id) return;

    setDetailLoading(true);
    try {
      const detailed = await getCallDetails(call.id);
      if (detailed) {
        setSelectedCall((prev) => ({
          ...prev,
          ...detailed,
          ...(detailed.call || {}),
        }));
      }
    } catch {
      // Backend may not have detailed endpoint response for older calls, keep basic log record
    } finally {
      setDetailLoading(false);
    }
  };

  // Copy Transcript Handler
  const handleCopyTranscript = (transcriptText) => {
    if (!transcriptText) return;
    navigator.clipboard.writeText(transcriptText);
    setCopiedTranscript(true);
    toast.success('Transcript copied to clipboard');
    setTimeout(() => setCopiedTranscript(false), 2000);
  };

  // Submit Outbound Call
  const handleConfirmDispatch = async () => {
    const { isValid, e164 } = validatePhoneNumber(rawPhone, countryCode);
    if (!isValid) {
      toast.error('Invalid phone number format', {
        description: 'Please ensure valid digits with area code.',
      });
      return;
    }

    if (!selectedAgentId) {
      toast.error('Agent required', {
        description: 'Please select an agent to conduct the call.',
      });
      return;
    }

    if (!selectedPhoneId) {
      toast.error('Caller ID required', {
        description: 'Please select a registered Caller ID number.',
      });
      return;
    }

    setIsDispatching(true);
    try {
      const payload = {
        assistantId: selectedAgentId,
        phoneNumberId: selectedPhoneId,
        customer: {
          number: e164,
        },
      };

      const res = await placeOutboundCall(payload);
      toast.success(res?.message || 'Outbound call dispatched successfully', {
        description: `Calling ${e164}...`,
      });
      setIsDispatchOpen(false);
      // Refresh calls after brief delay
      setTimeout(() => fetchData(true), 1500);
    } catch (err) {
      toast.error('Failed to dispatch call', {
        description: err?.message || 'Check telephony credentials and destination permissions.',
      });
    } finally {
      setIsDispatching(false);
    }
  };

  // Filtered Calls list
  const filteredCalls = useMemo(() => {
    return calls.filter((call) => {
      const dest = (call?.customer?.number || call?.destinationNumber || call?.phoneNumber || call?.id || '').toLowerCase();
      const matchesSearch = !searchQuery || dest.includes(searchQuery.toLowerCase());
      
      const status = (call?.status || '').toUpperCase();
      const matchesStatus = statusFilter === 'ALL' || status === statusFilter;

      const agentId = call?.assistantId || call?.assistant?.id || '';
      const matchesAgent = agentFilter === 'ALL' || agentId === agentFilter;

      return matchesSearch && matchesStatus && matchesAgent;
    });
  }, [calls, searchQuery, statusFilter, agentFilter]);

  // Derived Analytics from Real Calls Data
  const calculatedMetrics = useMemo(() => {
    const total = calls.length;
    if (total === 0) {
      return {
        total: stats?.totalCalls ?? 0,
        completed: stats?.completedCalls ?? 0,
        durationAvg: stats?.averageDuration ? `${Math.round(stats.averageDuration)}s` : '0s',
        successRate: stats?.successRate ? `${Math.round(stats.successRate)}%` : '0%',
      };
    }

    const completed = calls.filter((c) => {
      const s = (c?.status || '').toLowerCase();
      return s === 'completed' || s === 'ended' || s === 'success';
    }).length;

    const totalSeconds = calls.reduce((acc, c) => {
      const dur = Number(c?.duration || c?.durationSeconds || c?.callDuration || 0);
      return acc + (isNaN(dur) ? 0 : dur);
    }, 0);

    const avgSeconds = total > 0 ? Math.round(totalSeconds / total) : 0;
    const rate = Math.round((completed / total) * 100);

    return {
      total,
      completed,
      durationAvg: `${avgSeconds}s`,
      successRate: `${rate}%`,
    };
  }, [calls, stats]);

  // Format Duration display
  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0s';
    const s = Math.round(Number(seconds));
    if (s < 60) return `${s}s`;
    const mins = Math.floor(s / 60);
    const rem = s % 60;
    return `${mins}m ${rem}s`;
  };

  // Format Status Badge
  const renderStatusBadge = (statusStr) => {
    const s = (statusStr || 'UNKNOWN').toUpperCase();
    if (s === 'COMPLETED' || s === 'ENDED') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="h-3 w-3" />
          Completed
        </span>
      );
    }
    if (s === 'IN-PROGRESS' || s === 'RINGING' || s === 'IN_PROGRESS' || s === 'ONGOING') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 animate-pulse">
          <Clock className="h-3 w-3" />
          In Progress
        </span>
      );
    }
    if (s === 'FAILED' || s === 'ERROR' || s === 'NO-ANSWER' || s === 'BUSY' || s === 'CANCELLED') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
          <XCircle className="h-3 w-3" />
          {s.replace('_', ' ')}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground border border-border">
        {s}
      </span>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <PhoneCall className="h-6 w-6 text-primary" />
            Call Activity
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real-time telephony session logs, execution traces, durations, and call transcripts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(true)}
            disabled={isRefreshing || isLoading}
            className="gap-1.5 text-xs h-9"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            onClick={() => openDispatchDialog()}
            disabled={assistants.length === 0}
            size="sm"
            className="gap-1.5 text-xs h-9 font-medium shadow-xs"
          >
            <PhoneOutgoing className="h-3.5 w-3.5" />
            Dispatch Call
          </Button>
        </div>
      </div>

      {/* Real Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-card border border-border rounded-xl p-4 shadow-2xs">
          <div className="text-xs font-medium text-muted-foreground">Total Sessions</div>
          <div className="text-2xl font-bold tracking-tight mt-1">{calculatedMetrics.total}</div>
          <div className="text-[11px] text-muted-foreground mt-1">Logged telephony events</div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-2xs">
          <div className="text-xs font-medium text-muted-foreground">Completed Calls</div>
          <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 mt-1">
            {calculatedMetrics.completed}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">Successful conversations</div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-2xs">
          <div className="text-xs font-medium text-muted-foreground">Success Rate</div>
          <div className="text-2xl font-bold tracking-tight text-primary mt-1">
            {calculatedMetrics.successRate}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">Completion ratio</div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-2xs">
          <div className="text-xs font-medium text-muted-foreground">Avg. Duration</div>
          <div className="text-2xl font-bold tracking-tight mt-1">{calculatedMetrics.durationAvg}</div>
          <div className="text-[11px] text-muted-foreground mt-1">Mean active talk-time</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-card border border-border rounded-xl p-3.5 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search phone number or Call ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8.5 h-8.5 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Filter className="h-3 w-3" />
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-muted border border-border rounded-md px-2 py-1 text-xs text-foreground focus:ring-1 focus:ring-primary outline-hidden"
            >
              <option value="ALL">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="IN-PROGRESS">In Progress</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>

          {/* Agent Filter */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Agent:</span>
            <select
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              className="bg-muted border border-border rounded-md px-2 py-1 text-xs text-foreground focus:ring-1 focus:ring-primary outline-hidden max-w-[150px] truncate"
            >
              <option value="ALL">All Agents</option>
              {assistants.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name || 'Unnamed Agent'}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Calls Table / List Section */}
      {isLoading ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center shadow-2xs">
          <RefreshCw className="h-6 w-6 text-primary animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium">Loading call activity...</p>
          <p className="text-xs text-muted-foreground mt-1">Retrieving logs from telephony gateway</p>
        </div>
      ) : error ? (
        <div className="bg-card border border-destructive/30 rounded-xl p-8 text-center shadow-2xs space-y-3">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
          <h3 className="text-base font-semibold text-foreground">Call Service Connectivity Issue</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">{error}</p>
          <Button variant="outline" size="sm" onClick={() => fetchData(true)} className="gap-1.5 text-xs">
            <RefreshCw className="h-3.5 w-3.5" />
            Retry Connection
          </Button>
        </div>
      ) : calls.length === 0 ? (
        /* Real Empty State */
        <div className="bg-card border border-dashed border-border rounded-xl p-12 text-center shadow-2xs space-y-3">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <PhoneCall className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold">No call data yet</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Your call activity, transcripts, talk-time records, and outcomes will appear here once your agents start making or receiving calls.
          </p>
          <div className="pt-2">
            <Button
              onClick={() => openDispatchDialog()}
              disabled={assistants.length === 0}
              size="sm"
              className="gap-1.5 text-xs font-medium"
            >
              <PhoneOutgoing className="h-3.5 w-3.5" />
              Dispatch Your First Call
            </Button>
          </div>
        </div>
      ) : filteredCalls.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center shadow-2xs">
          <p className="text-xs text-muted-foreground">No call sessions match your filter criteria.</p>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); setAgentFilter('ALL'); }}
            className="mt-2 text-xs"
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        /* Calls Table */
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground font-medium">
                <tr>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Agent</th>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Direction</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredCalls.map((call) => {
                  const agentName = call?.assistant?.name || 
                    assistants.find((a) => a.id === (call?.assistantId || call?.assistant?.id))?.name || 
                    'Voice Agent';
                  const destNumber = call?.customer?.number || call?.destinationNumber || call?.phoneNumber || 'Unknown';
                  const dateStr = call?.createdAt || call?.startTime || call?.timestamp;
                  const formattedDate = dateStr ? new Date(dateStr).toLocaleString() : 'Recent';
                  const durationVal = call?.duration || call?.durationSeconds || call?.callDuration || 0;
                  const direction = (call?.type || call?.direction || 'outbound').toLowerCase();

                  return (
                    <tr 
                      key={call.id || Math.random().toString()} 
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => handleOpenCallDetail(call)}
                    >
                      <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3 text-muted-foreground/70" />
                          <span>{formattedDate}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-foreground whitespace-nowrap">
                        {agentName}
                      </td>
                      <td className="py-3 px-4 font-mono text-muted-foreground whitespace-nowrap">
                        {destNumber}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="capitalize text-muted-foreground font-medium text-[11px]">
                          {direction}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {renderStatusBadge(call.status)}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] whitespace-nowrap">
                        {formatDuration(durationVal)}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handleOpenCallDetail(call)}
                          className="text-xs h-7 gap-1"
                        >
                          Details
                          <ChevronRight className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Call Details Modal */}
      {selectedCall && (
        <Dialog open={true} onOpenChange={() => setSelectedCall(null)}>
          <DialogContent className="sm:max-w-xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="p-4 sm:p-5 border-b border-border">
              <div className="flex items-center justify-between pr-6">
                <div>
                  <DialogTitle className="text-base font-bold flex items-center gap-2">
                    <PhoneCall className="h-4.5 w-4.5 text-primary" />
                    Call Session Details
                  </DialogTitle>
                  <DialogDescription className="text-xs mt-0.5 font-mono text-muted-foreground">
                    ID: {selectedCall.id || 'N/A'}
                  </DialogDescription>
                </div>
                <div>
                  {renderStatusBadge(selectedCall.status)}
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
              {/* Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/30 border border-border rounded-lg p-3 text-xs">
                <div>
                  <div className="text-muted-foreground text-[10px] uppercase font-semibold">Recipient</div>
                  <div className="font-mono font-medium mt-0.5">
                    {selectedCall.customer?.number || selectedCall.phoneNumber || 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground text-[10px] uppercase font-semibold">Duration</div>
                  <div className="font-mono font-medium mt-0.5">
                    {formatDuration(selectedCall.duration || selectedCall.durationSeconds || selectedCall.callDuration)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground text-[10px] uppercase font-semibold">Direction</div>
                  <div className="capitalize font-medium mt-0.5">
                    {selectedCall.type || selectedCall.direction || 'Outbound'}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground text-[10px] uppercase font-semibold">Caller ID</div>
                  <div className="font-mono text-muted-foreground mt-0.5">
                    {selectedCall.phoneNumberId ? `ID: ${selectedCall.phoneNumberId.slice(-6)}` : 'Provisioned DID'}
                  </div>
                </div>
              </div>

              {/* Audio Recording Section (Real Check) */}
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-foreground">Audio Recording</div>
                {selectedCall.recordingUrl ? (
                  <div className="bg-muted/40 border border-border rounded-lg p-3">
                    <audio controls className="w-full h-8" src={selectedCall.recordingUrl}>
                      Your browser does not support audio playback.
                    </audio>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic bg-muted/20 border border-border/50 rounded-lg p-2.5">
                    Audio recording is not retained or was not enabled for this session.
                  </p>
                )}
              </div>

              {/* Conversation Transcript Section (Real Check) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-primary" />
                    Conversation Transcript
                  </div>
                  {(selectedCall.transcript || selectedCall.messages) && (
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => handleCopyTranscript(
                        typeof selectedCall.transcript === 'string'
                          ? selectedCall.transcript
                          : JSON.stringify(selectedCall.messages, null, 2)
                      )}
                      className="h-6 text-[11px] gap-1 text-muted-foreground"
                    >
                      {copiedTranscript ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                      {copiedTranscript ? 'Copied' : 'Copy Transcript'}
                    </Button>
                  )}
                </div>

                {detailLoading ? (
                  <div className="p-6 text-center text-xs text-muted-foreground bg-muted/20 border border-border rounded-lg">
                    <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-2 text-primary" />
                    Fetching detailed transcript records...
                  </div>
                ) : selectedCall.transcript && typeof selectedCall.transcript === 'string' ? (
                  <div className="bg-muted/30 border border-border rounded-lg p-3 max-h-60 overflow-y-auto font-mono text-xs whitespace-pre-wrap leading-relaxed">
                    {selectedCall.transcript}
                  </div>
                ) : Array.isArray(selectedCall.messages) && selectedCall.messages.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {selectedCall.messages.map((msg, i) => {
                      const isBot = msg.role === 'assistant' || msg.role === 'agent' || msg.role === 'bot';
                      return (
                        <div 
                          key={i} 
                          className={`p-2.5 rounded-lg text-xs ${
                            isBot 
                              ? 'bg-primary/10 border border-primary/20 mr-4' 
                              : 'bg-muted border border-border ml-4'
                          }`}
                        >
                          <div className="text-[10px] font-bold uppercase tracking-wider mb-1 text-muted-foreground">
                            {isBot ? 'VoxPilot Agent' : 'User'}
                          </div>
                          <p className="leading-relaxed whitespace-pre-wrap">{msg.content || msg.text || ''}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic bg-muted/20 border border-border/50 rounded-lg p-3">
                    No transcript was recorded for this session by the gateway.
                  </p>
                )}
              </div>
            </div>

            <DialogFooter className="p-3 border-t border-border bg-muted/20">
              <Button size="sm" variant="outline" onClick={() => setSelectedCall(null)} className="text-xs">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Outbound Call Dispatch Modal */}
      {isDispatchOpen && (
        <Dialog open={true} onOpenChange={setIsDispatchOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold">
                <PhoneOutgoing className="h-4.5 w-4.5 text-primary" />
                Dispatch Outbound Call
              </DialogTitle>
              <DialogDescription className="text-xs">
                {dispatchStep === 1 
                  ? 'Configure the destination recipient and select the conversational agent.'
                  : 'Confirm parameters before triggering the live telephone call.'}
              </DialogDescription>
            </DialogHeader>

            {dispatchStep === 1 ? (
              <div className="space-y-4 py-2 text-xs">
                {/* Agent Selection */}
                <div className="space-y-1.5">
                  <label className="font-medium text-foreground">Select Voice Agent</label>
                  <select
                    value={selectedAgentId}
                    onChange={(e) => setSelectedAgentId(e.target.value)}
                    className="w-full bg-muted border border-border rounded-md px-3 py-2 text-xs font-medium focus:ring-1 focus:ring-primary outline-hidden"
                  >
                    {assistants.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name || 'Unnamed Agent'} ({agent.voice?.provider || '11labs'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Destination Phone Number */}
                <div className="space-y-1.5">
                  <label className="font-medium text-foreground">Recipient Phone Number</label>
                  <div className="flex gap-2">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="bg-muted border border-border rounded-md px-2 py-2 text-xs font-mono font-medium focus:ring-1 focus:ring-primary outline-hidden"
                    >
                      {SUPPORTED_COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code} ({c.name})
                        </option>
                      ))}
                    </select>
                    <Input
                      placeholder="e.g. 4155552671"
                      value={rawPhone}
                      onChange={(e) => setRawPhone(e.target.value.replace(/\D/g, ''))}
                      className="text-xs font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Digits will be normalized to international E.164 format.
                  </p>
                </div>

                {/* Caller ID / Provisioned DID */}
                <div className="space-y-1.5">
                  <label className="font-medium text-foreground">Outbound Caller ID (DID)</label>
                  {phoneNumbers.length === 0 ? (
                    <div className="p-2.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs">
                      No provisioned phone numbers found in CallHQ account. Outbound call will use default carrier routing.
                    </div>
                  ) : (
                    <select
                      value={selectedPhoneId}
                      onChange={(e) => setSelectedPhoneId(e.target.value)}
                      className="w-full bg-muted border border-border rounded-md px-3 py-2 text-xs font-mono focus:ring-1 focus:ring-primary outline-hidden"
                    >
                      {phoneNumbers.map((num) => (
                        <option key={num.id} value={num.id}>
                          {num.phoneNumber || num.number || num.id} ({num.provider || 'Twilio'})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            ) : (
              /* Step 2: Confirmation Screen */
              <div className="space-y-4 py-2 text-xs">
                <div className="p-3.5 rounded-lg bg-primary/10 border border-primary/20 space-y-2">
                  <div className="text-xs font-semibold text-primary">Pre-call Verification</div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Recipient Number:</span>
                      <span className="font-mono font-bold text-foreground">
                        {formatE164(rawPhone, countryCode)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dispatched Agent:</span>
                      <span className="font-medium text-foreground">
                        {assistants.find((a) => a.id === selectedAgentId)?.name || 'Selected Agent'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Outbound Caller ID:</span>
                      <span className="font-mono text-muted-foreground">
                        {phoneNumbers.find((p) => p.id === selectedPhoneId)?.phoneNumber || 'Default Carrier'}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Initiating this call will place a real telephone call via the telecommunication gateway. Carrier charges or quota may apply.
                </p>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border">
              {dispatchStep === 1 ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => setIsDispatchOpen(false)} className="text-xs">
                    Cancel
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => {
                      const { isValid } = validatePhoneNumber(rawPhone, countryCode);
                      if (!isValid) {
                        toast.error('Please enter a valid phone number with 7-15 digits');
                        return;
                      }
                      setDispatchStep(2);
                    }}
                    className="text-xs"
                  >
                    Continue to Confirmation
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setDispatchStep(1)} 
                    disabled={isDispatching}
                    className="text-xs"
                  >
                    Back
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleConfirmDispatch} 
                    disabled={isDispatching}
                    className="text-xs gap-1.5"
                  >
                    {isDispatching ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <PhoneOutgoing className="h-3.5 w-3.5" />}
                    {isDispatching ? 'Initiating Call...' : 'Place Call Now'}
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
