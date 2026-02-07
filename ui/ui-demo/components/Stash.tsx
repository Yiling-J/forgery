import React from 'react';
import { StashItem } from '../types';

interface StashProps {
  items: StashItem[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onNavigateToExtractor: () => void;
}

export const Stash: React.FC<StashProps> = ({ items, onRemove, onClear, onNavigateToExtractor }) => {
  return (
    <div className="animate-fade-in-up">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-black text-stone-800 flex items-center gap-3">
             <span className="text-cyan-500">❖</span> INVENTORY
          </h2>
          <p className="text-stone-500 font-medium">Manage your collection of extracted assets.</p>
        </div>
        {items.length > 0 && (
           <button 
             onClick={onClear}
             className="text-red-500 hover:text-red-700 font-bold uppercase text-xs tracking-wider border border-red-200 px-3 py-1.5 rounded bg-red-50 hover:bg-red-100 transition-colors"
           >
             Clear All
           </button>
        )}
      </div>

      {items.length === 0 ? (
         <div className="bg-white rounded-2xl p-16 text-center border-4 border-dashed border-stone-200">
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4 text-stone-400">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
            </div>
            <h3 className="text-xl font-bold text-stone-700">Inventory Empty</h3>
            <p className="text-stone-400 mt-2 mb-6">Extract assets to populate your stash.</p>
            <button onClick={onNavigateToExtractor} className="text-cyan-600 font-bold uppercase hover:underline text-sm">Go to Extractor</button>
         </div>
      ) : (
         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {items.map((item) => (
               <div key={item.id} className="group relative bg-white rounded-lg border-2 border-stone-200 shadow-sm hover:border-cyan-400 hover:shadow-lg transition-all duration-300">
                  <div className="aspect-square p-3 flex items-center justify-center relative bg-stone-50 rounded-t-md overflow-hidden">
                     <div className="absolute inset-0 opacity-5" style={{backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '8px 8px'}}></div>
                     <img src={item.imageUrl} className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform" />
                     
                     <div className="absolute inset-0 bg-stone-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2 items-center justify-center p-2 backdrop-blur-[1px]">
                        <a 
                           href={item.imageUrl} 
                           download={`${item.item_name}.png`}
                           className="w-full py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[10px] font-bold uppercase tracking-widest text-center shadow-md"
                        >
                           Download
                        </a>
                        <button 
                           onClick={() => onRemove(item.id)}
                           className="w-full py-1.5 bg-red-500 hover:bg-red-400 text-white rounded text-[10px] font-bold uppercase tracking-widest text-center shadow-md"
                        >
                           Discard
                        </button>
                     </div>
                  </div>
                  <div className="p-3 border-t border-stone-100">
                     <h3 className="text-xs font-bold text-stone-700 truncate" title={item.item_name}>{item.item_name}</h3>
                     <p className="text-[10px] text-stone-400 mt-1">{new Date(item.createdAt).toLocaleDateString()}</p>
                  </div>
               </div>
            ))}
         </div>
      )}
    </div>
  );
};