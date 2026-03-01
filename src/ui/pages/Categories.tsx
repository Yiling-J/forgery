import { client } from '@/ui/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/ui/card'
import { PageHeader } from '@/ui/components/PageHeader'
import { useToast } from '@/ui/hooks/use-toast'
import { InferResponseType } from 'hono/client'
import { Loader2, Plus, Image as ImageIcon, Box } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CreateCategoryDialog } from '../components/CreateCategoryDialog'

type CategoryListResponse = InferResponseType<typeof client.categories.$get>
type Category = CategoryListResponse[number]

export default function Categories() {
  const { toast } = useToast()
  const { projectId } = useParams()
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const fetchCategories = async () => {
    if (!projectId) return
    setLoading(true)
    try {
      const res = await client.categories.$get({ query: { projectId } })
      if (res.ok) {
        const data = await res.json()
        setCategories(data)
      } else {
        throw new Error(`Failed to fetch categories: ${res.status} ${res.statusText}`)
      }
    } catch (error) {
      console.error('Failed to fetch categories', error)
      toast({
        title: 'Error',
        description: 'Failed to load categories.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleCreated = () => {
    fetchCategories()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="w-full h-full px-4 flex flex-col font-sans text-slate-900 relative space-y-8">
      <PageHeader
        title="Categories"
        subtitle="System // Data Schemas"
        actions={
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            <Plus className="mr-2 h-4 w-4" /> New Category
          </button>
        }
      />

      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <Card key={category.id} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start gap-2">
                <CardTitle className="text-xl font-bold truncate" title={category.name}>
                    {category.name}
                </CardTitle>
                <div className="flex flex-col items-end gap-1">
                   <div className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-mono whitespace-nowrap">
                      Max: {category.maxCount}
                   </div>
                </div>
              </div>
              <CardDescription className="line-clamp-2 h-10">
                {category.description || 'No description provided.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <div className="flex items-center gap-1.5" title="With Image">
                   <ImageIcon size={16} className={category.withImage ? "text-cyan-600" : "text-slate-300"} />
                   <span className={category.withImage ? "text-slate-700" : "text-slate-400"}>
                     {category.withImage ? 'Enabled' : 'Disabled'}
                   </span>
                </div>
                <div className="flex items-center gap-1.5" title="Options">
                   <Box size={16} className={category.options.length > 0 ? "text-blue-600" : "text-slate-300"} />
                   <span className={category.options.length > 0 ? "text-slate-700" : "text-slate-400"}>
                     {category.options.length} options
                   </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Create New Card */}
        <button
          className="group border border-slate-200 border-dashed rounded-xl shadow-sm hover:border-slate-400 hover:bg-slate-50/50 transition-all cursor-pointer flex flex-col items-center justify-center min-h-[180px] p-6 text-center outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          onClick={() => setIsCreateOpen(true)}
        >
          <div className="p-3 rounded-full bg-slate-100 group-hover:bg-white group-hover:scale-110 transition-all duration-300 mb-3 border border-slate-200">
             <Plus className="h-6 w-6 text-slate-600" />
          </div>
          <span className="font-semibold text-slate-900">Create New Category</span>
          <span className="text-sm text-slate-500 mt-1">Add a new data schema</span>
        </button>
      </div>

      <CreateCategoryDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} onCreated={handleCreated} />
    </div>
  )
}
