import { InferResponseType } from 'hono/client'
import { Hexagon, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { client } from '../client'
import { CreateCharacterDialog } from '../components/CreateCharacterDialog'
import { Button } from '../components/ui/button'

type CharacterResponse = InferResponseType<typeof client.characters.$get>
type Character = CharacterResponse['items'][number]

const getCharacterColor = (name: string) => {
  const colors = [
    '#ef4444', // Red
    '#f97316', // Orange
    '#f59e0b', // Amber
    '#22c55e', // Green
    '#3b82f6', // Blue
    '#a855f7', // Purple
  ]
  const charCode = name.charCodeAt(0) || 0
  return colors[charCode % colors.length]
}

export default function Characters() {
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchCharacters()
  }, [])

  const fetchCharacters = async () => {
    try {
      const res = await client.characters.$get({
        query: {
          limit: '100',
        },
      })
      if (res.ok) {
        const data = await res.json()
        setCharacters(data.items)
      }
    } catch (e) {
      console.error('Failed to load characters', e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-stone-500">Loading Characters...</div>
  }

  return (
    <div className="w-full min-h-screen p-4 md:p-8 flex flex-col font-sans text-slate-900 relative">
      <div className="mb-8 animate-fade-in-down flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 text-cyan-600 mb-2 tracking-[0.3em] text-xs font-mono uppercase">
            <Hexagon size={12} className="animate-spin-slow" />
            System // Character_Select
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-black uppercase text-slate-900 tracking-tighter">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600">
              Characters
            </span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-slate-400 text-sm hidden sm:block">
            COUNT: {characters.length}
          </span>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Create Character
          </Button>
        </div>
      </div>

      {characters.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-xl border border-stone-200">
          <p className="text-stone-500">No characters found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6 max-w-[1920px] mx-auto w-full pb-10">
          {characters.map((char, index) => (
            <div
              key={char.id}
              onClick={() => navigate(`/characters/${char.id}/looks`)}
              className="group relative h-64 cursor-pointer"
              style={{
                animation: `fadeIn 0.5s ease-out ${Math.min(index * 0.03, 0.5)}s backwards`,
              }}
            >
              {/* Wrapper for the Drop Shadow (Outer Glow) */}
              <div className={`absolute inset-0`}>
                {/* 1. Base Border (Static Slate - Always visible as the thin border) */}
                <div className="absolute inset-0 bg-slate-200 clip-path-slant" />

                {/* 2. Highlight Border (Blue - Fades in on hover, pre-scaled to avoid growth animation) */}
                {/* Scale 1.035 is approx 70% of the previous 1.05 scale. */}
                <div className="absolute inset-0 bg-blue-500 clip-path-slant opacity-0 group-hover:opacity-100 transition-opacity duration-0 scale-[1.035]" />

                {/* 3. Content Layer - Stays fixed size relative to parent, creating the cutout effect */}
                <div className="absolute inset-[1px] bg-slate-100 clip-path-slant overflow-hidden z-10">
                  <div className="absolute inset-0 bg-slate-100">
                    <img
                      src={char.image?.path ? `/files/${char.image.path}` : ''}
                      alt={char.name}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 grayscale group-hover:grayscale-0 opacity-80 group-hover:opacity-100 mix-blend-multiply"
                    />
                    {/* Gradient overlay for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent opacity-90 group-hover:opacity-80 transition-opacity duration-300" />
                  </div>

                  <div className="absolute inset-0 p-3 flex flex-col justify-end">
                    <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-200">
                      <div
                        className="h-0.5 w-6 mb-2 transition-all duration-300 group-hover:w-12"
                        style={{ backgroundColor: getCharacterColor(char.name) }}
                      />
                      <h2 className="text-lg font-display font-bold uppercase text-white mb-0.5 tracking-wider truncate drop-shadow-sm">
                        {char.name}
                      </h2>
                      <span className="text-[10px] font-mono text-slate-200 uppercase tracking-widest block font-semibold">
                        {/* @ts-ignore */}
                        {char.looksCount} LOOKS
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateCharacterDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={fetchCharacters}
      />
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  )
}
