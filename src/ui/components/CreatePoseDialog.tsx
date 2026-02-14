import { Loader2, Upload } from 'lucide-react'
import React, { useState } from 'react'
import { toast } from 'sonner'
import { client } from '../client'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'

interface CreatePoseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export const CreatePoseDialog: React.FC<CreatePoseDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [name, setName] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0]
      setFile(f)
      setPreview(URL.createObjectURL(f))
      if (!name) {
        setName(f.name.replace(/\.[^/.]+$/, ''))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !name) return

    setLoading(true)

    try {
      const res = await client.poses.$post({
        form: {
          name,
          image: file,
        },
      })

      if (!res.ok) {
        throw new Error('Failed to create pose')
      }

      toast.success('Pose created successfully')
      onSuccess()
      handleReset()
      onOpenChange(false)
    } catch (err) {
      console.error(err)
      toast.error('Failed to create pose')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setName('')
    setFile(null)
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Custom Pose</DialogTitle>
          <DialogDescription>Upload a reference image for a new pose.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pose-image">Pose Image</Label>
            <div className="flex items-center justify-center w-full">
              {!preview ? (
                <label
                  htmlFor="pose-dropzone"
                  className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-stone-50 hover:bg-stone-100 border-stone-300 hover:border-stone-400 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-stone-400" />
                    <p className="text-sm text-stone-500">
                      <span className="font-semibold">Click to upload</span>
                    </p>
                  </div>
                  <input
                    id="pose-dropzone"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                    required
                  />
                </label>
              ) : (
                <div className="relative w-full h-48 bg-stone-100 rounded-lg overflow-hidden group border border-stone-200">
                  <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null)
                      URL.revokeObjectURL(preview)
                      setPreview(null)
                    }}
                    className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-medium"
                  >
                    Change Image
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pose-name">Name</Label>
            <Input
              id="pose-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Pose Name"
              required
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={loading || !file || !name}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Pose
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
