import { CheckCircle2, Loader2 } from 'lucide-react'
import React from 'react'
import { cn } from '../../lib/utils'
import { CandidateAsset, ExtractedAsset } from '../../types'
import { ScrollArea } from '../ui/scroll-area'

interface RefineStageProps {
  selectedCandidates: CandidateAsset[]
  results: ExtractedAsset[]
  isComplete: boolean
}

export const RefineStage: React.FC<RefineStageProps> = ({
  selectedCandidates,
  results,
  isComplete,
}) => {
  return (
    <div className="flex flex-col h-full w-full max-w-6xl mx-auto px-4 py-6">
      {/* Grid */}
      <ScrollArea className="h-full px-2">
        <div className="grid grid-cols-3 gap-2 p-1 h-full pb-6">
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
                  'relative rounded-2xl overflow-hidden border-2 transition-all duration-500 bg-white flex-shrink-0 flex flex-col',
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

                {/* Info Bar */}
                <div
                  className={cn(
                    'p-3 border-t transition-colors',
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
      </ScrollArea>
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
