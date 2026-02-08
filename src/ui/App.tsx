import React, { useState } from 'react'
import { ExtractionStatus } from './types'
import { Extractor } from './components/Extractor'
import { Stash } from './components/Stash'
import { LoadingOverlay } from './components/LoadingOverlay'

export default function App() {
  const [view, setView] = useState<'extractor' | 'stash'>('extractor')
  const [status, setStatus] = useState<ExtractionStatus>('idle')
  const [statusMessage, setStatusMessage] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  const handleStatusChange = (newStatus: ExtractionStatus, message?: string) => {
    setStatus(newStatus)
    if (message) setStatusMessage(message)
  }

  interface NavButtonProps {
    target: 'extractor' | 'stash'
    label: string
    color: string
    icon: string
  }

  const NavButton = ({ target, label, color, icon }: NavButtonProps) => (
    <button
      onClick={() => setView(target)}
      className={`px-4 py-2 rounded-lg font-bold text-sm uppercase tracking-wider flex items-center gap-2 transition-all ${
        view === target
          ? `${color} text-white shadow-md transform -translate-y-0.5`
          : 'bg-white text-stone-500 hover:bg-stone-50'
      }`}
    >
      <span>{icon}</span> {label}
    </button>
  )

  return (
    <div className="min-h-screen text-stone-800 font-sans p-4 md:p-8">
      {/* Global Error */}
      {error && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-red-100 border-2 border-red-500 text-red-800 px-6 py-4 rounded-xl shadow-xl flex items-center gap-4 animate-fade-in-up">
          <span className="font-bold">{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-900 font-black"
          >
            X
          </button>
        </div>
      )}

      {/* Loading Overlay */}
      {status !== 'idle' && status !== 'complete' && status !== 'error' && (
        <LoadingOverlay status={status} current={50} total={100} />
        // Note: Progress is illustrative here unless we stream progress numbers from backend
      )}

      <header className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-stone-800 rounded-xl shadow-lg flex items-center justify-center text-amber-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-black text-stone-800 uppercase tracking-tighter">
              Forgery
            </h1>
            <p className="text-stone-400 text-xs font-bold tracking-[0.2em] uppercase">
              Digital Asset Synthesis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-stone-200/50 p-2 rounded-xl backdrop-blur-sm">
          <NavButton target="extractor" label="Extractor" color="bg-amber-500" icon="⛏" />
          <NavButton target="stash" label="Stash" color="bg-cyan-600" icon="❖" />
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        {view === 'extractor' && (
          <Extractor
            onStatusChange={handleStatusChange}
            onError={setError}
            onAssetsExtracted={() => {}}
            status={status}
            statusMessage={statusMessage}
          />
        )}
        {view === 'stash' && <Stash onNavigateToExtractor={() => setView('extractor')} />}
      </main>
    </div>
  )
}
