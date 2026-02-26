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
import { Loader2, Plus, X } from 'lucide-react'
import { useRef, useState } from 'react'

interface Asset {
  id: string
  path: string
  name: string
}

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
  const [promptText, setPromptText] = useState('')
  const [referenceImages, setReferenceImages] = useState<Asset[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const res = await client.assets.upload.$post({
          form: {
            file: file,
            name: file.name,
          },
        })

        if (res.ok) {
          const asset = await res.json()
          // @ts-ignore
          setReferenceImages((prev) => [...prev, asset])
        } else {
          console.error('Failed to upload', file.name)
          toast({
            title: 'Error',
            description: `Failed to upload ${file.name}`,
            variant: 'destructive',
          })
        }
      }
    } catch (error) {
      console.error('Upload error', error)
      toast({
        title: 'Error',
        description: 'Failed to upload images.',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const removeImage = (id: string) => {
    setReferenceImages((prev) => prev.filter((img) => img.id !== id))
  }

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
          imagePrompt: {
            text: withImage ? promptText : '',
            imageIds: withImage ? referenceImages.map((img) => img.id) : [],
          },
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
    setPromptText('')
    setReferenceImages([])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
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

          {withImage && (
            <div className="col-span-4 space-y-4 border-t border-slate-100 pt-4 mt-2">
              <div className="flex items-center justify-between">
                <Label className="text-slate-500 font-semibold uppercase text-xs tracking-wider">
                  Extraction Configuration
                </Label>
              </div>

              {/* Reference Images */}
              {referenceImages.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {referenceImages.map((img) => (
                    <div key={img.id} className="relative w-16 h-16 shrink-0 group">
                      <img
                        src={`/files/${img.path}`}
                        alt={img.name}
                        className="w-full h-full object-cover rounded-md border border-slate-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(img.id)}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Prompt & Add Image */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0 h-20 w-20 flex flex-col gap-1 items-center justify-center border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                  ) : (
                    <>
                      <Plus className="h-5 w-5 text-slate-400" />
                      <span className="text-[10px] text-slate-500">Add Image</span>
                    </>
                  )}
                </Button>
                <Textarea
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder="Enter extraction prompt (e.g. Extract {{name}} from image)..."
                  className="flex-1 h-20 resize-none font-mono text-sm"
                />
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleFileChange}
              />
            </div>
          )}

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
