import { ArrowRight, Check, Grid2X2 } from 'lucide-react'
import React, { useState } from 'react'
import { cn } from '../../lib/utils'
import { CandidateAsset } from '../../types'

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
    <div className="flex flex-col h-full w-full max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 animate-fade-in-up">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Grid2X2 className="text-cyan-500" />
            Select Candidates
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Unselect any items you wish to exclude from refinement.
          </p>
        </div>
        <div className="px-4 py-2 bg-white rounded-lg border border-slate-200 shadow-sm flex items-center gap-2">
          <span className="text-cyan-600 font-bold text-lg">{selectedIndices.length}</span>
          <span className="text-slate-500 text-sm">Selected</span>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-2 custom-scrollbar">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-24">
          {candidates.map((item, index) => {
            const isSelected = selectedIndices.includes(index)
            return (
              <div
                key={index}
                onClick={() => toggleSelection(index)}
                className={cn(
                  'group relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-all duration-300 border-2 bg-white animate-fade-in-up',
                  isSelected
                    ? 'border-cyan-500 shadow-lg shadow-cyan-100 scale-[1.02]'
                    : 'border-slate-200 opacity-80 hover:opacity-100 hover:border-slate-300',
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Checkerboard bg */}
                <div
                  className="absolute inset-0 opacity-10 pointer-events-none"
                  style={{
                    backgroundImage: 'radial-gradient(#000 1px, transparent 1px)',
                    backgroundSize: '8px 8px',
                  }}
                ></div>

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
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-white/90 backdrop-blur-sm border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-700 truncate">{item.name}</p>
                  <p className="text-[10px] text-slate-400 truncate uppercase">{item.category}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-md border-t border-slate-200 z-50">
        <div className="max-w-6xl mx-auto flex justify-end items-center gap-4">
          <button
            onClick={onCancel}
            className="px-6 py-3 rounded-xl text-slate-500 font-medium hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedIndices.length === 0}
            className={cn(
              'flex items-center gap-2 px-8 py-3 rounded-xl font-bold uppercase tracking-wide transition-all shadow-lg',
              selectedIndices.length > 0
                ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-cyan-200 hover:shadow-cyan-300 hover:-translate-y-0.5'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed',
            )}
          >
            Start Refining
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
