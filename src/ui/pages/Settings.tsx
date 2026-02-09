import { useState, useEffect } from 'react'
import { Button } from '@/ui/components/ui/button'
import { Input } from '@/ui/components/ui/input'
import { Label } from '@/ui/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/ui/card'
import { client } from '@/ui/client'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/ui/components/ui/select'
import { useToast } from '@/ui/hooks/use-toast'

export default function Settings() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})

  // Lists for dropdowns
  const [openaiTextModels, setOpenaiTextModels] = useState<string[]>([])
  const [openaiImageModels, setOpenaiImageModels] = useState<string[]>([])
  const [googleTextModels, setGoogleTextModels] = useState<string[]>([])
  const [googleImageModels, setGoogleImageModels] = useState<string[]>([])

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      // Corrected API call: remove .api prefix
      const res = await client.settings.$get()
      if (res.ok) {
        const data = await res.json()
        setSettings(data)

        // Parse models
        setOpenaiTextModels(JSON.parse(data['openai_text_models'] || '[]'))
        setOpenaiImageModels(JSON.parse(data['openai_image_models'] || '[]'))
        setGoogleTextModels(JSON.parse(data['google_text_models'] || '[]'))
        setGoogleImageModels(JSON.parse(data['google_image_models'] || '[]'))
      } else {
        throw new Error(`Failed to fetch settings: ${res.status} ${res.statusText}`)
      }
    } catch (error) {
      console.error('Failed to fetch settings', error)
      toast({
        title: 'Error',
        description: 'Failed to load settings.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const saveSetting = async (key: string, value: string) => {
    setSaving((prev) => ({ ...prev, [key]: true }))
    try {
      // Corrected API call: remove .api prefix
      const res = await client.settings[':key'].$put({
        param: { key },
        json: { value },
      })

      if (!res.ok) {
        throw new Error(`Failed to save setting: ${res.status} ${res.statusText}`)
      }

      setSettings((prev) => ({ ...prev, [key]: value }))
      toast({
        title: 'Success',
        description: 'Setting saved.',
      })
    } catch (error) {
      console.error('Failed to save setting', error)
      toast({
        title: 'Error',
        description: 'Failed to save setting.',
        variant: 'destructive',
      })
    } finally {
      setSaving((prev) => ({ ...prev, [key]: false }))
    }
  }

  const updateModelList = async (key: string, list: string[], setList: (l: string[]) => void) => {
    const value = JSON.stringify(list)
    await saveSetting(key, value)
    setList(list)
  }

  const addModel = (list: string[], setList: (l: string[]) => void, key: string, newItem: string) => {
    if (newItem && !list.includes(newItem)) {
      const newList = [...list, newItem]
      updateModelList(key, newList, setList)
    }
  }

  const removeModel = (list: string[], setList: (l: string[]) => void, key: string, itemToRemove: string) => {
    const newList = list.filter((item) => item !== itemToRemove)
    updateModelList(key, newList, setList)
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Settings</h2>

      {/* OpenAI Provider */}
      <Card>
        <CardHeader>
          <CardTitle>OpenAI Provider</CardTitle>
          <CardDescription>Configure OpenAI API settings and models.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="openai_api_key">API Key</Label>
            <div className="flex gap-2">
              <Input
                id="openai_api_key"
                type="password"
                value={settings['openai_api_key'] || ''}
                onChange={(e) => setSettings({ ...settings, openai_api_key: e.target.value })}
                placeholder="sk-..."
              />
              <Button
                onClick={() => saveSetting('openai_api_key', settings['openai_api_key'] || '')}
                disabled={saving['openai_api_key']}
              >
                {saving['openai_api_key'] ? <Loader2 className="animate-spin" /> : 'Save'}
              </Button>
            </div>
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="openai_base_url">Base URL (Optional)</Label>
            <div className="flex gap-2">
              <Input
                id="openai_base_url"
                value={settings['openai_base_url'] || ''}
                onChange={(e) => setSettings({ ...settings, openai_base_url: e.target.value })}
                placeholder="https://api.openai.com/v1"
              />
              <Button
                onClick={() => saveSetting('openai_base_url', settings['openai_base_url'] || '')}
                disabled={saving['openai_base_url']}
              >
                {saving['openai_base_url'] ? <Loader2 className="animate-spin" /> : 'Save'}
              </Button>
            </div>
          </div>

          <ModelList
            title="Text Models"
            models={openaiTextModels}
            onAdd={(m) => addModel(openaiTextModels, setOpenaiTextModels, 'openai_text_models', m)}
            onRemove={(m) => removeModel(openaiTextModels, setOpenaiTextModels, 'openai_text_models', m)}
          />
          <ModelList
            title="Image Models"
            models={openaiImageModels}
            onAdd={(m) => addModel(openaiImageModels, setOpenaiImageModels, 'openai_image_models', m)}
            onRemove={(m) => removeModel(openaiImageModels, setOpenaiImageModels, 'openai_image_models', m)}
          />
        </CardContent>
      </Card>

      {/* Google Provider */}
      <Card>
        <CardHeader>
          <CardTitle>Google Provider</CardTitle>
          <CardDescription>Configure Google Gemini API settings and models.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="google_api_key">API Key</Label>
            <div className="flex gap-2">
              <Input
                id="google_api_key"
                type="password"
                value={settings['google_api_key'] || ''}
                onChange={(e) => setSettings({ ...settings, google_api_key: e.target.value })}
                placeholder="AIza..."
              />
              <Button
                onClick={() => saveSetting('google_api_key', settings['google_api_key'] || '')}
                disabled={saving['google_api_key']}
              >
                {saving['google_api_key'] ? <Loader2 className="animate-spin" /> : 'Save'}
              </Button>
            </div>
          </div>

          <ModelList
            title="Text Models"
            models={googleTextModels}
            onAdd={(m) => addModel(googleTextModels, setGoogleTextModels, 'google_text_models', m)}
            onRemove={(m) => removeModel(googleTextModels, setGoogleTextModels, 'google_text_models', m)}
          />
          <ModelList
            title="Image Models"
            models={googleImageModels}
            onAdd={(m) => addModel(googleImageModels, setGoogleImageModels, 'google_image_models', m)}
            onRemove={(m) => removeModel(googleImageModels, setGoogleImageModels, 'google_image_models', m)}
          />
        </CardContent>
      </Card>

      {/* Extraction Flow Defaults */}
      <Card>
        <CardHeader>
          <CardTitle>Extraction Flow Defaults</CardTitle>
          <CardDescription>Select default models for each step of the extraction process.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           {/* Step 1: Analyze Image (Text) */}
           <StepSelector
             label="Step 1: Analyze Image (Text)"
             value={settings['step_analyze_model']}
             openaiModels={openaiTextModels}
             googleModels={googleTextModels}
             onSelect={(val) => saveSetting('step_analyze_model', val)}
           />
           {/* Step 2: Texture Sheet (Image) */}
           <StepSelector
             label="Step 2: Generate Texture Sheet (Image)"
             value={settings['step_texture_model']}
             openaiModels={openaiImageModels}
             googleModels={googleImageModels}
             onSelect={(val) => saveSetting('step_texture_model', val)}
           />
           {/* Step 3: Bounding Box (Text) */}
           <StepSelector
             label="Step 3: Detect Bounding Boxes (Text)"
             value={settings['step_bounding_box_model']}
             openaiModels={openaiTextModels}
             googleModels={googleTextModels}
             onSelect={(val) => saveSetting('step_bounding_box_model', val)}
           />
           {/* Step 4: Refine Asset (Image) */}
           <StepSelector
             label="Step 4: Refine Asset (Image)"
             value={settings['step_refine_model']}
             openaiModels={openaiImageModels}
             googleModels={googleImageModels}
             onSelect={(val) => saveSetting('step_refine_model', val)}
           />
        </CardContent>
      </Card>
    </div>
  )
}

function ModelList({
  title,
  models,
  onAdd,
  onRemove,
}: {
  title: string
  models: string[]
  onAdd: (m: string) => void
  onRemove: (m: string) => void
}) {
  const [newModel, setNewModel] = useState('')

  return (
    <div className="space-y-2">
      <Label>{title}</Label>
      <div className="flex gap-2">
        <Input
          value={newModel}
          onChange={(e) => setNewModel(e.target.value)}
          placeholder="Add model (e.g., gpt-4o)"
          className="max-w-xs"
        />
        <Button
          variant="outline"
          onClick={() => {
            if (newModel) {
              onAdd(newModel)
              setNewModel('')
            }
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Add
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {models.map((model) => (
          <div
            key={model}
            className="flex items-center gap-1 rounded-md border bg-secondary px-2 py-1 text-sm"
          >
            <span>{model}</span>
            <button onClick={() => onRemove(model)} className="text-muted-foreground hover:text-foreground">
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
        {models.length === 0 && <span className="text-sm text-muted-foreground">No models configured.</span>}
      </div>
    </div>
  )
}

function StepSelector({
  label,
  value,
  openaiModels,
  googleModels,
  onSelect,
}: {
  label: string
  value?: string
  openaiModels: string[]
  googleModels: string[]
  onSelect: (val: string) => void
}) {
  return (
    <div className="grid w-full items-center gap-1.5">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onSelect}>
        <SelectTrigger>
          <SelectValue placeholder="Select a model" />
        </SelectTrigger>
        <SelectContent>
          {openaiModels.length > 0 && (
            <SelectGroup>
                <SelectLabel>OpenAI</SelectLabel>
                {openaiModels.map((m) => (
                    <SelectItem key={`openai:${m}`} value={`openai:${m}`}>
                    {m}
                    </SelectItem>
                ))}
            </SelectGroup>
          )}

          {googleModels.length > 0 && (
            <SelectGroup>
                <SelectLabel>Google</SelectLabel>
                {googleModels.map((m) => (
                    <SelectItem key={`google:${m}`} value={`google:${m}`}>
                    {m}
                    </SelectItem>
                ))}
            </SelectGroup>
          )}
        </SelectContent>
      </Select>
    </div>
  )
}
