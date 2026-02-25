import { Check, Loader2, Save, X } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { client } from '../client'
import { cn } from '../lib/utils'
import { Category, CollectionItem, DataItem } from '../hooks/use-category'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { ScrollArea, ScrollBar } from './ui/scroll-area'
import { Textarea } from './ui/textarea'
import { toast } from 'sonner'

interface CollectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  collection?: CollectionItem | null
  category: Category
}

export const CollectionDialog: React.FC<CollectionDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
  collection,
  category,
}) => {
  const [items, setItems] = useState<DataItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<DataItem[]>([])
  const [collectionName, setCollectionName] = useState('')
  const [collectionPrompt, setCollectionPrompt] = useState('')
  const [collectionDescription, setCollectionDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Parse options
  const categoryOptions = React.useMemo(() => {
      try {
          return JSON.parse(category.options || '[]') as string[]
      } catch {
          return []
      }
  }, [category.options])

  useEffect(() => {
    if (open) {
      if (collection) {
        // Edit mode
        setCollectionName(collection.name)
        setCollectionPrompt(collection.prompt || '')
        setCollectionDescription(collection.description || '')
        // Items are already populated in collection.items (DataItem[])
        setSelectedItems(collection.items)
      } else {
        // Create mode
        setSelectedItems([])
        setCollectionName('')
        setCollectionPrompt('')
        setCollectionDescription('')
      }
      fetchItems()
    }
  }, [open, collection])

  useEffect(() => {
    if (open) fetchItems()
  }, [selectedOption])

  const fetchItems = async () => {
    setLoading(true)
    try {
      const query: { limit: string; option?: string } = {
        limit: '100', // Fetch reasonably large number for selection
      }
      if (selectedOption) {
        query.option = selectedOption
      }

      const res = await client.categories[':id'].data.$get({
        param: { id: category.id },
        query,
      })
      if (res.ok) {
        const data = await res.json()
        setItems(data.items)
      }
    } catch (e) {
      console.error('Failed to load items', e)
    } finally {
      setLoading(false)
    }
  }

  const toggleOption = (opt: string) => {
    setSelectedOption((prev) => (prev === opt ? null : opt))
  }

  const toggleItem = (item: DataItem) => {
    setSelectedItems((prev) => {
      const exists = prev.find((e) => e.id === item.id)
      if (exists) {
        return prev.filter((e) => e.id !== item.id)
      }
      return [...prev, item]
    })
  }

  const handleSave = async () => {
    if (selectedItems.length === 0) {
      toast.error('Please select at least one item.')
      return
    }
    if (!collectionName.trim()) {
      toast.error('Please enter a collection name.')
      return
    }

    setSubmitting(true)

    try {
      let res
      const payload = {
        name: collectionName.trim(),
        prompt: collectionPrompt.trim() || undefined,
        description: collectionDescription.trim() || undefined,
        dataIds: selectedItems.map((e) => e.id),
        categoryId: category.id
      }

      if (collection) {
        // Edit mode
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { categoryId, ...updatePayload } = payload // Update schema might not accept categoryId or it's ignored
        res = await client.collections[':id'].$put({
          param: { id: collection.id },
          json: updatePayload,
        })
      } else {
        // Create mode
        res = await client.collections.$post({
          json: payload,
        })
      }

      if (!res.ok) {
        throw new Error(collection ? 'Failed to update collection' : 'Failed to create collection')
      }

      onSuccess()
      onOpenChange(false)
      toast.success(collection ? 'Collection updated' : 'Collection created')
    } catch (e) {
      console.error(e)
      toast.error(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 gap-0 bg-stone-50 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-stone-200 bg-white shrink-0">
          <DialogTitle className="text-xl font-black uppercase tracking-tighter text-stone-800">
            {collection ? 'Edit Collection' : 'Create Collection'}
          </DialogTitle>
        </DialogHeader>

        {/* Options Filter */}
        {categoryOptions.length > 0 && (
          <div className="px-6 py-3 border-b border-stone-200 bg-white shrink-0">
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex w-max space-x-2 pb-2">
                {categoryOptions.map((opt) => {
                  const isSelected = selectedOption === opt
                  return (
                    <Badge
                      key={opt}
                      variant={isSelected ? 'default' : 'outline'}
                      className={cn(
                        'cursor-pointer px-3 py-1.5 text-xs transition-all select-none hover:bg-stone-100',
                        isSelected
                          ? 'bg-stone-900 text-white border-stone-900 hover:bg-stone-800'
                          : 'bg-white text-stone-600 border-stone-200',
                      )}
                      onClick={() => toggleOption(opt)}
                    >
                      {opt}
                    </Badge>
                  )
                })}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        )}

        {/* Main Content Area - Grid */}
        <div className="flex-1 overflow-y-auto p-6 bg-stone-50/50">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-stone-400">
              <p>No items found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {items.map((item) => {
                const isSelected = selectedItems.some((e) => e.id === item.id)
                return (
                  <div
                    key={item.id}
                    className={cn(
                      'group relative bg-white rounded-xl border transition-all cursor-pointer overflow-hidden',
                      isSelected
                        ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-lg'
                        : 'border-stone-200 hover:border-stone-400 hover:shadow-md',
                    )}
                    onClick={() => toggleItem(item)}
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
                      <p className="text-[10px] text-stone-400 uppercase truncate">
                        {item.option}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Form */}
        <div className="px-6 py-4 border-t border-stone-200 bg-white shrink-0 grid grid-cols-2 gap-4">
          <div className="space-y-4">
            <div>
                <Label htmlFor="col-name" className="text-xs font-bold text-stone-700 uppercase mb-1 block">Name</Label>
                <Input
                id="col-name"
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value)}
                placeholder="e.g. Summer Collection"
                />
            </div>
             <div>
                <Label htmlFor="col-desc" className="text-xs font-bold text-stone-700 uppercase mb-1 block">Description (Optional)</Label>
                <Input
                id="col-desc"
                value={collectionDescription}
                onChange={(e) => setCollectionDescription(e.target.value)}
                placeholder="Brief description..."
                />
            </div>
          </div>
          <div>
            <Label htmlFor="col-prompt" className="text-xs font-bold text-stone-700 uppercase mb-1 block">Prompt (Optional)</Label>
            <Textarea
              id="col-prompt"
              value={collectionPrompt}
              onChange={(e) => setCollectionPrompt(e.target.value)}
              placeholder="Extra prompt details..."
              className="h-[88px]"
            />
          </div>
        </div>

        {/* Bottom Dock */}
        <div className="border-t border-stone-200 bg-white shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
          <div className="px-6 py-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-bold text-stone-800 uppercase tracking-wide flex items-center gap-2">
                Selected Items{' '}
                <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs">
                  {selectedItems.length}
                </span>
              </h4>
            </div>

            <div className="flex gap-4 items-end">
              <ScrollArea className="flex-1 whitespace-nowrap min-w-0">
                <div className="flex gap-2 pb-2 min-h-[60px] items-center">
                  {selectedItems.length === 0 ? (
                    <div className="text-stone-400 text-sm italic w-full text-center py-2 border-2 border-dashed border-stone-100 rounded-xl h-[60px] flex items-center justify-center">
                      Select items above.
                    </div>
                  ) : (
                    selectedItems.map((item) => (
                      <div
                        key={item.id}
                        className="relative w-[60px] h-[60px] shrink-0 bg-stone-50 rounded-lg border border-stone-200 flex items-center justify-center group"
                      >
                        <img
                          src={item.image?.path ? `/files/${item.image.path}` : ''}
                          className="max-w-full max-h-full object-contain p-1"
                          alt={item.name}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleItem(item)
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>

              <div className="flex items-center pl-4 border-l border-stone-100 h-[70px]">
                <Button
                  size="lg"
                  className="bg-stone-900 hover:bg-stone-800 text-white shadow-lg border-0 h-[60px] min-w-[120px]"
                  disabled={submitting || selectedItems.length === 0 || !collectionName.trim()}
                  onClick={handleSave}
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <span className="flex items-center gap-2">
                      <Save className="w-4 h-4" /> {collection ? 'Update' : 'Save'}
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
