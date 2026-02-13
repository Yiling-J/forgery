import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { outfitService } from '../service/outfit'

const app = new Hono()

// Define schemas for validation
const listSchema = z.object({
  equipmentId: z.string().optional(),
})

const createSchema = z.object({
  name: z.string().min(1),
  prompt: z.string().optional(),
  equipmentIds: z.array(z.string()),
})

const updateSchema = z.object({
  name: z.string().optional(),
  prompt: z.string().optional(),
  equipmentIds: z.array(z.string()).optional(),
})

const route = app
  .get('/', zValidator('query', listSchema), async (c) => {
    const { equipmentId } = c.req.valid('query')
    const result = await outfitService.listOutfits(equipmentId)
    return c.json(result)
  })
  .post('/', zValidator('json', createSchema), async (c) => {
    const data = c.req.valid('json')
    const result = await outfitService.createOutfit(data)
    return c.json(result)
  })
  .put('/:id', zValidator('json', updateSchema), async (c) => {
    const id = c.req.param('id')
    const data = c.req.valid('json')
    const result = await outfitService.updateOutfit(id, data)
    return c.json(result)
  })
  .delete('/:id', async (c) => {
    const id = c.req.param('id')
    await outfitService.deleteOutfit(id)
    return c.json({ success: true })
  })

export default route
