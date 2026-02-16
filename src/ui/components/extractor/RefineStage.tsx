import { CheckCircle2, Loader2, RefreshCw, Sparkles } from 'lucide-react'
import React from 'react'
import { cn } from '../../lib/utils'
import { CandidateAsset, ExtractedAsset } from '../../types'

interface RefineStageProps {
  selectedCandidates: CandidateAsset[]
  results: ExtractedAsset[]
  isComplete: boolean
  onDone: () => void
}

export const RefineStage: React.FC<RefineStageProps> = ({
  selectedCandidates,
  results,
  isComplete,
  onDone,
}) => {
  return (
    <div className="flex flex-col h-full w-full max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 animate-fade-in-up">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="text-amber-500" />
            Refining Assets
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            {isComplete
              ? 'All selected assets have been refined and saved.'
              : `Processing item ${Math.min(results.length + 1, selectedCandidates.length)} of ${selectedCandidates.length}...`}
          </p>
        </div>
        {isComplete && (
          <button
            onClick={onDone}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium shadow-lg shadow-green-200 transition-all animate-bounce"
          >
            <RefreshCw className="w-4 h-4" />
            Start Over
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto pr-2 pb-10 custom-scrollbar">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {selectedCandidates.map((candidate, index) => {
            const isFinished = index < results.length
            const isProcessing = index === results.length && !isComplete
            const isPending = index > results.length

            // The asset to display: result if finished, candidate base64 otherwise
            const displayImage = isFinished ? results[index].imageUrl : candidate.base64

            return (
              <div
                key={index}
                className={cn(
                  'relative aspect-square rounded-2xl overflow-hidden border-2 transition-all duration-500 bg-white',
                  isProcessing
                    ? 'border-amber-400 shadow-xl shadow-amber-100 scale-105 z-10'
                    : isFinished
                      ? 'border-green-400 shadow-sm'
                      : 'border-slate-200 opacity-60 grayscale',
                )}
              >
                {/* Background Checkerboard */}
                <div
                  className="absolute inset-0 opacity-10 pointer-events-none"
                  style={{
                    backgroundImage: 'radial-gradient(#000 1px, transparent 1px)',
                    backgroundSize: '8px 8px',
                  }}
                ></div>

                <img
                  src={displayImage}
                  alt={candidate.name}
                  className="w-full h-full object-contain p-4"
                />

                {/* Overlay States */}
                <div
                  className={cn(
                    'absolute inset-0 flex items-center justify-center transition-all duration-300',
                    isPending ? 'bg-slate-50/50 backdrop-blur-[1px]' : '',
                    isProcessing ? 'bg-white/60 backdrop-blur-sm' : '',
                    isFinished ? 'bg-transparent' : '',
                  )}
                >
                  {isPending && (
                    <div className="px-3 py-1 rounded-full bg-white text-xs font-bold text-slate-400 border border-slate-200 shadow-sm">
                      Pending
                    </div>
                  )}

                  {isProcessing && (
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative">
                        <div className="absolute inset-0 bg-amber-400 rounded-full blur-md opacity-30 animate-pulse"></div>
                        <div className="relative bg-white rounded-full p-3 border border-amber-200 shadow-md">
                          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                        </div>
                      </div>
                      <span className="text-amber-600 text-sm font-bold animate-pulse">
                        Refining...
                      </span>
                    </div>
                  )}

                  {isFinished && (
                    <div className="absolute top-3 right-3">
                      <div className="bg-green-500 text-white p-1.5 rounded-full shadow-lg animate-fade-in-up">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Scanning effect for processing item only */}
                {isProcessing && (
                  <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_15px_rgba(251,191,36,1)] animate-[scanline_1.5s_linear_infinite]"></div>
                  </div>
                )}

                {/* Info Bar */}
                <div
                  className={cn(
                    'absolute bottom-0 left-0 right-0 p-3 border-t transition-colors',
                    isFinished
                      ? 'bg-green-50/90 border-green-100'
                      : 'bg-slate-50/90 border-slate-100',
                  )}
                >
                  <p className="text-xs font-bold text-slate-700 truncate">
                    {isFinished ? results[index].name : candidate.name}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate uppercase">
                    {candidate.category}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <style>{`
        @keyframes scanline {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(400px);
          }
        }
      `}</style>
    </div>
  )
}
