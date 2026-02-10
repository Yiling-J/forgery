import { InferResponseType } from 'hono/client'
import { Hexagon, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { EQUIPMENT_CATEGORIES } from '../../lib/categories'
import { client } from '../client'
import { ExtractorDialog } from '../components/ExtractorDialog'
import { VibeCard } from '../components/VibeCard'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { ScrollArea, ScrollBar } from '../components/ui/scroll-area'
import { cn } from '../lib/utils'

type EquipmentResponse = InferResponseType<typeof client.equipments.$get>
type EquipmentItem = EquipmentResponse['items'][number]

const getEquipmentColor = (name: string) => {
  const colors = [
    '#ef4444', // Red
    '#f97316', // Orange
    '#f59e0b', // Amber
    '#22c55e', // Green
    '#3b82f6', // Blue
    '#a855f7', // Purple
  ]
  const charCode = name.charCodeAt(0) || 0
  return colors[charCode % colors.length]
}

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
    <div className="w-full min-h-screen p-4 md:p-8 flex flex-col font-sans text-slate-900 relative">
      <div className="mb-8 animate-fade-in-down flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 text-cyan-600 mb-2 tracking-[0.3em] text-xs font-mono uppercase">
            <Hexagon size={12} className="animate-spin-slow" />
            System // Equipment_Select
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-black uppercase text-slate-900 tracking-tighter">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600">
              Equipments
            </span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={() => setExtractorOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Extract Equipment
          </Button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-8 animate-fade-in-down delay-100">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex w-max space-x-2 p-1">
            {EQUIPMENT_CATEGORIES.map((cat) => {
              const isSelected = selectedCategories.includes(cat.main_category)
              return (
                <Badge
                  key={cat.main_category}
                  variant={isSelected ? 'default' : 'outline'}
                  className={cn(
                    'cursor-pointer px-4 py-2 text-sm transition-all hover:scale-105 active:scale-95 select-none rounded-none clip-path-slant',
                    isSelected
                      ? 'bg-cyan-600 text-white border-cyan-600 hover:bg-cyan-700'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300',
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

      {loading ? (
        <div className="p-12 text-center text-slate-400 font-mono tracking-widest animate-pulse">
          INITIALIZING...
        </div>
      ) : items.length === 0 ? (
        <div className="text-center p-12 bg-white clip-path-slant border border-slate-200">
          <p className="text-slate-500 font-mono">No equipment found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6 max-w-[1920px] mx-auto w-full pb-10">
          {items.map((item, index) => (
            <VibeCard
              key={item.id}
              index={index}
              name={item.name}
              subtitle={item.category}
              image={item.image?.path ? `/files/${item.image.path}` : ''}
              color={getEquipmentColor(item.name)}
            />
          ))}
        </div>
      )}

      <ExtractorDialog
        open={extractorOpen}
        onOpenChange={setExtractorOpen}
        onSuccess={() => {
          fetchItems() // Refresh list on success
          setExtractorOpen(false)
        }}
      />
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  )
}
