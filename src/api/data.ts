import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { dataService } from '../service/data'

const app = new Hono()

// List route removed

// Create
const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().default(''),
  option: z.string().optional(),
  imageId: z.string().optional(),
  categoryId: z.string().min(1),
})

const createRoute = app.post('/', zValidator('json', createSchema), async (c) => {
  const { categoryId, imageId, ...rest } = c.req.valid('json')

  try {
    const result = await dataService.createData({
      ...rest,
      category: { connect: { id: categoryId } },
      image: imageId ? { connect: { id: imageId } } : undefined
    })
    return c.json(result, 201)
  } catch (e) {
    console.error('Failed to create data', e)
    return c.json({ error: 'Failed to create data' }, 500)
  }
})

// Update
const updateSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  option: z.string().optional(),
  imageId: z.string().optional(),
  categoryId: z.string().optional(),
})

const updateRoute = createRoute.patch('/:id', zValidator('json', updateSchema), async (c) => {
  const { id } = c.req.param()
  const { categoryId, imageId, ...rest } = c.req.valid('json')

  try {
    const result = await dataService.updateData(id, {
        ...rest,
        category: categoryId ? { connect: { id: categoryId } } : undefined,
        image: imageId ? { connect: { id: imageId } } : undefined
    })
    return c.json(result)
  } catch (e) {
    console.error('Failed to update data', e)
    return c.json({ error: 'Failed to update data' }, 500)
  }
})

// Delete
const deleteRoute = updateRoute.delete('/:id', async (c) => {
  const { id } = c.req.param()
  try {
    await dataService.deleteData(id)
    return c.json({ success: true })
  } catch (e) {
    console.error('Failed to delete data', e)
    return c.json({ error: 'Failed to delete data' }, 500)
  }
})

export default deleteRoute
