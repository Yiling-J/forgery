import { CheckCircle2, Loader2, RefreshCw, XCircle } from 'lucide-react'
import React, { useState } from 'react'
import { cn } from '../../lib/utils'
import { CandidateAsset, ExtractedAsset } from '../../types'
import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { ScrollArea } from '../ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Textarea } from '../ui/textarea'

export type ItemStatus = 'pending' | 'processing' | 'done' | 'error'

interface ExtractionStageProps {
  candidates: CandidateAsset[]
  results: (ExtractedAsset | null)[]
  statuses: ItemStatus[]
  onReExtract: (index: number, model: string, hint: string) => void
  onDone: () => void
  onCancel: () => void
  availableModels: string[]
  saveAsOutfit: boolean
  setSaveAsOutfit: (value: boolean) => void
  outfitName: string
  setOutfitName: (value: string) => void
}

export const ExtractionStage: React.FC<ExtractionStageProps> = ({
  candidates,
  results,
  statuses,
  onReExtract,
  onDone,
  onCancel,
  availableModels,
  saveAsOutfit,
  setSaveAsOutfit,
  outfitName,
  setOutfitName,
}) => {
  const [reExtractIndex, setReExtractIndex] = useState<number | null>(null)
  const [model, setModel] = useState('')
  const [hint, setHint] = useState('')

  const handleOpenReExtract = (index: number) => {
    setReExtractIndex(index)
    setModel('') // Reset or set default if possible
    setHint('')
  }

  const handleConfirmReExtract = () => {
    if (reExtractIndex !== null) {
      onReExtract(reExtractIndex, model, hint)
      setReExtractIndex(null)
    }
  }

  const isAllDone = statuses.every((s) => s === 'done' || s === 'error')
  const hasError = statuses.some((s) => s === 'error')

  return (
    <div className="flex flex-col h-full w-full max-w-6xl mx-auto px-4 py-6 overflow-hidden">
      {/* Grid */}
      <ScrollArea className="flex-1 px-2 min-h-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pb-6">
          {candidates.map((candidate, index) => {
            const result = results[index]
            const status = statuses[index]
            const isProcessing = status === 'processing'
            const isDone = status === 'done'
            const isError = status === 'error'
            const isPending = status === 'pending'

            return (
              <div
                key={index}
                className={cn(
                  'relative rounded-xl overflow-hidden border-2 transition-all duration-300 bg-white flex flex-col h-[320px]',
                  isProcessing
                    ? 'border-amber-400 shadow-lg shadow-amber-100'
                    : isDone
                      ? 'border-green-400 shadow-sm'
                      : isError
                        ? 'border-red-400'
                        : 'border-slate-200 opacity-80',
                )}
              >
                {/* Image Area */}
                <div className="relative flex-1 bg-slate-50 flex items-center justify-center overflow-hidden">
                  {/* Checkerboard bg */}
                  <div
                    className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{
                      backgroundImage: 'radial-gradient(#000 1px, transparent 1px)',
                      backgroundSize: '10px 10px',
                    }}
                  />

                  {isDone && result?.imageUrl ? (
                    <img
                      src={result.imageUrl}
                      alt={candidate.name}
                      className="w-full h-full object-contain p-4"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      {isProcessing ? (
                        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                      ) : isError ? (
                        <XCircle className="w-8 h-8 text-red-500" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-slate-200" />
                      )}
                    </div>
                  )}

                  {/* Status Overlay */}
                  {isDone && (
                    <div className="absolute top-2 right-2">
                      <div className="bg-green-500 text-white p-1 rounded-full shadow-md">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Info Bar */}
                <div className="p-3 border-t border-slate-100 bg-white flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-sm text-slate-800 truncate" title={candidate.name}>
                        {candidate.name}
                      </p>
                      <p className="text-[10px] text-slate-500 uppercase font-mono">
                        {candidate.category}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  {isDone && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenReExtract(index)}
                      className="w-full text-xs h-7"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" /> Re-extract
                    </Button>
                  )}
                  {isError && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleOpenReExtract(index)}
                      className="w-full text-xs h-7"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" /> Retry
                    </Button>
                  )}
                  {isProcessing && (
                     <div className="text-xs text-amber-600 font-medium text-center py-1">
                        Extracting...
                     </div>
                  )}
                  {isPending && (
                     <div className="text-xs text-slate-400 text-center py-1">
                        Waiting...
                     </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>

      {/* Footer / Done Actions */}
      {isAllDone && (
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-4 bg-white/50 backdrop-blur-sm rounded-xl">
          <div className="flex items-center space-x-2 px-2">
            <Checkbox
              id="saveOutfit"
              checked={saveAsOutfit}
              onCheckedChange={(c) => setSaveAsOutfit(c === true)}
            />
            <Label
              htmlFor="saveOutfit"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Save as Outfit
            </Label>
          </div>
          {saveAsOutfit && (
            <Input
              placeholder="Outfit Name"
              value={outfitName}
              onChange={(e) => setOutfitName(e.target.value)}
              className="w-full animate-in fade-in zoom-in duration-300"
            />
          )}

           <div className="flex justify-end gap-2 mt-2">
            <Button variant="ghost" onClick={onCancel}>
                Cancel
            </Button>
            <Button onClick={onDone} className="bg-green-600 hover:bg-green-700 min-w-[120px]">
                Finish
            </Button>
           </div>
        </div>
      )}

      {/* Re-extract Dialog */}
      <Dialog open={reExtractIndex !== null} onOpenChange={(open) => !open && setReExtractIndex(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Re-extract Item</DialogTitle>
            <DialogDescription>
              Try extracting with a different model or provide a hint.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="model">Model</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                   <SelectItem value="default">Default</SelectItem>
                  {availableModels.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="hint">Hint (Optional)</Label>
              <Textarea
                id="hint"
                placeholder="e.g., 'Focus on the golden buckle' or 'Include the strap'"
                value={hint}
                onChange={(e) => setHint(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReExtractIndex(null)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmReExtract}>Extract</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
