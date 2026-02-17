import { Loader2, Upload } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'
import { toast } from 'sonner'
import { EQUIPMENT_CATEGORIES, getSubCategories } from '../../lib/categories'
import { client } from '../client'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Textarea } from './ui/textarea'

interface UploadEquipmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function UploadEquipmentDialog({
  open,
  onOpenChange,
  onSuccess,
}: UploadEquipmentDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [category, setCategory] = useState<string>('')
  const [subCategory, setSubCategory] = useState<string>('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!open) return
      const items = e.clipboardData?.items
      if (items) {
        for (const item of items) {
          if (item.type.startsWith('image')) {
            const blob = item.getAsFile()
            if (blob) {
              setFile(blob)
              setPreviewUrl(URL.createObjectURL(blob))
              if (!name) setName('Pasted Image')
            }
          }
        }
      }
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [open, name])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFile(file)
      // Create preview
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      // Auto-fill name if empty
      if (!name) {
        setName(file.name.split('.')[0])
      }
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.type.startsWith('image')) {
        setFile(file)
        setPreviewUrl(URL.createObjectURL(file))
        if (!name) setName(file.name.split('.')[0])
      }
    }
  }

  const handleUpload = async () => {
    if (!file || !name || !category) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      // 1. Upload Asset
      const uploadRes = await client.assets.upload.$post({
        form: {
          file: file,
          name: name,
        },
      })

      if (!uploadRes.ok) throw new Error('Failed to upload image')
      const asset = await uploadRes.json()

      // 2. Create Equipment
      const createRes = await client.equipments.$post({
        json: {
          name,
          imageId: asset.id,
          category,
          subCategory: subCategory || undefined,
          description,
        },
      })

      if (!createRes.ok) throw new Error('Failed to create equipment')

      toast.success('Equipment created successfully')
      onSuccess()
      onOpenChange(false)

      // Reset form
      setFile(null)
      setName('')
      setCategory('')
      setSubCategory('')
      setDescription('')
      setPreviewUrl(null)
    } catch (error) {
      console.error(error)
      toast.error('Failed to create equipment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Equipment</DialogTitle>
          <DialogDescription>Upload a new equipment image directly.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Image Upload Area */}
          <div
            className={`
               relative w-full h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center
               transition-all duration-200 cursor-pointer overflow-hidden group
               ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100'}
             `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            {previewUrl ? (
              <>
                <img src={previewUrl} alt="Preview" className="w-full h-full object-contain p-2" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <p className="text-white font-medium">Click to change</p>
                </div>
              </>
            ) : (
              <div className="text-center p-6 pointer-events-none">
                <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-700">
                  Click or Drag & Drop Image Here
                </p>
                <p className="text-xs text-slate-500 mt-1">or paste from clipboard</p>
              </div>
            )}
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Equipment Name"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={category}
                onValueChange={(val) => {
                  setCategory(val)
                  setSubCategory('')
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {EQUIPMENT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.main_category} value={cat.main_category}>
                      {cat.main_category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {category && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="subCategory">Sub Category</Label>
              <Select value={subCategory} onValueChange={setSubCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {getSubCategories(category).map((sub) => (
                    <SelectItem key={sub} value={sub}>
                      {sub}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description..."
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={loading || !file || !name || !category}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
