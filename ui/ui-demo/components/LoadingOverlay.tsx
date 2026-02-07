import React from 'react';

interface LoadingOverlayProps {
  status: string;
  current?: number;
  total?: number;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ status, current, total }) => {
  let title = 'PROCESSING';
  let description = 'Please wait...';

  switch (status) {
    case 'analyzing':
      title = 'SCANNING ASSETS';
      description = 'Identifying equipment geometry...';
      break;
    case 'generating':
      title = 'FORGING TEXTURES';
      description = 'Creating ghost mannequin sprites...';
      break;
    case 'splitting':
      title = 'CUTTING SPRITES';
      description = 'Slicing texture sheet boundaries...';
      break;
    case 'refining':
      title = 'POLISHING';
      description = 'Refining edges and normalizing...';
      break;
    case 'modifying':
      title = 'SYNTHESIZING';
      description = 'Equipping character with new gear...';
      break;
  }

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-md flex flex-col items-center justify-center z-50">
      <div className="bg-white p-8 rounded-2xl shadow-2xl border-4 border-stone-200 max-w-sm w-full text-center relative overflow-hidden">
        {/* Top Decoration */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400"></div>

        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 border-4 border-t-amber-500 border-r-stone-200 border-b-stone-200 border-l-stone-200 rounded-full animate-spin"></div>
          <div className="absolute inset-3 border-4 border-t-cyan-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin-reverse"></div>
        </div>
        
        <h2 className="text-xl font-black text-stone-800 mb-2 uppercase tracking-widest font-mono">
          {title}
        </h2>
        <p className="text-stone-500 text-sm font-medium">
          {description}
        </p>

        {total && total > 1 && (
          <div className="mt-6">
             <div className="flex justify-between text-xs font-bold text-stone-400 mb-1 uppercase">
                <span>Progress</span>
                <span>{current} / {total}</span>
             </div>
             <div className="h-2 bg-stone-100 rounded-full overflow-hidden border border-stone-200">
                <div 
                  className="h-full bg-cyan-500 transition-all duration-300"
                  style={{ width: `${(current! / total) * 100}%` }}
                ></div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};