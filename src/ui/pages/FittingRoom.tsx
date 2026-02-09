import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { client } from '../client'
import { InferResponseType } from 'hono/client'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Plus, ArrowLeft } from 'lucide-react'
import { CreateOutfitDialog } from '../components/CreateOutfitDialog'
import { useNavigate } from 'react-router-dom'

// Types - Define locally to avoid complex type extraction if client inference is tricky
// But we should try to use inference
type CharacterResponse = InferResponseType<typeof client.characters[':id']['$get']>
type GenerationResponse = InferResponseType<typeof client.generations.$get>
type GenerationItem = GenerationResponse['items'][number]

export default function FittingRoom() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  // @ts-ignore - Response type might be union with error
  const [character, setCharacter] = useState<CharacterResponse | null>(null)
  const [generations, setGenerations] = useState<GenerationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)

  useEffect(() => {
    if (id) {
      fetchData(id)
    }
  }, [id])

  const fetchData = async (charId: string) => {
    setLoading(true)
    try {
      const [charRes, genRes] = await Promise.all([
        client.characters[':id'].$get({ param: { id: charId } }),
        client.generations.$get({ query: { characterId: charId, limit: '100' } })
      ])

      if (charRes.ok) {
        const data = await charRes.json()
        setCharacter(data)
      }
      if (genRes.ok) {
        const genData = await genRes.json()
        setGenerations(genData.items)
      }
    } catch (e) {
      console.error('Failed to load data', e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-stone-50">
        <div className="animate-pulse text-stone-400 font-medium">Loading Fitting Room...</div>
      </div>
    )
  }

  if (!character || 'error' in character) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-stone-50 gap-4">
        <h2 className="text-2xl font-bold text-stone-800">Character Not Found</h2>
        <Button onClick={() => navigate('/characters')}>Return to Characters</Button>
      </div>
    )
  }

  return (
    <div className="p-8 animate-fade-in-up h-screen flex flex-col overflow-hidden bg-stone-50/30">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/characters')} className="rounded-full hover:bg-stone-200">
            <ArrowLeft className="w-5 h-5 text-stone-600" />
          </Button>
          <div>
            <h1 className="text-3xl font-black text-stone-800 uppercase tracking-tighter">
              Fitting Room
            </h1>
            <p className="text-stone-500 text-sm font-medium flex items-center gap-2">
              Manage outfits for <span className="text-stone-900 font-bold bg-stone-200 px-2 py-0.5 rounded text-xs uppercase">{character.name}</span>
            </p>
          </div>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="bg-stone-900 hover:bg-stone-800 text-white shadow-lg hover:shadow-xl transition-all">
          <Plus className="mr-2 h-4 w-4" /> Create New Outfit
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 gap-6 overflow-hidden pb-4">
        {/* Left: Character Preview */}
        <div className="w-full lg:w-1/3 flex flex-col gap-4 shrink-0 h-full">
          <Card className="flex-1 border-stone-200 overflow-hidden bg-white flex items-center justify-center relative shadow-sm rounded-2xl p-8">
             <div className="absolute inset-0 opacity-5 pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(#000 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }}
              ></div>
             <img
               src={character.image?.path ? `/files/${character.image.path}` : ''}
               alt={character.name}
               className="w-full h-full object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500"
             />
             <div className="absolute bottom-4 left-4 right-4 bg-white/80 backdrop-blur-md p-4 rounded-xl border border-white/50 shadow-sm">
                <h3 className="font-bold text-stone-800 text-lg">{character.name}</h3>
                <p className="text-xs text-stone-500 mt-1 line-clamp-2">{character.description || 'No description provided.'}</p>
             </div>
          </Card>
        </div>

        {/* Right: Generations Grid */}
        <div className="flex-1 flex flex-col bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden h-full">
           <div className="p-4 border-b border-stone-100 bg-stone-50/50 flex justify-between items-center shrink-0">
             <h3 className="font-bold text-stone-700 uppercase tracking-wider text-xs flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-green-500"></span>
               Generated Outfits
             </h3>
             <span className="text-xs font-mono text-stone-400">{generations.length} OUTFITS</span>
           </div>

           <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
             {generations.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-stone-400 gap-4">
                  <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center">
                    <Plus className="w-8 h-8 text-stone-300" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-stone-600">No outfits generated yet.</p>
                    <p className="text-xs mt-1">Create your first outfit to get started.</p>
                  </div>
                  <Button variant="outline" onClick={() => setCreateOpen(true)}>Create Outfit</Button>
                </div>
             ) : (
               <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                 {generations.map(gen => (
                   <div key={gen.id} className="group relative aspect-[3/4] bg-stone-100 rounded-xl overflow-hidden border border-stone-200 hover:border-stone-900 hover:shadow-xl transition-all cursor-pointer">
                      <img
                        src={gen.image?.path ? `/files/${gen.image.path}` : ''}
                        alt="Generation"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                        <p className="text-white text-xs font-bold mb-2">
                           {new Date(gen.createdAt).toLocaleDateString()}
                        </p>
                         <div className="flex gap-1 flex-wrap content-start h-12 overflow-hidden">
                           {/* @ts-ignore - equipment structure might vary based on include */}
                           {gen.equipments?.slice(0, 3).map((eq: any) => (
                             <span key={eq.equipmentId} className="text-[10px] bg-white/20 text-white px-2 py-1 rounded-md backdrop-blur-md border border-white/10">
                               {eq.equipment.name}
                             </span>
                           ))}
                           {/* @ts-ignore */}
                           {gen.equipments && gen.equipments.length > 3 && (
                             <span className="text-[10px] bg-white/20 text-white px-2 py-1 rounded-md backdrop-blur-md border border-white/10">
                               +{gen.equipments.length - 3}
                             </span>
                           )}
                         </div>
                      </div>
                   </div>
                 ))}
               </div>
             )}
           </div>
        </div>
      </div>

      <CreateOutfitDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        characterId={id || ''}
        onSuccess={() => id && fetchData(id)}
      />
    </div>
  )
}
