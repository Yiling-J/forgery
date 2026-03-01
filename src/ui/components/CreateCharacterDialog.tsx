import { Loader2, Upload } from 'lucide-react'
import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { client } from '../client'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'

interface CreateCharacterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export const CreateCharacterDialog: React.FC<CreateCharacterDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { projectId } = useParams()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0]
      setFile(f)
      setPreview(URL.createObjectURL(f))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !name || !projectId) return

    setLoading(true)
    setError(null)

    try {
      // 1. Upload Image
      const uploadRes = await client.assets.upload.$post({
        form: {
          file: file,
          name: file.name,
        },
      })

      if (!uploadRes.ok) {
        throw new Error('Failed to upload image')
      }

      const asset = await uploadRes.json()

      // Get character category
      const categoriesRes = await client.categories.$get({ query: { projectId } })
      if (!categoriesRes.ok) throw new Error('Failed to fetch categories')
      const categories = await categoriesRes.json()
      const charCategory = categories.find(c => c.name === 'Character')
      if (!charCategory) throw new Error('Character category not found')

      // 2. Create Data
      const createRes = await client.data.$post({
        json: {
          name,
          description,
          imageId: asset.id,
          categoryId: charCategory.id,
          projectId
        },
      })

      if (!createRes.ok) {
        throw new Error('Failed to create character')
      }

      onSuccess()
      handleReset()
      onOpenChange(false)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setName('')
    setDescription('')
    setFile(null)
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    setError(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Character</DialogTitle>
          <DialogDescription>Add a new character to your collection.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="image">Character Image</Label>
            <div className="flex items-center justify-center w-full">
              {!preview ? (
                <label
                  htmlFor="dropzone-file"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-stone-50 hover:bg-stone-100 border-stone-300 hover:border-stone-400"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-stone-400" />
                    <p className="text-sm text-stone-500">
                      <span className="font-semibold">Click to upload</span>
                    </p>
                  </div>
                  <input
                    id="dropzone-file"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                    required
                  />
                </label>
              ) : (
                <div className="relative w-full h-32 bg-stone-100 rounded-lg overflow-hidden group">
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
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Character Name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={loading || !file || !name}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Character
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
