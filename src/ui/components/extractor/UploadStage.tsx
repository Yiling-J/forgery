import { Image as ImageIcon, Upload } from 'lucide-react'
import React, { useCallback, useState } from 'react'
import { cn } from '../../lib/utils'

interface UploadStageProps {
  onImageUpload: (file: File) => void
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
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0]
        if (file.type.startsWith('image/')) {
          onImageUpload(file)
        }
      }
    },
    [onImageUpload],
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        onImageUpload(e.target.files[0])
      }
    },
    [onImageUpload],
  )

  React.useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        const file = e.clipboardData.files[0]
        if (file.type.startsWith('image/')) {
          onImageUpload(file)
        }
      }
    }

    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [onImageUpload])

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-8 animate-fade-in-up">
      <div
        className={cn(
          'relative flex flex-col items-center justify-center w-full max-w-2xl h-96 rounded-3xl border-2 border-dashed transition-all duration-300 ease-in-out cursor-pointer group',
          isDragging
            ? 'border-cyan-500 bg-cyan-50 scale-[1.02]'
            : 'border-slate-300 bg-slate-50 hover:border-cyan-400 hover:bg-slate-100',
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-upload')?.click()}
      >
        <div className="flex flex-col items-center justify-center space-y-4 text-center p-6 pointer-events-none">
          <div
            className={cn(
              'p-4 rounded-full ring-1 transition-all duration-300',
              isDragging
                ? 'bg-cyan-100 ring-cyan-200'
                : 'bg-white ring-slate-200 group-hover:ring-cyan-200 group-hover:bg-cyan-50',
            )}
          >
            <Upload
              className={cn(
                'w-8 h-8 transition-colors duration-300',
                isDragging ? 'text-cyan-600' : 'text-slate-400 group-hover:text-cyan-500',
              )}
            />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-700 group-hover:text-slate-900 transition-colors">
              Upload an Image
            </h3>
            <p className="text-sm text-slate-500 max-w-xs mx-auto group-hover:text-slate-600 transition-colors">
              Drag and drop your image here, or click to browse files
            </p>
          </div>
          <div className="pt-4">
            <span
              className={cn(
                'inline-flex items-center px-6 py-2.5 rounded-xl font-medium transition-all shadow-sm',
                isDragging
                  ? 'bg-cyan-600 text-white shadow-cyan-200'
                  : 'bg-white text-slate-700 border border-slate-200 group-hover:border-cyan-200 group-hover:text-cyan-600 group-hover:shadow-md',
              )}
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Select File
            </span>
          </div>
        </div>
        <input
          id="file-upload"
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />
      </div>
      <p className="mt-8 text-slate-400 text-sm font-medium">Supports JPG, PNG, WEBP up to 10MB</p>
    </div>
  )
}
