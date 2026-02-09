import React, { useState, useEffect } from 'react'
import { client } from '../client'
import { InferResponseType } from 'hono/client'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { ScrollArea, ScrollBar } from '../components/ui/scroll-area'
import { ExtractorDialog } from '../components/ExtractorDialog'
import { EQUIPMENT_CATEGORIES } from '../../lib/categories'
import { Plus } from 'lucide-react'
import { cn } from '../lib/utils'

type EquipmentResponse = InferResponseType<typeof client.equipments.$get>
type EquipmentItem = EquipmentResponse['items'][number]

export default function Equipments() {
  const [items, setItems] = useState<EquipmentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [extractorOpen, setExtractorOpen] = useState(false)

  useEffect(() => {
    fetchItems()
  }, [selectedCategories])

  const fetchItems = async () => {
    setLoading(true)
    try {
      const query: { limit: string; category?: string[] } = {
        limit: '100',
      }

      if (selectedCategories.length > 0) {
        query.category = selectedCategories
      }

      const res = await client.equipments.$get({
        query,
      })
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
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    )
  }

  return (
    <div className="p-8 animate-fade-in-up h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h1 className="text-3xl font-black text-stone-800 uppercase tracking-tighter">
            Equipments
          </h1>
          <p className="text-stone-500 text-sm font-medium">Manage your asset inventory</p>
        </div>
        <Button onClick={() => setExtractorOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Extract Equipment
        </Button>
      </div>

      {/* Category Filter */}
      <div className="mb-6 shrink-0 border-b border-stone-200 pb-4">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex w-max space-x-2 p-1">
            {EQUIPMENT_CATEGORIES.map((cat) => {
              const isSelected = selectedCategories.includes(cat.main_category)
              return (
                <Badge
                  key={cat.main_category}
                  variant={isSelected ? 'default' : 'outline'}
                  className={cn(
                    'cursor-pointer px-4 py-2 text-sm transition-all hover:scale-105 active:scale-95 select-none',
                    isSelected
                      ? 'bg-stone-900 text-white border-stone-900 shadow-md'
                      : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50 hover:border-stone-300',
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

      {/* Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-10">
        {loading ? (
          <div className="p-12 text-center text-stone-400">Loading stash...</div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-stone-200 rounded-xl bg-stone-50/50">
            <p className="text-stone-500 font-medium mb-2">No equipment found</p>
            <p className="text-stone-400 text-sm">
              Try adjusting your filters or extract new items.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="group relative bg-white rounded-xl border border-stone-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer"
              >
                <div className="aspect-square bg-stone-50 p-4 flex items-center justify-center relative">
                  <div
                    className="absolute inset-0 opacity-5"
                    style={{
                      backgroundImage: 'radial-gradient(#000 1px, transparent 1px)',
                      backgroundSize: '8px 8px',
                    }}
                  ></div>
                  <img
                    src={item.image?.path ? `/files/${item.image.path}` : ''}
                    className="max-w-full max-h-full object-contain drop-shadow-sm group-hover:scale-110 transition-transform"
                    alt={item.name}
                  />
                </div>
                <div className="p-3 border-t border-stone-100">
                  <div className="flex justify-between items-start mb-1">
                    <h3
                      className="text-sm font-bold text-stone-800 leading-tight truncate pr-2"
                      title={item.name}
                    >
                      {item.name}
                    </h3>
                  </div>
                  <p className="text-[10px] text-stone-400 font-mono uppercase tracking-wider truncate">
                    {item.category || 'Unknown'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ExtractorDialog
        open={extractorOpen}
        onOpenChange={setExtractorOpen}
        onSuccess={() => {
          fetchItems() // Refresh list on success
          setExtractorOpen(false)
        }}
      />
    </div>
  )
}
