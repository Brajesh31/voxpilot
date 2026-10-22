import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  Hash, 
  Search, 
  RefreshCw, 
  PhoneCall, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  ShieldCheck,
  Radio,
  Copy,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getAllPhoneNumber } from '@/utils/api/phoneNumberAPI';
import { toast } from 'sonner';

export default function PhoneNumbersPage() {
  const assistants = useSelector((state) => state.assistants?.assistants || []);

  const [phoneNumbers, setPhoneNumbers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const fetchNumbers = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const data = await getAllPhoneNumber();
      const list = Array.isArray(data) 
        ? data 
        : (data?.phoneNumbers || data?.data || data?.items || []);
      setPhoneNumbers(list);
    } catch {
      setError('Unable to reach phone numbers service. Please verify your CallHQ API connection.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNumbers();
  }, []);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Number copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredNumbers = phoneNumbers.filter((item) => {
    const num = (item?.phoneNumber || item?.number || item?.id || '').toLowerCase();
    const provider = (item?.provider || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return num.includes(query) || provider.includes(query);
  });

  const totalCount = phoneNumbers.length;
  const assignedCount = phoneNumbers.filter((p) => p.assistantId || p.assistant).length;
  const availableCount = totalCount - assignedCount;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Hash className="h-6 w-6 text-primary" />
            Phone Numbers
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Provisioned telephony Direct Inward Dialing (DID) numbers used for caller ID and inbound voice routing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNumbers(true)}
            disabled={isRefreshing || isLoading}
            className="gap-1.5 text-xs h-9"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Numbers
          </Button>
        </div>
      </div>

      {/* Telephony Status Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-card border border-border rounded-xl p-4 shadow-2xs">
          <div className="text-xs font-medium text-muted-foreground">Total DIDs</div>
          <div className="text-2xl font-bold tracking-tight mt-1">{totalCount}</div>
          <div className="text-[11px] text-muted-foreground mt-1">Provisioned carrier lines</div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-2xs">
          <div className="text-xs font-medium text-muted-foreground">Assigned to Agents</div>
          <div className="text-2xl font-bold tracking-tight text-primary mt-1">{assignedCount}</div>
          <div className="text-[11px] text-muted-foreground mt-1">Bound to conversational flows</div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-2xs">
          <div className="text-xs font-medium text-muted-foreground">Available Pools</div>
          <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 mt-1">
            {availableCount}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">Ready for outbound dispatch</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-card border border-border rounded-xl p-3.5 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search number or carrier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8.5 h-8.5 text-xs"
          />
        </div>

        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          <span>Real-time carrier sync via CallHQ Telephony</span>
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center shadow-2xs">
          <RefreshCw className="h-6 w-6 text-primary animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium">Fetching provisioned phone numbers...</p>
          <p className="text-xs text-muted-foreground mt-1">Connecting to telephony registry</p>
        </div>
      ) : error ? (
        <div className="bg-card border border-destructive/30 rounded-xl p-8 text-center shadow-2xs space-y-3">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
          <h3 className="text-base font-semibold text-foreground">Phone Registry Offline</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">{error}</p>
          <Button variant="outline" size="sm" onClick={() => fetchNumbers(true)} className="gap-1.5 text-xs">
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </Button>
        </div>
      ) : phoneNumbers.length === 0 ? (
        /* Real Empty State */
        <div className="bg-card border border-dashed border-border rounded-xl p-12 text-center shadow-2xs space-y-4">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <Hash className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold">No Phone Numbers Provisioned</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1 leading-relaxed">
              Your CallHQ account currently has no active telephone numbers registered. To receive inbound customer calls or present a dedicated Caller ID, provision numbers in your CallHQ / Twilio carrier dashboard.
            </p>
          </div>

          <div className="bg-muted/30 border border-border rounded-lg p-4 max-w-md mx-auto text-left text-xs space-y-2">
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <Radio className="h-3.5 w-3.5 text-primary" />
              How to provision numbers:
            </div>
            <ul className="list-disc pl-4 space-y-1 text-muted-foreground text-[11px]">
              <li>Log into your CallHQ management portal</li>
              <li>Navigate to Telephony &gt; Numbers</li>
              <li>Purchase or link a Twilio/Vonage carrier SIP trunk</li>
              <li>Refresh this page to bind numbers to your VoxPilot agents</li>
            </ul>
          </div>
        </div>
      ) : filteredNumbers.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center shadow-2xs">
          <p className="text-xs text-muted-foreground">No numbers matched "{searchQuery}".</p>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setSearchQuery('')}
            className="mt-2 text-xs"
          >
            Clear Search
          </Button>
        </div>
      ) : (
        /* Numbers List Table */
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground font-medium">
                <tr>
                  <th className="py-3 px-4">Phone Number</th>
                  <th className="py-3 px-4">Provider</th>
                  <th className="py-3 px-4">Assigned Agent</th>
                  <th className="py-3 px-4">Capabilities</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredNumbers.map((num) => {
                  const numberStr = num.phoneNumber || num.number || num.id;
                  const provider = num.provider || 'Twilio';
                  const assignedAgent = assistants.find((a) => a.id === num.assistantId);
                  const isAssigned = Boolean(assignedAgent || num.assistantId);

                  return (
                    <tr key={num.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-foreground whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-xs">{numberStr}</span>
                          <button
                            onClick={() => handleCopy(numberStr, num.id)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            title="Copy number"
                          >
                            {copiedId === num.id ? (
                              <Check className="h-3 w-3 text-emerald-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-muted border border-border">
                          {provider}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isAssigned ? (
                          <span className="inline-flex items-center gap-1.5 text-primary font-medium">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                            {assignedAgent?.name || `Agent ${num.assistantId.slice(-6)}`}
                          </span>
                        ) : (
                          <span className="text-muted-foreground italic text-[11px]">Unassigned (Outbound pool)</span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium">
                            Voice In
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
                            Voice Out
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="h-3 w-3" />
                          Active
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span className="text-[11px] font-mono text-muted-foreground">
                          ID: {num.id ? num.id.slice(-6) : 'N/A'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
