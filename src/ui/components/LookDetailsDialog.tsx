import { InferResponseType } from 'hono/client'
import {
  Calendar,
  Download,
  Eye,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
} from 'lucide-react'
import React, { useState } from 'react'
import { toast } from 'sonner'
import { client } from '../client'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { ScrollArea } from './ui/scroll-area'

// Use new type for generation
// @ts-ignore
type GenerationItem = InferResponseType<typeof client.data[':id']['generations']['$get']>['items'][number]

interface LookDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  generation: GenerationItem | null
}

export const LookDetailsDialog: React.FC<LookDetailsDialogProps> = ({
  open,
  onOpenChange,
  generation,
}) => {
  const [fullscreen, setFullscreen] = useState(false)

  if (!generation) return null

  // Extract character, pose, expression, equipment from `data` array
  // @ts-ignore
  const character = generation.data.find(d => d.data.category.name === 'Character')?.data
  // @ts-ignore
  const pose = generation.data.find(d => d.data.category.name === 'Pose')?.data
  // @ts-ignore
  const expression = generation.data.find(d => d.data.category.name === 'Expression')?.data
  // @ts-ignore
  const equipments = generation.data.filter(d =>
      !['Character', 'Pose', 'Expression'].includes(d.data.category.name)
      // @ts-ignore
  ).map(d => d.data)

  const handleDownload = () => {
    if (generation.image?.path) {
      const link = document.createElement('a')
      link.href = `/files/${generation.image.path}`
      link.download = generation.image.path.split('/').pop() || 'download'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 gap-0 overflow-hidden bg-white border-stone-200">
        <div className="flex flex-col lg:flex-row h-full">
          {/* Left: Image Viewer */}
          <div className="flex-1 bg-stone-900 relative flex items-center justify-center p-4 overflow-hidden group">
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)',
                backgroundSize: '24px 24px',
              }}
            ></div>

            <img
              src={generation.image?.path ? `/files/${generation.image.path}` : ''}
              alt="Generated Look"
              className="max-w-full max-h-full object-contain shadow-2xl transition-transform duration-500"
            />

            {/* Overlay Actions */}
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="secondary"
                size="icon"
                className="rounded-full bg-black/50 hover:bg-black/70 text-white border-none backdrop-blur-md"
                onClick={() => setFullscreen(!fullscreen)}
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="rounded-full bg-black/50 hover:bg-black/70 text-white border-none backdrop-blur-md"
                onClick={handleDownload}
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Right: Details Panel */}
          <div className="w-full lg:w-[400px] bg-white border-l border-stone-200 flex flex-col h-full shrink-0">
            <DialogHeader className="p-6 border-b border-stone-100 shrink-0">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <DialogTitle className="text-xl font-bold text-stone-900">
                    Look Details
                  </DialogTitle>
                  <p className="text-xs text-stone-500 font-mono">
                    ID: {generation.id.slice(0, 8)}...
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleDownload}>
                      <Download className="mr-2 h-4 w-4" /> Download Image
                    </DropdownMenuItem>
                    {/* Add Delete if needed, but usually handled in parent list */}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </DialogHeader>

            <ScrollArea className="flex-1">
              <div className="p-6 space-y-8">
                {/* User Prompt */}
                {generation.userPrompt && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                      Instructions
                    </h4>
                    <div className="p-3 bg-stone-50 rounded-lg text-sm text-stone-600 italic border border-stone-100">
                      "{generation.userPrompt}"
                    </div>
                  </div>
                )}

                {/* Composition */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                    Composition
                  </h4>

                  {/* Character */}
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-stone-50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-stone-100 overflow-hidden border border-stone-200 shrink-0">
                      {character?.image?.path && (
                        <img
                          src={`/files/${character.image.path}`}
                          className="w-full h-full object-cover"
                          alt="Character"
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-stone-400 uppercase">Base Character</p>
                      <p className="text-sm font-medium text-stone-800 truncate">
                        {character?.name || 'Unknown'}
                      </p>
                    </div>
                  </div>

                  {/* Pose */}
                  {pose && (
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-stone-50 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-stone-100 overflow-hidden border border-stone-200 shrink-0">
                        {pose.image?.path && (
                          <img
                            src={`/files/${pose.image.path}`}
                            className="w-full h-full object-cover"
                            alt="Pose"
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-stone-400 uppercase">Pose</p>
                        <p className="text-sm font-medium text-stone-800 truncate">
                          {pose.name}
                        </p>
                      </div>
                    </div>
                  )}

                   {/* Expression */}
                   {expression && (
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-stone-50 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-stone-100 overflow-hidden border border-stone-200 shrink-0">
                        {expression.image?.path && (
                          <img
                            src={`/files/${expression.image.path}`}
                            className="w-full h-full object-cover"
                            alt="Expression"
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-stone-400 uppercase">Expression</p>
                        <p className="text-sm font-medium text-stone-800 truncate">
                          {expression.name}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Equipment List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                      Equipment ({equipments.length})
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {/* @ts-ignore */}
                    {equipments.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-2 rounded-lg border border-stone-100 hover:border-stone-200 hover:shadow-sm transition-all bg-white"
                      >
                        <div className="w-10 h-10 rounded bg-stone-50 overflow-hidden border border-stone-100 shrink-0 flex items-center justify-center">
                          <img
                            src={item.image?.path ? `/files/${item.image.path}` : ''}
                            className="max-w-full max-h-full object-contain mix-blend-multiply"
                            alt={item.name}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-stone-800 truncate">
                            {item.name}
                          </p>
                          <p className="text-[10px] text-stone-400 uppercase truncate">
                            {item.option}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Metadata */}
                <div className="pt-6 border-t border-stone-100 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-stone-400 uppercase">Created</p>
                    <p className="text-sm font-medium text-stone-800">
                      {new Date(generation.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-stone-400 uppercase">Time</p>
                    <p className="text-sm font-medium text-stone-800">
                      {new Date(generation.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
