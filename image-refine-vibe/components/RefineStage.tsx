import React, { useEffect, useState, useRef } from 'react'
import { ImageSegment } from '../types'
import { Loader2, CheckCircle2, Sparkles, RefreshCw } from 'lucide-react'

interface RefineStageProps {
  initialSegments: ImageSegment[]
  onDone: () => void
}

export const RefineStage: React.FC<RefineStageProps> = ({ initialSegments, onDone }) => {
  const [segments, setSegments] = useState<ImageSegment[]>(initialSegments)
  const [processingIndex, setProcessingIndex] = useState(0)
  const [isAllDone, setIsAllDone] = useState(false)
  const processingRef = useRef(false)

  useEffect(() => {
    // We only process segments that were selected
    const selectedSegments = segments.filter((s) => s.selected)

    if (processingIndex >= selectedSegments.length) {
      setIsAllDone(true)
      return
    }

    if (processingRef.current) return
    processingRef.current = true

    const currentSegmentId = selectedSegments[processingIndex].id

    // Set current to processing
    setSegments((prev) =>
      prev.map((s) => (s.id === currentSegmentId ? { ...s, status: 'processing' } : s)),
    )

    const processTimer = setTimeout(() => {
      // Mark as completed and move next
      setSegments((prev) =>
        prev.map((s) => (s.id === currentSegmentId ? { ...s, status: 'completed' } : s)),
      )

      setProcessingIndex((prev) => prev + 1)
      processingRef.current = false
    }, 2000)

    return () => clearTimeout(processTimer)
  }, [processingIndex, segments])

  return (
    <div className="flex flex-col h-full w-full max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="text-purple-400" />
            Refining Images
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {isAllDone
              ? 'All selected segments have been processed successfully.'
              : `Processing item ${processingIndex + 1} of ${segments.length}...`}
          </p>
        </div>
        {isAllDone && (
          <button
            onClick={onDone}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-green-500 hover:bg-green-400 text-white font-medium shadow-lg shadow-green-500/20 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Start Over
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto pr-2 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {segments.map((seg) => (
            <div
              key={seg.id}
              className={`
                relative aspect-square rounded-2xl overflow-hidden border-2 transition-all duration-500
                ${
                  seg.status === 'processing'
                    ? 'border-purple-500 shadow-xl shadow-purple-500/20 scale-105 z-10'
                    : seg.status === 'completed'
                      ? 'border-green-500/50 shadow-md'
                      : 'border-slate-800 opacity-60 grayscale'
                }
              `}
            >
              <img src={seg.src} alt="segment" className="w-full h-full object-cover" />

              {/* Overlay states */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] transition-opacity duration-300">
                {seg.status === 'pending' && (
                  <div className="px-3 py-1 rounded-full bg-slate-900/80 text-xs text-slate-400 border border-white/10">
                    Pending
                  </div>
                )}

                {seg.status === 'processing' && (
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                      <div className="absolute inset-0 bg-purple-500 rounded-full blur-md opacity-50 animate-pulse"></div>
                      <div className="relative bg-slate-900 rounded-full p-3 border border-purple-500/50">
                        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                      </div>
                    </div>
                    <span className="text-purple-200 text-sm font-medium animate-pulse">
                      Refining...
                    </span>
                  </div>
                )}

                {seg.status === 'completed' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-transparent backdrop-blur-none">
                    {/* Clean view for completed, just a subtle indicator */}
                    <div className="absolute top-3 right-3 bg-green-500 text-white p-1.5 rounded-full shadow-lg animate-scale-in">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  </div>
                )}
              </div>

              {/* Scanning effect for processing item only */}
              {seg.status === 'processing' && (
                <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-transparent via-purple-500/10 to-transparent -translate-y-full animate-[scan_1.5s_linear_infinite]" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
