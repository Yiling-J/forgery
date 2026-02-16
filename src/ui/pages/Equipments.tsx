import { InferResponseType } from 'hono/client'
import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { EQUIPMENT_CATEGORIES } from '../../lib/categories'
import { client } from '../client'
import { CreateOutfitDialog } from '../components/CreateOutfitDialog'
import { EquipmentDetailsDialog } from '../components/EquipmentDetailsDialog'
import { ExtractorDialog } from '../components/ExtractorDialog'
import { PageHeader } from '../components/PageHeader'
import { VibeCard } from '../components/VibeCard'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { ScrollArea, ScrollBar } from '../components/ui/scroll-area'
import { useInfiniteScroll } from '../hooks/use-infinite-scroll'
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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [extractorOpen, setExtractorOpen] = useState(false)
  const [createOutfitOpen, setCreateOutfitOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'equipments' | 'outfits'>('equipments')
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentItem | null>(null)
  const [equipmentDetailsOpen, setEquipmentDetailsOpen] = useState(false)

  const {
    items: items,
    loading: equipmentLoading,
    ref: equipmentRef,
    reset: resetEquipment,
  } = useInfiniteScroll<EquipmentItem>({
    fetchData: async (page, limit) => {
      const query: { limit: string; page: string; category?: string[] } = {
        limit: limit.toString(),
        page: page.toString(),
      }
      if (selectedCategory) {
        query.category = [selectedCategory]
      }
      const res = await client.equipments.$get({ query })
      if (res.ok) {
        const data = await res.json()
        return data.items
      }
      return []
    },
    limit: 20,
  })

  const {
    items: outfits,
    loading: outfitLoading,
    ref: outfitRef,
    reset: resetOutfits,
    setItems: setOutfits,
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

  useEffect(() => {
    resetEquipment()
  }, [selectedCategory, resetEquipment])

  const handleDeleteEquipment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this equipment? This cannot be undone.')) return
    try {
      const res = await client.equipments[':id'].$delete({ param: { id } })
      if (res.ok) {
        toast.success('Equipment deleted')
        resetEquipment()
      } else {
        toast.error('Failed to delete equipment')
      }
    } catch (e) {
      console.error(e)
      toast.error('Failed to delete equipment')
    }
  }

  const handleDeleteOutfit = async (id: string) => {
    if (!confirm('Are you sure you want to delete this outfit?')) return
    try {
      const res = await client.outfits[':id'].$delete({ param: { id } })
      if (res.ok) {
        toast.success('Outfit deleted')
        setOutfits((prev) => prev.filter((o) => o.id !== id))
      }
    } catch (e) {
      console.error(e)
      toast.error('Failed to delete outfit')
    }
  }

  const toggleCategory = (category: string) => {
    setSelectedCategory((prev) => (prev === category ? null : category))
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
                const isSelected = selectedCategory === cat.main_category
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

      {viewMode === 'equipments' ? (
        <>
          {items.length === 0 && !equipmentLoading ? (
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
                  onClick={() => {
                    setSelectedEquipment(item)
                    setEquipmentDetailsOpen(true)
                  }}
                  actions={[
                    {
                      name: 'Delete',
                      onClick: () => handleDeleteEquipment(item.id),
                      variant: 'destructive',
                      icon: <Trash2 className="w-4 h-4" />,
                    },
                  ]}
                />
              ))}
            </div>
          )}
          {/* Loading Indicator */}
          <div ref={equipmentRef} className="h-10 w-full flex items-center justify-center p-4">
            {equipmentLoading && (
              <div className="text-slate-400 font-mono tracking-widest animate-pulse">
                LOADING...
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {outfits.length === 0 && !outfitLoading ? (
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
                            src={
                              eq.equipment.image?.path ? `/files/${eq.equipment.image.path}` : ''
                            }
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
          {/* Loading Indicator */}
          <div ref={outfitRef} className="h-10 w-full flex items-center justify-center p-4">
            {outfitLoading && (
              <div className="text-slate-400 font-mono tracking-widest animate-pulse">
                LOADING...
              </div>
            )}
          </div>
        </>
      )}

      <ExtractorDialog
        open={extractorOpen}
        onOpenChange={setExtractorOpen}
        onSuccess={() => {
          resetEquipment() // Refresh list on success
          setExtractorOpen(false)
        }}
      />
      <CreateOutfitDialog
        open={createOutfitOpen}
        onOpenChange={setCreateOutfitOpen}
        onSuccess={() => {
          resetOutfits()
        }}
      />

      <EquipmentDetailsDialog
        open={equipmentDetailsOpen}
        onOpenChange={setEquipmentDetailsOpen}
        equipment={selectedEquipment}
        onUpdate={resetEquipment}
      />
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  )
}
