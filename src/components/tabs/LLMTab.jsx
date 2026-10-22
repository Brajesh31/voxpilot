import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { appendToAssistantDetail } from '@/store/slices/assistantsSlice'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Skeleton } from '@/components/ui/shimmer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { LLM_CONFIG } from '@/utils/llm_config'
import { Cpu, Gauge, Zap } from 'lucide-react'

export default function LLMTab() {
  const dispatch = useDispatch()
  
  const assistantDetails = useSelector(
    (state) => state?.assistantsApp?.activeDetail?.details || state?.assistants?.activeDetail?.details
  )
  const detailStatus = useSelector((state) => state?.assistantsApp?.detailStatus || state?.assistants?.detailStatus)

  const reduxModel = assistantDetails?.model || {}
  const initialProvider = reduxModel?.provider || 'google'
  const initialModel = reduxModel?.model || 'gemini-2.0-flash'
  const initialTemperature = typeof reduxModel?.temperature === 'number' ? reduxModel?.temperature : 0.5
  const initialMaxTokens = typeof reduxModel?.maxTokens === 'number' ? reduxModel?.maxTokens : 250

  const providers = Object.keys(LLM_CONFIG)
  const defaultProvider = providers.includes(initialProvider) ? initialProvider : providers[0]

  // Local states
  const [selectedProvider, setSelectedProvider] = useState(defaultProvider)
  const [selectedModel, setSelectedModel] = useState('')
  const [temperature, setTemperature] = useState(initialTemperature)
  const [maxTokens, setMaxTokens] = useState(initialMaxTokens >= 50 ? initialMaxTokens : 250)
  const [maxTokensInput, setMaxTokensInput] = useState(String(maxTokens))

  const getModels = (provider) => {
    if (LLM_CONFIG[provider] && LLM_CONFIG[provider].models) {
      return Object.keys(LLM_CONFIG[provider].models)
    }
    return []
  }

  const getModelDisplayName = (provider, modelId) => {
    if (LLM_CONFIG[provider] && LLM_CONFIG[provider].models) {
      const models = LLM_CONFIG[provider].models
      for (const [displayName, id] of Object.entries(models)) {
        if (id === modelId) {
          return displayName
        }
      }
    }
    return null
  }

  const availableModels = getModels(selectedProvider)
  const modelDisplayName = getModelDisplayName(selectedProvider, initialModel)
  const defaultModel = modelDisplayName || availableModels[0] || ''

  useEffect(() => {
    setSelectedModel(defaultModel)
  }, [selectedProvider, defaultModel])

  useEffect(() => {
    if (initialModel && selectedProvider) {
      const displayName = getModelDisplayName(selectedProvider, initialModel)
      if (displayName) {
        setSelectedModel(displayName)
      } else if (availableModels.length > 0) {
        setSelectedModel(availableModels[0])
      }
    } else if (availableModels.length > 0) {
      setSelectedModel(availableModels[0])
    }
  }, [initialModel, selectedProvider, availableModels])

  // Sync state to Redux staged updateData
  useEffect(() => {
    const resolvedModelId = LLM_CONFIG[selectedProvider]?.models[selectedModel] || selectedModel || 'gemini-2.0-flash'
    
    const formattedData = {
      firstMessageMode: assistantDetails?.firstMessageMode || 'assistant-speaks-first',
      firstMessage: assistantDetails?.firstMessage || '',
      transcriber: assistantDetails?.transcriber || {
        provider: 'deepgram',
        model: 'nova-3',
        language: 'multi',
      },
      backgroundDenoisingEnabled: assistantDetails?.backgroundDenoisingEnabled !== undefined ? assistantDetails.backgroundDenoisingEnabled : true,
      backgroundSound: assistantDetails?.backgroundSound || 'office',
      silenceTimeoutSeconds: assistantDetails?.silenceTimeoutSeconds || 10,
      firstMessageInterruptionsEnabled: assistantDetails?.firstMessageInterruptionsEnabled !== undefined ? assistantDetails.firstMessageInterruptionsEnabled : false,
      maxDurationSeconds: assistantDetails?.maxDurationSeconds || 3600,
      model: {
        provider: selectedProvider,
        model: resolvedModelId,
        maxTokens,
        temperature,
        emotionRecognitionEnabled: assistantDetails?.model?.emotionRecognitionEnabled || false,
        messages: assistantDetails?.model?.messages || [
          {
            role: "system",
            content: "You are a professional voice agent. Communicate clearly and politely.",
          },
        ],
      },
    }
    dispatch(appendToAssistantDetail(formattedData))
  }, [selectedProvider, selectedModel, maxTokens, temperature, dispatch, assistantDetails])

  const validateMaxTokens = () => {
    const val = Number(maxTokensInput)
    if (isNaN(val) || val < 50 || val > 4000) {
      toast.error('Max tokens must be a number between 50 and 4000.')
      setMaxTokensInput(String(maxTokens))
      return
    }
    setMaxTokens(val)
  }

  if (detailStatus === 'loading') {
    return (
      <div className="p-4 lg:p-6 space-y-6 max-w-4xl">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-4xl">
      {/* Model & Provider Selection */}
      <Card className="shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Language Model Architecture</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">Select the core foundation model powering your voice agent's intelligence</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Provider</Label>
              <Select 
                value={selectedProvider} 
                onValueChange={setSelectedProvider}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((provider) => (
                    <SelectItem key={provider} value={provider}>
                      {provider.charAt(0).toUpperCase() + provider.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Model</Label>
              <Select 
                value={selectedModel} 
                onValueChange={setSelectedModel}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Gemini 2.0 Flash is recommended for real-time conversational telephony due to sub-second TTFT (Time to First Token).
          </p>
        </CardContent>
      </Card>

      {/* Temperature */}
      <Card className="shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Sampling Temperature</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">Controls predictability vs creative variance in agent speech responses</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="px-2 pt-2">
            <Slider
              value={[temperature]}
              onValueChange={([value]) => setTemperature(value)}
              max={1}
              min={0}
              step={0.01}
              className="w-full"
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Deterministic (0.0)</span>
            <span className="font-mono font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">
              {temperature.toFixed(2)}
            </span>
            <span>Creative (1.0)</span>
          </div>
          <div className="bg-muted/40 p-3 rounded-lg border border-border text-xs text-muted-foreground">
            <strong>Behavior:</strong> {temperature < 0.3 ? 'Deterministic & strict adherence to instructions' : temperature < 0.7 ? 'Balanced consistency and conversational naturalness' : 'High variability and creative freedom'}
          </div>
        </CardContent>
      </Card>

      {/* Max Generation Tokens */}
      <Card className="shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Max Response Tokens</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">Limits the maximum length of each conversational utterance generated by the model</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-3">
            <Input
              type="number"
              value={maxTokensInput}
              onChange={(e) => setMaxTokensInput(e.target.value)}
              onBlur={validateMaxTokens}
              onKeyDown={(e) => {
                if (e.key === 'Enter') validateMaxTokens();
              }}
              min={50}
              max={4000}
              className="w-32 font-mono text-sm"
            />
            <span className="text-xs text-muted-foreground">tokens (Recommended: 150-350 for natural turn-taking)</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
