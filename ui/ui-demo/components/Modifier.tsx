import React, { useState } from 'react';
import { generateModifiedCharacter } from '../services/geminiService';
import { StashItem, ExtractionStatus } from '../types';

interface ModifierProps {
  stash: StashItem[];
  onStatusChange: (status: ExtractionStatus) => void;
  onError: (msg: string | null) => void;
  apiKeyValid: boolean;
  onConnectKey: () => void;
  onNavigateToExtractor: () => void;
}

export const Modifier: React.FC<ModifierProps> = ({ 
  stash, 
  onStatusChange, 
  onError, 
  apiKeyValid, 
  onConnectKey, 
  onNavigateToExtractor 
}) => {
  const [baseFile, setBaseFile] = useState<File | null>(null);
  const [basePreview, setBasePreview] = useState<string | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3-pro-image-preview');

  const handleBaseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setBaseFile(f);
      setBasePreview(URL.createObjectURL(f));
      setResultUrl(null);
      onError(null);
    }
  };

  const toggleItem = (id: string) => {
    const next = new Set(selectedItemIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedItemIds(next);
  };

  const handleForge = async () => {
    if (!baseFile || selectedItemIds.size === 0) return;
    if (!apiKeyValid) {
        onConnectKey();
        return;
    }

    onStatusChange('modifying');
    setResultUrl(null);
    onError(null);

    try {
        const items = stash.filter(i => selectedItemIds.has(i.id));
        const url = await generateModifiedCharacter(baseFile, items, selectedModel);
        setResultUrl(url);
        onStatusChange('idle');
    } catch (e: any) {
        console.error(e);
        onError(e.message || "Modification failed");
        onStatusChange('error');
    }
  };

  return (
    <div className="animate-fade-in-up pb-20">
      <div className="mb-8">
         <h2 className="text-3xl font-black text-stone-800 flex items-center gap-3">
             <span className="text-purple-600">⚒</span> SMITHY
         </h2>
         <p className="text-stone-500 font-medium">Equip your characters with extracted assets.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* LEFT: Base Character */}
         <div className="bg-white rounded-xl border border-stone-200 shadow-lg p-5 flex flex-col h-fit">
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">Base Character</h3>
            
            <div className="aspect-[3/4] bg-stone-100 rounded-lg border-2 border-dashed border-stone-300 overflow-hidden relative flex flex-col items-center justify-center hover:border-purple-400 transition-colors">
               {basePreview ? (
                   <>
                     <img src={basePreview} className="w-full h-full object-contain" />
                     <button 
                       onClick={() => { setBaseFile(null); setBasePreview(null); }}
                       className="absolute top-2 right-2 bg-white/90 text-stone-600 hover:text-red-500 p-1 rounded-full shadow-sm"
                     >
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                     </button>
                   </>
               ) : (
                   <label className="cursor-pointer flex flex-col items-center p-6 text-center w-full h-full justify-center">
                       <input type="file" accept="image/*" onChange={handleBaseChange} className="hidden" />
                       <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                       </div>
                       <span className="text-sm font-bold text-stone-600 uppercase">Upload Character</span>
                   </label>
               )}
            </div>

            {/* Model Selector */}
            <div className="mt-6 bg-stone-50 p-4 rounded-lg border border-stone-200">
                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Forge Model</h3>
                <div className="space-y-2">
                    <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedModel === 'gemini-3-pro-image-preview' ? 'bg-white border-purple-500 shadow-sm' : 'border-stone-200 hover:bg-white'}`}>
                        <input type="radio" name="model" value="gemini-3-pro-image-preview" checked={selectedModel === 'gemini-3-pro-image-preview'} onChange={(e) => setSelectedModel(e.target.value)} className="w-4 h-4 text-purple-600 accent-purple-600" />
                        <div>
                            <div className="font-bold text-sm text-stone-800 flex items-center gap-2">
                                Banana Pro 
                                <span className="text-[10px] bg-purple-100 text-purple-600 px-1.5 rounded">High Quality</span>
                            </div>
                            <div className="text-[10px] text-stone-500">2K Resolution, Better coherence</div>
                        </div>
                    </label>
                    <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedModel === 'gemini-2.5-flash-image' ? 'bg-white border-amber-500 shadow-sm' : 'border-stone-200 hover:bg-white'}`}>
                        <input type="radio" name="model" value="gemini-2.5-flash-image" checked={selectedModel === 'gemini-2.5-flash-image'} onChange={(e) => setSelectedModel(e.target.value)} className="w-4 h-4 text-amber-600 accent-amber-600" />
                        <div>
                            <div className="font-bold text-sm text-stone-800">Banana Flash</div>
                            <div className="text-[10px] text-stone-500">Faster, Standard Resolution</div>
                        </div>
                    </label>
                </div>
            </div>
         </div>

         {/* CENTER: Stash Selector */}
         <div className="lg:col-span-2 flex flex-col h-[650px] bg-white rounded-xl border border-stone-200 shadow-lg overflow-hidden">
             <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                 <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest">Available Equipment</h3>
                 <span className="text-xs font-bold bg-stone-200 text-stone-600 px-2 py-0.5 rounded-full">{selectedItemIds.size} Selected</span>
             </div>

             <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-stone-50/30">
                 {stash.length === 0 ? (
                     <div className="h-full flex flex-col items-center justify-center text-stone-400">
                         <p>No equipment in stash.</p>
                         <button onClick={onNavigateToExtractor} className="text-cyan-600 text-sm font-bold uppercase mt-2 hover:underline">Go to Extractor</button>
                     </div>
                 ) : (
                     <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                         {stash.map(item => {
                             const isSelected = selectedItemIds.has(item.id);
                             return (
                                 <div 
                                    key={item.id}
                                    onClick={() => toggleItem(item.id)}
                                    className={`cursor-pointer rounded-lg border-2 p-2 transition-all hover:shadow-md ${isSelected ? 'border-purple-500 bg-purple-50' : 'border-stone-200 bg-white hover:border-stone-300'}`}
                                 >
                                     <div className="aspect-square bg-stone-100 rounded overflow-hidden mb-2">
                                         <img src={item.imageUrl} className="w-full h-full object-contain" />
                                     </div>
                                     <p className={`text-[10px] font-bold truncate text-center ${isSelected ? 'text-purple-700' : 'text-stone-500'}`}>{item.item_name}</p>
                                 </div>
                             )
                         })}
                     </div>
                 )}
             </div>

             <div className="p-4 border-t border-stone-200 bg-white flex justify-end">
                 <button 
                    onClick={handleForge}
                    disabled={!baseFile || selectedItemIds.size === 0}
                    className={`px-8 py-3 rounded-lg font-bold uppercase tracking-wider shadow-lg flex items-center gap-2 transition-all ${
                        !baseFile || selectedItemIds.size === 0 
                        ? 'bg-stone-200 text-stone-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white hover:-translate-y-1'
                    }`}
                 >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
                     Forge
                 </button>
             </div>
         </div>
      </div>

      {/* RESULT */}
      {resultUrl && (
          <div className="mt-12 text-center animate-fade-in-up">
              <h2 className="text-2xl font-black text-stone-800 mb-6 uppercase">Masterpiece Created</h2>
              <div className="inline-block p-4 bg-white rounded-2xl shadow-2xl border-2 border-purple-200 relative group">
                  <img src={resultUrl} className="max-w-md w-full rounded-lg" />
                  <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                      <a href={resultUrl} download="forged_character.png" className="bg-purple-600 text-white px-6 py-3 rounded-lg font-bold uppercase tracking-wider shadow-xl hover:scale-105 transition-transform flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                          Download
                      </a>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};