import { InferResponseType } from 'hono/client'
import {
  Calendar,
  Download,
  Eye,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
} from 'lucide-react'
import React, { useState } from 'react'
import { toast } from 'sonner'
import { client } from '../client'
import { DataItem } from '../hooks/use-category'
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
import { Textarea } from './ui/textarea'
import { Category } from '../hooks/use-category'

interface ItemDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: DataItem | null
  category: Category
  onUpdate: () => void
}

export const ItemDetailsDialog: React.FC<ItemDetailsDialogProps> = ({
  open,
  onOpenChange,
  item,
  category,
  onUpdate,
}) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [option, setOption] = useState('')
  const [loading, setLoading] = useState(false)

  React.useEffect(() => {
    if (item) {
      setName(item.name)
      setDescription(item.description)
      setOption(item.option || '')
    }
  }, [item])

  const handleSave = async () => {
    if (!item) return
    setLoading(true)
    try {
      await client.data[':id'].$patch({
        param: { id: item.id },
        json: {
          name,
          description,
          option: option || undefined,
        },
      })
      toast.success('Item updated')
      onUpdate()
      onOpenChange(false)
    } catch (e) {
      console.error(e)
      toast.error('Failed to update item')
    } finally {
      setLoading(false)
    }
  }

  if (!item) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0 overflow-hidden bg-white">
        <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
          {/* Left: Image */}
          <div className="md:w-1/2 bg-stone-50 flex items-center justify-center p-8 border-r border-stone-200">
            {item.image?.path ? (
              <img
                src={`/files/${item.image.path}`}
                alt={item.name}
                className="max-w-full max-h-full object-contain drop-shadow-xl"
              />
            ) : (
              <div className="text-stone-400">No Image</div>
            )}
          </div>

          {/* Right: Details Form */}
          <div className="md:w-1/2 flex flex-col">
            <DialogHeader className="px-6 py-4 border-b border-stone-200 shrink-0">
              <DialogTitle>Item Details</DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              {category.options.length > 0 && (
                <div className="space-y-2">
                  <Label>Option ({category.name})</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-stone-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-950 disabled:cursor-not-allowed disabled:opacity-50"
                    value={option}
                    onChange={(e) => setOption(e.target.value)}
                  >
                    <option value="">Select option...</option>
                    {category.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[150px]"
                />
              </div>

              <div className="pt-4 border-t border-stone-100">
                <div className="grid grid-cols-2 gap-4 text-xs text-stone-500">
                  <div>
                    <span className="font-bold block text-stone-700">Created</span>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </div>
                  <div>
                    <span className="font-bold block text-stone-700">Updated</span>
                    {new Date(item.updatedAt).toLocaleDateString()}
                  </div>
                  <div>
                    <span className="font-bold block text-stone-700">ID</span>
                    <span className="font-mono">{item.id}</span>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="px-6 py-4 border-t border-stone-200 bg-stone-50 shrink-0">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
