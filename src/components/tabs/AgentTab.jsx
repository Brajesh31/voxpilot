import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { appendToAssistantDetail } from '@/store/slices/assistantsSlice'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/shimmer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare, Sparkles, UserCheck } from 'lucide-react'

export default function AgentTab() {
  const dispatch = useDispatch()
  
  // Grab assistant details from unified Redux store
  const assistantDetails = useSelector((state) => state?.assistantsApp?.activeDetail?.details || state?.assistants?.activeDetail?.details)
  const detailStatus = useSelector((state) => state?.assistantsApp?.detailStatus || state?.assistants?.detailStatus)

  const firstMessage = assistantDetails?.firstMessage || ""
  const promptMessage = assistantDetails?.model?.messages?.[0]?.content || ""
  const messageMode = assistantDetails?.firstMessageMode

  // Local state
  const [firstMessageMode, setFirstMessageMode] = useState("assistant-speaks-first")
  const [updatedMessage, setUpdatedMessage] = useState("")
  const [updatedPrompt, setUpdatedPrompt] = useState("")

  // Initialize local states when assistant details change
  useEffect(() => {
    setUpdatedMessage(firstMessage)
    setUpdatedPrompt(promptMessage)
    setFirstMessageMode(messageMode || "assistant-speaks-first")
  }, [firstMessage, promptMessage, messageMode])

  // Sync local changes to Redux staged updateData
  useEffect(() => {
    const validFirstMessageModes = [
      'assistant-speaks-first',
      'assistant-speaks-first-with-model-generated-message', 
      'assistant-waits-for-user'
    ]
    
    const formattedData = {
      ...(firstMessageMode && 
          validFirstMessageModes.includes(firstMessageMode) && 
          { firstMessageMode }),
      firstMessage: updatedMessage,
      // Preserve LLM configuration with updated prompt content
      model: {
        provider: assistantDetails?.model?.provider || 'google',
        model: assistantDetails?.model?.model || 'gemini-2.0-flash',
        temperature: assistantDetails?.model?.temperature ?? 0.5,
        maxTokens: assistantDetails?.model?.maxTokens ?? 250,
        emotionRecognitionEnabled: assistantDetails?.model?.emotionRecognitionEnabled || false,
        messages: [
          {
            role: "system",
            content: updatedPrompt,
          },
        ],
      },
      // Preserve transcriber configuration
      transcriber: assistantDetails?.transcriber || {
        provider: 'deepgram',
        model: 'nova-3',
        language: 'multi',
      },
      // Preserve call runtime options
      backgroundDenoisingEnabled: assistantDetails?.backgroundDenoisingEnabled !== undefined ? assistantDetails.backgroundDenoisingEnabled : true,
      backgroundSound: assistantDetails?.backgroundSound || 'office',
      silenceTimeoutSeconds: assistantDetails?.silenceTimeoutSeconds || 10,
      firstMessageInterruptionsEnabled: assistantDetails?.firstMessageInterruptionsEnabled !== undefined ? assistantDetails.firstMessageInterruptionsEnabled : false,
      maxDurationSeconds: assistantDetails?.maxDurationSeconds || 3600,
    }

    dispatch(appendToAssistantDetail(formattedData))
  }, [firstMessageMode, updatedMessage, updatedPrompt, dispatch, assistantDetails])

  if (detailStatus === 'loading') {
    return (
      <div className="p-4 lg:p-6 space-y-6 max-w-4xl">
        <div className="space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-4xl">
      {/* First Message Mode */}
      <Card className="shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Initiation & Speaker Precedence</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">Choose who begins speaking once the call connects</p>
        </CardHeader>
        <CardContent>
          <Select 
            value={firstMessageMode} 
            onValueChange={setFirstMessageMode}
          >
            <SelectTrigger className="w-full sm:max-w-md">
              <SelectValue placeholder="Select initiation behavior" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="assistant-speaks-first">Assistant speaks first (Fixed greeting)</SelectItem>
              <SelectItem value="assistant-speaks-first-with-model-generated-message">Assistant speaks first (Dynamic AI greeting)</SelectItem>
              <SelectItem value="assistant-waits-for-user">Assistant waits for user to speak</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Assistant Welcome Message */}
      <Card className="shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Welcome Greeting</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">The initial phrase spoken by the agent immediately upon connection</p>
        </CardHeader>
        <CardContent className="space-y-2">
          <Input
            value={updatedMessage}
            onChange={(e) => setUpdatedMessage(e.target.value)}
            placeholder="e.g., Hi, this is Alex from Support. How can I help you today?"
            className="w-full text-sm"
          />
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary shrink-0" />
            <span>Use template placeholders like <code className="px-1 py-0.5 rounded bg-muted font-mono text-[11px]">&#123;&#123;customer_name&#125;&#125;</code> for personalized outreach.</span>
          </div>
        </CardContent>
      </Card>
      
      {/* Agent System Prompt */}
      <Card className="shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Agent System Instructions</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">Define the persona, role, business domain, constraints, and instructions</p>
        </CardHeader>
        <CardContent className="space-y-2">
          <Textarea
            value={updatedPrompt}
            onChange={(e) => setUpdatedPrompt(e.target.value)}
            placeholder="You are a professional voice agent. Your task is to..."
            className="min-h-[220px] font-mono text-xs leading-relaxed resize-y"
          />
          <p className="text-xs text-muted-foreground">
            Dynamic parameters like <code className="px-1 py-0.5 rounded bg-muted font-mono text-[11px]">&#123;&#123;order_id&#125;&#125;</code> will be automatically extracted during outbound call setup.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
