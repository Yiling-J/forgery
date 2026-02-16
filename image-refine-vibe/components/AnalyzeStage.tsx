import React, { useEffect } from 'react';
import { Scan, BrainCircuit } from 'lucide-react';

interface AnalyzeStageProps {
  imageSrc: string;
  onAnalysisComplete: () => void;
}

export const AnalyzeStage: React.FC<AnalyzeStageProps> = ({ imageSrc, onAnalysisComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onAnalysisComplete();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onAnalysisComplete]);

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full overflow-hidden bg-slate-900">
      {/* Background Frosted Glass Layer */}
      <div 
        className="absolute inset-0 w-full h-full z-0 opacity-40 blur-3xl scale-110 pointer-events-none transition-opacity duration-1000"
        style={{
          backgroundImage: `url(${imageSrc})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
      />
      
      {/* Main Container */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-4xl h-[80vh] p-8">
        
        {/* Image Container with Scanning Effect */}
        <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 bg-black/40 backdrop-blur-sm group">
          <img 
            src={imageSrc} 
            alt="Analyzing" 
            className="w-full h-full object-contain"
          />
          
          {/* Scan Line Animation */}
          <div className="scan-line"></div>
          
          {/* Grid Overlay Effect (Subtle) */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(56,189,248,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

          {/* Corner Brackets UI */}
          <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-sky-500/50 rounded-tl-lg"></div>
          <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-sky-500/50 rounded-tr-lg"></div>
          <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-sky-500/50 rounded-bl-lg"></div>
          <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-sky-500/50 rounded-br-lg"></div>
        </div>

        {/* Status Text */}
        <div className="mt-8 flex items-center space-x-3 px-6 py-3 rounded-full bg-slate-800/80 backdrop-blur-md border border-white/10 shadow-xl">
          <BrainCircuit className="w-5 h-5 text-sky-400 animate-pulse" />
          <span className="text-slate-200 font-medium tracking-wide">
            Analyzing Structure...
          </span>
          <div className="flex space-x-1 ml-2">
            <div className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce"></div>
          </div>
        </div>

      </div>
    </div>
  );
};