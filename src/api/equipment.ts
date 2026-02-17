import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { equipmentService } from '../service/equipment'

const app = new Hono()

const listSchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(20),
  category: z.union([z.string(), z.array(z.string())]).optional(),
  subCategory: z.string().optional(),
})

const route = app.get('/', zValidator('query', listSchema), async (c) => {
  const { page, limit, category, subCategory } = c.req.valid('query')
  const categories = category ? (Array.isArray(category) ? category : [category]) : undefined

  const result = await equipmentService.listEquipments(
    { page, limit },
    { category: categories, subCategory },
  )

  return c.json(result)
})

const createSchema = z.object({
  name: z.string().min(1),
  imageId: z.string().min(1),
  category: z.string().min(1),
  subCategory: z.string().optional(),
  description: z.string().optional().default(''),
})

const routeWithCreate = route.post('/', zValidator('json', createSchema), async (c) => {
  const { name, imageId, category, subCategory, description } = c.req.valid('json')

  try {
    const result = await equipmentService.createEquipment({
      name,
      imageId,
      category,
      subCategory,
      description,
    })
    return c.json(result, 201)
  } catch (e) {
    console.error('Failed to create equipment', e)
    return c.json({ error: 'Failed to create equipment' }, 500)
  }
})

const patchSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
})

const routeWithPatch = routeWithCreate.patch('/:id', zValidator('json', patchSchema), async (c) => {
  const { id } = c.req.param()
  const { name, description } = c.req.valid('json')

  try {
    const result = await equipmentService.updateEquipment(id, { name, description })
    return c.json(result)
  } catch (e) {
    console.error('Failed to update equipment', e)
    return c.json({ error: 'Failed to update equipment' }, 500)
  }
})

const routeWithDelete = routeWithPatch.delete('/:id', async (c) => {
  const { id } = c.req.param()
  try {
    await equipmentService.deleteEquipment(id)
    return c.json({ success: true })
  } catch (e) {
    console.error('Failed to delete equipment', e)
    return c.json({ error: 'Failed to delete equipment' }, 500)
  }
})

export default routeWithDelete
