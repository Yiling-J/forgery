import { InferResponseType } from 'hono/client'
import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { client } from '../client'
import { CreateCharacterDialog } from '../components/CreateCharacterDialog'
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog'
import { PageHeader } from '../components/PageHeader'
import { VibeCard } from '../components/VibeCard'
import { Button } from '../components/ui/button'
import { useInfiniteScroll } from '../hooks/use-infinite-scroll'
import { useCategory } from '../hooks/use-category'

// Use Data API response type now
type DataItem = InferResponseType<typeof client.data.$post>

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
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const navigate = useNavigate()
  const { projectId } = useParams()

  // Use generic Data hook but filtering by 'Character' category
  // Destructure dataRef to attach to loading element
  const { category, dataItems: items, loadingData: loading, resetData, dataRef } = useCategory(projectId, 'Character')

  return (
    <div className="w-full h-full px-4 flex flex-col text-slate-900 relative">
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
              subtitle={char.description || 'Character'}
              image={char.image?.path ? `/files/${char.image.path}` : ''}
              color={getCharacterColor(char.name)}
              onClick={() => navigate(`/data/${char.id}`)}
              actions={[
                {
                  name: 'Delete',
                  onClick: () => setDeleteId(char.id),
                  variant: 'destructive',
                  icon: <Trash2 className="w-4 h-4" />,
                },
              ]}
            />
          ))}
        </div>
      )}

      {/* Loading Indicator with Ref attached */}
      <div ref={dataRef} className="h-10 w-full flex items-center justify-center p-4">
        {loading && (
          <div className="text-slate-400 font-mono tracking-widest animate-pulse">LOADING...</div>
        )}
      </div>

      <CreateCharacterDialog open={createOpen} onOpenChange={setCreateOpen} onSuccess={resetData} />
      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Character"
        description="Are you sure you want to delete this character? This action cannot be undone and will delete all associated looks and files."
        onConfirm={async () => {
          if (!deleteId) return
          try {
            const res = await client.data[':id'].$delete({ param: { id: deleteId } })
            if (res.ok) {
              toast.success('Character deleted')
              resetData()
            } else {
              toast.error('Failed to delete character')
            }
          } catch (e) {
            console.error(e)
            toast.error('Failed to delete character')
          }
        }}
      />
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  )
}
