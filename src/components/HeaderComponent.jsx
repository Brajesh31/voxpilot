import { useEffect, useState, useRef } from 'react';
import { Copy, LogOut, Loader2, SlidersHorizontal, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useSelector, useDispatch } from 'react-redux';
import { updateAssistant } from '../utils/api/assistantAPI'; 
import { fetchAssistantDetail, fetchAssistants } from '../store/slices/assistantsSlice';
import { removeApiKey } from '../utils/apiKeyManager';
import ThemeCustomizer from './ThemeCustomizer';
import { Button } from './ui/button';

export default function HeaderComponent({ onToggleActions, isActionsOpen }) {
  const activeDetails = useSelector((state) => state?.assistantsApp?.activeDetail || state?.assistants?.activeDetail || {});
  const assistantId = activeDetails?.id || activeDetails?.details?.id || activeDetails?.assistant?.id;
  const currentName = activeDetails?.details?.name || activeDetails?.name || '';
  
  const [agentName, setAgentName] = useState(currentName);
  const [isCopied, setIsCopied] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  
  const editableRef = useRef(null);
  const debounceTimeout = useRef(null);
  const prevAgentName = useRef(agentName);
  const dispatch = useDispatch();

  useEffect(() => {
    const freshName = activeDetails?.details?.name || activeDetails?.name || '';
    setAgentName(freshName);
    prevAgentName.current = freshName;
    if (editableRef.current && editableRef.current.textContent !== freshName) {
      editableRef.current.textContent = freshName;
    }
  }, [activeDetails]);

  const handleCopy = () => {
    if (!assistantId) {
      toast.error('No assistant ID available');
      return;
    }

    navigator.clipboard.writeText(assistantId).then(() => {
      setIsCopied(true);
      toast.success('Assistant ID copied to clipboard', {
        description: assistantId,
      });
      setTimeout(() => setIsCopied(false), 2000);
    }).catch(() => {
      toast.error('Failed to copy ID to clipboard');
    });
  };

  const handleDebouncedUpdate = async (newName) => {
    const trimmed = newName.trim();
    if (!assistantId || !trimmed || trimmed === prevAgentName.current) return;

    setIsSavingName(true);
    try {
      await updateAssistant(assistantId, { name: trimmed });
      toast.success('Agent name updated', {
        description: `Name saved as "${trimmed}".`,
      });
      prevAgentName.current = trimmed;
      dispatch(fetchAssistantDetail(assistantId));
      dispatch(fetchAssistants());
    } catch (err) {
      toast.error('Failed to update agent name', {
        description: err?.message || 'Please check your connection and try again.',
      });
    } finally {
      setIsSavingName(false);
    }
  };

  const handleAgentNameChange = (newName) => {
    setAgentName(newName);

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      handleDebouncedUpdate(newName);
    }, 1000);
  };

  const handleLogout = () => {
    setIsLoggingOut(true);
    removeApiKey();
    toast.success('Logged out successfully', {
      description: 'Your API key has been cleared from local storage.',
    });
    setTimeout(() => {
      window.location.reload();
    }, 400);
  };

  return (
    <header className="border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-10 select-none">
      <div className="px-4 lg:px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Agent Title & Copy ID */}
          <div className="flex items-center space-x-2 min-w-0">
            <div className="flex items-center space-x-2 min-w-0">
              <span
                ref={editableRef}
                contentEditable
                suppressContentEditableWarning={true}
                onInput={(e) => handleAgentNameChange(e.currentTarget.textContent || '')}
                className="text-base sm:text-lg font-semibold text-foreground bg-transparent border-none outline-none focus:ring-2 focus:ring-primary/20 rounded px-2 py-1 min-w-[120px] max-w-[300px] truncate"
                title="Click to rename voice agent"
              />
              {isSavingName && (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground shrink-0" />
              )}
              {assistantId && (
                <button
                  type="button"
                  onClick={handleCopy}
                  title="Copy Assistant ID"
                  className="p-1.5 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground shrink-0"
                  aria-label="Copy Assistant ID"
                >
                  {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              )}
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            {/* Mobile Actions Drawer Toggle */}
            {onToggleActions && (
              <Button
                variant={isActionsOpen ? "default" : "outline"}
                size="sm"
                onClick={onToggleActions}
                className="lg:hidden h-8 px-2.5 text-xs flex items-center gap-1.5"
                title="Toggle Actions Panel"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Actions</span>
              </Button>
            )}

            {/* Theme Customizer Trigger */}
            <ThemeCustomizer />

            {/* Logout Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              disabled={isLoggingOut}
              title="Logout / Disconnect Key"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              aria-label="Logout"
            >
              {isLoggingOut ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
