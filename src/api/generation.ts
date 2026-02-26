import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { generationService } from '../service/generation'

const app = new Hono()

// New Create Generation (Generic)
const createSchema = z.object({
  dataIds: z.array(z.string()).min(1),
  userPrompt: z.string().optional(),
})

const route = app
  .post('/', zValidator('json', createSchema), async (c) => {
    const { dataIds, userPrompt } = c.req.valid('json')
    try {
      const result = await generationService.createGeneration(
        dataIds,
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
