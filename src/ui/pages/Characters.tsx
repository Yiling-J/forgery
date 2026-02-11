import { InferResponseType } from 'hono/client'
import { Hexagon, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { client } from '../client'
import { CreateCharacterDialog } from '../components/CreateCharacterDialog'
import { VibeCard } from '../components/VibeCard'
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
    return (
      <div className="p-8 text-slate-400 font-mono tracking-widest animate-pulse">
        INITIALIZING...
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen p-4 pt-2 flex flex-col font-sans text-slate-900 relative">
      <div className="mb-8 animate-fade-in-down flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 text-cyan-600 mb-2 tracking-[0.3em] text-xs font-mono uppercase">
            <Hexagon size={12} className="animate-spin-slow" />
            System // Character_List
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-black uppercase text-slate-900 tracking-tighter">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600">
              Characters
            </span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Create Character
          </Button>
        </div>
      </div>

      {characters.length === 0 ? (
        <div className="text-center p-12 bg-white clip-path-slant border border-slate-200">
          <p className="text-slate-500 font-mono">No characters found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6 max-w-[1920px] mx-auto w-full pb-10">
          {characters.map((char, index) => (
            <VibeCard
              key={char.id}
              index={index}
              name={char.name}
              // @ts-ignore
              subtitle={`${char.looksCount} LOOKS`}
              image={char.image?.path ? `/files/${char.image.path}` : ''}
              color={getCharacterColor(char.name)}
              onClick={() => navigate(`/characters/${char.id}/looks`)}
            />
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
