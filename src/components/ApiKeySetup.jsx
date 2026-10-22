import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { getApiKey } from '@/utils/apiKeyManager';
import { testApiKey } from '@/utils/api/apiKey';
import { Check, KeyRound, Loader2, Radio, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function ApiKeySetup() {
  const [apiKey, setApiKeyValue] = useState(getApiKey());
  const [isValidating, setIsValidating] = useState(false);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    const cleanKey = apiKey.trim();
    if (!cleanKey) return;
    
    setIsValidating(true);
    
    try {
      const result = await testApiKey(cleanKey);
      
      if (result.isValid) {
        toast.success('Connection verified!', {
          description: 'Access granted. Loading your VoxPilot workspace...',
          duration: 2500,
        });
        
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        toast.error('API Key Verification Failed', {
          description: result.message || 'Please check your API key and try again.',
          duration: 4500,
        });
      }
    } catch (error) {
      toast.error('Connection Error', {
        description: error?.message || 'Failed to reach the validation server. Please check your network connection.',
        duration: 4500,
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleClear = () => {
    setApiKeyValue('');
  };

  return (
    <Card className="p-6 sm:p-8 max-w-md w-full mx-auto shadow-lg border-border">
      <form onSubmit={handleSave} className="space-y-6">
        {/* Header with VoxPilot Branding */}
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shrink-0">
            <Radio className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground">VoxPilot Studio</h2>
            <p className="text-xs text-muted-foreground">Voice Agent Workspace</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <KeyRound className="h-4 w-4 text-primary" />
            <h3>Connect Voice Engine API Key</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Enter your CallHQ voice engine API key to manage AI voice agents, dispatch telephony calls, and test conversation flows.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="api-key" className="text-xs font-medium">API Key</Label>
          <Input
            id="api-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKeyValue(e.target.value)}
            placeholder="sk-..."
            className="font-mono text-xs tracking-wider"
            autoComplete="off"
            spellCheck="false"
            disabled={isValidating}
            autoFocus
          />
          <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground mt-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
            <span>Stored strictly in your local browser session and never sent to third-party tracking services.</span>
          </div>
        </div>

        <div className="flex space-x-2 pt-2">
          <Button 
            type="submit"
            disabled={!apiKey.trim() || isValidating}
            className="flex-1 shadow-sm"
          >
            {isValidating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Validating Key...
              </>
            ) : (
              'Connect Workspace'
            )}
          </Button>
          <Button 
            type="button"
            variant="outline" 
            onClick={handleClear}
            disabled={!apiKey || isValidating}
          >
            Clear
          </Button>
        </div>
      </form>
    </Card>
  );
}
