import { Archive, Download, RefreshCw, Upload } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Separator } from './ui/separator'

interface BackupRestoreDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BackupRestoreDialog({ open, onOpenChange }: BackupRestoreDialogProps) {
  const [isRestoring, setIsRestoring] = useState(false)

  const handleDownloadBackup = () => {
    window.location.href = '/api/backup'
  }

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (
      !confirm('Warning: This will overwrite all existing data. Are you sure you want to proceed?')
    ) {
      event.target.value = '' // Reset input
      return
    }

    setIsRestoring(true)
    const toastId = toast.loading('Restoring backup...')

    try {
      const response = await fetch('/api/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-tar',
        },
        body: file,
      })

      if (!response.ok) {
        throw new Error('Restore failed')
      }

      toast.success('Restore successful! Please refresh the page.', { id: toastId })
      onOpenChange(false)
      // Optionally reload the page to refresh data
      setTimeout(() => window.location.reload(), 1500)
    } catch (error) {
      console.error(error)
      toast.error('Failed to restore backup.', { id: toastId })
    } finally {
      setIsRestoring(false)
      event.target.value = '' // Reset input
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Backup & Restore</DialogTitle>
          <DialogDescription>Manage your data backup and restoration.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-4">
          {/* Backup Section */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 font-medium">
              <Archive className="h-4 w-4" />
              <span>Backup</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Download a complete backup of your data, including the database and all files.
            </p>
            <Button onClick={handleDownloadBackup} variant="outline" className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Download Backup (tar)
            </Button>
          </div>

          <Separator />

          {/* Restore Section */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 font-medium text-destructive">
              <RefreshCw className="h-4 w-4" />
              <span>Restore</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Restore data from a backup file.{' '}
              <span className="font-bold text-destructive">
                Warning: This will overwrite all current data.
              </span>
            </p>
            <div className="relative">
              <input
                type="file"
                accept=".tar"
                onChange={handleRestore}
                disabled={isRestoring}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <Button variant="destructive" className="w-full" disabled={isRestoring}>
                {isRestoring ? (
                  <>Restoring...</>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Select Backup File to Restore
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
