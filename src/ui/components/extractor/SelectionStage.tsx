import { Check } from 'lucide-react'
import React, { useState } from 'react'
import { cn } from '../../lib/utils'
import { CandidateAsset } from '../../types'
import { Button } from '../ui/button'
import { ScrollArea } from '../ui/scroll-area'

interface SelectionStageProps {
  candidates: CandidateAsset[]
  onConfirm: (selectedIndices: number[]) => void
  onCancel: () => void
}

export const SelectionStage: React.FC<SelectionStageProps> = ({
  candidates,
  onConfirm,
  onCancel,
}) => {
  // Initialize with all selected by default
  const [selectedIndices, setSelectedIndices] = useState<number[]>(candidates.map((_, i) => i))

  const toggleSelection = (index: number) => {
    setSelectedIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    )
  }

  const handleConfirm = () => {
    if (selectedIndices.length === 0) return
    onConfirm(selectedIndices)
  }

  return (
    <div className="flex flex-col max-h-[80vh] w-full max-w-6xl mx-auto px-4 py-2">
      {/* Grid */}
      <ScrollArea className="h-full">
        <div className="grid grid-cols-3 gap-2 p-1 h-full">
          {candidates.map((item, index) => {
            const isSelected = selectedIndices.includes(index)
            return (
              <div
                key={index}
                onClick={() => toggleSelection(index)}
                className={cn(
                  'group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300 border-2 bg-white animate-fade-in-up flex-shrink-0',
                  isSelected
                    ? 'border-cyan-500 shadow-lg shadow-cyan-100 scale-[1.02]'
                    : 'border-slate-200 opacity-80 hover:opacity-100 hover:border-slate-300',
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <img
                  src={item.base64}
                  alt={item.name}
                  className="w-full h-full object-contain p-4"
                />

                {/* Selection Overlay */}
                <div
                  className={cn(
                    'absolute inset-0 bg-cyan-900/10 transition-opacity duration-200',
                    isSelected ? 'opacity-100' : 'opacity-0',
                  )}
                />

                {/* Checkbox Indicator */}
                <div
                  className={cn(
                    'absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200',
                    isSelected
                      ? 'bg-cyan-500 text-white shadow-md scale-100'
                      : 'bg-white/80 border border-slate-300 text-transparent scale-90 group-hover:border-slate-400',
                  )}
                >
                  <Check className="w-4 h-4" strokeWidth={3} />
                </div>

                {/* Label */}
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-white/50 backdrop-blur-sm border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-700 truncate">{item.name}</p>
                  <p className="text-[10px] text-slate-400 truncate uppercase">{item.category}</p>
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>

      {/* Footer Actions */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-md border-t border-slate-200 z-50">
        <div className="max-w-6xl mx-auto flex justify-end items-center gap-4">
          <Button onClick={onCancel}>Cancel</Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedIndices.length === 0}
            className={cn(
              'flex items-center gap-2 px-8 py-3 font-bold uppercase tracking-wide transition-all shadow-lg',
              selectedIndices.length > 0
                ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed',
            )}
          >
            Start Refining ({selectedIndices.length})
          </Button>
        </div>
      </div>
    </div>
  )
}
