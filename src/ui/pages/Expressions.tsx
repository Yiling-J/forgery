import { InferResponseType } from 'hono/client'
import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { client } from '../client'
import { CreateExpressionDialog } from '../components/CreateExpressionDialog'
import { PageHeader } from '../components/PageHeader'
import { VibeCard } from '../components/VibeCard'
import { Button } from '../components/ui/button'

type ExpressionResponse = InferResponseType<typeof client.expressions.$get>
type ExpressionItem = ExpressionResponse[number]

export default function Expressions() {
  const [expressions, setExpressions] = useState<ExpressionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)

  const fetchExpressions = async () => {
    try {
      const res = await client.expressions.$get()
      if (res.ok) {
        const data = await res.json()
        setExpressions(data)
      }
    } catch (e) {
      console.error('Failed to load expressions', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExpressions()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expression?')) return

    try {
      const res = await client.expressions[':id'].$delete({ param: { id } })
      if (res.ok) {
        toast.success('Expression deleted')
        fetchExpressions()
      } else {
        const err = await res.json()
        // @ts-ignore
        toast.error('Failed to delete: ' + (err.error || 'Unknown error'))
      }
    } catch {
      toast.error('Failed to delete expression')
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
        title="Expressions"
        subtitle="System // Expression_Library"
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Expression
          </Button>
        }
        className="mb-8"
      />

      {expressions.length === 0 ? (
        <div className="text-center p-12 bg-white clip-path-slant border border-slate-200">
          <p className="text-slate-500 font-mono">No expressions found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6 max-w-[1920px] mx-auto w-full pb-10">
          {expressions.map((expression, index) => (
            <div key={expression.id} className="relative group/container">
              <VibeCard
                index={index}
                name={expression.name}
                subtitle={expression.type === 'builtin' ? 'SYSTEM' : 'CUSTOM'}
                image={expression.imageUrl}
                color={expression.type === 'builtin' ? '#10b981' : '#f59e0b'}
                onClick={() => {}}
              />
              {expression.type === 'custom' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(expression.id)
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

      <CreateExpressionDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={fetchExpressions}
      />
    </div>
  )
}
