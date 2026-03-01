import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import { projectService } from '../service/project'

const app = new Hono()

const createSchema = z.object({
  name: z.string().min(1),
  coverImageId: z.string().optional(),
})

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  coverImageId: z.string().optional().nullable(),
})

const route = app
  .get('/', async (c) => {
    const projects = await projectService.listProjects()
    return c.json(projects)
  })
  .post('/', zValidator('json', createSchema), async (c) => {
    const data = c.req.valid('json')
    const project = await projectService.createProject(data)
    return c.json(project, 201)
  })
  .get('/:id', async (c) => {
    const { id } = c.req.param()
    const project = await projectService.getProject(id)
    if (!project) return c.json({ error: 'Project not found' }, 404)
    return c.json(project)
  })
  .patch('/:id', zValidator('json', updateSchema), async (c) => {
    const { id } = c.req.param()
    const data = c.req.valid('json')
    const project = await projectService.updateProject(id, data)
    return c.json(project)
  })
  .delete('/:id', async (c) => {
    const { id } = c.req.param()
    await projectService.deleteProject(id)
    return c.json({ success: true })
  })

export default route
