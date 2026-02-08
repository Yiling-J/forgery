import React, { useState } from 'react'
import { ExtractionStatus, ExtractedAsset } from '../types'
import { client } from '../client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card } from './ui/card'
import { Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

interface ExtractorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (assets: ExtractedAsset[]) => void
}

export const ExtractorDialog: React.FC<ExtractorDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [status, setStatus] = useState<ExtractionStatus>('idle')
  const [statusMessage, setStatusMessage] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<ExtractedAsset[]>([])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0]
      setFile(f)
      setPreview(URL.createObjectURL(f))
      setResults([])
      setError(null)
      setStatus('idle')
    }
  }

  const handleExtract = async () => {
    if (!file) return

    setResults([])
    setError(null)
    setStatus('analyzing')
    setStatusMessage('Starting extraction...')

    try {
      const response = await client.extract.$post({
        form: {
          image: file,
        },
      })

      if (!response.ok) throw new Error('Server error')
      if (!response.body) throw new Error('No response body')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            const eventMatch = line.match(/^event: (.+)$/m)
            const dataMatch = line.match(/^data: (.+)$/m)

            if (eventMatch && dataMatch) {
              const event = eventMatch[1].trim()
              const data = JSON.parse(dataMatch[1])

              if (event === 'status') {
                setStatus(data.status)
                setStatusMessage(data.message)
              } else if (event === 'asset_refined') {
                setResults((prev) => [...prev, data.asset])
              } else if (event === 'complete') {
                setStatus('complete')
                setStatusMessage('Extraction complete!')
                setResults(data.assets)
                onSuccess(data.assets)
              } else if (event === 'error') {
                throw new Error(data.message)
              }
            }
          }
        }
      }
    } catch (e: unknown) {
      console.error(e)
      const err = e instanceof Error ? e : new Error(String(e))
      setError(err.message || 'Extraction failed')
      setStatus('error')
    }
  }

  const handleReset = () => {
    setFile(null)
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    setResults([])
    setStatus('idle')
    setError(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Equipment Extractor</DialogTitle>
          <DialogDescription>
            Upload a character image to identify and extract equipment sprites.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {!file ? (
            <div className="border-4 border-dashed border-stone-200 rounded-xl p-12 text-center hover:border-stone-400 hover:bg-stone-50 transition-all cursor-pointer relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Upload className="w-12 h-12 text-stone-400 mx-auto mb-4" />
              <h3 className="font-bold text-stone-700">Upload Source Image</h3>
              <p className="text-sm text-stone-500">Click or drag and drop</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Card className="p-4 overflow-hidden relative group">
                   <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 hover:bg-white"
                    onClick={handleReset}
                   >
                     Change
                   </Button>
                  <img
                    src={preview || ''}
                    alt="Source"
                    className="w-full h-64 object-contain rounded-md bg-stone-100"
                  />
                </Card>

                {status !== 'complete' && (
                  <Button
                    onClick={handleExtract}
                    disabled={status !== 'idle' && status !== 'error'}
                    className="w-full"
                    size="lg"
                  >
                    {status === 'analyzing' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {statusMessage}
                      </>
                    ) : (
                      'Begin Extraction'
                    )}
                  </Button>
                )}

                {error && (
                   <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm flex items-start gap-2">
                     <AlertCircle className="w-4 h-4 mt-0.5 shrink-0"/>
                     {error}
                   </div>
                )}
              </div>

              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <h3 className="font-bold text-stone-800 flex items-center gap-2">
                      Results
                      {results.length > 0 && <span className="text-xs bg-stone-100 px-2 py-0.5 rounded-full text-stone-600">{results.length}</span>}
                    </h3>
                    {status === 'complete' && <CheckCircle2 className="text-green-500 w-5 h-5"/>}
                 </div>

                 <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {results.map((item, i) => (
                      <div key={i} className="border rounded-lg p-2 bg-stone-50 text-center relative group">
                        <div className="aspect-square mb-2 bg-white rounded flex items-center justify-center overflow-hidden">
                          <img src={item.imageUrl} className="max-w-full max-h-full object-contain" />
                        </div>
                        <div className="text-xs font-bold truncate">{item.name}</div>
                        <div className="text-[10px] text-stone-500 truncate">{item.category}</div>
                      </div>
                    ))}
                    {results.length === 0 && status !== 'idle' && status !== 'error' && (
                       <div className="col-span-2 py-12 text-center text-stone-400 text-sm">
                          {status === 'analyzing' ? 'Analyzing image...' : 'Ready to extract'}
                       </div>
                    )}
                 </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
