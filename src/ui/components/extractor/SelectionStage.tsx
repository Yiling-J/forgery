import { Check } from 'lucide-react'
import React from 'react'
import { cn } from '../../lib/utils'
import { CandidateAsset } from '../../types'
import { Badge } from '../ui/badge'
import { ScrollArea } from '../ui/scroll-area'

interface SelectionStageProps {
  candidates: CandidateAsset[]
  selectedIndices: number[]
  onToggleSelection: (index: number) => void
}

export const SelectionStage: React.FC<SelectionStageProps> = ({
  candidates,
  selectedIndices,
  onToggleSelection,
}) => {
  return (
    <div className="flex flex-col h-full w-full max-w-2xl mx-auto px-4 py-6 overflow-hidden">
      <div className="flex items-center justify-between mb-4 px-2 shrink-0">
        <h3 className="text-lg font-semibold text-slate-800">
          Detected Items ({candidates.length})
        </h3>
        <span className="text-sm text-slate-500">
          Select items to extract ({selectedIndices.length})
        </span>
      </div>

      <ScrollArea className="flex-1 min-h-0 -mx-2 px-2">
        <div className="flex flex-col gap-3 pb-6 w-full">
          {candidates.map((item, index) => {
            const isSelected = selectedIndices.includes(index)
            return (
              <div
                key={index}
                onClick={() => onToggleSelection(index)}
                className={cn(
                  'group relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 flex items-center justify-between gap-4 bg-white hover:shadow-md select-none',
                  isSelected
                    ? 'border-cyan-500 bg-cyan-50/30'
                    : 'border-slate-200 hover:border-cyan-200',
                )}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-bold text-slate-800 text-sm truncate">{item.name}</h4>
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-slate-100 text-slate-600 border-slate-200 font-mono uppercase tracking-wide shrink-0"
                      >
                        {item.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-500 truncate pr-2">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors duration-200 border',
                    isSelected
                      ? 'bg-cyan-500 border-cyan-500 text-white'
                      : 'bg-white border-slate-300 text-transparent group-hover:border-cyan-300',
                  )}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3px]" />
                </div>

                {/* Selection Overlay (subtle) */}
                {isSelected && (
                  <div className="absolute inset-0 rounded-xl border-2 border-cyan-500 pointer-events-none" />
                )}
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
