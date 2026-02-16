import React, { useState, useCallback } from 'react'
import { UploadStage } from './components/UploadStage'
import { AnalyzeStage } from './components/AnalyzeStage'
import { SplitStage } from './components/SplitStage'
import { RefineStage } from './components/RefineStage'
import { sliceImage } from './utils/imageProcessor'
import { AppStage, ImageSegment } from './types'

const App: React.FC = () => {
  const [stage, setStage] = useState<AppStage>('upload')
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [segments, setSegments] = useState<ImageSegment[]>([])

  // 1. Handle Upload
  const handleImageUpload = useCallback((imageDataUrl: string) => {
    setUploadedImage(imageDataUrl)
    setStage('analyze')
  }, [])

  // 2. Handle Analysis Completion
  const handleAnalysisComplete = useCallback(async () => {
    if (!uploadedImage) return

    try {
      // Slice image into 3x3 grid
      const slicedImages = await sliceImage(uploadedImage, 3, 3)

      const newSegments: ImageSegment[] = slicedImages.map((src, index) => ({
        id: `seg-${index}`,
        src,
        selected: true, // Default all selected
        status: 'pending',
      }))

      setSegments(newSegments)
      setStage('split')
    } catch (error) {
      console.error('Failed to slice image', error)
      // Fallback or error handling could go here
    }
  }, [uploadedImage])

  // 3. Handle Split Confirmation
  const handleSplitConfirm = useCallback(
    (selectedIds: string[]) => {
      // Filter out unselected items for the refine view
      const selectedSegments = segments.filter((seg) => selectedIds.includes(seg.id))
      setSegments(selectedSegments)
      setStage('refine')
    },
    [segments],
  )

  // 4. Reset
  const handleReset = useCallback(() => {
    setUploadedImage(null)
    setSegments([])
    setStage('upload')
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-sky-500/30 selection:text-sky-200 overflow-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-sky-900/20 rounded-full blur-[120px]" />
      </div>

      <main className="relative z-10 w-full h-screen flex flex-col">
        {/* Navigation / Header (Minimal) */}
        <header className="px-6 py-4 flex items-center justify-between border-b border-white/5 bg-slate-900/50 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-sky-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
              <span className="font-bold text-white text-lg">AI</span>
            </div>
            <h1 className="font-semibold text-lg tracking-tight text-slate-200">
              Refine<span className="text-sky-400">Lab</span>
            </h1>
          </div>

          {/* Progress Steps */}
          {stage !== 'upload' && (
            <div className="hidden sm:flex items-center gap-2 text-xs font-medium bg-black/20 p-1 rounded-full border border-white/5">
              <div
                className={`px-3 py-1 rounded-full transition-colors ${stage === 'analyze' ? 'bg-sky-500/20 text-sky-400' : 'text-slate-500'}`}
              >
                Analyze
              </div>
              <div className="w-4 h-[1px] bg-slate-800"></div>
              <div
                className={`px-3 py-1 rounded-full transition-colors ${stage === 'split' ? 'bg-sky-500/20 text-sky-400' : 'text-slate-500'}`}
              >
                Split
              </div>
              <div className="w-4 h-[1px] bg-slate-800"></div>
              <div
                className={`px-3 py-1 rounded-full transition-colors ${stage === 'refine' ? 'bg-purple-500/20 text-purple-400' : 'text-slate-500'}`}
              >
                Refine
              </div>
            </div>
          )}
        </header>

        {/* Content Area */}
        <div className="flex-1 relative overflow-hidden">
          {stage === 'upload' && <UploadStage onImageUpload={handleImageUpload} />}

          {stage === 'analyze' && uploadedImage && (
            <AnalyzeStage imageSrc={uploadedImage} onAnalysisComplete={handleAnalysisComplete} />
          )}

          {stage === 'split' && (
            <SplitStage segments={segments} onConfirm={handleSplitConfirm} onBack={handleReset} />
          )}

          {stage === 'refine' && <RefineStage initialSegments={segments} onDone={handleReset} />}
        </div>
      </main>
    </div>
  )
}

export default App
