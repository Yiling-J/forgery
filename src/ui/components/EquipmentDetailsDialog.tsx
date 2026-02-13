import React, { useEffect, useState } from 'react'
import { InferResponseType } from 'hono/client'
import { client } from '../client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

type EquipmentResponse = InferResponseType<typeof client.equipments.$get>
type EquipmentItem = EquipmentResponse['items'][number]

interface EquipmentDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  equipment: EquipmentItem | null
  onUpdate: () => void
}

export const EquipmentDetailsDialog: React.FC<EquipmentDetailsDialogProps> = ({
  open,
  onOpenChange,
  equipment,
  onUpdate,
}) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (equipment) {
      setName(equipment.name)
      setDescription(equipment.description || '')
    }
  }, [equipment])

  const handleSave = async () => {
    if (!equipment) return
    setSaving(true)
    try {
      const res = await client.equipments[':id'].$patch({
        param: { id: equipment.id },
        json: { name, description },
      })
      if (res.ok) {
        toast.success('Equipment updated')
        onUpdate()
        onOpenChange(false)
      } else {
        toast.error('Failed to update equipment')
      }
    } catch (e) {
      console.error(e)
      toast.error('An error occurred')
    } finally {
      setSaving(false)
    }
  }

  if (!equipment) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 gap-0 bg-stone-50 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-stone-200 bg-white shrink-0">
          <DialogTitle className="text-xl font-black uppercase tracking-tighter text-stone-800">
            Equipment Details
          </DialogTitle>
          <DialogDescription>
            {equipment.category} {equipment.subCategory && `> ${equipment.subCategory}`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Top: Full Image */}
          <div className="h-[60%] bg-stone-900 flex items-center justify-center p-4 overflow-hidden relative shrink-0">
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            ></div>
            <img
              src={equipment.image?.path ? `/files/${equipment.image.path}` : ''}
              alt={equipment.name}
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
                  placeholder="Equipment Name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the equipment..."
                  rows={8}
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
