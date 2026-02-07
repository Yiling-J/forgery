import React, { useState, useEffect } from 'react';
import { analyzeImageForAssets, generateTextureSheet, detectAssetBoundingBoxes, cropAssetsFromSheet, refineAssetImage } from '../services/geminiService';
import { AnalysisResponse, CroppedAsset, ExtractionStatus } from '../types';

interface ExtractorProps {
  onStatusChange: (status: ExtractionStatus, index?: number, total?: number) => void;
  onError: (msg: string | null) => void;
  onAssetsExtracted: (assets: CroppedAsset[]) => void;
  apiKeyValid: boolean;
  onConnectKey: () => void;
  onSaveToStash: (assets: CroppedAsset[]) => void;
}

export const Extractor: React.FC<ExtractorProps> = ({ 
  onStatusChange, 
  onError, 
  onAssetsExtracted, 
  apiKeyValid, 
  onConnectKey,
  onSaveToStash
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [results, setResults] = useState<CroppedAsset[]>([]);
  const [selectedSourceIdx, setSelectedSourceIdx] = useState<number | null>(null);

  // Handle Paste Events
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.items) {
        const items = e.clipboardData.items;
        const newFiles: File[] = [];
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf("image") !== -1) {
            const blob = items[i].getAsFile();
            if (blob) {
              newFiles.push(blob);
            }
          }
        }
        
        if (newFiles.length > 0) {
            addFiles(newFiles);
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, []); // Empty dependency array means this runs once on mount and cleans up on unmount

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(Array.from(e.target.files));
  };

  const addFiles = (newFiles: File[]) => {
    setFiles(prev => [...prev, ...newFiles]);
    setPreviews(prev => [...prev, ...newFiles.map(f => URL.createObjectURL(f))]);
    setResults([]); // Clear results on new upload
    onError(null);
  };

  const removeFile = (idx: number) => {
    const newFiles = [...files];
    const newPreviews = [...previews];
    URL.revokeObjectURL(newPreviews[idx]);
    newFiles.splice(idx, 1);
    newPreviews.splice(idx, 1);
    setFiles(newFiles);
    setPreviews(newPreviews);
  };

  const handleExtract = async () => {
    if (files.length === 0) return;
    if (!apiKeyValid) {
       onConnectKey();
       return;
    }

    setResults([]);
    onError(null);
    const allAssets: CroppedAsset[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        onStatusChange('analyzing', i + 1, files.length);
        
        // 1. Analyze
        let analysis: AnalysisResponse;
        try {
          analysis = await analyzeImageForAssets(files[i]);
        } catch (e) {
          console.error(`Analysis failed for ${files[i].name}`, e);
          continue;
        }

        if (analysis.assets.length === 0) continue;

        // 2. Generate Sheet
        onStatusChange('generating', i + 1, files.length);
        const sheetUrl = await generateTextureSheet(files[i], analysis.assets);

        // 3. Slice
        onStatusChange('splitting', i + 1, files.length);
        const base64 = sheetUrl.split(',')[1];
        const boxes = await detectAssetBoundingBoxes(base64);
        const cropped = await cropAssetsFromSheet(sheetUrl, boxes.assets);

        // 4. Refine
        onStatusChange('refining', i + 1, files.length);
        const refined = await Promise.all(cropped.map(async (a) => {
           try {
             const refinedUrl = await refineAssetImage(a.imageUrl);
             return { ...a, refinedImageUrl: refinedUrl, sourceIndex: i };
           } catch {
             return { ...a, sourceIndex: i };
           }
        }));

        allAssets.push(...refined);
      }
      
      setResults(allAssets);
      onAssetsExtracted(allAssets);
      onStatusChange('complete');
      if (allAssets.length > 0) setSelectedSourceIdx(0);

    } catch (e: any) {
       console.error(e);
       onError(e.message || "Extraction failed");
       onStatusChange('error');
    }
  };

  const handleReset = () => {
    setFiles([]);
    previews.forEach(p => URL.revokeObjectURL(p));
    setPreviews([]);
    setResults([]);
    onStatusChange('idle');
  };

  if (results.length > 0) {
     const filtered = selectedSourceIdx !== null 
        ? results.filter(r => r.sourceIndex === selectedSourceIdx) 
        : results;

     return (
        <div className="animate-fade-in-up space-y-8">
           {/* Source Selection Strip */}
           <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
              <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Source References</h3>
              <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                 {previews.map((src, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedSourceIdx(idx === selectedSourceIdx ? null : idx)}
                      className={`relative w-16 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${idx === selectedSourceIdx ? 'border-amber-500 shadow-md scale-105' : 'border-stone-200 opacity-60 hover:opacity-100'}`}
                    >
                       <img src={src} className="w-full h-full object-cover" />
                       {idx === selectedSourceIdx && <div className="absolute inset-0 bg-amber-500/10" />}
                    </button>
                 ))}
              </div>
           </div>

           {/* Results Grid */}
           <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-lg">
              <div className="flex justify-between items-center mb-6">
                 <div>
                    <h2 className="text-2xl font-black text-stone-800 flex items-center gap-2">
                       <span className="text-amber-500">✦</span> LOOT ACQUIRED
                    </h2>
                    <p className="text-stone-500 text-sm font-medium">{filtered.length} items found</p>
                 </div>
                 <div className="flex gap-3">
                    <button 
                      onClick={() => onSaveToStash(results)}
                      className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold uppercase tracking-wider rounded-lg shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2"
                    >
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                       Stash All
                    </button>
                    <button onClick={handleReset} className="px-5 py-2.5 text-stone-500 font-bold uppercase text-sm hover:bg-stone-100 rounded-lg transition-colors">
                       Reset
                    </button>
                 </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                 {filtered.map((item, i) => (
                    <div key={i} className="group relative bg-stone-50 rounded-lg border-2 border-stone-200 hover:border-amber-400 hover:shadow-lg transition-all duration-300">
                       <div className="aspect-square p-4 flex items-center justify-center relative overflow-hidden rounded-t-lg">
                          {/* Checkerboard bg */}
                          <div className="absolute inset-0 opacity-5" style={{backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '8px 8px'}}></div>
                          <img src={item.refinedImageUrl || item.imageUrl} className="max-w-full max-h-full object-contain drop-shadow-md group-hover:scale-110 transition-transform" />
                          
                          {/* Download Overlay */}
                          <a 
                             href={item.refinedImageUrl || item.imageUrl} 
                             download={`${item.item_name}.png`}
                             className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[1px]"
                          >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                          </a>
                       </div>
                       <div className="p-3 bg-white border-t border-stone-200 rounded-b-lg">
                          <div className="text-xs font-bold text-stone-700 truncate">{item.item_name}</div>
                          <div className="w-6 h-1 bg-amber-400 rounded-full mt-2"></div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
     );
  }

  // Initial State
  return (
    <div className="max-w-2xl mx-auto animate-fade-in-up">
       {files.length === 0 ? (
          <div className="border-4 border-dashed border-stone-300 bg-white rounded-3xl p-12 text-center hover:border-cyan-400 hover:bg-cyan-50/30 transition-all group">
             <div className="w-20 h-20 bg-cyan-100 text-cyan-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
             </div>
             <h2 className="text-2xl font-black text-stone-800 mb-2">UPLOAD SOURCES</h2>
             <p className="text-stone-500 mb-4 max-w-sm mx-auto">Drop character images to identify and extract equipment sprites.</p>
             <div className="inline-block bg-cyan-50 border border-cyan-100 text-cyan-700 text-xs font-mono py-1 px-3 rounded mb-8">
               Paste (Ctrl+V) Supported
             </div>
             <div className="block">
                <label className="inline-block cursor-pointer">
                    <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
                    <span className="px-8 py-4 bg-stone-900 text-white font-bold uppercase tracking-wider rounded-xl shadow-xl hover:bg-stone-800 transition-colors">Select Images</span>
                </label>
             </div>
          </div>
       ) : (
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 p-6">
             <div className="flex justify-between items-center mb-6 pb-6 border-b border-stone-100">
                <div>
                   <h3 className="font-bold text-stone-700 uppercase tracking-wider">Staging Area ({files.length})</h3>
                   <span className="text-[10px] text-stone-400 font-mono">Drag, Drop, or Paste more</span>
                </div>
                <label className="text-cyan-600 font-bold text-sm cursor-pointer hover:text-cyan-700 uppercase tracking-wide">
                   + Add More
                   <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
             </div>
             
             <div className="grid grid-cols-4 gap-4 mb-8">
                {previews.map((src, i) => (
                   <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-stone-200">
                      <img src={src} className="w-full h-full object-cover" />
                      <button onClick={() => removeFile(i)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                      </button>
                   </div>
                ))}
             </div>

             <button 
                onClick={handleExtract}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black uppercase tracking-widest text-lg rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
             >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Begin Extraction
             </button>
             <p className="text-center text-xs text-stone-400 mt-4 font-mono">POWERED BY GEMINI 2.5 FLASH</p>
          </div>
       )}
    </div>
  );
};