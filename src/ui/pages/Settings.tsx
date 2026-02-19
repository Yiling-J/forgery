import { client } from '@/ui/client'
import { ExtractionFlowDesigner } from '@/ui/components/ExtractionFlowDesigner'
import { PageHeader } from '@/ui/components/PageHeader'
import { Button } from '@/ui/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/ui/card'
import { Input } from '@/ui/components/ui/input'
import { Label } from '@/ui/components/ui/label'
import { useToast } from '@/ui/hooks/use-toast'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function Settings() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})

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

  const handleInputChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    setSaved((prev) => ({ ...prev, [key]: false }))
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
      setSaved((prev) => ({ ...prev, [key]: true }))
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

  const addModel = (
    list: string[],
    setList: (l: string[]) => void,
    key: string,
    newItem: string,
  ) => {
    if (newItem && !list.includes(newItem)) {
      const newList = [...list, newItem]
      updateModelList(key, newList, setList)
    }
  }

  const removeModel = (
    list: string[],
    setList: (l: string[]) => void,
    key: string,
    itemToRemove: string,
  ) => {
    const newList = list.filter((item) => item !== itemToRemove)
    updateModelList(key, newList, setList)
  }

  const renderSaveButton = (key: string) => {
    const isSaving = saving[key]
    const isSaved = saved[key]

    return (
      <Button
        onClick={() => saveSetting(key, settings[key] || '')}
        disabled={isSaving || isSaved}
        className={isSaved ? 'bg-green-600 hover:bg-green-700 text-white opacity-90' : ''}
      >
        {isSaving ? <Loader2 className="animate-spin" /> : isSaved ? 'Saved' : 'Save'}
      </Button>
    )
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="w-full h-full p-4 pt-2 flex flex-col font-sans text-slate-900 relative space-y-8">
      <PageHeader title="Settings" subtitle="System // Configuration" />

      <div className="max-w-4xl mx-auto w-full grid gap-8">
        {/* OpenAI Provider */}
        <Card className="border-slate-200 shadow-sm">
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
                  onChange={(e) => handleInputChange('openai_api_key', e.target.value)}
                  placeholder="sk-..."
                  className="font-mono text-sm"
                />
                {renderSaveButton('openai_api_key')}
              </div>
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="openai_base_url">Base URL (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  id="openai_base_url"
                  value={settings['openai_base_url'] || ''}
                  onChange={(e) => handleInputChange('openai_base_url', e.target.value)}
                  placeholder="https://api.openai.com/v1"
                  className="font-mono text-sm"
                />
                {renderSaveButton('openai_base_url')}
              </div>
            </div>

            <ModelList
              title="Text Models"
              models={openaiTextModels}
              onAdd={(m) =>
                addModel(openaiTextModels, setOpenaiTextModels, 'openai_text_models', m)
              }
              onRemove={(m) =>
                removeModel(openaiTextModels, setOpenaiTextModels, 'openai_text_models', m)
              }
            />
            <ModelList
              title="Image Models"
              models={openaiImageModels}
              onAdd={(m) =>
                addModel(openaiImageModels, setOpenaiImageModels, 'openai_image_models', m)
              }
              onRemove={(m) =>
                removeModel(openaiImageModels, setOpenaiImageModels, 'openai_image_models', m)
              }
            />
          </CardContent>
        </Card>

        {/* Google Provider */}
        <Card className="border-slate-200 shadow-sm">
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
                  onChange={(e) => handleInputChange('google_api_key', e.target.value)}
                  placeholder="AIza..."
                  className="font-mono text-sm"
                />
                {renderSaveButton('google_api_key')}
              </div>
            </div>

            <ModelList
              title="Text Models"
              models={googleTextModels}
              onAdd={(m) =>
                addModel(googleTextModels, setGoogleTextModels, 'google_text_models', m)
              }
              onRemove={(m) =>
                removeModel(googleTextModels, setGoogleTextModels, 'google_text_models', m)
              }
            />
            <ModelList
              title="Image Models"
              models={googleImageModels}
              onAdd={(m) =>
                addModel(googleImageModels, setGoogleImageModels, 'google_image_models', m)
              }
              onRemove={(m) =>
                removeModel(googleImageModels, setGoogleImageModels, 'google_image_models', m)
              }
            />
          </CardContent>
        </Card>

        {/* Default Models */}
        <div>
          <div className="mb-4 ml-1">
            <h3 className="text-lg font-semibold text-slate-900">Default Models</h3>
            <p className="text-sm text-slate-500">
              Configure the AI models used for each step of the asset generation pipeline.
            </p>
          </div>

          <ExtractionFlowDesigner
            settings={settings}
            openaiTextModels={openaiTextModels}
            openaiImageModels={openaiImageModels}
            googleTextModels={googleTextModels}
            googleImageModels={googleImageModels}
            onSelect={(key, val) => saveSetting(key, val)}
          />
        </div>
      </div>
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
          className="max-w-xs font-mono text-sm"
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
            className="flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-sm font-mono text-slate-700"
          >
            <span>{model}</span>
            <button
              onClick={() => onRemove(model)}
              className="text-slate-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
        {models.length === 0 && (
          <span className="text-sm text-slate-400 italic">No models configured.</span>
        )}
      </div>
    </div>
  )
}
