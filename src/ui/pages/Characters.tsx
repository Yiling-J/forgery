import { InferResponseType } from 'hono/client'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { client } from '../client'
import { CreateCharacterDialog } from '../components/CreateCharacterDialog'
import { PageHeader } from '../components/PageHeader'
import { VibeCard } from '../components/VibeCard'
import { Button } from '../components/ui/button'
import { useInfiniteScroll } from '../hooks/use-infinite-scroll'

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
  const [createOpen, setCreateOpen] = useState(false)
  const navigate = useNavigate()

  const { items, loading, ref, reset } = useInfiniteScroll<Character>({
    fetchData: async (page, limit) => {
      const res = await client.characters.$get({
        query: {
          page: page.toString(),
          limit: limit.toString(),
        },
      })
      if (res.ok) {
        const data = await res.json()
        return data.items
      }
      return []
    },
    limit: 20,
  })

  return (
    <div className="w-full h-full p-4 pt-2 flex flex-col text-slate-900 relative">
      <PageHeader
        title="Characters"
        subtitle="System // Character_List"
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Create Character
          </Button>
        }
        className="mb-8"
      />

      {items.length === 0 && !loading ? (
        <div className="text-center p-12 bg-white clip-path-slant border border-slate-200">
          <p className="text-slate-500 font-mono">No characters found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6 max-w-[1920px] mx-auto w-full pb-10">
          {items.map((char, index) => (
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

      {/* Loading Indicator */}
      <div ref={ref} className="h-10 w-full flex items-center justify-center p-4">
        {loading && (
          <div className="text-slate-400 font-mono tracking-widest animate-pulse">LOADING...</div>
        )}
      </div>

      <CreateCharacterDialog open={createOpen} onOpenChange={setCreateOpen} onSuccess={reset} />
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  )
}
