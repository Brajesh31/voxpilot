import { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
  Bot, 
  Plus, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  PhoneCall, 
  MessageSquare, 
  Trash2, 
  Cpu, 
  Mic, 
  Volume2, 
  ArrowRight,
  LayoutGrid,
  List
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { calculateAgentReadiness } from '@/utils/readiness';
import { deleteAssistant } from '@/store/slices/assistantsSlice';
import ConfirmationDialog from '@/components/ConfirmationDialog';
import CreateAssistantDialog from '@/components/CreateAssistantDialog';
import PlaceOutboundCall from '@/components/PlaceOutboundCall';
import { toast } from 'sonner';

export default function AgentsPage() {
  const dispatch = useDispatch();
  const { assistants } = useSelector((state) => state.assistants);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'ready' | 'draft'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [callAgentId, setCallAgentId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter and search
  const filteredAgents = useMemo(() => {
    return assistants.filter((agent) => {
      const name = agent.name?.toLowerCase() || '';
      const prompt = (agent.model?.messages?.[0]?.content || agent.prompt || '').toLowerCase();
      const model = (agent.model?.model || '').toLowerCase();
      const q = searchQuery.toLowerCase().trim();

      const matchesQuery = !q || name.includes(q) || prompt.includes(q) || model.includes(q);
      if (!matchesQuery) return false;

      const readiness = calculateAgentReadiness(agent);
      if (statusFilter === 'ready') return readiness.isReady;
      if (statusFilter === 'draft') return !readiness.isReady;
      return true;
    });
  }, [assistants, searchQuery, statusFilter]);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      await dispatch(deleteAssistant(deleteTarget.id)).unwrap();
      toast.success('Agent removed', {
        description: `"${deleteTarget.name}" has been deleted from your workspace.`,
      });
      setDeleteTarget(null);
    } catch (err) {
      toast.error('Failed to delete agent', {
        description: err?.message || 'Server error occurred during deletion.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Voice Agents Catalog</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Manage your AI voice workforce, monitor prompt readiness, and launch testing simulators.
          </p>
        </div>

        <Button 
          onClick={() => setIsCreateOpen(true)}
          size="sm"
          className="shadow-xs font-medium self-start sm:self-auto"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Create Voice Agent
        </Button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by agent name, persona, or model..."
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter Tabs */}
          <div className="flex rounded-lg bg-muted p-1 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                statusFilter === 'all' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All ({assistants.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ready')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                statusFilter === 'ready' ? 'bg-card text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Ready
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('draft')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                statusFilter === 'draft' ? 'bg-card text-amber-600 dark:text-amber-400 shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Needs Setup
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="hidden sm:flex border border-border rounded-lg p-0.5 bg-muted/50">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
              className="h-7 w-7"
              aria-label="Grid view"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('list')}
              className="h-7 w-7"
              aria-label="List view"
            >
              <List className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Agents Listing */}
      {filteredAgents.length === 0 ? (
        <Card className="p-12 text-center space-y-4 border-dashed">
          <Bot className="h-12 w-12 text-muted-foreground/60 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">
              {searchQuery ? 'No matching agents found' : 'No voice agents yet'}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {searchQuery 
                ? 'Try refining your search keyword or clearing the status filter.' 
                : 'Create your first voice agent to start designing conversation logic.'}
            </p>
          </div>
          {searchQuery ? (
            <Button variant="outline" size="sm" onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}>
              Clear Filters
            </Button>
          ) : (
            <Button size="sm" onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              Create First Agent
            </Button>
          )}
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAgents.map((agent) => {
            const readiness = calculateAgentReadiness(agent);
            const prompt = agent.model?.messages?.[0]?.content || agent.prompt || 'No system instructions configured yet.';

            return (
              <Card key={agent.id} className="p-5 shadow-xs hover:border-primary/40 transition-colors flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  {/* Top Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                        <Bot className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-foreground truncate">{agent.name || 'Unnamed Agent'}</h3>
                        <p className="text-[11px] text-muted-foreground truncate">ID: {agent.id}</p>
                      </div>
                    </div>

                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1 ${
                      readiness.isReady 
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }`}>
                      {readiness.isReady ? (
                        <>
                          <CheckCircle2 className="h-3 w-3" />
                          Ready
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-3 w-3" />
                          Needs Setup
                        </>
                      )}
                    </span>
                  </div>

                  {/* Persona Excerpt */}
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {prompt}
                  </p>

                  {/* Architecture Badges */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-muted border border-border text-foreground font-mono flex items-center gap-1">
                      <Cpu className="h-3 w-3 text-primary" />
                      {agent.model?.model || 'Gemini 2.0 Flash'}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-muted border border-border text-foreground flex items-center gap-1">
                      <Volume2 className="h-3 w-3 text-muted-foreground" />
                      {agent.voice?.voiceId || 'Priya'}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-muted border border-border text-foreground flex items-center gap-1">
                      <Mic className="h-3 w-3 text-muted-foreground" />
                      {agent.transcriber?.provider || 'Deepgram'}
                    </span>
                  </div>

                  {/* Readiness Progress Bar */}
                  <div className="space-y-1 pt-1 border-t border-border/60">
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>Configuration Completeness</span>
                      <span className="font-mono font-medium">{readiness.score}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${readiness.isReady ? 'bg-emerald-500' : 'bg-primary'}`} 
                        style={{ width: `${readiness.score}%` }} 
                      />
                    </div>
                    {!readiness.isReady && readiness.missingRequired.length > 0 && (
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 truncate">
                        Missing: {readiness.missingRequired.join(', ')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => setCallAgentId(agent.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      title="Dispatch Call with this Agent"
                    >
                      <PhoneCall className="h-3.5 w-3.5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setDeleteTarget(agent)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      title="Delete Agent"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <Link to={`/agents/${agent.id}`}>
                    <Button size="sm" className="h-8 text-xs font-medium px-3">
                      <span>Workspace</span>
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* List / Table Mode */
        <Card className="overflow-hidden shadow-xs border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="p-3 pl-4">Agent Name</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Readiness</th>
                  <th className="p-3">Model</th>
                  <th className="p-3">Voice</th>
                  <th className="p-3 text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredAgents.map((agent) => {
                  const readiness = calculateAgentReadiness(agent);
                  return (
                    <tr key={agent.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3 pl-4">
                        <div className="flex items-center gap-2">
                          <Bot className="h-4 w-4 text-primary shrink-0" />
                          <span className="font-semibold text-foreground">{agent.name || 'Unnamed Agent'}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          readiness.isReady 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        }`}>
                          {readiness.isReady ? 'Ready' : 'Needs Setup'}
                        </span>
                      </td>
                      <td className="p-3 font-mono">
                        {readiness.score}%
                      </td>
                      <td className="p-3 font-mono text-muted-foreground">
                        {agent.model?.model || 'Gemini 2.0 Flash'}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {agent.voice?.voiceId || 'Priya'}
                      </td>
                      <td className="p-3 text-right pr-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setCallAgentId(agent.id)}
                            className="h-7 w-7 text-muted-foreground hover:text-primary"
                            title="Call with Agent"
                          >
                            <PhoneCall className="h-3 w-3" />
                          </Button>
                          <Link to={`/agents/${agent.id}`}>
                            <Button variant="outline" size="sm" className="h-7 text-xs px-2.5">
                              Configure
                            </Button>
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setDeleteTarget(agent)}
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Voice Agent"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? All prompt instructions and call associations will be permanently removed.`}
        confirmText="Delete Agent"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
      />

      {/* Create Assistant Modal */}
      <CreateAssistantDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />

      {/* Outbound Call Modal */}
      {callAgentId && (
        <PlaceOutboundCall
          activeAssistantId={callAgentId}
          onClose={() => setCallAgentId(null)}
        />
      )}
    </div>
  );
}
