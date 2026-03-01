import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { generationService } from '../service/generation'

const app = new Hono()

// New Create Generation (Generic)
const createSchema = z.object({
  dataIds: z.array(z.string()).min(1),
  projectId: z.string(),
  userPrompt: z.string().optional(),
})

const listSchema = z.object({
  projectId: z.string(),
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(10),
})

const route = app
  .get('/', zValidator('query', listSchema), async (c) => {
    const { projectId, page, limit } = c.req.valid('query')
    try {
      const result = await generationService.listGenerations(projectId, { page, limit })
      return c.json(result)
    } catch (e) {
      console.error('Failed to list generations', e)
      return c.json({ error: 'Failed to list generations' }, 500)
    }
  })
  .post('/', zValidator('json', createSchema), async (c) => {
    const { dataIds, projectId, userPrompt } = c.req.valid('json')
    try {
      const result = await generationService.createGeneration(
        dataIds,
        projectId,
        userPrompt
      )
      return c.json(result, 201)
    } catch (e) {
      console.error('Failed to create generation', e)
      return c.json({ error: e instanceof Error ? e.message : 'Unknown error' }, 500)
    }
  })
  .delete('/:id', async (c) => {
    const id = c.req.param('id')
    await generationService.deleteGeneration(id)
    return c.json({ success: true }, 200)
  })

export default route
