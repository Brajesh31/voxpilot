import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { deleteAssistant, saveAssistantDetail } from '@/store/slices/assistantsSlice'
import { createSession } from '@/utils/api/sessionAPI'
import { chatApi } from '@/utils/api/chatApi'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import ChatWidget from './chatWidget/ChatWidget'
import ConfirmationDialog from './ConfirmationDialog'
import PlaceOutboundCall from './PlaceOutboundCall'
import { 
  Save, 
  Trash2, 
  MessageSquare, 
  Phone,
  Loader2,
  X,
  Sparkles
} from 'lucide-react'
import { toast } from 'sonner'

export default function RightPanel({ onSave, onClose }) {
  const { assistants, currentAssistantId } = useSelector((state) => state.assistants)
  const assistantDetails = useSelector((state) => state?.assistantsApp?.activeDetail?.details || state?.assistants?.activeDetail?.details)
  const dispatch = useDispatch()
  
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showCallModal, setShowCallModal] = useState(false)
  const [currentSession, setCurrentSession] = useState(null)
  const [chatMessages, setChatMessages] = useState([])
  
  const currentAssistant = assistants.find((a) => a.id === currentAssistantId)
  
  if (!currentAssistant && !assistantDetails) {
    return (
      <aside className="w-80 bg-card border-l border-border flex items-center justify-center h-full p-6 text-center">
        <p className="text-sm text-muted-foreground">Select an assistant to access management actions.</p>
      </aside>
    )
  }

  const handleSave = async () => {
    if (!currentAssistantId) return
    
    setIsSaving(true)
    try {
      await dispatch(saveAssistantDetail({ 
        assistantId: currentAssistantId,
      })).unwrap()
      
      const agentName = assistantDetails?.name || currentAssistant?.name || 'Voice Agent'
      toast.success('Configuration saved', {
        description: `${agentName} has been updated successfully.`,
      })
      
      if (onSave) {
        onSave()
      }
    } catch (error) {
      toast.error('Failed to save configuration', {
        description: error.message || 'Please check your inputs and try again.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!currentAssistantId) return

    setIsDeleting(true)
    try {
      await dispatch(deleteAssistant(currentAssistantId)).unwrap()
      
      toast.success('Voice agent deleted', {
        description: `Agent "${currentAssistant?.name || 'Agent'}" has been removed.`,
      })
      setShowDeleteDialog(false)
    } catch (error) {
      toast.error('Failed to delete agent', {
        description: error?.message || 'The server could not process the deletion.',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const createChatSession = async () => {
    try {
      const sessionPayload = {
        name: assistantDetails?.name || currentAssistant?.name || "VoxPilot Session",
        assistantId: currentAssistantId,
      }
      
      const sessionResponse = await createSession(sessionPayload)
      setCurrentSession(sessionResponse.session)
      return sessionResponse.session
    } catch (error) {
      toast.error('Unable to initialize chat session', {
        description: error.message || 'Please check your API key.',
      })
      throw error
    }
  }

  const onSendMessage = async (messages) => {
    try {
      let session = currentSession
      if (!session) {
        session = await createChatSession()
      }

      const lastMessage = messages[messages.length - 1]
      
      // Pass the agent's configured model or default to gemini-2.0-flash
      const configuredModel = assistantDetails?.model || {}
      const chatPayload = {
        sessionId: session.id,
        input: lastMessage.content,
        assistantOverrides: {
          model: {
            provider: configuredModel.provider || "google",
            model: configuredModel.model || "gemini-2.0-flash",
          },
        },
      }

      const chatResponse = await chatApi(chatPayload)
      
      const userMessage = {
        role: 'user',
        content: lastMessage.content,
      }
      
      const assistantOutput = chatResponse?.chat?.output?.[0]?.content || 'I received your message.'
      const assistantMessage = {
        role: 'assistant',
        content: assistantOutput,
      }
      
      setChatMessages((prev) => {
        const lastStoredMessage = prev[prev.length - 1]
        if (lastStoredMessage && lastStoredMessage.role === 'user' && lastStoredMessage.content === userMessage.content) {
          return [...prev, assistantMessage]
        }
        return [...prev, userMessage, assistantMessage]
      })
      
      return assistantOutput
    } catch (error) {
      toast.error('Failed to transmit message to agent')
      throw error
    }
  }

  return (
    <aside className="w-80 bg-card border-l border-border flex flex-col h-full select-none shrink-0" aria-label="Agent Actions">
      <div className="p-5 space-y-5 flex-1 overflow-y-auto">
        {/* Header with optional close button for mobile drawer */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground">Actions & Testing</h3>
            <p className="text-xs text-muted-foreground">Manage and test your active agent</p>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="lg:hidden h-8 w-8 text-muted-foreground"
              aria-label="Close actions panel"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Primary Configuration Actions */}
        <Card className="p-4 space-y-3 shadow-xs">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Deployment Actions
          </div>
          <Button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full shadow-sm"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>

          <Button 
            variant="outline"
            onClick={() => setShowCallModal(true)}
            className="w-full flex items-center justify-center"
          >
            <Phone className="h-4 w-4 mr-2 text-primary" />
            Dispatch Outbound Call
          </Button>
        </Card>

        {/* Real-time Agent Testing */}
        <Card className="p-4 space-y-3 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Simulation & Testing
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Test agent prompts, greeting flow, and responses in a sandboxed session before calling real numbers.
          </p>
          <Button 
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            onClick={() => {
              if (!showChat) {
                setCurrentSession(null)
                setChatMessages([])
              }
              setShowChat(!showChat)
            }}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            {showChat ? 'Close Interactive Chat' : 'Test Agent via Chat'}
          </Button>
        </Card>

        {/* Danger Zone */}
        <Card className="p-4 space-y-3 border-destructive/20 bg-destructive/5 shadow-xs">
          <div className="text-xs font-semibold text-destructive uppercase tracking-wider">
            Danger Zone
          </div>
          <p className="text-xs text-muted-foreground">
            Permanently remove this agent and its prompt configurations from the workspace.
          </p>
          <Button 
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            className="w-full"
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Agent
          </Button>
        </Card>
      </div>

      {/* Floating Chat Widget */}
      {showChat && (
        <ChatWidget
          onSendMessage={onSendMessage}
          onClose={() => {
            setShowChat(false)
            setCurrentSession(null)
            setChatMessages([])
          }}
          messages={chatMessages}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Voice Agent"
        description={`Are you sure you want to permanently delete "${currentAssistant?.name || assistantDetails?.name || 'this agent'}"? All instructions, settings, and conversation logs associated with it will be removed.`}
        confirmText="Delete Voice Agent"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
      />

      {/* Outbound Call Dispatch Modal */}
      {showCallModal && (
        <PlaceOutboundCall
          activeAssistantId={currentAssistantId}
          onClose={() => setShowCallModal(false)}
        />
      )}
    </aside>
  )
}
