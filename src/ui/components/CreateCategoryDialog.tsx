import { client } from '@/ui/client'
import { Button } from '@/ui/components/ui/button'
import { Checkbox } from '@/ui/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/components/ui/dialog'
import { Input } from '@/ui/components/ui/input'
import { Label } from '@/ui/components/ui/label'
import { Textarea } from '@/ui/components/ui/textarea'
import { useToast } from '@/ui/hooks/use-toast'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'

interface CreateCategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}

export function CreateCategoryDialog({ open, onOpenChange, onCreated }: CreateCategoryDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [maxCount, setMaxCount] = useState(9)
  const [withImage, setWithImage] = useState(true)
  const [options, setOptions] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return

    setLoading(true)
    try {
      const optionsArray = options.split(',').map((s) => s.trim()).filter(Boolean)

      const res = await client.categories.$post({
        json: {
          name,
          description,
          maxCount,
          withImage,
          options: optionsArray,
          imagePrompt: { text: '', imageIds: [] },
          enabled: true,
        },
      })

      if (!res.ok) {
        throw new Error(`Failed to create category: ${res.status}`)
      }

      toast({
        title: 'Success',
        description: 'Category created successfully.',
      })
      onCreated()
      onOpenChange(false)
      resetForm()
    } catch (error) {
      console.error('Failed to create category', error)
      toast({
        title: 'Error',
        description: 'Failed to create category.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setName('')
    setDescription('')
    setMaxCount(9)
    setWithImage(true)
    setOptions('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Category</DialogTitle>
          <DialogDescription>Add a new category to organize your assets.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              required
              placeholder="e.g. Weapon"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
              placeholder="Optional description..."
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="maxCount" className="text-right">
              Max Count
            </Label>
            <Input
              id="maxCount"
              type="number"
              value={maxCount}
              onChange={(e) => setMaxCount(parseInt(e.target.value) || 0)}
              className="col-span-3"
              min={1}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="options" className="text-right">
              Options
            </Label>
            <Input
              id="options"
              value={options}
              onChange={(e) => setOptions(e.target.value)}
              className="col-span-3"
              placeholder="Comma separated (e.g. Red, Blue)"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="withImage" className="text-right">
              With Image
            </Label>
            <div className="flex items-center space-x-2 col-span-3">
              <Checkbox
                id="withImage"
                checked={withImage}
                onCheckedChange={(c) => setWithImage(!!c)}
              />
              <label
                htmlFor="withImage"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Enable image support
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
