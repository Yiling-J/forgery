import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { EquipmentService } from '../service/equipment'

const equipment = new Hono()

const listSchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(20),
  categoryId: z.string().optional(),
  subCategoryId: z.string().optional(),
})

equipment.get('/', zValidator('query', listSchema), async (c) => {
  const { page, limit, categoryId, subCategoryId } = c.req.valid('query')

  const result = await EquipmentService.listEquipments(
    { page, limit },
    { categoryId, subCategoryId },
  )

  return c.json(result)
})

export default equipment
