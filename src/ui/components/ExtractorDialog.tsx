import React, { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { client } from '../client'
import { CandidateAsset, ExtractedAsset } from '../types'
import { AnalyzeStage } from './extractor/AnalyzeStage'
import { RefineStage } from './extractor/RefineStage'
import { SelectionStage } from './extractor/SelectionStage'
import { UploadStage } from './extractor/UploadStage'
import { Dialog, DialogContent, DialogTitle } from './ui/dialog'

interface ExtractorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (assets: ExtractedAsset[]) => void
}

type Stage = 'upload' | 'analyze' | 'selection' | 'refine'

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
    analyzeController.current?.abort()
    refineController.current?.abort()
  }

  // Handle dialog close
  useEffect(() => {
    if (!open) {
      // Small delay to allow animation to finish if needed, or just reset immediately
      // resetting immediately might flash content if closing animation plays
      // But for now, we reset on close to ensure fresh state next open
      const t = setTimeout(resetState, 300)
      return () => clearTimeout(t)
    }
  }, [open])

  const handleImageUpload = (f: File) => {
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setStage('analyze')
  }

  // Auto-start analysis when entering analyze stage
  useEffect(() => {
    let active = true
    const analyze = async () => {
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

        while (active) {
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
                  if (active) setStatusMessage(data.message)
                } else if (event === 'complete') {
                  if (active) {
                    setCandidates(data.assets as CandidateAsset[])
                    setStage('selection')
                  }
                } else if (event === 'error') {
                  throw new Error(data.message)
                }
              }
            }
          }
        }
      } catch (e: unknown) {
        if (active) {
          console.error(e)
          const err = e instanceof Error ? e : new Error(String(e))
          toast.error(err.message || 'Analysis failed')
          setStage('upload')
        }
      }
    }

    if (stage === 'analyze' && file) {
      analyze()
    }

    return () => {
      active = false
      analyzeController.current?.abort()
    }
  }, [stage, file])

  const handleRefineConfirm = (indices: number[]) => {
    setSelectedIndices(indices)
    setStage('refine')
    handleRefine(indices)
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
                onSuccess(data.assets)
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
      // Don't change stage automatically on error here, let user see what happened or retry?
      // For now, staying on refine stage allows them to see partial results.
      // But we might want a 'retry' button or back.
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-full h-[90vh] p-0 overflow-hidden bg-slate-50 border-none shadow-2xl rounded-2xl flex flex-col">
        <DialogTitle className="sr-only">Equipment Extractor</DialogTitle>

        {/* Top Navigation / Branding Bar (Optional, matches App feel) */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <span className="font-bold text-white text-lg">AI</span>
            </div>
            <h1 className="font-bold text-lg tracking-tight text-slate-800">
              Refine<span className="text-cyan-500">Lab</span>
            </h1>
          </div>

          {/* Progress Steps */}
          {stage !== 'upload' && (
            <div className="hidden sm:flex items-center gap-2 text-xs font-bold bg-slate-100 p-1 rounded-full border border-slate-200">
              <div
                className={`px-3 py-1 rounded-full transition-colors ${stage === 'analyze' ? 'bg-white text-cyan-600 shadow-sm' : 'text-slate-400'}`}
              >
                Analyze
              </div>
              <div className="w-4 h-[1px] bg-slate-300"></div>
              <div
                className={`px-3 py-1 rounded-full transition-colors ${stage === 'selection' ? 'bg-white text-cyan-600 shadow-sm' : 'text-slate-400'}`}
              >
                Select
              </div>
              <div className="w-4 h-[1px] bg-slate-300"></div>
              <div
                className={`px-3 py-1 rounded-full transition-colors ${stage === 'refine' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-400'}`}
              >
                Refine
              </div>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative">
          {stage === 'upload' && <UploadStage onImageUpload={handleImageUpload} />}

          {stage === 'analyze' && preview && (
            <AnalyzeStage imageSrc={preview} statusMessage={statusMessage} />
          )}

          {stage === 'selection' && (
            <SelectionStage
              candidates={candidates}
              onConfirm={handleRefineConfirm}
              onCancel={() => setStage('upload')}
            />
          )}

          {stage === 'refine' && (
            <RefineStage
              selectedCandidates={candidates.filter((_, i) => selectedIndices.includes(i))}
              results={results}
              isComplete={isRefineComplete}
              onDone={resetState}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
