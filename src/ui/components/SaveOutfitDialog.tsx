import React, { useState } from 'react'
import { client } from '../client'
import { InferResponseType } from 'hono/client'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Loader2 } from 'lucide-react'

type EquipmentResponse = InferResponseType<typeof client.equipments.$get>
type EquipmentItem = EquipmentResponse['items'][number]

interface SaveOutfitDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedEquipments: EquipmentItem[]
  prompt: string
  onSuccess: () => void
}

export const SaveOutfitDialog: React.FC<SaveOutfitDialogProps> = ({
  open,
  onOpenChange,
  selectedEquipments,
  prompt,
  onSuccess,
}) => {
  const [outfitName, setOutfitName] = useState('')
  const [outfitPrompt, setOutfitPrompt] = useState(prompt)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!outfitName.trim()) {
      setError('Please enter an outfit name.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const res = await client.outfits.$post({
        json: {
          name: outfitName.trim(),
          prompt: outfitPrompt.trim() || undefined,
          equipmentIds: selectedEquipments.map((e) => e.id),
        },
      })

      if (!res.ok) {
        throw new Error('Failed to create outfit')
      }

      onSuccess()
      onOpenChange(false)
    } catch (e) {
      console.error(e)
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>Save Outfit</DialogTitle>
          <DialogDescription>Save current selection as a reusable outfit.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <div>
            <Label htmlFor="save-outfit-name">Name</Label>
            <Input
              id="save-outfit-name"
              value={outfitName}
              onChange={(e) => setOutfitName(e.target.value)}
              placeholder="e.g. Combat Gear"
            />
          </div>
          <div>
            <Label htmlFor="save-outfit-prompt">Prompt (Optional)</Label>
            <Input
              id="save-outfit-prompt"
              value={outfitPrompt}
              onChange={(e) => setOutfitPrompt(e.target.value)}
              placeholder="Extra prompt details..."
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={submitting || !outfitName.trim()}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
