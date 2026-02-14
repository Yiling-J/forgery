import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { generationService } from '../service/generation'

const app = new Hono()

const listSchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(10),
  characterId: z.string().optional(),
  equipmentId: z.string().optional(),
})

const createSchema = z.object({
  characterId: z.string().min(1),
  equipmentIds: z.array(z.string()),
  userPrompt: z.string().optional(),
  poseId: z.string().optional(),
  expressionId: z.string().optional(),
})

const route = app
  .get('/', zValidator('query', listSchema), async (c) => {
    const { page, limit, characterId, equipmentId } = c.req.valid('query')

    const result = await generationService.listGenerations(
      { page, limit },
      { characterId, equipmentId },
    )
    return c.json(result)
  })
  .post('/', zValidator('json', createSchema), async (c) => {
    const { characterId, equipmentIds, userPrompt, poseId, expressionId } = c.req.valid('json')
    try {
      const result = await generationService.createGeneration(
        characterId,
        equipmentIds,
        userPrompt,
        poseId,
        expressionId,
      )
      return c.json(result, 201)
    } catch (e) {
      console.error('Failed to create generation', e)
      return c.json({ error: e instanceof Error ? e.message : 'Unknown error' }, 500)
    }
  })

export default route
