import { InferResponseType } from 'hono/client'
import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { client } from '../client'
import { CreatePoseDialog } from '../components/CreatePoseDialog'
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog'
import { PageHeader } from '../components/PageHeader'
import { VibeCard } from '../components/VibeCard'
import { Button } from '../components/ui/button'
import { useInfiniteScroll } from '../hooks/use-infinite-scroll'

type PoseResponse = InferResponseType<typeof client.poses.$get>
type PoseItem = PoseResponse[number]

export default function Poses() {
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const {
    items: poses,
    loading,
    ref,
    reset,
    setItems: setPoses,
  } = useInfiniteScroll<PoseItem>({
    fetchData: async (page, limit) => {
      const res = await client.poses.$get({
        query: {
          page: page.toString(),
          limit: limit.toString(),
        },
      })
      if (res.ok) {
        return await res.json()
      }
      return []
    },
    limit: 20,
  })

  return (
    <div className="w-full h-full px-4 flex flex-col text-slate-900 relative">
      <PageHeader
        title="Poses"
        subtitle="System // Pose_Library"
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Pose
          </Button>
        }
        className="mb-8"
      />

      {poses.length === 0 && !loading ? (
        <div className="text-center p-12 bg-white clip-path-slant border border-slate-200">
          <p className="text-slate-500 font-mono">No poses found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6 max-w-[1920px] mx-auto w-full pb-10">
          {poses.map((pose, index) => (
            <div key={pose.id} className="relative group/container">
              <VibeCard
                index={index}
                name={pose.name}
                subtitle="CUSTOM"
                image={pose.imageUrl}
                color="#f59e0b"
                onClick={() => {}}
                actions={[
                  {
                    name: 'Delete',
                    onClick: () => setDeleteId(pose.id),
                    variant: 'destructive',
                    icon: <Trash2 className="w-4 h-4" />,
                  },
                ]}
              />
            </div>
          ))}
        </div>
      )}

      {/* Loading Indicator */}
      <div ref={ref} className="h-10 w-full flex items-center justify-center p-4">
        {loading && (
          <div className="text-slate-400 font-mono tracking-widest animate-pulse">LOADING...</div>
        )}
      </div>

      <CreatePoseDialog open={createOpen} onOpenChange={setCreateOpen} onSuccess={reset} />
      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Pose"
        description="Are you sure you want to delete this pose? This action cannot be undone."
        onConfirm={async () => {
          if (!deleteId) return
          try {
            const res = await client.poses[':id'].$delete({ param: { id: deleteId } })
            if (res.ok) {
              toast.success('Pose deleted')
              setPoses((prev) => prev.filter((p) => p.id !== deleteId))
            } else {
              const err = await res.json()
              // @ts-ignore
              toast.error('Failed to delete: ' + (err.error || 'Unknown error'))
            }
          } catch {
            toast.error('Failed to delete pose')
          }
        }}
      />
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  )
}
