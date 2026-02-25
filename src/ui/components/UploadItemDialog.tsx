import { Loader2, Upload, ClipboardPaste } from 'lucide-react'
import React, { useEffect, useState, useRef } from 'react'
import { toast } from 'sonner'
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
import { Category } from '../hooks/use-category'

interface UploadItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  category: Category
}

export const UploadItemDialog: React.FC<UploadItemDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
  category,
}) => {
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [option, setOption] = useState<string>('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const categoryOptions = React.useMemo(() => {
      try {
          return JSON.parse(category.options || '[]') as string[]
      } catch {
          return []
      }
  }, [category.options])

  useEffect(() => {
      if (!open) {
          setFile(null)
          setName('')
          setOption('')
          setDescription('')
          setPreviewUrl(null)
      }
  }, [open])

  // Handle Paste
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
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
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
    if (!file || !name) {
      toast.error('Please fill in name and upload a file')
      return
    }
    if (categoryOptions.length > 0 && !option) {
        toast.error('Please select an option')
        return
    }

    setLoading(true)
    try {
      // 1. Upload Asset
      const formData = new FormData()
      formData.append('file', file)
      formData.append('name', name)

      const uploadRes = await client.assets.upload.$post({
          form: {
              file: file,
              name: name
          }
      })

      if (!uploadRes.ok) throw new Error('Failed to upload image')
      const asset = await uploadRes.json()

      // 2. Create Data Item
      const createRes = await client.data.$post({
        json: {
          name,
          imageId: asset.id,
          categoryId: category.id,
          option: option || undefined,
          description,
        },
      })

      if (!createRes.ok) throw new Error('Failed to create item')

      toast.success('Item created successfully')
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error(error)
      toast.error('Failed to create item')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle>Upload {category.name}</DialogTitle>
          <DialogDescription>Upload a new image directly.</DialogDescription>
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
                  Click or Drag & Drop Image
                </p>
                <div className="flex items-center justify-center gap-2 mt-2 text-xs text-slate-400">
                     <ClipboardPaste className="w-3 h-3" /> Paste enabled
                </div>
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

          <div className="grid gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Item Name"
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={loading || !file || !name || (categoryOptions.length > 0 && !option)}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
