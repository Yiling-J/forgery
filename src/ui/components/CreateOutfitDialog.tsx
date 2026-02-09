import React, { useState, useEffect } from 'react'
import { client } from '../client'
import { InferResponseType } from 'hono/client'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { ScrollArea, ScrollBar } from './ui/scroll-area'
import { EQUIPMENT_CATEGORIES } from '../../lib/categories'
import { cn } from '../lib/utils'
import { Loader2, X, Check } from 'lucide-react'

type EquipmentResponse = InferResponseType<typeof client.equipments.$get>
type EquipmentItem = EquipmentResponse['items'][number]

interface CreateOutfitDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  characterId: string
  onSuccess: () => void
}

export const CreateOutfitDialog: React.FC<CreateOutfitDialogProps> = ({
  open,
  onOpenChange,
  characterId,
  onSuccess,
}) => {
  const [items, setItems] = useState<EquipmentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedEquipments, setSelectedEquipments] = useState<EquipmentItem[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      fetchItems()
    }
  }, [open, selectedCategories])

  const fetchItems = async () => {
    setLoading(true)
    try {
      const query: any = {
        limit: '100',
      }
      if (selectedCategories.length > 0) {
        query.category = selectedCategories
      }

      const res = await client.equipments.$get({ query })
      if (res.ok) {
        const data = await res.json()
        setItems(data.items)
      }
    } catch (e) {
      console.error('Failed to load equipment', e)
    } finally {
      setLoading(false)
    }
  }

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    )
  }

  const toggleEquipment = (item: EquipmentItem) => {
    setSelectedEquipments((prev) => {
      const exists = prev.find((e) => e.id === item.id)
      if (exists) {
        return prev.filter((e) => e.id !== item.id)
      }
      return [...prev, item]
    })
  }

  const handleCreate = async () => {
    if (selectedEquipments.length === 0) return
    setSubmitting(true)
    setError(null)

    try {
      const res = await client.generations.$post({
        json: {
          characterId,
          equipmentIds: selectedEquipments.map((e) => e.id),
        },
      })

      if (!res.ok) {
        const errData = await res.json() as { error?: string }
        throw new Error(errData.error || 'Failed to create outfit')
      }

      onSuccess()
      onOpenChange(false)
      setSelectedEquipments([])
    } catch (e) {
      console.error(e)
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 gap-0 bg-stone-50 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-stone-200 bg-white shrink-0">
          <DialogTitle className="text-xl font-black uppercase tracking-tighter text-stone-800">Select Equipment</DialogTitle>
          <DialogDescription>
            Choose items to equip on your character.
          </DialogDescription>
        </DialogHeader>

        {/* Categories */}
        <div className="px-6 py-3 border-b border-stone-200 bg-white shrink-0">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex w-max space-x-2 pb-2">
              {EQUIPMENT_CATEGORIES.map((cat) => {
                const isSelected = selectedCategories.includes(cat.main_category)
                return (
                  <Badge
                    key={cat.main_category}
                    variant={isSelected ? 'default' : 'outline'}
                    className={cn(
                      "cursor-pointer px-3 py-1.5 text-xs transition-all select-none hover:bg-stone-100",
                      isSelected
                        ? "bg-stone-900 text-white border-stone-900 hover:bg-stone-800"
                        : "bg-white text-stone-600 border-stone-200"
                    )}
                    onClick={() => toggleCategory(cat.main_category)}
                  >
                    {cat.main_category}
                  </Badge>
                )
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-stone-50/50">
           {loading ? (
             <div className="flex justify-center items-center h-full">
               <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
             </div>
           ) : items.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full text-stone-400">
               <p>No equipment found.</p>
             </div>
           ) : (
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
               {items.map((item) => {
                 const isSelected = selectedEquipments.some(e => e.id === item.id)
                 return (
                   <div
                     key={item.id}
                     className={cn(
                       "group relative bg-white rounded-xl border transition-all cursor-pointer overflow-hidden",
                       isSelected
                         ? "border-amber-500 ring-2 ring-amber-500/20 shadow-lg"
                         : "border-stone-200 hover:border-stone-400 hover:shadow-md"
                     )}
                     onClick={() => toggleEquipment(item)}
                   >
                     <div className="aspect-square p-4 flex items-center justify-center relative">
                        <img
                          src={item.image?.path ? `/files/${item.image.path}` : ''}
                          className="max-w-full max-h-full object-contain"
                          alt={item.name}
                        />
                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-amber-500 text-white rounded-full p-1 shadow-sm">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                     </div>
                     <div className="p-2 border-t border-stone-100 bg-white">
                       <p className="text-xs font-bold truncate text-stone-800">{item.name}</p>
                       <p className="text-[10px] text-stone-400 uppercase truncate">{item.category}</p>
                     </div>
                   </div>
                 )
               })}
             </div>
           )}
        </div>

        {/* Bottom Dock - Selected Items */}
        <div className="border-t border-stone-200 bg-white shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
           <div className="px-6 py-4">
              <div className="flex items-center justify-between mb-3">
                 <h4 className="text-sm font-bold text-stone-800 uppercase tracking-wide flex items-center gap-2">
                   Selected Items <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs">{selectedEquipments.length}</span>
                 </h4>
                 {error && <span className="text-red-500 text-xs font-medium">{error}</span>}
              </div>

              <div className="flex gap-4">
                <ScrollArea className="flex-1 whitespace-nowrap">
                   <div className="flex gap-3 pb-2 min-h-[100px] items-center">
                     {selectedEquipments.length === 0 ? (
                       <div className="text-stone-400 text-sm italic w-full text-center py-8 border-2 border-dashed border-stone-100 rounded-xl">
                         Select items from the list above to equip them.
                       </div>
                     ) : (
                       selectedEquipments.map((item) => (
                         <div key={item.id} className="relative w-[100px] h-[100px] shrink-0 bg-stone-50 rounded-lg border border-stone-200 flex items-center justify-center group">
                            <img
                              src={item.image?.path ? `/files/${item.image.path}` : ''}
                              className="max-w-full max-h-full object-contain p-2"
                              alt={item.name}
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleEquipment(item)
                              }}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm p-1 text-[10px] truncate text-center font-medium border-t border-stone-100">
                              {item.name}
                            </div>
                         </div>
                       ))
                     )}
                   </div>
                   <ScrollBar orientation="horizontal" />
                </ScrollArea>

                <div className="flex items-center pl-4 border-l border-stone-100">
                   <Button
                     size="lg"
                     className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg border-0 h-full max-h-[100px] min-w-[120px]"
                     disabled={submitting || selectedEquipments.length === 0}
                     onClick={handleCreate}
                   >
                     {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Generate'}
                   </Button>
                </div>
              </div>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
