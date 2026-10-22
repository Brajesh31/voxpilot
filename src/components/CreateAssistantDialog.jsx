import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setCurrentAssistant, fetchAssistants, fetchAssistantDetail } from '@/store/slices/assistantsSlice';
import { createAssistant } from '@/utils/api/assistantAPI';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bot, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CreateAssistantDialog({ open, onOpenChange, onAssistantCreated }) {
  const [assistantName, setAssistantName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const dispatch = useDispatch();

  const handleCreate = async () => {
    const trimmedName = assistantName.trim();
    if (!trimmedName) {
      toast.error('Please enter an assistant name');
      return;
    }

    setIsCreating(true);

    try {
      // Default VoxPilot starter configuration template
      const payload = {
        name: trimmedName,
        voice: { 
          provider: 'CallHQ', // Voice synthesis provider required by backend engine
          voiceId: 'Priya', 
          speed: 1,
        },
        transcriber: {
          provider: 'deepgram',
          model: 'nova-3',
          language: 'multi',
        },
        model: {
          provider: 'google',
          model: 'gemini-2.0-flash',
          temperature: 0.5,
          maxTokens: 250,
          emotionRecognitionEnabled: false,
          messages: [
            {
              role: 'system',
              content: 'You are a professional voice representative. Communicate clearly, concisely, and politely.',
            },
          ],
        },
        firstMessage: 'Hello, how may I assist you today?',
        firstMessageMode: 'assistant-speaks-first',
        backgroundSound: 'office',
        silenceTimeoutSeconds: 10,
        backgroundDenoisingEnabled: true,
        firstMessageInterruptionsEnabled: false,
        maxDurationSeconds: 3600,
      };

      // Create assistant on the backend
      const createdAssistant = await createAssistant(payload);
      const createdId = createdAssistant?.id || createdAssistant?.assistant?.id;

      // Refresh assistants collection
      await dispatch(fetchAssistants());

      if (createdId) {
        dispatch(setCurrentAssistant(createdId));
        await dispatch(fetchAssistantDetail(createdId));
      }

      toast.success('Voice agent created!', {
        description: `"${trimmedName}" is ready for prompt configuration.`,
      });

      setAssistantName('');
      onOpenChange(false);

      if (onAssistantCreated) {
        onAssistantCreated(createdAssistant);
      }
    } catch (error) {
      toast.error('Failed to create voice agent', {
        description: error.message || 'Please check your connection and try again.',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    if (isCreating) return;
    setAssistantName('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !isCreating && onOpenChange(val)}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Bot className="h-5 w-5" />
            </div>
            <DialogTitle className="text-lg">Create Voice Agent</DialogTitle>
          </div>
          <DialogDescription>
            Initialize a new voice agent with a starter prompt, speech recognition, and language model configuration.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
          <div className="py-4 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="agent-name">Agent Name</Label>
              <Input
                id="agent-name"
                value={assistantName}
                onChange={(e) => setAssistantName(e.target.value)}
                placeholder="e.g., Support Receptionist, Sales Outreach"
                disabled={isCreating}
                autoFocus
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              You will be able to customize the system prompt, model temperature, language, and voice settings after creation.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel} 
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!assistantName.trim() || isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Agent'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
