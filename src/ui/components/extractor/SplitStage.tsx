import { Check, Loader2, MoveHorizontal, MoveVertical, RotateCcw } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import { Button } from '../ui/button'

interface SplitStageProps {
  imageSrc: string
  grid: { rows: number; cols: number }
  onConfirm: (config: { verticalLines: number[]; horizontalLines: number[] }) => void
  isSplitting: boolean
  onCancel: () => void
}

export const SplitStage: React.FC<SplitStageProps> = ({
  imageSrc,
  grid,
  onConfirm,
  isSplitting,
  onCancel,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [vLines, setVLines] = useState<number[]>([])
  const [hLines, setHLines] = useState<number[]>([])
  const [dragging, setDragging] = useState<{ type: 'v' | 'h'; index: number } | null>(null)

  // Initialize lines
  useEffect(() => {
    if (grid.cols > 1) {
      setVLines(Array.from({ length: grid.cols - 1 }, (_, i) => (i + 1) / grid.cols))
    }
    if (grid.rows > 1) {
      setHLines(Array.from({ length: grid.rows - 1 }, (_, i) => (i + 1) / grid.rows))
    }
  }, [grid])

  const handleMouseDown = (type: 'v' | 'h', index: number) => (e: React.MouseEvent) => {
    e.preventDefault()
    setDragging({ type, index })
  }

  const handleReset = () => {
    if (grid.cols > 1) {
      setVLines(Array.from({ length: grid.cols - 1 }, (_, i) => (i + 1) / grid.cols))
    }
    if (grid.rows > 1) {
      setHLines(Array.from({ length: grid.rows - 1 }, (_, i) => (i + 1) / grid.rows))
    }
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging || !containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      const { type, index } = dragging

      if (type === 'v') {
        let newX = (e.clientX - rect.left) / rect.width
        // Constraints
        const prev = index > 0 ? vLines[index - 1] : 0
        const next = index < vLines.length - 1 ? vLines[index + 1] : 1
        const padding = 0.02 // 2% padding
        newX = Math.max(prev + padding, Math.min(next - padding, newX))

        setVLines((prevLines) => {
          const newLines = [...prevLines]
          newLines[index] = newX
          return newLines
        })
      } else {
        let newY = (e.clientY - rect.top) / rect.height
        // Constraints
        const prev = index > 0 ? hLines[index - 1] : 0
        const next = index < hLines.length - 1 ? hLines[index + 1] : 1
        const padding = 0.02 // 2% padding
        newY = Math.max(prev + padding, Math.min(next - padding, newY))

        setHLines((prevLines) => {
          const newLines = [...prevLines]
          newLines[index] = newY
          return newLines
        })
      }
    }

    const handleMouseUp = () => {
      setDragging(null)
    }

    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragging, vLines, hLines])

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header / Instructions */}
      <div className="flex items-center justify-between px-6 py-2 bg-slate-50 border-b border-slate-200 shrink-0">
        <p className="text-sm text-slate-500">
          Drag the lines to adjust the grid split. Ensure each item is centered in its cell.
        </p>
        <Button variant="ghost" size="sm" onClick={handleReset} title="Reset Grid">
          <RotateCcw className="w-4 h-4 text-slate-500" />
        </Button>
      </div>

      {/* Main Area */}
      <div className="flex-1 relative flex items-center justify-center bg-slate-100 p-8 overflow-hidden">
        <div
          ref={containerRef}
          className="relative shadow-2xl bg-white select-none"
          style={{
             maxHeight: '100%',
             maxWidth: '100%',
             aspectRatio: '1 / 1' // Assuming square texture sheet
          }}
        >
          <img
            src={imageSrc}
            alt="Texture Sheet"
            className="w-full h-full object-contain pointer-events-none"
            draggable={false}
          />

          {/* Vertical Lines */}
          {vLines.map((pos, i) => (
            <div
              key={`v-${i}`}
              className="absolute top-0 bottom-0 w-1 bg-cyan-400 hover:bg-cyan-300 cursor-col-resize z-10 group flex flex-col items-center justify-center transition-colors"
              style={{ left: `${pos * 100}%`, transform: 'translateX(-50%)' }}
              onMouseDown={handleMouseDown('v', i)}
            >
              <div className="w-4 h-8 bg-white rounded shadow-md border border-slate-200 flex items-center justify-center group-hover:border-cyan-400">
                 <MoveHorizontal className="w-3 h-3 text-slate-400 group-hover:text-cyan-500" />
              </div>
              <div className="absolute inset-y-0 -left-2 -right-2 bg-transparent"></div> {/* Hit area */}
            </div>
          ))}

          {/* Horizontal Lines */}
          {hLines.map((pos, i) => (
            <div
              key={`h-${i}`}
              className="absolute left-0 right-0 h-1 bg-cyan-400 hover:bg-cyan-300 cursor-row-resize z-10 group flex items-center justify-center transition-colors"
              style={{ top: `${pos * 100}%`, transform: 'translateY(-50%)' }}
              onMouseDown={handleMouseDown('h', i)}
            >
              <div className="h-4 w-8 bg-white rounded shadow-md border border-slate-200 flex items-center justify-center group-hover:border-cyan-400">
                 <MoveVertical className="w-3 h-3 text-slate-400 group-hover:text-cyan-500" />
              </div>
              <div className="absolute inset-x-0 -top-2 -bottom-2 bg-transparent"></div> {/* Hit area */}
            </div>
          ))}

          {/* Grid Overlay (Visual Guide) */}
          <div className="absolute inset-0 border-2 border-cyan-500 pointer-events-none"></div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-6 py-4 border-t border-slate-200 bg-white flex justify-between items-center shrink-0">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm({ verticalLines: vLines, horizontalLines: hLines })}
            disabled={isSplitting}
            className="bg-cyan-600 hover:bg-cyan-700 min-w-[140px]"
          >
            {isSplitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Splitting...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" /> Confirm Split
              </>
            )}
          </Button>
      </div>
    </div>
  )
}
