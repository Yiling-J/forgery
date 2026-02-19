import { Loader2, Play, RefreshCw, Sparkles } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { client } from '../client'
import { CandidateAsset, ExtractedAsset } from '../types'
import { AnalyzeStage } from './extractor/AnalyzeStage'
import { RefineStage } from './extractor/RefineStage'
import { SelectionStage } from './extractor/SelectionStage'
import { UploadStage } from './extractor/UploadStage'
import { SplitStage } from './extractor/SplitStage'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogFooter, DialogTitle } from './ui/dialog'

interface ExtractorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (assets: ExtractedAsset[]) => void
}

type Stage = 'upload' | 'analyze' | 'split' | 'selection' | 'refine'

interface AnalyzedAsset {
  item_name: string
  description: string
  category: string
}

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
  const [candidates, setCandidates] = useState<CandidateAsset[]>([])
  const [selectedIndices, setSelectedIndices] = useState<number[]>([])
  const [results, setResults] = useState<ExtractedAsset[]>([])
  const [isRefineComplete, setIsRefineComplete] = useState(false)

  // Split Stage Data
  const [textureImage, setTextureImage] = useState<string | null>(null)
  const [gridDimensions, setGridDimensions] = useState<{ rows: number; cols: number }>({ rows: 0, cols: 0 })
  const [analyzedAssets, setAnalyzedAssets] = useState<AnalyzedAsset[]>([])
  const [isSplitting, setIsSplitting] = useState(false)

  // Save as Outfit state
  const [saveAsOutfit, setSaveAsOutfit] = useState(false)
  const [outfitName, setOutfitName] = useState('')

  // Refs for cleanup
  const analyzeController = useRef<AbortController | null>(null)
  const refineController = useRef<AbortController | null>(null)

  const resetState = () => {
    setStage('upload')
    setFile(null)
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    setStatusMessage('')
    setCandidates([])
    setSelectedIndices([])
    setResults([])
    setIsRefineComplete(false)
    setSaveAsOutfit(false)
    setOutfitName('')
    setTextureImage(null)
    setGridDimensions({ rows: 0, cols: 0 })
    setAnalyzedAssets([])
    setIsSplitting(false)
    analyzeController.current?.abort()
    refineController.current?.abort()
  }

  // Handle dialog close
  useEffect(() => {
    if (!open) {
      // Small delay to allow animation to finish if needed, or just reset immediately
      const t = setTimeout(resetState, 300)
      return () => clearTimeout(t)
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
              } else if (event === 'texture_generated') {
                setTextureImage(data.image)
                setGridDimensions(data.grid)
                setAnalyzedAssets(data.assets)
                setStage('split')
                // We stop processing the stream here as we transition to manual split
                // The stream might continue sending 'splitting'/'complete' if not updated on backend,
                // but we ignore it by changing stage.
                return
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

  const handleSplitConfirm = async (config: { verticalLines: number[]; horizontalLines: number[] }) => {
    if (!textureImage) return
    setIsSplitting(true)
    try {
      const res = await client.extract.split.$post({
        json: {
          image: textureImage,
          assets: analyzedAssets.map((a) => ({
            item_name: a.item_name,
            description: a.description,
            category: a.category,
          })),
          splitConfig: config,
        },
      })
      if (!res.ok) throw new Error('Split failed')
      const data = await res.json()

      // Map response to CandidateAsset[]
      // The backend returns { assets: CandidateAsset[] }
      if ('error' in data) throw new Error(data.error as string)

      const newCandidates = data.assets as CandidateAsset[]
      setCandidates(newCandidates)
      setSelectedIndices(newCandidates.map((_, i) => i))
      setStage('selection')
    } catch (e) {
      console.error(e)
      toast.error('Failed to split image')
    } finally {
      setIsSplitting(false)
    }
  }

  const toggleSelection = (index: number) => {
    setSelectedIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    )
  }

  const handleRefineConfirm = () => {
    if (selectedIndices.length === 0) return
    setStage('refine')
    handleRefine(selectedIndices)
  }

  const handleRefine = async (indices: number[]) => {
    const selectedCandidates = candidates.filter((_, i) => indices.includes(i))

    setResults([])
    setIsRefineComplete(false)
    setStatusMessage('Starting refinement...')

    try {
      const response = await client.extract.refine.$post({
        json: { assets: selectedCandidates },
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
              } else if (event === 'asset_refined') {
                setResults((prev) => [...prev, data.asset])
              } else if (event === 'complete') {
                setIsRefineComplete(true)
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
      toast.error(err.message || 'Refinement failed')
      setStage('selection')
    }
  }

  const handleClose = () => onOpenChange(false)

  const handleDone = async () => {
    if (saveAsOutfit) {
      if (!outfitName.trim()) {
        toast.error('Please enter an outfit name')
        return
      }
      try {
        const equipmentIds = results.map((r) => r.id)
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
    onSuccess(results)
    handleClose()
  }

  const isAnalyzing = stage === 'analyze' && !!statusMessage

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full p-0 bg-slate-50 border-none shadow-2xl rounded-2xl flex flex-col gap-0">
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

          {stage === 'split' && textureImage && (
            <SplitStage
              imageSrc={textureImage}
              grid={gridDimensions}
              onConfirm={handleSplitConfirm}
              isSplitting={isSplitting}
              onCancel={() => setStage('analyze')}
            />
          )}

          {stage === 'selection' && (
            <SelectionStage
              candidates={candidates}
              selectedIndices={selectedIndices}
              onToggleSelection={toggleSelection}
            />
          )}

          {stage === 'refine' && (
            <RefineStage
              selectedCandidates={candidates.filter((_, i) => selectedIndices.includes(i))}
              results={results}
              isComplete={isRefineComplete}
              saveAsOutfit={saveAsOutfit}
              setSaveAsOutfit={setSaveAsOutfit}
              outfitName={outfitName}
              setOutfitName={setOutfitName}
            />
          )}
        </div>

        {/* Footer */}
        {stage !== 'split' && (
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
                  onClick={handleRefineConfirm}
                  disabled={selectedIndices.length === 0}
                  className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-lg border-none hover:opacity-90 min-w-[160px]"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Start Refining ({selectedIndices.length})
                </Button>
              </>
            )}

            {stage === 'refine' && (
              <>
                {isRefineComplete ? (
                  <>
                    <Button variant="outline" onClick={resetState}>
                      <RefreshCw className="mr-2 h-4 w-4" /> Start Over
                    </Button>
                    <Button onClick={handleDone} className="bg-green-600 hover:bg-green-700">
                      Done
                    </Button>
                  </>
                ) : (
                  <Button disabled className="min-w-[160px]">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Refining...
                  </Button>
                )}
              </>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
