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

const route = app.get('/', zValidator('query', listSchema), async (c) => {
  const { page, limit, characterId, equipmentId } = c.req.valid('query')

  const result = await generationService.listGenerations(
    { page, limit },
    { characterId, equipmentId },
  )
  return c.json(result)
})

export default route
