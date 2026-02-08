import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { equipmentService } from '../service/equipment'

const app = new Hono()

const listSchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(20),
  category: z.string().optional(),
  subCategory: z.string().optional(),
})

const route = app.get('/', zValidator('query', listSchema), async (c) => {
  const { page, limit, category, subCategory } = c.req.valid('query')

  const result = await equipmentService.listEquipments({ page, limit }, { category, subCategory })

  return c.json(result)
})

export default route
