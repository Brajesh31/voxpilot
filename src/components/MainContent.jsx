import { useSelector } from 'react-redux'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import AgentTab from './tabs/AgentTab'
import LLMTab from './tabs/LLMTab'
import TranscriberTab from './tabs/TranscriberTab'
import HeaderComponent from './HeaderComponent'
import AssistantShimmer from './AssistantShimmer'
import { Bot, Plus, Radio } from 'lucide-react'

export default function MainContent({ onCreateAssistant, onToggleActions, isActionsOpen }) {
  const assistantDetails = useSelector((state) => state?.assistantsApp?.activeDetail?.details || state?.assistants?.activeDetail?.details)
  const detailStatus = useSelector((state) => state?.assistantsApp?.detailStatus || state?.assistants?.detailStatus)
  const assistants = useSelector((state) => state?.assistants?.assistants || state?.assistantsApp?.assistants || [])
  
  if (detailStatus === 'loading') {
    return <AssistantShimmer />
  }
  
  // Show clean empty state when no assistants exist
  if (assistants.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background min-h-screen p-6">
        <div className="text-center space-y-5 max-w-md mx-auto">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto text-primary shadow-sm">
            <Radio className="h-8 w-8" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold tracking-tight text-foreground">No Voice Agents Configured</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Create your first AI voice agent to configure prompts, language models, speech recognition, and telephony dispatch.
            </p>
          </div>
          <Button 
            onClick={onCreateAssistant}
            size="sm"
            className="shadow-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create First Agent
          </Button>
        </div>
      </div>
    )
  }
  
  if (!assistantDetails || detailStatus === 'failed') {
    return (
      <div className="flex-1 flex flex-col bg-background min-h-screen">
        <HeaderComponent onToggleActions={onToggleActions} isActionsOpen={isActionsOpen} />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-4 max-w-sm mx-auto">
            <div className="w-14 h-14 bg-muted rounded-xl flex items-center justify-center mx-auto text-muted-foreground">
              <Bot className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-foreground">No Agent Selected</h2>
              <p className="text-xs text-muted-foreground">
                Select an agent from the sidebar list to view and configure its parameters.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-background min-h-screen">
      {/* Header Bar with inline rename, copy ID, and theme toggle */}
      <HeaderComponent onToggleActions={onToggleActions} isActionsOpen={isActionsOpen} />

      {/* Tabs Layout */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <Tabs defaultValue="agent" className="h-full flex flex-col">
          <div className="border-b border-border bg-card/40 px-4 lg:px-6 py-2">
            <TabsList className="grid w-full max-w-md grid-cols-3 bg-muted/60">
              <TabsTrigger value="agent" className="text-xs font-medium">
                Agent & Prompt
              </TabsTrigger>
              <TabsTrigger value="llm" className="text-xs font-medium">
                LLM Engine
              </TabsTrigger>
              <TabsTrigger value="transcriber" className="text-xs font-medium">
                Transcriber
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <TabsContent value="agent" className="m-0 h-full outline-hidden">
              <AgentTab />
            </TabsContent>
            <TabsContent value="llm" className="m-0 h-full outline-hidden">
              <LLMTab />
            </TabsContent>
            <TabsContent value="transcriber" className="m-0 h-full outline-hidden">
              <TranscriberTab />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
