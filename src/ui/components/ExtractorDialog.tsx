import { Loader2, Play, RefreshCw, Sparkles } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { client } from '../client'
import { CandidateAsset, ExtractedAsset } from '../types'
import { AnalyzeStage } from './extractor/AnalyzeStage'
import { ExtractionStage, ItemStatus } from './extractor/ExtractionStage'
import { SelectionStage } from './extractor/SelectionStage'
import { UploadStage } from './extractor/UploadStage'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogFooter, DialogTitle } from './ui/dialog'

interface ExtractorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (assets: ExtractedAsset[]) => void
}

type Stage = 'upload' | 'analyze' | 'selection' | 'extraction'

export const ExtractorDialog: React.FC<ExtractorDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [stage, setStage] = useState<Stage>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string>('')

  // Data
  const [imagePath, setImagePath] = useState<string>('')
  const [candidates, setCandidates] = useState<CandidateAsset[]>([])
  const [selectedIndices, setSelectedIndices] = useState<number[]>([])

  // Extraction State
  // We maintain parallel arrays for the *selected* items
  const [extractionCandidates, setExtractionCandidates] = useState<CandidateAsset[]>([])
  const [extractionResults, setExtractionResults] = useState<(ExtractedAsset | null)[]>([])
  const [extractionStatuses, setExtractionStatuses] = useState<ItemStatus[]>([])

  // Save as Outfit state
  const [saveAsOutfit, setSaveAsOutfit] = useState(false)
  const [outfitName, setOutfitName] = useState('')

  // Models
  const [availableModels, setAvailableModels] = useState<string[]>([])

  // Refs for cleanup
  const analyzeController = useRef<AbortController | null>(null)
  const isMounted = useRef(true)

  const resetState = () => {
    setStage('upload')
    setFile(null)
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    setStatusMessage('')
    setImagePath('')
    setCandidates([])
    setSelectedIndices([])
    setExtractionCandidates([])
    setExtractionResults([])
    setExtractionStatuses([])
    setSaveAsOutfit(false)
    setOutfitName('')
    analyzeController.current?.abort()
  }

  // Fetch available models
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const res = await client.settings.$get()
        if (res.ok) {
          const data = await res.json()
          const openai = JSON.parse(data['openai_image_models'] || '[]')
          const google = JSON.parse(data['google_image_models'] || '[]')
          const models = [
            ...openai.map((m: string) => `openai:${m}`),
            ...google.map((m: string) => `google:${m}`),
          ]
          if (isMounted.current) {
            setAvailableModels(models)
          }
        }
      } catch (e) {
        console.error('Failed to fetch models', e)
      }
    }
    if (open) {
      fetchModels()
    }
  }, [open])

  // Handle dialog close
  useEffect(() => {
    isMounted.current = true
    if (!open) {
      // Small delay to allow animation to finish
      const t = setTimeout(resetState, 300)
      return () => clearTimeout(t)
    }
    return () => {
      isMounted.current = false
    }
  }, [open])

  const handleImageUpload = (f: File) => {
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setStage('analyze')
  }

  const startAnalysis = async () => {
    if (!file) return

    setStatusMessage('Initializing analysis...')
    analyzeController.current = new AbortController()

    try {
      const response = await client.extract.analyze.$post({
        form: { image: file },
      })

      if (!response.ok) throw new Error('Server error')
      if (!response.body) throw new Error('No response body')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            const eventMatch = line.match(/^event: (.+)$/m)
            const dataMatch = line.match(/^data: (.+)$/m)

            if (eventMatch && dataMatch) {
              const event = eventMatch[1].trim()
              const data = JSON.parse(dataMatch[1])

              if (event === 'status') {
                setStatusMessage(data.message)
              } else if (event === 'complete') {
                const newCandidates = data.assets as CandidateAsset[]
                const path = data.imagePath as string
                setCandidates(newCandidates)
                setImagePath(path)
                setSelectedIndices(newCandidates.map((_, i) => i))
                setStage('selection')
              } else if (event === 'error') {
                throw new Error(data.message)
              }
            }
          }
        }
      }
    } catch (e: unknown) {
      console.error(e)
      const err = e instanceof Error ? e : new Error(String(e))
      toast.error(err.message || 'Analysis failed')
      setStage('upload')
    }
  }

  const toggleSelection = (index: number) => {
    setSelectedIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    )
  }

  const handleStartExtraction = () => {
    if (selectedIndices.length === 0) return

    // Prepare extraction state
    const selectedCandidates = candidates.filter((_, i) => selectedIndices.includes(i))
    setExtractionCandidates(selectedCandidates)
    setExtractionResults(new Array(selectedCandidates.length).fill(null))

    // Initialize statuses and trigger extraction
    const initialStatuses = new Array(selectedCandidates.length).fill('pending') as ItemStatus[]
    setExtractionStatuses(initialStatuses)

    setStage('extraction')

    // Start extraction loop
    extractAllItems(selectedCandidates)
  }

  const extractAllItems = async (items: CandidateAsset[]) => {
    // We execute in parallel but independent calls
    items.forEach((item, index) => {
      extractSingleItem(index, item)
    })
  }

  const extractSingleItem = async (index: number, item: CandidateAsset, model?: string, hint?: string) => {
    // Update status to processing
    setExtractionStatuses((prev) => {
      const next = [...prev]
      next[index] = 'processing'
      return next
    })

    try {
      const res = await client.extract.item.$post({
        json: {
          imagePath,
          name: item.name,
          description: item.description,
          category: item.category,
          model,
          hint,
        },
      })

      if (res.ok) {
        const asset = await res.json()
        if (isMounted.current) {
          setExtractionResults((prev) => {
            const next = [...prev]
            next[index] = asset
            return next
          })
          setExtractionStatuses((prev) => {
            const next = [...prev]
            next[index] = 'done'
            return next
          })
        }
      } else {
        throw new Error('Failed to extract')
      }
    } catch (e) {
      console.error(e)
      if (isMounted.current) {
        setExtractionStatuses((prev) => {
          const next = [...prev]
          next[index] = 'error'
          return next
        })
        toast.error(`Failed to extract ${item.name}`)
      }
    }
  }

  const handleReExtract = (index: number, model: string, hint: string) => {
    const item = extractionCandidates[index]
    extractSingleItem(index, item, model || undefined, hint || undefined)
  }

  const handleClose = () => onOpenChange(false)

  const handleDone = async () => {
    const successfulResults = extractionResults.filter((r): r is ExtractedAsset => r !== null)

    if (saveAsOutfit) {
      if (!outfitName.trim()) {
        toast.error('Please enter an outfit name')
        return
      }
      try {
        const equipmentIds = successfulResults.map((r) => r.id)
        const res = await client.outfits.$post({
          json: {
            name: outfitName,
            equipmentIds,
          },
        })
        if (res.ok) {
          toast.success('Outfit created')
        } else {
          toast.error('Failed to create outfit')
        }
      } catch (e) {
        console.error(e)
        toast.error('Failed to create outfit')
      }
    }

    onSuccess(successfulResults)
    handleClose()
  }

  const isAnalyzing = stage === 'analyze' && !!statusMessage

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full p-0 bg-slate-50 border-none shadow-2xl rounded-2xl flex flex-col gap-0 max-w-5xl">
        <DialogTitle className="sr-only">Extractor</DialogTitle>

        {/* Top Navigation / Branding Bar */}
        <div className="flex-none items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-lg tracking-tight text-slate-800">Extractor</h1>
          </div>
        </div>

        {/* Content Area */}
        <div className="relative grow h-[70dvh]">
          {stage === 'upload' && <UploadStage onImageUpload={handleImageUpload} />}

          {stage === 'analyze' && preview && (
            <AnalyzeStage imageSrc={preview} isAnalyzing={isAnalyzing} />
          )}

          {stage === 'selection' && (
            <SelectionStage
              candidates={candidates}
              selectedIndices={selectedIndices}
              onToggleSelection={toggleSelection}
            />
          )}

          {stage === 'extraction' && (
            <ExtractionStage
              candidates={extractionCandidates}
              results={extractionResults}
              statuses={extractionStatuses}
              onReExtract={handleReExtract}
              onDone={handleDone}
              onCancel={() => setStage('selection')}
              availableModels={availableModels}
              saveAsOutfit={saveAsOutfit}
              setSaveAsOutfit={setSaveAsOutfit}
              outfitName={outfitName}
              setOutfitName={setOutfitName}
            />
          )}
        </div>

        {/* Footer */}
        {stage !== 'extraction' && (
        <DialogFooter className="px-6 py-4 border-t border-slate-200 bg-white shrink-0 flex-none">
          {stage === 'upload' && (
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          )}

          {stage === 'analyze' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button disabled={isAnalyzing} onClick={startAnalysis} className="min-w-[160px]">
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {statusMessage || 'Analyzing...'}
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" /> Start Extraction
                  </>
                )}
              </Button>
            </>
          )}

          {stage === 'selection' && (
            <>
              <Button variant="outline" onClick={() => setStage('upload')}>
                Back to Upload
              </Button>
              <Button
                onClick={handleStartExtraction}
                disabled={selectedIndices.length === 0}
                className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-lg border-none hover:opacity-90 min-w-[160px]"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Start Extraction ({selectedIndices.length})
              </Button>
            </>
          )}
        </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
