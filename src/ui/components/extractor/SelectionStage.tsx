import { Check } from 'lucide-react'
import React from 'react'
import { cn } from '../../lib/utils'
import { CandidateAsset } from '../../types'
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
    <div className="flex flex-col h-full w-full max-w-6xl mx-auto px-4 py-2">
      {/* Grid */}
      <ScrollArea className="h-full">
        <div className="grid grid-cols-3 gap-2 p-1 h-full pb-6">
          {candidates.map((item, index) => {
            const isSelected = selectedIndices.includes(index)
            return (
              <div
                key={index}
                onClick={() => onToggleSelection(index)}
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
    </div>
  )
}
