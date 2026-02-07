import React from 'react';
import { Asset, HEX_COLORS } from '../types';

interface AssetListProps {
  assets: Asset[];
  onConfirm: () => void;
  onCancel: () => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
}

export const AssetList: React.FC<AssetListProps> = ({ assets, onConfirm, onCancel, selectedModel, onModelChange }) => {
  return (
    <div className="bg-slate-800 rounded-xl p-6 shadow-2xl border border-slate-700 max-w-4xl mx-auto w-full animate-fade-in-up">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Identified Assets</h2>
          <p className="text-slate-400 mt-1">Review the items detected for extraction.</p>
        </div>
        <span className="bg-cyan-900/50 text-cyan-300 px-3 py-1 rounded-full text-sm font-medium border border-cyan-700/50">
          {assets.length} Items Found
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {assets.map((asset, idx) => (
          <div key={idx} className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors flex gap-4">
            <div 
              className="w-12 h-12 rounded-full flex-shrink-0 shadow-inner"
              style={{ backgroundColor: HEX_COLORS[asset.background_color] || asset.background_color }}
              title={`Background: ${asset.background_color}`}
            />
            <div>
              <h3 className="font-semibold text-slate-100">{asset.item_name}</h3>
              <p className="text-sm text-slate-400 mt-1 leading-relaxed">{asset.description}</p>
              <div className="mt-2 text-xs font-mono text-slate-500">
                Target Key: {asset.background_color}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Model Selection */}
      <div className="mb-6 bg-slate-900/30 p-4 rounded-lg border border-slate-700/50">
        <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">Extraction Model</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className={`relative p-3 rounded-lg border cursor-pointer transition-all ${selectedModel === 'gemini-3-pro-image-preview' ? 'bg-cyan-900/20 border-cyan-500/70 shadow-[0_0_15px_-3px_rgba(6,182,212,0.3)]' : 'bg-slate-800 border-slate-700 hover:border-slate-600'}`}>
             <div className="flex items-center gap-3 mb-1">
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedModel === 'gemini-3-pro-image-preview' ? 'border-cyan-500' : 'border-slate-500'}`}>
                   {selectedModel === 'gemini-3-pro-image-preview' && <div className="w-2 h-2 rounded-full bg-cyan-500" />}
                </div>
                <input type="radio" name="model" value="gemini-3-pro-image-preview" checked={selectedModel === 'gemini-3-pro-image-preview'} onChange={(e) => onModelChange(e.target.value)} className="hidden" />
                <span className={`font-bold ${selectedModel === 'gemini-3-pro-image-preview' ? 'text-cyan-400' : 'text-slate-300'}`}>Gemini 3 Pro</span>
                <span className="text-[10px] font-bold bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded ml-auto">RECOMMENDED</span>
             </div>
             <p className="text-xs text-slate-400 pl-7">Best quality, 2K resolution support, precise geometry.</p>
          </label>

          <label className={`relative p-3 rounded-lg border cursor-pointer transition-all ${selectedModel === 'gemini-2.5-flash-image' ? 'bg-amber-900/20 border-amber-500/70 shadow-[0_0_15px_-3px_rgba(245,158,11,0.3)]' : 'bg-slate-800 border-slate-700 hover:border-slate-600'}`}>
             <div className="flex items-center gap-3 mb-1">
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedModel === 'gemini-2.5-flash-image' ? 'border-amber-500' : 'border-slate-500'}`}>
                   {selectedModel === 'gemini-2.5-flash-image' && <div className="w-2 h-2 rounded-full bg-amber-500" />}
                </div>
                <input type="radio" name="model" value="gemini-2.5-flash-image" checked={selectedModel === 'gemini-2.5-flash-image'} onChange={(e) => onModelChange(e.target.value)} className="hidden" />
                <span className={`font-bold ${selectedModel === 'gemini-2.5-flash-image' ? 'text-amber-400' : 'text-slate-300'}`}>Gemini 2.5 Flash</span>
             </div>
             <p className="text-xs text-slate-400 pl-7">Fast generation, standard resolution, experimental for extraction.</p>
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
        <button 
          onClick={onCancel}
          className="px-6 py-2 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-colors font-medium"
        >
          Discard
        </button>
        <button 
          onClick={onConfirm}
          className="px-6 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold shadow-lg shadow-cyan-900/20 transform hover:-translate-y-0.5 transition-all"
        >
          Generate Texture Sheet
        </button>
      </div>
    </div>
  );
};