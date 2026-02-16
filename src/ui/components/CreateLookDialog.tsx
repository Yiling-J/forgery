import { InferResponseType } from 'hono/client'
import { Check, Download, Loader2, Save, Smile, User, X } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { EQUIPMENT_CATEGORIES } from '../../lib/categories'
import { client } from '../client'
import { useInfiniteScroll } from '../hooks/use-infinite-scroll'
import { cn } from '../lib/utils'
import { LoadOutfitDialog } from './LoadOutfitDialog'
import { SaveOutfitDialog } from './SaveOutfitDialog'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Label } from './ui/label'
import { ScrollArea, ScrollBar } from './ui/scroll-area'
import { Textarea } from './ui/textarea'

type EquipmentResponse = InferResponseType<typeof client.equipments.$get>
type EquipmentItem = EquipmentResponse['items'][number]
type OutfitItem = InferResponseType<typeof client.outfits.$get>[number]
type PoseResponse = InferResponseType<typeof client.poses.$get>
type PoseItem = PoseResponse[number]
type ExpressionResponse = InferResponseType<typeof client.expressions.$get>
type ExpressionItem = ExpressionResponse[number]

interface CreateLookDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  characterId: string
  onSuccess: () => void
}

type Tab = 'equipment' | 'pose' | 'expression' | 'instructions'

export const CreateLookDialog: React.FC<CreateLookDialogProps> = ({
  open,
  onOpenChange,
  characterId,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('equipment')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedEquipments, setSelectedEquipments] = useState<EquipmentItem[]>([])
  const [selectedPoseId, setSelectedPoseId] = useState<string | null>(null)
  const [selectedExpressionId, setSelectedExpressionId] = useState<string | null>(null)
  const [userPrompt, setUserPrompt] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [loadOutfitOpen, setLoadOutfitOpen] = useState(false)
  const [saveOutfitOpen, setSaveOutfitOpen] = useState(false)

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
      if (selectedCategories.length > 0) {
        query.category = selectedCategories
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
    items: poses,
    loading: posesLoading,
    ref: poseRef,
  } = useInfiniteScroll<PoseItem>({
    fetchData: async (page, limit) => {
      const res = await client.poses.$get({
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

  const {
    items: expressions,
    loading: expressionsLoading,
    ref: expressionRef,
  } = useInfiniteScroll<ExpressionItem>({
    fetchData: async (page, limit) => {
      const res = await client.expressions.$get({
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
  }, [selectedCategories, resetEquipment])

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) => (prev.includes(category) ? [] : [category]))
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
          userPrompt: userPrompt.trim() || undefined,
          poseId: selectedPoseId || undefined,
          expressionId: selectedExpressionId || undefined,
        },
      })

      if (!res.ok) {
        const errData = (await res.json()) as { error?: string }
        throw new Error(errData.error || 'Failed to create look')
      }

      onSuccess()
      onOpenChange(false)
      setSelectedEquipments([])
      setUserPrompt('')
    } catch (e) {
      console.error(e)
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const handleOutfitSelected = (outfit: OutfitItem) => {
    const equipments = outfit.equipments.map((oe) => oe.equipment)
    setSelectedEquipments(equipments)
    if (outfit.prompt) {
      setUserPrompt(outfit.prompt)
    }
    toast.success(`Loaded outfit: ${outfit.name}`)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-7xl h-[85vh] flex flex-col p-0 gap-0 bg-stone-50 overflow-hidden">
          {/* Header */}
          <DialogHeader className="px-6 py-4 border-b border-stone-200 bg-white shrink-0">
            <DialogTitle className="text-xl font-black uppercase tracking-tighter text-stone-800">
              Create New Look
            </DialogTitle>
            <DialogDescription>
              Design your character's look by selecting equipment, pose, and expression.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar Navigation */}
            <div className="w-32 bg-stone-100 border-r border-stone-200 flex flex-col py-4 gap-1">
              <button
                onClick={() => setActiveTab('equipment')}
                className={cn(
                  'w-full text-left px-6 py-3 text-sm font-medium transition-colors block',
                  activeTab === 'equipment'
                    ? 'bg-white text-stone-900 border-r-2 border-stone-900 shadow-sm'
                    : 'text-stone-500 hover:text-stone-900 hover:bg-stone-50',
                )}
              >
                Equipment
              </button>
              <button
                onClick={() => setActiveTab('pose')}
                className={cn(
                  'w-full text-left px-6 py-3 text-sm font-medium transition-colors block',
                  activeTab === 'pose'
                    ? 'bg-white text-stone-900 border-r-2 border-stone-900 shadow-sm'
                    : 'text-stone-500 hover:text-stone-900 hover:bg-stone-50',
                )}
              >
                Pose
              </button>
              <button
                onClick={() => setActiveTab('expression')}
                className={cn(
                  'w-full text-left px-6 py-3 text-sm font-medium transition-colors block',
                  activeTab === 'expression'
                    ? 'bg-white text-stone-900 border-r-2 border-stone-900 shadow-sm'
                    : 'text-stone-500 hover:text-stone-900 hover:bg-stone-50',
                )}
              >
                Expression
              </button>
              <button
                onClick={() => setActiveTab('instructions')}
                className={cn(
                  'w-full text-left px-6 py-3 text-sm font-medium transition-colors block',
                  activeTab === 'instructions'
                    ? 'bg-white text-stone-900 border-r-2 border-stone-900 shadow-sm'
                    : 'text-stone-500 hover:text-stone-900 hover:bg-stone-50',
                )}
              >
                Instructions
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col bg-stone-50 overflow-hidden relative">
              {/* Equipment Tab */}
              {activeTab === 'equipment' && (
                <div className="flex flex-col h-full">
                  {/* Category Filter */}
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
                                'cursor-pointer px-3 py-1.5 text-xs transition-all select-none hover:bg-stone-100',
                                isSelected
                                  ? 'bg-stone-900 text-white border-stone-900 hover:bg-stone-800'
                                  : 'bg-white text-stone-600 border-stone-200',
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

                  {/* Equipment Grid */}
                  <ScrollArea className="flex-1 p-6 h-full">
                    {items.length === 0 && !equipmentLoading ? (
                      <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-stone-400">
                        <p>No equipment found.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-6 pb-20">
                        {items.map((item) => {
                          const isSelected = selectedEquipments.some((e) => e.id === item.id)
                          return (
                            <div
                              key={item.id}
                              className={cn(
                                'group relative bg-white rounded-xl border transition-all cursor-pointer overflow-hidden hover:shadow-md',
                                isSelected
                                  ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-md'
                                  : 'border-stone-200 hover:border-stone-400',
                              )}
                              onClick={() => toggleEquipment(item)}
                            >
                              <div className="aspect-square p-4 flex items-center justify-center relative bg-stone-50/50">
                                <img
                                  src={item.image?.path ? `/files/${item.image.path}` : ''}
                                  className="max-w-full max-h-full object-contain mix-blend-multiply"
                                  alt={item.name}
                                />
                                {isSelected && (
                                  <div className="absolute top-2 right-2 bg-amber-500 text-white rounded-full p-1 shadow-sm z-10">
                                    <Check className="w-3 h-3" />
                                  </div>
                                )}
                              </div>
                              <div className="p-3 border-t border-stone-100 bg-white">
                                <p className="text-sm font-bold truncate text-stone-800">
                                  {item.name}
                                </p>
                                <p className="text-[10px] text-stone-500 uppercase truncate mt-0.5">
                                  {item.category}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                    {/* Loading Indicator */}
                    <div
                      ref={equipmentRef}
                      className="h-10 w-full flex items-center justify-center p-4"
                    >
                      {equipmentLoading && (
                        <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
                      )}
                    </div>
                  </ScrollArea>

                  {/* Selected Items (Persistent in Equipment Tab) */}
                  <div className="border-t border-stone-200 bg-white shrink-0 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wide flex items-center gap-2">
                        Selected Items
                        <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[10px]">
                          {selectedEquipments.length}
                        </span>
                      </h4>
                    </div>
                    <ScrollArea className="w-full whitespace-nowrap">
                      <div className="flex gap-3 pb-2 min-h-[80px] items-center">
                        {selectedEquipments.length === 0 ? (
                          <div className="text-stone-400 text-xs italic w-full text-center py-6 border-2 border-dashed border-stone-100 rounded-lg">
                            Select items from the list above.
                          </div>
                        ) : (
                          selectedEquipments.map((item) => (
                            <div
                              key={item.id}
                              className="relative w-20 h-20 shrink-0 bg-stone-50 rounded-lg border border-stone-200 flex items-center justify-center group"
                            >
                              <img
                                src={item.image?.path ? `/files/${item.image.path}` : ''}
                                className="max-w-full max-h-full object-contain p-1"
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
                            </div>
                          ))
                        )}
                      </div>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  </div>
                </div>
              )}

              {/* Pose Tab */}
              {activeTab === 'pose' && (
                <ScrollArea className="flex-1 p-6 h-full">
                  <div className="grid grid-cols-2 gap-6">
                    <div
                      className={cn(
                        'aspect-[3/4] border rounded-lg cursor-pointer flex flex-col items-center justify-center bg-white transition-all hover:bg-stone-50',
                        selectedPoseId === null
                          ? 'border-amber-500 ring-2 ring-amber-500/20'
                          : 'border-stone-200',
                      )}
                      onClick={() => setSelectedPoseId(null)}
                    >
                      <User className="w-10 h-10 text-stone-400 mb-2" />
                      <span className="text-xs font-medium text-stone-600">Default Pose</span>
                    </div>
                    {poses.map((pose) => (
                      <div
                        key={pose.id}
                        className={cn(
                          'group relative aspect-[3/4] border rounded-lg cursor-pointer overflow-hidden transition-all hover:shadow-md bg-white',
                          selectedPoseId === pose.id
                            ? 'border-amber-500 ring-2 ring-amber-500/20'
                            : 'border-stone-200 hover:border-stone-400',
                        )}
                        onClick={() => setSelectedPoseId(pose.id)}
                      >
                        <img
                          src={pose.imageUrl}
                          alt={pose.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 inset-x-0 bg-black/60 p-2 text-center">
                          <span className="text-xs text-white font-medium truncate block">
                            {pose.name}
                          </span>
                        </div>
                        {selectedPoseId === pose.id && (
                          <div className="absolute top-2 right-2 bg-amber-500 text-white rounded-full p-1 shadow-sm">
                            <Check className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {/* Loading Indicator */}
                  <div ref={poseRef} className="h-10 w-full flex items-center justify-center p-4">
                    {posesLoading && <Loader2 className="w-8 h-8 animate-spin text-stone-400" />}
                  </div>
                </ScrollArea>
              )}

              {/* Expression Tab */}
              {activeTab === 'expression' && (
                <ScrollArea className="flex-1 p-6 h-full">
                  <div className="grid grid-cols-2 gap-6">
                    <div
                      className={cn(
                        'aspect-[3/4] border rounded-lg cursor-pointer flex flex-col items-center justify-center bg-white transition-all hover:bg-stone-50',
                        selectedExpressionId === null
                          ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                          : 'border-stone-200',
                      )}
                      onClick={() => setSelectedExpressionId(null)}
                    >
                      <Smile className="w-10 h-10 text-stone-400 mb-2" />
                      <span className="text-xs font-medium text-stone-600">Default</span>
                    </div>
                    {expressions.map((expression) => (
                      <div
                        key={expression.id}
                        className={cn(
                          'group relative aspect-[3/4] border rounded-lg cursor-pointer overflow-hidden transition-all hover:shadow-md bg-white',
                          selectedExpressionId === expression.id
                            ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                            : 'border-stone-200 hover:border-stone-400',
                        )}
                        onClick={() => setSelectedExpressionId(expression.id)}
                      >
                        <img
                          src={expression.imageUrl}
                          alt={expression.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 inset-x-0 bg-black/60 p-2 text-center">
                          <span className="text-xs text-white font-medium truncate block">
                            {expression.name}
                          </span>
                        </div>
                        {selectedExpressionId === expression.id && (
                          <div className="absolute top-2 right-2 bg-emerald-500 text-white rounded-full p-1 shadow-sm">
                            <Check className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {/* Loading Indicator */}
                  <div
                    ref={expressionRef}
                    className="h-10 w-full flex items-center justify-center p-4"
                  >
                    {expressionsLoading && (
                      <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
                    )}
                  </div>
                </ScrollArea>
              )}

              {/* Instructions Tab */}
              {activeTab === 'instructions' && (
                <div className="p-8 max-w-2xl mx-auto w-full h-full flex flex-col">
                  <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm flex-1 flex flex-col">
                    <Label
                      htmlFor="user-prompt"
                      className="text-sm font-bold text-stone-800 uppercase tracking-wide mb-4 block"
                    >
                      Extra Instructions
                    </Label>
                    <p className="text-sm text-stone-500 mb-4">
                      Add any specific details or instructions for the AI generation. Describe how
                      the equipment should be worn or any specific stylistic preferences.
                    </p>
                    <Textarea
                      id="user-prompt"
                      placeholder="E.g. The sword should be worn on the back, slightly angled to the right..."
                      className="resize-none bg-stone-50 border-stone-200 focus:border-stone-400 flex-1 text-base p-4"
                      value={userPrompt}
                      onChange={(e) => setUserPrompt(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="px-6 py-4 border-t border-stone-200 bg-white shrink-0 flex items-center justify-between sm:justify-between w-full">
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setLoadOutfitOpen(true)}>
                <Download className="w-4 h-4 mr-2" /> Load Outfit
              </Button>
              <Button
                variant="outline"
                onClick={() => setSaveOutfitOpen(true)}
                disabled={selectedEquipments.length === 0}
              >
                <Save className="w-4 h-4 mr-2" /> Save Outfit
              </Button>
            </div>

            <div className="flex items-center gap-4">
              {error && <span className="text-red-500 text-sm font-medium">{error}</span>}
              <Button
                size="lg"
                className="bg-stone-900 hover:bg-stone-800 text-white shadow-lg min-w-[150px]"
                disabled={submitting || selectedEquipments.length === 0}
                onClick={handleCreate}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating...
                  </>
                ) : (
                  'Generate Look'
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LoadOutfitDialog
        open={loadOutfitOpen}
        onOpenChange={setLoadOutfitOpen}
        onSelect={handleOutfitSelected}
      />
      <SaveOutfitDialog
        open={saveOutfitOpen}
        onOpenChange={setSaveOutfitOpen}
        selectedEquipments={selectedEquipments}
        prompt={userPrompt}
        onSuccess={() => toast.success('Outfit saved successfully')}
      />
    </>
  )
}
