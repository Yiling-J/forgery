import { BrainCircuit, Play } from 'lucide-react'
import React from 'react'
import { Button } from '../ui/button'

interface AnalyzeStageProps {
  imageSrc: string
  statusMessage: string
  isAnalyzing: boolean
  onStart: () => void
}

export const AnalyzeStage: React.FC<AnalyzeStageProps> = ({
  imageSrc,
  statusMessage,
  isAnalyzing,
  onStart,
}) => {
  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full overflow-hidden bg-slate-50">
      {/* Background Frosted Glass Layer */}
      <div
        className="absolute inset-0 w-full h-full z-0 opacity-20 blur-3xl scale-110 pointer-events-none transition-opacity duration-1000"
        style={{
          backgroundImage: `url(${imageSrc})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
      />

      {/* Main Container */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-4xl h-[70vh] p-8">
        {/* Image Container with Scanning Effect */}
        <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl ring-1 ring-slate-200 bg-white/50 backdrop-blur-sm group">
          <img src={imageSrc} alt="Analyzing" className="w-full h-full object-contain p-8" />

          {/* Scan Line Animation (only when analyzing) */}
          {isAnalyzing && (
            <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
              <div className="w-full h-[2px] bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.8)] animate-[scanline_2s_linear_infinite]"></div>
            </div>
          )}

          {/* Grid Overlay Effect (Subtle) */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-10"></div>

          {/* Corner Brackets UI */}
          <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-cyan-500 rounded-tl-lg z-20"></div>
          <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-cyan-500 rounded-tr-lg z-20"></div>
          <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-cyan-500 rounded-bl-lg z-20"></div>
          <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-cyan-500 rounded-br-lg z-20"></div>
        </div>

        {/* Status Text or Action Button */}
        <div className="mt-8 flex items-center justify-center">
          {isAnalyzing ? (
            <div className="flex items-center space-x-3 px-6 py-3 rounded-full bg-white/80 backdrop-blur-md border border-slate-200 shadow-xl">
              <BrainCircuit className="w-5 h-5 text-cyan-500 animate-pulse" />
              <span className="text-slate-700 font-medium tracking-wide">{statusMessage}</span>
              <div className="flex space-x-1 ml-2">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-bounce"></div>
              </div>
            </div>
          ) : (
            <Button
              size="lg"
              className="px-8 py-6 rounded-full text-lg font-bold shadow-xl shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:-translate-y-1 transition-all"
              onClick={onStart}
            >
              <Play className="w-5 h-5 mr-2 fill-current" />
              Start Extraction
            </Button>
          )}
        </div>
      </div>
      <style>{`
        @keyframes scanline {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(100vh);
          }
        }
      `}</style>
    </div>
  )
}
