import { InferResponseType } from 'hono/client'
import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { client } from '../client'
import { CreateCharacterDialog } from '../components/CreateCharacterDialog'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { Button } from '../components/ui/button'

type CharacterResponse = InferResponseType<typeof client.characters.$get>
type Character = CharacterResponse['items'][number]

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
    <div className="p-8 animate-fade-in-up">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black text-stone-800 uppercase tracking-tighter">
          Characters
        </h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Create Character
        </Button>
      </div>

      {characters.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-xl border border-stone-200">
          <p className="text-stone-500">No characters found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {characters.map((char) => (
            <div
              key={char.id}
              className="border-transparent cursor-pointer"
              onClick={() => navigate(`/characters/${char.id}/looks`)}
            >
              <div className="flex flex-col items-center p-6 gap-4">
                <Avatar className="w-32 h-32 border-4 border-stone-100 shadow-inner">
                  <AvatarImage
                    src={char.image?.path ? `/files/${char.image.path}` : ''}
                    alt={char.name}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-3xl font-bold bg-stone-200 text-stone-400">
                    {char.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <h3 className="font-bold text-stone-800 text-lg leading-tight">{char.name}</h3>
                  {char.description && (
                    <p className="text-xs text-stone-400 mt-1 line-clamp-2">{char.description}</p>
                  )}
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
    </div>
  )
}
