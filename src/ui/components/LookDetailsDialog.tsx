import React, { useState, useEffect } from 'react'
import { InferResponseType } from 'hono/client'
import { client } from '../client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { ScrollArea, ScrollBar } from './ui/scroll-area'
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'

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
  const [zoomLevel, setZoomLevel] = useState(1)

  useEffect(() => {
    if (open) {
      setZoomLevel(1)
    }
  }, [open, generation])

  if (!generation) return null

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.5, 3))
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.5, 0.5))
  const handleReset = () => setZoomLevel(1)

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
          <div className="h-[60%] bg-stone-900 flex items-center justify-center overflow-hidden relative shrink-0">
            {/* Background Blur */}
            <div className="absolute inset-0 z-0">
              <img
                src={generation.image?.path ? `/files/${generation.image.path}` : ''}
                alt="Background"
                className="w-full h-full object-cover blur-xl opacity-60"
              />
              <div className="absolute inset-0 bg-black/20" />
            </div>

            {/* Main Image */}
            <div className="z-10 relative flex items-center justify-center w-full h-full overflow-hidden p-8">
              <img
                src={generation.image?.path ? `/files/${generation.image.path}` : ''}
                alt="Generated Look"
                className="max-w-full max-h-full object-contain drop-shadow-2xl border-2 border-white/20 transition-transform duration-200 ease-out"
                style={{ transform: `scale(${zoomLevel})` }}
              />
            </div>

            {/* Controls */}
            <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-2">
              <button
                onClick={handleZoomIn}
                className="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors backdrop-blur-sm"
                title="Zoom In"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              <button
                onClick={handleZoomOut}
                className="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors backdrop-blur-sm"
                title="Zoom Out"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <button
                onClick={handleReset}
                className="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors backdrop-blur-sm"
                title="Reset View"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Bottom: Details */}
          <div className="flex-1 bg-white border-t border-stone-200 flex flex-col overflow-hidden shrink-0">
            <ScrollArea className="flex-1">
              <div className="p-6 flex flex-col gap-6">
                {/* Equipments Used */}
                <div>
                  <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">
                    Equipments Used
                  </h4>
                  <ScrollArea className="w-full whitespace-nowrap">
                    <div className="flex w-max space-x-4 pb-4">
                      {/* @ts-ignore - type inference might be tricky with nested includes */}
                      {generation.equipments?.map((relation) => {
                        const eq = relation.equipment
                        return (
                          <div
                            key={eq.id}
                            className="relative w-[120px] h-[120px] rounded-xl overflow-hidden border border-stone-200 shadow-sm shrink-0 group bg-stone-100"
                          >
                            {/* Background Image */}
                            {eq.image ? (
                              <img
                                src={`/files/${eq.image.path}`}
                                alt={eq.name}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-stone-300">
                                No Image
                              </div>
                            )}

                            {/* Overlay */}
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-8">
                              <p className="text-xs font-bold text-white truncate drop-shadow-md">
                                {eq.name}
                              </p>
                              <p className="text-[10px] text-stone-300 uppercase truncate drop-shadow-md opacity-90">
                                {eq.category}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                      {/* @ts-ignore */}
                      {(!generation.equipments || generation.equipments.length === 0) && (
                        <div className="text-sm text-stone-400 italic p-2">
                          No equipment recorded.
                        </div>
                      )}
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </div>

                {/* Prompt */}
                {generation.userPrompt && (
                  <div>
                    <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                      Prompt
                    </h4>
                    <div className="p-4 bg-stone-50 rounded-xl border border-stone-100 text-sm text-stone-600 italic leading-relaxed">
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
