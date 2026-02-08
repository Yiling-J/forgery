import React, { useState, useEffect } from 'react'
import { client } from '../client'
import { InferResponseType } from 'hono/client'

type EquipmentResponse = InferResponseType<typeof client.equipments.$get>
type StashItem = EquipmentResponse['items'][number]

interface StashProps {
  onNavigateToExtractor: () => void
}

export const Stash: React.FC<StashProps> = ({ onNavigateToExtractor }) => {
  const [items, setItems] = useState<StashItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    try {
      // Using Hono RPC client
      const res = await client.equipments.$get({
        query: {
          limit: '100',
        },
      })
      if (res.ok) {
        const data = await res.json()
        setItems(data.items)
      }
    } catch (e) {
      console.error('Failed to load stash', e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center p-12 text-stone-500">Loading Stash...</div>
  }

  if (items.length === 0) {
    return (
      <div className="text-center p-12 animate-fade-in-up">
        <div className="w-24 h-24 bg-stone-200 rounded-full flex items-center justify-center mx-auto mb-6 text-stone-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
        <h2 className="text-xl font-black text-stone-700 uppercase tracking-wide mb-2">
          Empty Stash
        </h2>
        <p className="text-stone-500 mb-8 max-w-md mx-auto">
          Your inventory is empty. Use the Extractor to loot equipment from character images.
        </p>
        <button
          onClick={onNavigateToExtractor}
          className="px-6 py-3 bg-stone-800 text-white font-bold uppercase tracking-wider rounded-lg shadow-lg hover:bg-stone-700 transition-colors"
        >
          Go to Extractor
        </button>
      </div>
    )
  }

  return (
    <div className="animate-fade-in-up">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black text-stone-800 uppercase tracking-tighter">
            Your Stash
          </h2>
          <p className="text-stone-500 text-xs font-bold tracking-[0.2em] uppercase">
            {items.length} Items Collected
          </p>
        </div>
        <button onClick={fetchItems} className="text-stone-400 hover:text-stone-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="group relative bg-white rounded-xl border border-stone-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
          >
            <div className="aspect-square bg-stone-50 p-4 flex items-center justify-center relative">
              <div
                className="absolute inset-0 opacity-5"
                style={{
                  backgroundImage: 'radial-gradient(#000 1px, transparent 1px)',
                  backgroundSize: '8px 8px',
                }}
              ></div>
              <img
                src={item.image?.path ? `/files/${item.image.path}` : ''}
                className="max-w-full max-h-full object-contain drop-shadow-sm group-hover:scale-110 transition-transform"
              />
            </div>
            <div className="p-3">
              <div className="flex justify-between items-start mb-1">
                <h3 className="text-sm font-bold text-stone-800 leading-tight truncate pr-2">
                  {item.name}
                </h3>
              </div>
              <p className="text-[10px] text-stone-400 font-mono uppercase tracking-wider truncate">
                {item.category || 'Unknown'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
