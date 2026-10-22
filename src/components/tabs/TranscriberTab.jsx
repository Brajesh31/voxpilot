import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { appendToAssistantDetail } from '@/store/slices/assistantsSlice'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/shimmer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TRANSCRIBER_CONFIG } from '@/utils/transcriber_config'
import { Mic, Waves } from 'lucide-react'

export default function TranscriberTab() {
  const dispatch = useDispatch()
  const assistantDetails = useSelector((state) => state?.assistantsApp?.activeDetail?.details || state?.assistants?.activeDetail?.details || {})
  const detailStatus = useSelector((state) => state?.assistantsApp?.detailStatus || state?.assistants?.detailStatus)

  const [selectedProvider, setSelectedProvider] = useState('deepgram')
  const [selectedModel, setSelectedModel] = useState('nova-3')
  const [selectedLanguage, setSelectedLanguage] = useState('multi')
  const [enableBackgroundNoise, setEnableBackgroundNoise] = useState(true)

  const transcribers = Object.keys(TRANSCRIBER_CONFIG)
  
  const getModels = (provider) => {
    if (TRANSCRIBER_CONFIG[provider] && TRANSCRIBER_CONFIG[provider].models) {
      return TRANSCRIBER_CONFIG[provider].models
    }
    return []
  }
  
  const getLanguages = (provider) => {
    if (TRANSCRIBER_CONFIG[provider] && TRANSCRIBER_CONFIG[provider].languages) {
      return TRANSCRIBER_CONFIG[provider].languages
    }
    return []
  }
  
  const models = getModels(selectedProvider)
  const languages = getLanguages(selectedProvider)

  useEffect(() => {
    if (assistantDetails?.transcriber) {
      setSelectedProvider(assistantDetails.transcriber.provider || 'deepgram')
      setSelectedModel(assistantDetails.transcriber.model || 'nova-3')
      setSelectedLanguage(assistantDetails.transcriber.language || 'multi')
      setEnableBackgroundNoise(Boolean(assistantDetails.backgroundDenoisingEnabled ?? true))
    }
  }, [assistantDetails])

  useEffect(() => {
    if (!selectedProvider) return

    dispatch(
      appendToAssistantDetail({
        firstMessageMode: assistantDetails?.firstMessageMode || 'assistant-speaks-first',
        firstMessage: assistantDetails?.firstMessage || '',
        model: assistantDetails?.model || {
          provider: 'google',
          model: 'gemini-2.0-flash',
          temperature: 0.5,
          maxTokens: 250,
          emotionRecognitionEnabled: false,
          messages: [
            {
              role: "system",
              content: "You are a professional voice agent. Communicate clearly and politely.",
            },
          ],
        },
        backgroundSound: assistantDetails?.backgroundSound || 'office',
        silenceTimeoutSeconds: assistantDetails?.silenceTimeoutSeconds || 10,
        firstMessageInterruptionsEnabled: assistantDetails?.firstMessageInterruptionsEnabled !== undefined ? assistantDetails.firstMessageInterruptionsEnabled : false,
        maxDurationSeconds: assistantDetails?.maxDurationSeconds || 3600,
        transcriber: {
          provider: selectedProvider,
          model: selectedModel,
          language: selectedLanguage,
        },
        backgroundDenoisingEnabled: enableBackgroundNoise,
      })
    )
  }, [selectedProvider, selectedModel, selectedLanguage, enableBackgroundNoise, dispatch, assistantDetails])

  if (detailStatus === 'loading') {
    return (
      <div className="p-4 lg:p-6 space-y-6 max-w-4xl">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-4xl">
      {/* Speech-to-Text Engine Selection */}
      <Card className="shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Mic className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Speech Recognition (STT)</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">Configure the speech-to-text pipeline that transcribes incoming caller voice in real-time</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Provider</Label>
              <Select 
                value={selectedProvider} 
                onValueChange={(value) => {
                  setSelectedProvider(value)
                  const newModels = getModels(value)
                  const newLangs = getLanguages(value)
                  setSelectedModel(newModels[0] || '')
                  setSelectedLanguage(newLangs[0] || '')
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {transcribers.map((provider) => (
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
                disabled={!selectedProvider}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5 max-w-sm">
            <Label className="text-xs font-medium">Spoken Language</Label>
            <Select 
              value={selectedLanguage} 
              onValueChange={setSelectedLanguage}
              disabled={!selectedProvider}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {languages.map((language) => (
                  <SelectItem key={language} value={language}>
                    {language.charAt(0).toUpperCase() + language.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Audio Denoising Filtering */}
      <Card className="shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Waves className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Acoustic Signal Processing</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">Real-time digital signal processing applied to the audio stream</p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3.5 border border-border rounded-lg bg-muted/30">
            <div className="space-y-0.5 pr-4">
              <Label htmlFor="bg-noise-toggle" className="text-sm font-medium">Background Denoising Filter</Label>
              <p className="text-xs text-muted-foreground">
                Suppresses ambient background noise and echo from the user's microphone during conversation.
              </p>
            </div>
            <Switch
              id="bg-noise-toggle"
              checked={enableBackgroundNoise}
              onCheckedChange={setEnableBackgroundNoise}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}