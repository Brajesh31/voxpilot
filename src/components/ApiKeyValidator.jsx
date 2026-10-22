import { useState, useEffect } from 'react';
import { validateCurrentApiKey } from '../utils/api/apiKey';
import { getApiKey, removeApiKey } from '../utils/apiKeyManager';
import { toast } from 'sonner';
import { Loader2, Radio } from 'lucide-react';

export default function ApiKeyValidator({ children }) {
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkKey = async () => {
      const apiKey = getApiKey();
      if (!apiKey) {
        if (isMounted) {
          setIsValid(false);
          setIsValidating(false);
        }
        return;
      }

      try {
        const result = await validateCurrentApiKey();
        
        if (!isMounted) return;

        if (result.isValid) {
          setIsValid(true);
        } else {
          removeApiKey();
          toast.error("Invalid API Key", {
            description: result.message || "Your API key is invalid or expired. Please re-enter your credentials.",
          });
          setIsValid(false);
        }
      } catch {
        if (!isMounted) return;
        removeApiKey();
        toast.error("API Key Verification Failed", {
          description: "Unable to verify your API key with the voice engine. Please reconnect.",
        });
        setIsValid(false);
      } finally {
        if (isMounted) {
          setIsValidating(false);
        }
      }
    };

    checkKey();

    return () => {
      isMounted = false;
    };
  }, []);

  // Professional loading screen while validating on startup
  if (isValidating) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 select-none">
        <div className="flex flex-col items-center max-w-sm text-center space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
            <Radio className="h-6 w-6 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h1 className="text-base font-bold text-foreground">VoxPilot Workspace</h1>
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin text-primary" />
              Verifying voice engine connection...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If invalid, null triggers the parent App.jsx to render ApiKeySetup
  if (!isValid) {
    return null;
  }

  return children;
}
