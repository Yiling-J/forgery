import React, { useCallback, useState } from 'react'
import { Upload, Image as ImageIcon } from 'lucide-react'
import { readFileAsDataURL } from '../utils/imageProcessor'

interface UploadStageProps {
  onImageUpload: (imageDataUrl: string) => void
}

export const UploadStage: React.FC<UploadStageProps> = ({ onImageUpload }) => {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0]
        if (file.type.startsWith('image/')) {
          try {
            const dataUrl = await readFileAsDataURL(file)
            onImageUpload(dataUrl)
          } catch (error) {
            console.error('Error reading file:', error)
          }
        }
      }
    },
    [onImageUpload],
  )

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        try {
          const dataUrl = await readFileAsDataURL(e.target.files[0])
          onImageUpload(dataUrl)
        } catch (error) {
          console.error('Error reading file:', error)
        }
      }
    },
    [onImageUpload],
  )

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-8 animate-fade-in">
      <div
        className={`
          relative flex flex-col items-center justify-center w-full max-w-2xl h-96 
          rounded-3xl border-2 border-dashed transition-all duration-300 ease-in-out
          ${
            isDragging
              ? 'border-sky-400 bg-sky-400/10 scale-[1.02]'
              : 'border-slate-600 bg-slate-800/50 hover:border-slate-500 hover:bg-slate-800/80'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center space-y-4 text-center p-6">
          <div className="p-4 rounded-full bg-slate-700/50 ring-1 ring-white/10">
            <Upload className="w-8 h-8 text-sky-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-slate-200">Upload an Image</h3>
            <p className="text-sm text-slate-400 max-w-xs mx-auto">
              Drag and drop your image here, or click to browse files
            </p>
          </div>
          <label className="cursor-pointer">
            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            <span className="inline-flex items-center px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-medium transition-colors shadow-lg shadow-sky-500/20">
              <ImageIcon className="w-4 h-4 mr-2" />
              Select File
            </span>
          </label>
        </div>
      </div>
      <p className="mt-8 text-slate-500 text-sm">Supports JPG, PNG, WEBP up to 10MB</p>
    </div>
  )
}
