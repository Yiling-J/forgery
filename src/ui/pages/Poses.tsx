import { InferResponseType } from 'hono/client'
import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { client } from '../client'
import { CreatePoseDialog } from '../components/CreatePoseDialog'
import { PageHeader } from '../components/PageHeader'
import { VibeCard } from '../components/VibeCard'
import { Button } from '../components/ui/button'

type PoseResponse = InferResponseType<typeof client.poses.$get>
type PoseItem = PoseResponse[number]

export default function Poses() {
  const [poses, setPoses] = useState<PoseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)

  const fetchPoses = async () => {
    try {
      const res = await client.poses.$get()
      if (res.ok) {
        const data = await res.json()
        setPoses(data)
      }
    } catch (e) {
      console.error('Failed to load poses', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPoses()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this pose?')) return

    try {
      const res = await client.poses[':id'].$delete({ param: { id } })
      if (res.ok) {
        toast.success('Pose deleted')
        fetchPoses()
      } else {
        const err = await res.json()
        // @ts-ignore
        toast.error('Failed to delete: ' + (err.error || 'Unknown error'))
      }
    } catch {
      toast.error('Failed to delete pose')
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
    <div className="w-full h-full p-4 pt-2 flex flex-col text-slate-900 relative">
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

      {poses.length === 0 ? (
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
                subtitle={pose.type === 'builtin' ? 'SYSTEM' : 'CUSTOM'}
                image={pose.imageUrl}
                color={pose.type === 'builtin' ? '#3b82f6' : '#f59e0b'}
                onClick={() => {}}
              />
              {pose.type === 'custom' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(pose.id)
                  }}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover/container:opacity-100 transition-opacity z-10 hover:bg-red-600 shadow-md"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <CreatePoseDialog open={createOpen} onOpenChange={setCreateOpen} onSuccess={fetchPoses} />
    </div>
  )
}
