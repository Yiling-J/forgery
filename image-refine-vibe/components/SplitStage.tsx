import React, { useState } from 'react'
import { ImageSegment } from '../types'
import { Check, Grid2X2, ArrowRight } from 'lucide-react'

interface SplitStageProps {
  segments: ImageSegment[]
  onConfirm: (selectedIds: string[]) => void
  onBack: () => void
}

export const SplitStage: React.FC<SplitStageProps> = ({ segments, onConfirm, onBack }) => {
  const [localSegments, setLocalSegments] = useState<ImageSegment[]>(segments)

  const toggleSelection = (id: string) => {
    setLocalSegments((prev) =>
      prev.map((seg) => (seg.id === id ? { ...seg, selected: !seg.selected } : seg)),
    )
  }

  const selectedCount = localSegments.filter((s) => s.selected).length

  const handleConfirm = () => {
    if (selectedCount === 0) return
    const selectedIds = localSegments.filter((s) => s.selected).map((s) => s.id)
    onConfirm(selectedIds)
  }

  return (
    <div className="flex flex-col h-full w-full max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Grid2X2 className="text-sky-400" />
            Select Segments
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Unselect any areas you wish to exclude from processing.
          </p>
        </div>
        <div className="px-4 py-2 bg-slate-800 rounded-lg border border-slate-700">
          <span className="text-sky-400 font-bold text-lg">{selectedCount}</span>
          <span className="text-slate-400 ml-2 text-sm">Selected</span>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-2">
        <div className="grid grid-cols-3 gap-4 pb-20">
          {localSegments.map((seg) => (
            <div
              key={seg.id}
              onClick={() => toggleSelection(seg.id)}
              className={`
                group relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-all duration-300
                border-2 
                ${
                  seg.selected
                    ? 'border-sky-500 shadow-lg shadow-sky-500/20 scale-[1.01]'
                    : 'border-slate-700 opacity-60 hover:opacity-100 hover:border-slate-500'
                }
              `}
            >
              <img src={seg.src} alt="segment" className="w-full h-full object-cover" />

              {/* Selection Overlay */}
              <div
                className={`
                absolute inset-0 bg-sky-900/20 transition-opacity duration-200
                ${seg.selected ? 'opacity-100' : 'opacity-0'}
              `}
              />

              {/* Checkbox Indicator */}
              <div
                className={`
                absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200
                ${
                  seg.selected
                    ? 'bg-sky-500 text-white shadow-lg scale-100'
                    : 'bg-black/50 border border-white/30 text-transparent scale-90 group-hover:border-white/60'
                }
              `}
              >
                <Check className="w-5 h-5" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 z-50">
        <div className="max-w-6xl mx-auto flex justify-end items-center gap-4">
          <button
            onClick={onBack}
            className="px-6 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedCount === 0}
            className={`
                flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all shadow-lg
                ${
                  selectedCount > 0
                    ? 'bg-sky-500 hover:bg-sky-400 text-white shadow-sky-500/25 hover:shadow-sky-500/40 translate-y-0'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }
              `}
          >
            Start Refining
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
