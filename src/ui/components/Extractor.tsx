import React, { useState } from 'react'
import { ExtractionStatus, ExtractedAsset } from '../types'
import { client } from '../client'

interface ExtractorProps {
  onStatusChange: (status: ExtractionStatus, message?: string) => void
  onError: (msg: string | null) => void
  onAssetsExtracted: (assets: ExtractedAsset[]) => void
  status: ExtractionStatus
  statusMessage: string
}

export const Extractor: React.FC<ExtractorProps> = ({
  onStatusChange,
  onError,
  onAssetsExtracted,
  status,
  statusMessage,
}) => {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [results, setResults] = useState<ExtractedAsset[]>([])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0]
      setFile(f)
      setPreview(URL.createObjectURL(f))
      setResults([])
      onError(null)
      onStatusChange('idle')
    }
  }

  const handleExtract = async () => {
    if (!file) return

    setResults([])
    onError(null)
    onStatusChange('analyzing', 'Starting extraction...')

    try {
      // Hono RPC Client for File Upload
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
        const lines = buffer.split('\n\n') // SSE events are separated by double newline
        buffer = lines.pop() || '' // Keep incomplete line

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            // Basic SSE parsing
            const eventMatch = line.match(/^event: (.+)$/m)
            const dataMatch = line.match(/^data: (.+)$/m)

            if (eventMatch && dataMatch) {
              const event = eventMatch[1].trim()
              const data = JSON.parse(dataMatch[1])

              if (event === 'status') {
                onStatusChange(data.status, data.message)
              } else if (event === 'asset_refined') {
                // progressively update results
                const newAsset = data.asset
                setResults((prev) => [...prev, newAsset])
              } else if (event === 'complete') {
                onStatusChange('complete', 'Extraction complete!')
                // Assuming data.assets contains all assets, but we have been accumulating them.
                // We can just rely on the accumulated results if we trust asset_refined.
                // But let's sync one last time or just keep what we have.
                // The API sends all assets in complete event too.
                setResults(data.assets)
                onAssetsExtracted(data.assets)
              } else if (event === 'error') {
                throw new Error(data.message)
              }
            }
          }
        }
      }
    } catch (e: unknown) {
      console.error(e)
      const error = e instanceof Error ? e : new Error(String(e))
      onError(error.message || 'Extraction failed')
      onStatusChange('error')
    }
  }

  const handleReset = () => {
    setFile(null)
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    setResults([])
    onStatusChange('idle')
  }

  if (results.length > 0) {
    return (
      <div className="animate-fade-in-up space-y-8">
        {/* Source Selection Strip */}
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
          <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">
            Source Reference
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
            <div className="relative w-16 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 border-amber-500 shadow-md">
              <img src={preview || ''} className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        {/* Results Grid */}
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-black text-stone-800 flex items-center gap-2">
                <span className="text-amber-500">✦</span> LOOT ACQUIRED
              </h2>
              <p className="text-stone-500 text-sm font-medium">
                {results.length} items found & stashed
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="px-5 py-2.5 text-stone-500 font-bold uppercase text-sm hover:bg-stone-100 rounded-lg transition-colors"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 text-white"
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
                <div className="p-3 bg-white border-t border-stone-200 rounded-b-lg">
                  <div className="text-xs font-bold text-stone-700 truncate">{item.name}</div>
                  <div className="text-[10px] text-stone-400 truncate">{item.category}</div>
                  <div className="w-6 h-1 bg-amber-400 rounded-full mt-2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Initial State
  return (
    <div className="max-w-2xl mx-auto animate-fade-in-up">
      {!file ? (
        <div className="border-4 border-dashed border-stone-300 bg-white rounded-3xl p-12 text-center hover:border-cyan-400 hover:bg-cyan-50/30 transition-all group">
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
          <h2 className="text-2xl font-black text-stone-800 mb-2">UPLOAD SOURCE</h2>
          <p className="text-stone-500 mb-4 max-w-sm mx-auto">
            Drop character image to identify and extract equipment sprites.
          </p>
          <div className="block">
            <label className="inline-block cursor-pointer">
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              <span className="px-8 py-4 bg-stone-900 text-white font-bold uppercase tracking-wider rounded-xl shadow-xl hover:bg-stone-800 transition-colors">
                Select Image
              </span>
            </label>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xl border border-stone-200 p-6">
          <div className="flex justify-between items-center mb-6 pb-6 border-b border-stone-100">
            <div>
              <h3 className="font-bold text-stone-700 uppercase tracking-wider">Staging Area</h3>
            </div>
            <button
              onClick={handleReset}
              className="text-red-500 font-bold text-xs uppercase hover:text-red-700"
            >
              Remove
            </button>
          </div>

          <div className="w-full aspect-square rounded-lg overflow-hidden border border-stone-200 mb-8 relative bg-stone-100">
            <img src={preview || ''} className="w-full h-full object-contain" />
          </div>

          <button
            onClick={handleExtract}
            disabled={status !== 'idle' && status !== 'error'}
            className={`w-full py-4 text-white font-black uppercase tracking-widest text-lg rounded-xl shadow-lg transition-all flex items-center justify-center gap-3 ${
              status === 'idle' || status === 'error'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:shadow-xl hover:-translate-y-1'
                : 'bg-stone-400 cursor-not-allowed'
            }`}
          >
            {status === 'idle' || status === 'error' ? (
              <>
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
              </>
            ) : (
              <span>{statusMessage}...</span>
            )}
          </button>
          <p className="text-center text-xs text-stone-400 mt-4 font-mono">
            POWERED BY GEMINI 2.0 FLASH
          </p>
        </div>
      )}
    </div>
  )
}
