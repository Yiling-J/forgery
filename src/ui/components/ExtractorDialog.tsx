import { AlertCircle, Loader2 } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { client } from '../client'
import { ExtractedAsset, ExtractionStatus } from '../types'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'

interface ExtractorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (assets: ExtractedAsset[]) => void
}

interface GridDimensions {
  rows: number
  cols: number
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
  const [textureSheet, setTextureSheet] = useState<string | null>(null)
  const [gridDimensions, setGridDimensions] = useState<GridDimensions | null>(null)

  const processFile = (f: File) => {
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setResults([])
    setError(null)
    setStatus('idle')
    setTextureSheet(null)
    setGridDimensions(null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0])
    }
  }

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!open) return
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        const f = e.clipboardData.files[0]
        if (f.type.startsWith('image/')) {
          processFile(f)
        }
      }
    }

    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [open])

  const handleExtract = async () => {
    if (!file) return

    setResults([])
    setError(null)
    setStatus('analyzing')
    setStatusMessage('Starting extraction...')
    setTextureSheet(null)
    setGridDimensions(null)

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
              } else if (event === 'texture_generated') {
                setTextureSheet(data.image)
                setGridDimensions(data.grid)
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
    setTextureSheet(null)
    setGridDimensions(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto bg-stone-50/50 backdrop-blur-sm border-stone-200 shadow-2xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-2xl font-black text-stone-800 uppercase tracking-tighter">
            Equipment Extractor
          </DialogTitle>
          <DialogDescription className="text-stone-500 font-medium">
            Upload a character image to identify and extract equipment sprites.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload Area */}
          {!file ? (
            <div className="border-4 border-dashed border-stone-300 bg-white rounded-3xl p-12 text-center hover:border-cyan-400 hover:bg-cyan-50/30 transition-all group relative cursor-pointer shadow-sm">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
              />
              <div className="w-20 h-20 bg-cyan-100 text-cyan-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-inner">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-stone-800 mb-2 uppercase">Upload Source</h2>
              <p className="text-stone-500 mb-4 max-w-sm mx-auto">
                Drop character image to identify and extract equipment sprites.
              </p>
              <span className="inline-block px-8 py-4 bg-stone-900 text-white font-bold uppercase tracking-wider rounded-xl shadow-xl hover:bg-stone-800 transition-colors pointer-events-none">
                Select Image
              </span>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in-up">
              {/* Staging Area */}
              <div className="bg-white rounded-2xl shadow-xl border border-stone-200 p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-600"></div>

                <div className="flex justify-between items-center mb-6 pb-6 border-b border-stone-100">
                  <div>
                    <h3 className="font-bold text-stone-700 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                      Staging Area
                    </h3>
                  </div>
                  <button
                    onClick={handleReset}
                    className="text-red-500 font-bold text-xs uppercase hover:text-red-700 hover:underline"
                  >
                    Remove / Reset
                  </button>
                </div>

                <div className="flex flex-col md:flex-row gap-8">
                  {/* Source Image */}
                  <div className="w-full md:w-1/3 shrink-0 space-y-4">
                    <div className="aspect-[3/4] rounded-xl overflow-hidden border-2 border-stone-100 shadow-inner bg-stone-50 relative group">
                      <img src={preview || ''} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-bold uppercase tracking-widest bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
                          Source
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Generated Texture Sheet (with Grid Overlay) */}
                  {textureSheet && gridDimensions && (
                    <div className="w-full md:w-1/3 shrink-0 space-y-4 animate-fade-in">
                      <div className="aspect-square rounded-xl overflow-hidden border-2 border-amber-200 shadow-inner bg-stone-50 relative group">
                        <img src={textureSheet} className="w-full h-full object-contain" />

                        {/* Grid Overlay */}
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            display: 'grid',
                            gridTemplateRows: `repeat(${gridDimensions.rows}, 1fr)`,
                            gridTemplateColumns: `repeat(${gridDimensions.cols}, 1fr)`,
                          }}
                        >
                          {Array.from({ length: gridDimensions.rows * gridDimensions.cols }).map(
                            (_, i) => (
                              <div
                                key={i}
                                className="border border-red-500/30 bg-red-500/5 text-[10px] text-red-500 p-1 font-mono"
                              >
                                {i + 1}
                              </div>
                            ),
                          )}
                        </div>

                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white text-xs font-bold uppercase tracking-widest bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
                            Generated Sheet
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Controls & Status */}
                  <div className="flex-1 flex flex-col justify-center space-y-6">
                    {status === 'idle' || status === 'error' ? (
                      <div className="text-center md:text-left">
                        <h4 className="text-lg font-bold text-stone-800 mb-2">Ready to Process</h4>
                        <p className="text-stone-500 text-sm mb-6">
                          The image is ready for analysis. The system will identify equipment pieces
                          and extract them as individual assets.
                        </p>
                        {error && (
                          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm flex items-start gap-3 shadow-sm">
                            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold block mb-1">Extraction Failed</span>
                              {error}
                            </div>
                          </div>
                        )}
                        <button
                          onClick={handleExtract}
                          className="w-full py-4 text-white font-black uppercase tracking-widest text-lg rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-center gap-3"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                          </svg>
                          Begin Extraction
                        </button>
                      </div>
                    ) : (
                      <div className="w-full py-8 px-6 bg-stone-50 rounded-xl border border-stone-100 text-center">
                        <Loader2 className="w-10 h-10 text-amber-500 animate-spin mx-auto mb-4" />
                        <h4 className="text-lg font-bold text-stone-800 mb-1">{statusMessage}</h4>
                        <p className="text-xs text-stone-400 font-mono uppercase tracking-widest">
                          Processing...
                        </p>
                      </div>
                    )}

                    <div className="text-center">
                      <p className="text-[10px] text-stone-300 font-mono uppercase tracking-widest">
                        Powered by Gemini 2.0 Flash
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Results Grid (Appears progressively) */}
              {(results.length > 0 || status === 'complete') && (
                <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xl animate-fade-in-up delay-100">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-xl font-black text-stone-800 flex items-center gap-2 uppercase tracking-tighter">
                        <span className="text-amber-500">✦</span> Loot Acquired
                      </h2>
                      <p className="text-stone-500 text-xs font-bold tracking-[0.2em] uppercase mt-1">
                        {results.length} items found & stashed
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                    {results.map((item, i) => (
                      <div
                        key={i}
                        className="group relative bg-stone-50 rounded-lg border-2 border-stone-200 hover:border-amber-400 hover:shadow-lg transition-all duration-300"
                      >
                        <div className="aspect-square p-4 flex items-center justify-center relative overflow-hidden rounded-t-lg">
                          {/* Checkerboard bg */}
                          <div
                            className="absolute inset-0 opacity-5"
                            style={{
                              backgroundImage: 'radial-gradient(#000 1px, transparent 1px)',
                              backgroundSize: '8px 8px',
                            }}
                          ></div>
                          <img
                            src={item.imageUrl}
                            className="max-w-full max-h-full object-contain drop-shadow-md group-hover:scale-110 transition-transform"
                          />

                          {/* Download Overlay */}
                          <a
                            href={item.imageUrl}
                            download={`${item.name}.webp`}
                            className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[1px]"
                            title="Download Asset"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-8 w-8 text-white drop-shadow-md"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                              />
                            </svg>
                          </a>
                        </div>
                        <div className="p-2 bg-white border-t border-stone-200 rounded-b-lg">
                          <div className="text-xs font-bold text-stone-700 truncate">
                            {item.name}
                          </div>
                          <div className="text-[10px] text-stone-400 truncate uppercase">
                            {item.category}
                          </div>
                          <div className="w-6 h-1 bg-amber-400 rounded-full mt-2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
