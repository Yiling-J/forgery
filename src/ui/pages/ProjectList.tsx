import { Layers, Plus, Pencil } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { client } from '../client'
import { CreateProjectDialog } from '../components/CreateProjectDialog'
import { Button } from '../components/ui/button'

export default function ProjectList() {
  const [projects, setProjects] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editProject, setEditProject] = useState<any | null>(null)
  
  const loadProjects = async () => {
    try {
      const res = await client.projects.$get()
      if (res.ok) {
        const data = await res.json()
        setProjects(data)
      }
    } catch (error) {
      console.error(error)
      toast.error('Failed to load projects')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    if (!confirm('Are you sure you want to delete this project? All associated data will be lost.')) return

    try {
      const res = await client.projects[':id'].$delete({ param: { id } })
      if (res.ok) {
        toast.success('Project deleted')
        loadProjects()
      } else {
        throw new Error('Failed to delete')
      }
    } catch (error) {
      console.error(error)
      toast.error('Failed to delete project')
    }
  }

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading projects...</div>
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1">Manage your workspaces and collections.</p>
        </div>
        <Button onClick={() => {
          setEditProject(null)
          setIsCreateOpen(true)
        }}>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center p-12 border rounded-lg border-dashed text-muted-foreground bg-muted/20">
          No projects yet. Create one to get started!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {projects.map((project) => (
            <Link key={project.id} to={`/projects/${project.id}/characters`}>
              <div className="group relative border rounded-xl overflow-hidden hover:shadow-lg transition-all hover:border-primary/50 bg-card h-[280px] flex flex-col">
                <div className="h-40 bg-muted shrink-0 w-full overflow-hidden relative">
                  {project.coverImage?.path ? (
                    <img
                      src={`/files/${project.coverImage.path}`}
                      alt={project.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary/40">
                      <Layers className="h-12 w-12" />
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-1 justify-between">
                  <div>
                    <h3 className="font-semibold text-lg line-clamp-1">{project.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1 flex gap-3">
                      <span>{project._count?.data || 0} Assets</span>
                      <span>{project._count?.generations || 0} Generations</span>
                    </p>
                  </div>
                  <div className="flex justify-end pt-2 gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault()
                        setEditProject(project)
                        setIsCreateOpen(true)
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={(e) => handleDelete(project.id, e)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <CreateProjectDialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open)
          if (!open) setEditProject(null)
        }}
        onSuccess={loadProjects}
        initialData={editProject}
      />
    </div>
  )
}
