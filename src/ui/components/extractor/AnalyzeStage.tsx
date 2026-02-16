import React from 'react'

interface AnalyzeStageProps {
  imageSrc: string
  isAnalyzing: boolean
}

export const AnalyzeStage: React.FC<AnalyzeStageProps> = ({ imageSrc, isAnalyzing }) => {
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
