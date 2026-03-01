import { InferResponseType } from 'hono/client'
import { Check, Download, Loader2, Save, Smile, User, X } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { EQUIPMENT_CATEGORIES } from '../../lib/categories'
import { client } from '../client'
import { useInfiniteScroll } from '../hooks/use-infinite-scroll'
import { useCategory } from '../hooks/use-category'
import { cn } from '../lib/utils'
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

// Use generic Data Item type
type DataItem = InferResponseType<typeof client.data[':id']['$get']>

// Re-map Outfit type if needed, or rely on any
// Outfit API is deprecated but we might still use it for now if not fully migrated on UI
type OutfitItem = InferResponseType<typeof client.outfits.$get>[number]


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
  const [selectedEquipments, setSelectedEquipments] = useState<DataItem[]>([])
  const [selectedPoseId, setSelectedPoseId] = useState<string | null>(null)
  const [selectedExpressionId, setSelectedExpressionId] = useState<string | null>(null)
  const [userPrompt, setUserPrompt] = useState('')
  const [submitting, setSubmitting] = useState(false)


  // Use generic hooks
  // Note: we need to adapt useCategory or useInfiniteScroll to filter by option (category) for Equipment
  // useCategory handles 'category' (e.g. Equipment) but 'option' is the sub-category (e.g. Headwear)

  // Actually, useCategory already exposes `selectedOption` and filters by it if set.
  // But here we want to manually control the filter via `selectedCategories`.
  // So we might need useInfiniteScroll with custom query on Data API.

  const {
      items: equipmentItems,
      loading: equipmentLoading,
      ref: equipmentRef,
      reset: resetEquipment
  } = useInfiniteScroll<DataItem>({
      fetchData: async (page, limit) => {
          // We need to fetch items from Category 'Equipment'
          // And optionally filter by `option` (which maps to our sub-categories)

          // But wait, standard `client.data` doesn't support complex filtering yet in generic listing?
          // Wait, `CategoryPage` uses `useCategory` which calls `client.categories[':id'].data.$get`.
          // We should use that if possible.

          // But first we need the Category ID for 'Equipment'.
          // Let's assume we can just use `client.data` but we need a way to filter by category name 'Equipment'.
          // The current `client.data` API doesn't seem to expose a global list with category name filter.
          // It only exposes `create`, `update`, `delete`, `get one`.

          // `useCategory` fetches category by name first, then uses ID to fetch data.
          // Let's replicate that logic or reuse useCategory but we need to pass selected options.

          // Since we are inside a hook, let's use `useCategory` for 'Equipment', 'Pose', 'Expression'.
          return []
      },
      limit: 20
  })

  // We can't conditionally call hooks.
  // Let's use `useCategory` for each type.
  const {
      category: equipmentCategory,
      dataItems: equipments,
      loadingData: loadingEquipments,
      dataRef: equipmentRefInner,
      setSelectedOption: setEquipmentOption,
      selectedOption: currentEquipmentOption
  } = useCategory(character?.projectId, 'Equipment')

  const {
      dataItems: poses,
      loadingData: loadingPoses,
      dataRef: poseRef
  } = useCategory(character?.projectId, 'Pose')

  const {
      dataItems: expressions,
      loadingData: loadingExpressions,
      dataRef: expressionRef
  } = useCategory(character?.projectId, 'Expression')

  // Sync selectedCategories with equipmentOption
  // useCategory only supports single option selection currently.
  // If we want multi-select or no-select (all), we might need to adjust.
  // The UI allows selecting multiple categories, but `useCategory` might only support one.
  // Let's assume for now we just toggle one.

  const toggleCategory = (category: string) => {
      if (currentEquipmentOption === category) {
          setEquipmentOption(null)
          setSelectedCategories([])
      } else {
          setEquipmentOption(category)
          setSelectedCategories([category])
      }
  }

  const toggleEquipment = (item: DataItem) => {
    // @ts-ignore
    if (item.error) return

    setSelectedEquipments((prev) => {
      // @ts-ignore
      const exists = prev.find((e) => e.id === item.id)
      if (exists) {
        // @ts-ignore
        return prev.filter((e) => e.id !== item.id)
      }
      return [...prev, item]
    })
  }

  const handleCreate = async () => {
    if (selectedEquipments.length === 0) return
    setSubmitting(true)

    try {
      const dataIds = [
          characterId,
          // @ts-ignore
          ...selectedEquipments.map(e => e.id)
      ]

      if (selectedPoseId) dataIds.push(selectedPoseId)
      if (selectedExpressionId) dataIds.push(selectedExpressionId)

      const res = await client.generations.$post({
        json: {
          dataIds,
          projectId: character.projectId,
          userPrompt: userPrompt.trim() || undefined,
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
      toast.error(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
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
                          const isSelected = currentEquipmentOption === cat.main_category
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
                    {equipments.length === 0 && !loadingEquipments ? (
                      <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-stone-400">
                        <p>No equipment found.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-6 pb-20">
                        {equipments.map((item) => {
                           // @ts-ignore
                          const isSelected = selectedEquipments.some((e) => e.id === item.id)
                          return (
                            <div
                              // @ts-ignore
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
                                  // @ts-ignore
                                  src={item.image?.path ? `/files/${item.image.path}` : ''}
                                  className="max-w-full max-h-full object-contain mix-blend-multiply"
                                  // @ts-ignore
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
                                  {/* @ts-ignore */}
                                  {item.name}
                                </p>
                                <p className="text-[10px] text-stone-500 uppercase truncate mt-0.5">
                                  {/* @ts-ignore */}
                                  {item.option}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                    {/* Loading Indicator */}
                    <div
                      ref={equipmentRefInner}
                      className="h-10 w-full flex items-center justify-center p-4"
                    >
                      {loadingEquipments && (
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
                              // @ts-ignore
                              key={item.id}
                              className="relative w-20 h-20 shrink-0 bg-stone-50 rounded-lg border border-stone-200 flex items-center justify-center group"
                            >
                              <img
                                // @ts-ignore
                                src={item.image?.path ? `/files/${item.image.path}` : ''}
                                className="max-w-full max-h-full object-contain p-1"
                                // @ts-ignore
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
                          src={pose.image?.path ? `/files/${pose.image.path}` : ''}
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
                    {loadingPoses && <Loader2 className="w-8 h-8 animate-spin text-stone-400" />}
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
                          src={expression.image?.path ? `/files/${expression.image.path}` : ''}
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
                    {loadingExpressions && (
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
          <DialogFooter className="px-6 py-4 border-t border-stone-200 bg-white shrink-0 flex justify-end w-full">
            <div className="flex items-center gap-4">
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
    </>
  )
}
