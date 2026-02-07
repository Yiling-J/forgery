import React from 'react';
import { ExtractionStatus } from '../types';

interface LoadingOverlayProps {
  status: ExtractionStatus;
  current?: number;
  total?: number;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ status, current = 0, total = 0 }) => {
  const getStatusText = () => {
    switch (status) {
      case 'analyzing': return 'Scanning Neural Patterns...';
      case 'generating': return 'Synthesizing Texture Data...';
      case 'splitting': return 'Isolating Components...';
      case 'refining': return 'Upscaling & Polishing...';
      default: return 'Processing...';
    }
  };

  const percent = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/90 backdrop-blur-sm flex flex-col items-center justify-center text-white animate-fade-in-up">
       <div className="w-64 mb-8">
          <div className="flex justify-between text-xs font-mono uppercase tracking-widest text-stone-400 mb-2">
             <span>System Status</span>
             <span>{percent}%</span>
          </div>
          <div className="h-2 bg-stone-800 rounded-full overflow-hidden">
             <div
               className="h-full bg-amber-500 transition-all duration-300 ease-out"
               style={{ width: `${percent}%` }}
             ></div>
          </div>
       </div>

       <div className="relative">
          <div className="w-16 h-16 border-4 border-stone-700 border-t-amber-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-8 h-8 bg-amber-500/20 rounded-full animate-pulse"></div>
          </div>
       </div>

       <h2 className="mt-8 text-2xl font-black uppercase tracking-widest">{getStatusText()}</h2>
       <p className="text-stone-500 font-mono text-sm mt-2">Do not close window</p>
    </div>
  );
};