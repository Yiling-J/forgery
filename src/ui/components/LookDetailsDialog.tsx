import React, { useMemo, useState, useRef, useEffect } from 'react'
import { InferResponseType } from 'hono/client'
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
import { client } from '../client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { ScrollArea } from './ui/scroll-area'

type GenerationResponse = InferResponseType<typeof client.generations.$get>
type GenerationItem = GenerationResponse['items'][number]

interface LookDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  generation: GenerationItem | null
}

export const LookDetailsDialog: React.FC<LookDetailsDialogProps> = ({
  open,
  onOpenChange,
  generation,
}) => {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef({ x: 0, y: 0 })

  const items = useMemo(() => {
    if (!generation) return []
    const list: Array<{
      id: string
      name: string
      category: string
      image?: { path: string } | null
    }> = []

    // Equipments
    generation.equipments?.forEach((relation: any) => {
      const eq = relation.equipment
      if (eq) {
        list.push({
          id: eq.id,
          name: eq.name,
          category: eq.category,
          image: eq.image,
        })
      }
    })

    // Pose
    // @ts-ignore
    if (generation.pose && typeof generation.pose === 'object') {
      // @ts-ignore
      const p = generation.pose
      list.push({
        id: p.id,
        name: p.name,
        category: 'Pose',
        image: p.image,
      })
    }

    // Expression
    // @ts-ignore
    if (generation.expression && typeof generation.expression === 'object') {
      // @ts-ignore
      const e = generation.expression
      list.push({
        id: e.id,
        name: e.name,
        category: 'Expression',
        image: e.image,
      })
    }

    return list
  }, [generation])

  // Reset zoom when generation changes
  useEffect(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }, [generation?.id])

  // Global mouse up to stop dragging
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) setIsDragging(false)
    }
    window.addEventListener('mouseup', handleGlobalMouseUp)
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp)
  }, [isDragging])

  if (!generation) return null

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.5, 4))
  }

  const handleZoomOut = () => {
    setScale((prev) => {
      const next = Math.max(prev - 0.5, 1)
      if (next === 1) setPosition({ x: 0, y: 0 })
      return next
    })
  }

  const handleReset = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true)
      dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y }
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      e.preventDefault()
      setPosition({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 gap-0 bg-stone-50 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-stone-200 bg-white shrink-0">
          <DialogTitle className="text-xl font-black uppercase tracking-tighter text-stone-800">
            Look Details
          </DialogTitle>
          <DialogDescription>
            Generated on {new Date(generation.createdAt).toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Top: Full Image Viewer */}
          <div
            className="h-[60%] bg-stone-900 flex items-center justify-center p-4 overflow-hidden relative shrink-0 select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
          >
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            ></div>

            <img
              src={generation.image?.path ? `/files/${generation.image.path}` : ''}
              alt="Generated Look"
              className="max-w-full max-h-full object-contain drop-shadow-2xl"
              draggable={false}
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
              }}
            />

            {/* Zoom Controls */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 backdrop-blur-sm p-1.5 rounded-full border border-white/10 z-10 shadow-lg">
              <button
                onClick={handleZoomOut}
                className="p-2 hover:bg-white/20 rounded-full text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={scale <= 1}
                title="Zoom Out"
              >
                <ZoomOut size={18} />
              </button>
              <button
                onClick={handleReset}
                className="p-2 hover:bg-white/20 rounded-full text-white transition-colors"
                title="Reset View"
              >
                <RotateCcw size={14} />
              </button>
              <button
                onClick={handleZoomIn}
                className="p-2 hover:bg-white/20 rounded-full text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={scale >= 4}
                title="Zoom In"
              >
                <ZoomIn size={18} />
              </button>
            </div>
          </div>

          {/* Bottom: Details */}
          <div className="flex-1 bg-white border-t border-stone-200 flex flex-col overflow-hidden shrink-0 min-h-0">
            <ScrollArea className="flex-1 h-full">
              <div className="p-6 flex flex-col gap-6">
                {/* Items Used */}
                <div>
                  <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">
                    Items Used
                  </h4>
                  <div className="flex flex-col gap-3">
                    {items.map((item) => (
                      <div
                        key={`${item.category}-${item.id}`}
                        className="flex items-center gap-3 p-2 rounded-lg border border-stone-100 bg-stone-50 hover:border-stone-200 transition-colors"
                      >
                        <div className="w-10 h-10 rounded bg-white border border-stone-200 shrink-0 overflow-hidden flex items-center justify-center">
                          {item.image ? (
                            <img
                              src={`/files/${item.image.path}`}
                              alt={item.name}
                              className="w-full h-full object-contain p-1"
                            />
                          ) : (
                            <div className="w-full h-full bg-stone-100" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-stone-800 truncate">{item.name}</p>
                          <p className="text-[10px] text-stone-500 uppercase">{item.category}</p>
                        </div>
                      </div>
                    ))}
                    {items.length === 0 && (
                      <p className="text-sm text-stone-400 italic">No items recorded.</p>
                    )}
                  </div>
                </div>

                {/* Prompt */}
                {generation.userPrompt && (
                  <div>
                    <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                      Prompt
                    </h4>
                    <div className="p-3 bg-stone-50 rounded-lg border border-stone-100 text-sm text-stone-600 italic">
                      "{generation.userPrompt}"
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
