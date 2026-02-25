import { Loader2 } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { client } from '../client'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { DataItem, Category } from '../hooks/use-category'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

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
  const [saving, setSaving] = useState(false)

  const categoryOptions = React.useMemo(() => {
      try {
          return JSON.parse(category.options || '[]') as string[]
      } catch {
          return []
      }
  }, [category.options])

  useEffect(() => {
    if (item) {
      setName(item.name)
      setDescription(item.description || '')
      setOption(item.option || '')
    }
  }, [item])

  const handleSave = async () => {
    if (!item) return
    setSaving(true)
    try {
      const res = await client.data[':id'].$patch({
        param: { id: item.id },
        json: {
            name,
            description,
            option: option || undefined
        },
      })
      if (res.ok) {
        toast.success('Item updated')
        onUpdate()
        onOpenChange(false)
      } else {
        toast.error('Failed to update item')
      }
    } catch (e) {
      console.error(e)
      toast.error('An error occurred')
    } finally {
      setSaving(false)
    }
  }

  if (!item) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 gap-0 bg-stone-50 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-stone-200 bg-white shrink-0">
          <DialogTitle className="text-xl font-black uppercase tracking-tighter text-stone-800">
            Details
          </DialogTitle>
          <DialogDescription>{item.option || category.name}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Top: Full Image */}
          <div className="h-[60%] bg-white flex items-center justify-center p-4 overflow-hidden relative shrink-0">
             <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(#000 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            ></div>
            <img
              src={item.image?.path ? `/files/${item.image.path}` : ''}
              alt={item.name}
              className="max-w-full max-h-full object-contain drop-shadow-2xl"
            />
          </div>

          {/* Bottom: Edit Form */}
          <div className="flex-1 bg-white border-t border-stone-200 flex flex-col overflow-y-auto shrink-0 p-6 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Name"
                />
              </div>

               {categoryOptions.length > 0 && (
                <div className="flex flex-col gap-2">
                <Label htmlFor="option">Option</Label>
                <Select
                    value={option}
                    onValueChange={setOption}
                >
                    <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                    {categoryOptions.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                        {opt}
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the item..."
                  rows={4}
                  className="resize-none"
                />
              </div>
            </div>

            <div className="mt-auto pt-6 border-t border-stone-100">
              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
