import { InferResponseType } from 'hono/client'
import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { EQUIPMENT_CATEGORIES } from '../../lib/categories'
import { client } from '../client'
import { CreateOutfitDialog } from '../components/CreateOutfitDialog'
import { ExtractorDialog } from '../components/ExtractorDialog'
import { PageHeader } from '../components/PageHeader'
import { VibeCard } from '../components/VibeCard'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { ScrollArea, ScrollBar } from '../components/ui/scroll-area'
import { cn } from '../lib/utils'

type EquipmentResponse = InferResponseType<typeof client.equipments.$get>
type EquipmentItem = EquipmentResponse['items'][number]
type OutfitResponse = InferResponseType<typeof client.outfits.$get>
type OutfitItem = OutfitResponse[number]

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
  const [outfits, setOutfits] = useState<OutfitItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [extractorOpen, setExtractorOpen] = useState(false)
  const [createOutfitOpen, setCreateOutfitOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'equipments' | 'outfits'>('equipments')

  useEffect(() => {
    if (viewMode === 'equipments') {
      fetchItems()
    } else {
      fetchOutfits()
    }
  }, [viewMode, selectedCategories])

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

  const fetchOutfits = async () => {
    setLoading(true)
    try {
      const res = await client.outfits.$get({ query: {} })
      if (res.ok) {
        const data = await res.json()
        setOutfits(data)
      }
    } catch (e) {
      console.error('Failed to load outfits', e)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteOutfit = async (id: string) => {
    if (!confirm('Are you sure you want to delete this outfit?')) return
    try {
      const res = await client.outfits[':id'].$delete({ param: { id } })
      if (res.ok) {
        toast.success('Outfit deleted')
        fetchOutfits()
      }
    } catch (e) {
      console.error(e)
      toast.error('Failed to delete outfit')
    }
  }

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    )
  }

  return (
    <div className="w-full h-full p-4 pt-2 flex flex-col font-sans text-slate-900 relative">
      <PageHeader
        title={viewMode === 'equipments' ? 'Equipments' : 'Outfits'}
        subtitle={
          <>
            System //{' '}
            <span
              className={cn(
                'cursor-pointer hover:text-cyan-500 transition-colors',
                viewMode === 'equipments' ? '' : 'text-muted-foreground/80',
              )}
              onClick={() => setViewMode('equipments')}
            >
              Equipment_List
            </span>{' '}
            <span>|</span>{' '}
            <span
              className={cn(
                'cursor-pointer hover:text-cyan-500 transition-colors',
                viewMode === 'outfits' ? '' : 'text-muted-foreground/80',
              )}
              onClick={() => setViewMode('outfits')}
            >
              Outfit_List
            </span>
          </>
        }
        actions={
          viewMode === 'equipments' ? (
            <Button onClick={() => setExtractorOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Extract Equipment
            </Button>
          ) : (
            <Button onClick={() => setCreateOutfitOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Create Outfit
            </Button>
          )
        }
        className="mb-8"
      >
        {/* Category Filter - Sticky inside PageHeader */}
        {viewMode === 'equipments' && (
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
        )}
      </PageHeader>

      {loading ? (
        <div className="p-12 text-center text-slate-400 font-mono tracking-widest animate-pulse">
          INITIALIZING...
        </div>
      ) : viewMode === 'equipments' ? (
        items.length === 0 ? (
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
        )
      ) : outfits.length === 0 ? (
        <div className="text-center p-12 bg-white clip-path-slant border border-slate-200">
          <p className="text-slate-500 font-mono">No outfits found.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 max-w-[1200px] mx-auto w-full pb-10">
          {outfits.map((outfit) => (
            <div
              key={outfit.id}
              className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 text-lg mb-2">{outfit.name}</h3>
                <div className="flex gap-2 flex-wrap">
                  {outfit.equipments.map((eq) => (
                    <div
                      key={eq.equipment.id}
                      className="w-10 h-10 rounded-md border border-slate-200 bg-slate-50 overflow-hidden relative group"
                      title={eq.equipment.name}
                    >
                      <img
                        src={eq.equipment.image?.path ? `/files/${eq.equipment.image.path}` : ''}
                        alt={eq.equipment.name}
                        className="w-full h-full object-contain p-1"
                      />
                    </div>
                  ))}
                  {outfit.prompt && (
                    <Badge variant="outline" className="ml-2 h-auto self-center">
                      + Prompt
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 pl-4 border-l border-slate-100">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteOutfit(outfit.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            </div>
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
      <CreateOutfitDialog
        open={createOutfitOpen}
        onOpenChange={setCreateOutfitOpen}
        onSuccess={() => {
          fetchOutfits()
        }}
      />
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  )
}
