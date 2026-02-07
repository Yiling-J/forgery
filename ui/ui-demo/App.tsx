import React, { useState, useEffect } from 'react';
import { ExtractionStatus, StashItem, CroppedAsset } from './types';
import { LoadingOverlay } from './components/LoadingOverlay';
import { Extractor } from './components/Extractor';
import { Stash } from './components/Stash';
import { Modifier } from './components/Modifier';

export default function App() {
  const [view, setView] = useState<'extractor' | 'stash' | 'modifier'>('extractor');
  const [status, setStatus] = useState<ExtractionStatus>('idle');
  const [loadingCurrent, setLoadingCurrent] = useState(0);
  const [loadingTotal, setLoadingTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [stash, setStash] = useState<StashItem[]>([]);
  const [apiKeySelected, setApiKeySelected] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    checkApiKey();
    loadStash();
  }, []);

  const checkApiKey = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio?.hasSelectedApiKey) {
      const hasKey = await aistudio.hasSelectedApiKey();
      setApiKeySelected(hasKey);
    } else {
      setApiKeySelected(true); 
    }
  };

  const handleSelectKey = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio?.openSelectKey) {
      await aistudio.openSelectKey();
      setApiKeySelected(true);
    }
  };

  const loadStash = () => {
    try {
      // Changed key to reflect new app name
      const saved = localStorage.getItem('forgery_stash');
      if (saved) setStash(JSON.parse(saved));
    } catch (e) {
      console.error("Failed to load stash", e);
    }
  };

  const saveStash = (items: StashItem[]) => {
    setStash(items);
    localStorage.setItem('forgery_stash', JSON.stringify(items));
  };

  const handleAddToStash = (assets: CroppedAsset[]) => {
    const newItems: StashItem[] = assets.map(asset => ({
      id: Math.random().toString(36).substr(2, 9),
      item_name: asset.item_name,
      imageUrl: asset.refinedImageUrl || asset.imageUrl,
      createdAt: Date.now()
    }));
    saveStash([...newItems, ...stash]);
    showNotification("Loot successfully stashed!");
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleStatusChange = (newStatus: ExtractionStatus, current?: number, total?: number) => {
    setStatus(newStatus);
    if (current !== undefined) setLoadingCurrent(current);
    if (total !== undefined) setLoadingTotal(total);
  };

  const NavButton = ({ target, label, color, icon }: any) => (
    <button
      onClick={() => setView(target)}
      className={`px-4 py-2 rounded-lg font-bold text-sm uppercase tracking-wider flex items-center gap-2 transition-all ${
        view === target 
          ? `${color} text-white shadow-md transform -translate-y-0.5` 
          : 'bg-white text-stone-500 hover:bg-stone-50'
      }`}
    >
      <span>{icon}</span> {label}
      {target === 'stash' && stash.length > 0 && (
         <span className="bg-stone-800 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">{stash.length}</span>
      )}
    </button>
  );

  return (
    <div className="min-h-screen text-stone-800 font-sans p-4 md:p-8">
      {/* Notifications */}
      {notification && (
         <div className="fixed bottom-8 right-8 z-50 bg-stone-800 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in-up border border-stone-700">
             <div className="bg-green-500 rounded-full p-1"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>
             <span className="font-bold tracking-wide">{notification}</span>
         </div>
      )}

      {/* Global Error */}
      {error && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-red-100 border-2 border-red-500 text-red-800 px-6 py-4 rounded-xl shadow-xl flex items-center gap-4 animate-fade-in-up">
           <span className="font-bold">{error}</span>
           <button onClick={() => setError(null)} className="text-red-500 hover:text-red-900 font-black">X</button>
        </div>
      )}

      {/* Loading */}
      {(status !== 'idle' && status !== 'complete' && status !== 'error') && (
        <LoadingOverlay status={status} current={loadingCurrent} total={loadingTotal} />
      )}

      <header className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row justify-between items-center gap-6">
         <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-stone-800 rounded-xl shadow-lg flex items-center justify-center text-amber-500">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </div>
            <div>
               <h1 className="text-3xl font-black text-stone-800 uppercase tracking-tighter">Forgery</h1>
               <p className="text-stone-400 text-xs font-bold tracking-[0.2em] uppercase">Digital Asset Synthesis</p>
            </div>
         </div>

         <div className="flex items-center gap-4 bg-stone-200/50 p-2 rounded-xl backdrop-blur-sm">
            <NavButton target="extractor" label="Extractor" color="bg-amber-500" icon="⛏" />
            <NavButton target="stash" label="Stash" color="bg-cyan-600" icon="❖" />
            <NavButton target="modifier" label="Smithy" color="bg-purple-600" icon="⚒" />
            
            {!apiKeySelected && (window as any).aistudio && (
               <button onClick={handleSelectKey} className="ml-2 px-3 py-1 bg-red-500 text-white text-xs font-bold rounded hover:bg-red-600 uppercase tracking-wide">
                  Key Required
               </button>
            )}
         </div>
      </header>

      <main className="max-w-7xl mx-auto">
         {view === 'extractor' && (
            <Extractor 
               onStatusChange={handleStatusChange}
               onError={setError}
               onAssetsExtracted={() => {}}
               apiKeyValid={apiKeySelected}
               onConnectKey={handleSelectKey}
               onSaveToStash={handleAddToStash}
            />
         )}
         {view === 'stash' && (
            <Stash 
               items={stash}
               onRemove={(id) => saveStash(stash.filter(i => i.id !== id))}
               onClear={() => saveStash([])}
               onNavigateToExtractor={() => setView('extractor')}
            />
         )}
         {view === 'modifier' && (
            <Modifier 
               stash={stash}
               onStatusChange={handleStatusChange}
               onError={setError}
               apiKeyValid={apiKeySelected}
               onConnectKey={handleSelectKey}
               onNavigateToExtractor={() => setView('extractor')}
            />
         )}
      </main>
    </div>
  );
}