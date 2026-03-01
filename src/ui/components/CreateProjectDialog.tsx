import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { client } from '../client'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  initialData?: { id: string; name: string; coverImageId?: string | null } | null
}

export function CreateProjectDialog({ open, onOpenChange, onSuccess, initialData }: Props) {
  const [name, setName] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open) {
      if (initialData) {
        setName(initialData.name)
        // Note: we can't easily set file/preview from just coverImageId without fetching the asset path
        // For simplicity, we just clear preview unless they upload a new one
        setPreview(null)
      } else {
        setName('')
        setFile(null)
        setPreview(null)
      }
    }
  }, [open, initialData])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      setFile(selected)
      const url = URL.createObjectURL(selected)
      setPreview(url)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsLoading(true)
    try {
      let coverImageId: string | undefined = undefined

      if (file) {
        const uploadRes = await client.assets.upload.$post({
          form: { file, name: file.name },
        })
        if (!uploadRes.ok) throw new Error('Failed to upload image')
        const asset = await uploadRes.json()
        coverImageId = asset.id
      }

      if (initialData) {
        const updateRes = await client.projects[':id'].$patch({
          param: { id: initialData.id },
          json: { name, coverImageId },
        })
        if (!updateRes.ok) throw new Error('Failed to update project')
        toast.success('Project updated')
      } else {
        const createRes = await client.projects.$post({
          json: { name, coverImageId },
        })
        if (!createRes.ok) throw new Error('Failed to create project')
        toast.success('Project created')
      }

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error(error)
      toast.error(initialData ? 'Failed to update project' : 'Failed to create project')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Project' : 'New Project'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              placeholder="e.g. Fantasy Assets"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Cover Image (Optional)</Label>
            <div className="flex items-center gap-4">
              <div
                className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/50 overflow-hidden cursor-pointer hover:bg-muted transition-colors relative"
                onClick={() => document.getElementById('project-cover')?.click()}
              >
                {preview ? (
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm text-muted-foreground">Upload</span>
                )}
                <input
                  id="project-cover"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={isLoading}
                />
              </div>
              <div className="text-sm text-muted-foreground flex-1">
                Recommend 16:9 ratio image for best appearance.
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
