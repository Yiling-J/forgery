import { InferResponseType } from 'hono/client'
import { Loader2 } from 'lucide-react'
import React from 'react'
import { client } from '../client'
import { useInfiniteScroll } from '../hooks/use-infinite-scroll'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'

type OutfitResponse = InferResponseType<typeof client.outfits.$get>
type OutfitItem = OutfitResponse[number]

interface LoadOutfitDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (outfit: OutfitItem) => void
}

export const LoadOutfitDialog: React.FC<LoadOutfitDialogProps> = ({
  open,
  onOpenChange,
  onSelect,
}) => {
  const {
    items: outfits,
    loading,
    ref,
  } = useInfiniteScroll<OutfitItem>({
    fetchData: async (page, limit) => {
      const res = await client.outfits.$get({
        query: {
          page: page.toString(),
          limit: limit.toString(),
        },
      })
      if (res.ok) {
        return await res.json()
      }
      return []
    },
    limit: 20,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[70vh] flex flex-col p-0 gap-0 bg-stone-50 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-stone-200 bg-white shrink-0">
          <DialogTitle className="text-xl font-black uppercase tracking-tighter text-stone-800">
            Load Outfit
          </DialogTitle>
          <DialogDescription>Select a saved outfit to load its configuration.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 bg-stone-50/50">
          {outfits.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center h-full text-stone-400">
              <p>No saved outfits found.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {outfits.map((outfit) => (
                <div
                  key={outfit.id}
                  className="bg-white rounded-xl border border-stone-200 p-4 flex items-center justify-between cursor-pointer hover:border-amber-500 hover:shadow-md transition-all"
                  onClick={() => {
                    onSelect(outfit)
                    onOpenChange(false)
                  }}
                >
                  <div className="flex-1">
                    <h3 className="font-bold text-stone-800 mb-1">{outfit.name}</h3>
                    <div className="flex gap-2 items-center">
                      <div className="flex -space-x-2 overflow-hidden">
                        {outfit.equipments.slice(0, 5).map((eq) => (
                          <div
                            key={eq.equipment.id}
                            className="relative inline-block w-6 h-6 rounded-full border border-white bg-stone-100 overflow-hidden"
                          >
                            <img
                              src={
                                eq.equipment.image?.path ? `/files/${eq.equipment.image.path}` : ''
                              }
                              className="w-full h-full object-cover"
                              alt={eq.equipment.name}
                            />
                          </div>
                        ))}
                        {outfit.equipments.length > 5 && (
                          <div className="relative inline-block w-6 h-6 rounded-full border border-white bg-stone-100 flex items-center justify-center text-[8px] font-bold text-stone-500">
                            +{outfit.equipments.length - 5}
                          </div>
                        )}
                      </div>
                      {outfit.prompt && (
                        <span className="text-xs text-stone-400 truncate max-w-[200px] border-l border-stone-200 pl-2 ml-2">
                          {outfit.prompt}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Loading Indicator */}
          <div ref={ref} className="h-10 w-full flex items-center justify-center p-4">
            {loading && <Loader2 className="w-8 h-8 animate-spin text-stone-400" />}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
