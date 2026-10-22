import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  Calendar, 
  PhoneCall, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Bot, 
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCallsList, getCallStats } from '@/utils/api/callAPI';

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const assistants = useSelector((state) => state.assistants?.assistants || []);

  const [calls, setCalls] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('30D'); // '7D' | '30D' | '90D' | 'ALL'

  const fetchData = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const [callsRes, statsRes] = await Promise.allSettled([
        getCallsList({ limit: 100 }),
        getCallStats(),
      ]);

      if (callsRes.status === 'fulfilled') {
        const raw = callsRes.value;
        const list = Array.isArray(raw) ? raw : (raw?.calls || raw?.data || raw?.items || []);
        setCalls(list);
      }

      if (statsRes.status === 'fulfilled') {
        const raw = statsRes.value;
        setStats(raw?.stats || raw?.data || (raw?.totalCalls !== undefined ? raw : null));
      }
    } catch {
      setError('Unable to fetch analytics telemetry from CallHQ service.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter calls by selected time range
  const filteredCalls = useMemo(() => {
    if (timeRange === 'ALL') return calls;

    const now = Date.now();
    let days = 30;
    if (timeRange === '7D') days = 7;
    if (timeRange === '90D') days = 90;

    const cutoff = now - days * 24 * 60 * 60 * 1000;

    return calls.filter((call) => {
      const dateVal = call.createdAt || call.startTime || call.timestamp;
      if (!dateVal) return true; // keep if timestamp missing
      const callTime = new Date(dateVal).getTime();
      return isNaN(callTime) || callTime >= cutoff;
    });
  }, [calls, timeRange]);

  // Derive real calculations
  const analyticsData = useMemo(() => {
    const total = filteredCalls.length;
    if (total === 0) {
      return {
        total: 0,
        completed: 0,
        failed: 0,
        successRate: 0,
        avgDurationSec: 0,
        totalDurationSec: 0,
        agentBreakdown: [],
        dailyTrend: [],
      };
    }

    let completed = 0;
    let failed = 0;
    let totalSec = 0;
    const agentMap = {};
    const dailyMap = {};

    filteredCalls.forEach((call) => {
      const status = (call.status || '').toLowerCase();
      if (status === 'completed' || status === 'ended' || status === 'success') {
        completed += 1;
      } else if (status === 'failed' || status === 'error' || status === 'no-answer' || status === 'busy' || status === 'cancelled') {
        failed += 1;
      }

      const dur = Number(call.duration || call.durationSeconds || call.callDuration || 0);
      const validDur = isNaN(dur) ? 0 : dur;
      totalSec += validDur;

      // Group by Agent
      const agentId = call.assistantId || call.assistant?.id || 'unassigned';
      if (!agentMap[agentId]) {
        const agentObj = assistants.find((a) => a.id === agentId);
        agentMap[agentId] = {
          id: agentId,
          name: agentObj?.name || call.assistant?.name || 'Voice Agent',
          model: agentObj?.model?.model || 'gpt-4o-mini',
          totalCalls: 0,
          completedCalls: 0,
          durationSec: 0,
        };
      }
      agentMap[agentId].totalCalls += 1;
      if (status === 'completed' || status === 'ended' || status === 'success') {
        agentMap[agentId].completedCalls += 1;
      }
      agentMap[agentId].durationSec += validDur;

      // Group by Day
      const dateVal = call.createdAt || call.startTime || call.timestamp;
      if (dateVal) {
        const d = new Date(dateVal);
        if (!isNaN(d.getTime())) {
          const dayKey = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
          dailyMap[dayKey] = (dailyMap[dayKey] || 0) + 1;
        }
      }
    });

    const avgDurationSec = total > 0 ? Math.round(totalSec / total) : 0;
    const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const agentBreakdown = Object.values(agentMap).sort((a, b) => b.totalCalls - a.totalCalls);
    const dailyTrend = Object.entries(dailyMap).map(([date, count]) => ({ date, count }));

    return {
      total,
      completed,
      failed,
      successRate,
      avgDurationSec,
      totalDurationSec: totalSec,
      agentBreakdown,
      dailyTrend,
    };
  }, [filteredCalls, assistants]);

  const formatSeconds = (sec) => {
    if (!sec || isNaN(sec)) return '0s';
    if (sec < 60) return `${sec}s`;
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${mins}m ${rem}s`;
  };

  const hasData = analyticsData.total > 0 || (stats && stats.totalCalls > 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Performance & Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Measurable call telemetry, conversation completion ratios, and agent operational performance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Time Range Filter */}
          <div className="inline-flex rounded-md shadow-2xs border border-border bg-card p-0.5 text-xs font-medium">
            {['7D', '30D', '90D', 'ALL'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-2.5 py-1 rounded transition-colors ${
                  timeRange === range
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {range === 'ALL' ? 'All Time' : range}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(true)}
            disabled={isRefreshing || isLoading}
            className="gap-1.5 text-xs h-8.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center shadow-2xs">
          <RefreshCw className="h-6 w-6 text-primary animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium">Aggregating telemetry metrics...</p>
          <p className="text-xs text-muted-foreground mt-1">Calculating verified stats from telephony logs</p>
        </div>
      ) : error ? (
        <div className="bg-card border border-destructive/30 rounded-xl p-8 text-center shadow-2xs space-y-3">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
          <h3 className="text-base font-semibold text-foreground">Analytics Service Unavailable</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">{error}</p>
          <Button variant="outline" size="sm" onClick={() => fetchData(true)} className="gap-1.5 text-xs">
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </Button>
        </div>
      ) : !hasData ? (
        /* Real Empty State - No fabricated data */
        <div className="bg-card border border-dashed border-border rounded-xl p-12 text-center shadow-2xs space-y-4">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold">Not enough data yet</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1 leading-relaxed">
              Make your first call to start seeing performance data. Call volume, completion ratios, agent comparisons, and talk-time distributions are calculated exclusively from live session telemetry.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              onClick={() => navigate('/calls')}
              size="sm"
              className="text-xs gap-1.5"
            >
              <PhoneCall className="h-3.5 w-3.5" />
              Go to Call Activity
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/agents')}
              size="sm"
              className="text-xs gap-1.5"
            >
              <Bot className="h-3.5 w-3.5" />
              Configure Agents
            </Button>
          </div>
        </div>
      ) : (
        /* Analytics Content */
        <div className="space-y-6">
          {/* Primary Telemetry Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-card border border-border rounded-xl p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Total Sessions</span>
                <PhoneCall className="h-4 w-4 text-primary" />
              </div>
              <div className="text-2xl font-bold tracking-tight mt-1">{analyticsData.total}</div>
              <div className="text-[11px] text-muted-foreground mt-1">In selected range ({timeRange})</div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Completion Rate</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 mt-1">
                {analyticsData.successRate}%
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">
                {analyticsData.completed} of {analyticsData.total} completed
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Avg Talk Time</span>
                <Clock className="h-4 w-4 text-blue-500" />
              </div>
              <div className="text-2xl font-bold tracking-tight mt-1">
                {formatSeconds(analyticsData.avgDurationSec)}
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">Mean session duration</div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Total Talk Time</span>
                <TrendingUp className="h-4 w-4 text-indigo-500" />
              </div>
              <div className="text-2xl font-bold tracking-tight mt-1">
                {formatSeconds(analyticsData.totalDurationSec)}
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">Cumulative voice minutes</div>
            </div>
          </div>

          {/* Daily Distribution Chart (Responsive Bar Visualization) */}
          {analyticsData.dailyTrend.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Call Volume Distribution
                </h2>
                <span className="text-xs text-muted-foreground">Daily Call Sessions</span>
              </div>

              <div className="pt-4 flex items-end gap-2 h-40 overflow-x-auto pb-2">
                {(() => {
                  const maxCount = Math.max(...analyticsData.dailyTrend.map((d) => d.count), 1);
                  return analyticsData.dailyTrend.map((item, idx) => {
                    const heightPercent = Math.max(Math.round((item.count / maxCount) * 100), 10);
                    return (
                      <div key={idx} className="flex-1 min-w-[36px] flex flex-col items-center gap-1.5 h-full justify-end group">
                        <span className="text-[10px] font-mono text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                          {item.count}
                        </span>
                        <div 
                          className="w-full bg-primary/80 group-hover:bg-primary transition-colors rounded-t-sm"
                          style={{ height: `${heightPercent}%` }}
                        />
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap truncate max-w-full">
                          {item.date}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {/* Agent Performance Breakdown Table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-2xs space-y-0">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Bot className="h-4 w-4 text-primary" />
                  Agent Operational Performance
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Volume, completion rate, and active duration by agent profile
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground font-medium">
                  <tr>
                    <th className="py-3 px-4">Agent Name</th>
                    <th className="py-3 px-4">LLM Engine</th>
                    <th className="py-3 px-4">Total Calls</th>
                    <th className="py-3 px-4">Completed</th>
                    <th className="py-3 px-4">Completion %</th>
                    <th className="py-3 px-4">Total Talk-Time</th>
                    <th className="py-3 px-4 text-right">Avg Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {analyticsData.agentBreakdown.map((row) => {
                    const rate = row.totalCalls > 0 ? Math.round((row.completedCalls / row.totalCalls) * 100) : 0;
                    const avgSec = row.totalCalls > 0 ? Math.round(row.durationSec / row.totalCalls) : 0;

                    return (
                      <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 font-medium text-foreground">
                          {row.name}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground font-mono text-[11px]">
                          {row.model}
                        </td>
                        <td className="py-3 px-4 font-bold">
                          {row.totalCalls}
                        </td>
                        <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-medium">
                          {row.completedCalls}
                        </td>
                        <td className="py-3 px-4 font-medium">
                          <span className={rate >= 70 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600'}>
                            {rate}%
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground">
                          {formatSeconds(row.durationSec)}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-right">
                          {formatSeconds(avgSec)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
