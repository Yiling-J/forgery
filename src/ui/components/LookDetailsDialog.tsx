import React from 'react'
import { InferResponseType } from 'hono/client'
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
  if (!generation) return null

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
          {/* Top: Full Image */}
          <div className="h-[60%] bg-stone-900 flex items-center justify-center p-4 overflow-hidden relative shrink-0">
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
            />
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
                  <div className="flex flex-col gap-3">
                    {/* @ts-ignore - type inference might be tricky with nested includes */}
                    {generation.equipments?.map((relation) => {
                      const eq = relation.equipment
                      return (
                        <div
                          key={eq.id}
                          className="flex items-center gap-3 p-2 rounded-lg border border-stone-100 bg-stone-50 hover:border-stone-200 transition-colors"
                        >
                          <div className="w-10 h-10 rounded bg-white border border-stone-200 shrink-0 overflow-hidden flex items-center justify-center">
                            {eq.image ? (
                              <img
                                src={`/files/${eq.image.path}`}
                                alt={eq.name}
                                className="w-full h-full object-contain p-1"
                              />
                            ) : (
                              <div className="w-full h-full bg-stone-100" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-stone-800 truncate">{eq.name}</p>
                            <p className="text-[10px] text-stone-500 uppercase">{eq.category}</p>
                          </div>
                        </div>
                      )
                    })}
                    {/* @ts-ignore */}
                    {(!generation.equipments || generation.equipments.length === 0) && (
                      <p className="text-sm text-stone-400 italic">No equipment recorded.</p>
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
