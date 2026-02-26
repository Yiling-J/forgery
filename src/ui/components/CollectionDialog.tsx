import { InferResponseType } from 'hono/client'
import {
  Calendar,
  Edit,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { client } from '../client'
import { Category, CollectionItem } from '../hooks/use-category'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { ScrollArea } from './ui/scroll-area'
import { Textarea } from './ui/textarea'

interface CollectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  collection: CollectionItem | null
  category: Category
}

export const CollectionDialog: React.FC<CollectionDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
  collection,
  category,
}) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [prompt, setPrompt] = useState('')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [availableItems, setAvailableItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (open) {
      if (collection) {
        setName(collection.name)
        setDescription(collection.description || '')
        setPrompt(collection.prompt || '')
        setSelectedItems(collection.items.map((i: any) => i.id))
      } else {
        setName('')
        setDescription('')
        setPrompt('')
        setSelectedItems([])
      }
      fetchAvailableItems()
    }
  }, [open, collection])

  const fetchAvailableItems = async () => {
    try {
      // @ts-ignore
      const res = await client.categories[':id'].data.$get({
        param: { id: category.id },
        query: { limit: '1000' }, // Fetch all for selection
      })
      if (res.ok) {
        const data = await res.json()
        setAvailableItems(data.items)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Name is required')
      return
    }

    setLoading(true)
    try {
      if (collection) {
        // @ts-ignore
        await client.collections[':id'].$put({
          param: { id: collection.id },
          json: {
            name,
            description,
            prompt,
            dataIds: selectedItems,
          },
        })
        toast.success('Collection updated')
      } else {
        await client.collections.$post({
          json: {
            name,
            description,
            prompt,
            categoryId: category.id,
            dataIds: selectedItems,
          },
        })
        toast.success('Collection created')
      }
      onSuccess()
      onOpenChange(false)
    } catch (e) {
      console.error(e)
      toast.error('Failed to save collection')
    } finally {
      setLoading(false)
    }
  }

  const toggleItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    )
  }

  const filteredItems = availableItems.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0 bg-white">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle>
            {collection ? 'Edit Collection' : 'Create Collection'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden flex-row">
          {/* Left: Form */}
          <div className="w-1/3 p-6 border-r flex flex-col gap-4 overflow-y-auto">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Collection Name"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
              />
            </div>
            <div className="space-y-2">
              <Label>Prompt</Label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Prompt for generation using this collection"
                className="h-32"
              />
            </div>
          </div>

          {/* Right: Item Selection */}
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b flex items-center justify-between bg-slate-50">
              <Input
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-xs"
              />
              <span className="text-sm text-slate-500">
                {selectedItems.length} selected
              </span>
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="grid grid-cols-4 gap-4">
                {filteredItems.map((item) => {
                  const isSelected = selectedItems.includes(item.id)
                  return (
                    <div
                      key={item.id}
                      className={`relative aspect-square border rounded-lg overflow-hidden cursor-pointer transition-all ${
                        isSelected
                          ? 'ring-2 ring-cyan-500 border-cyan-500'
                          : 'hover:border-slate-400'
                      }`}
                      onClick={() => toggleItem(item.id)}
                    >
                      {item.image?.path && (
                        <img
                          src={`/files/${item.image.path}`}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2">
                        <p className="text-xs text-white truncate font-medium">
                          {item.name}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="absolute top-2 right-2 bg-cyan-500 text-white rounded-full p-1">
                          <Plus className="w-3 h-3 rotate-45" />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : 'Save Collection'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
