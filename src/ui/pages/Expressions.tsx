import { InferResponseType } from 'hono/client'
import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { client } from '../client'
import { CreateExpressionDialog } from '../components/CreateExpressionDialog'
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog'
import { PageHeader } from '../components/PageHeader'
import { VibeCard } from '../components/VibeCard'
import { Button } from '../components/ui/button'
import { useInfiniteScroll } from '../hooks/use-infinite-scroll'

type ExpressionResponse = InferResponseType<typeof client.expressions.$get>
type ExpressionItem = ExpressionResponse[number]

export default function Expressions() {
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const {
    items: expressions,
    loading,
    ref,
    reset,
    setItems: setExpressions,
  } = useInfiniteScroll<ExpressionItem>({
    fetchData: async (page, limit) => {
      const res = await client.expressions.$get({
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

      {expressions.length === 0 && !loading ? (
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
                actions={
                  expression.type === 'custom'
                    ? [
                        {
                          name: 'Delete',
                          onClick: () => setDeleteId(expression.id),
                          variant: 'destructive',
                          icon: <Trash2 className="w-4 h-4" />,
                        },
                      ]
                    : []
                }
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

      <CreateExpressionDialog open={createOpen} onOpenChange={setCreateOpen} onSuccess={reset} />
      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Expression"
        description="Are you sure you want to delete this expression? This action cannot be undone."
        onConfirm={async () => {
          if (!deleteId) return
          try {
            const res = await client.expressions[':id'].$delete({ param: { id: deleteId } })
            if (res.ok) {
              toast.success('Expression deleted')
              setExpressions((prev) => prev.filter((e) => e.id !== deleteId))
            } else {
              const err = await res.json()
              // @ts-ignore
              toast.error('Failed to delete: ' + (err.error || 'Unknown error'))
            }
          } catch {
            toast.error('Failed to delete expression')
          }
        }}
      />
    </div>
  )
}
