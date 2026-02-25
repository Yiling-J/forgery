import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import { collectionService } from '../service/collection'

const app = new Hono()

const createCollectionSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  prompt: z.string().optional(),
  categoryId: z.string(),
  dataIds: z.array(z.string()),
})

const updateCollectionSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  prompt: z.string().optional(),
  dataIds: z.array(z.string()).optional(),
})

const listQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  categoryId: z.string().optional(),
})

const route = app
  .get('/', zValidator('query', listQuerySchema), async (c) => {
    const query = c.req.valid('query')
    const page = query.page ? parseInt(query.page) : 1
    const limit = query.limit ? parseInt(query.limit) : 20
    const categoryId = query.categoryId

    const items = await collectionService.listCollections({ page, limit, categoryId })
    return c.json(items)
  })
  .get('/:id', async (c) => {
    const id = c.req.param('id')
    const item = await collectionService.getCollection(id)
    if (!item) return c.json({ error: 'Not found' }, 404)
    return c.json(item)
  })
  .post('/', zValidator('json', createCollectionSchema), async (c) => {
    const body = c.req.valid('json')
    try {
      const result = await collectionService.createCollection(body)
      return c.json(result)
    } catch (e) {
      console.error(e)
      return c.json({ error: 'Failed to create' }, 500)
    }
  })
  .put('/:id', zValidator('json', updateCollectionSchema), async (c) => {
    const id = c.req.param('id')
    const body = c.req.valid('json')
    try {
      const result = await collectionService.updateCollection(id, body)
      return c.json(result)
    } catch (e) {
      console.error(e)
      return c.json({ error: 'Failed to update' }, 500)
    }
  })
  .delete('/:id', async (c) => {
    const id = c.req.param('id')
    try {
      await collectionService.deleteCollection(id)
      return c.json({ success: true })
    } catch (e) {
      console.error(e)
      return c.json({ error: 'Failed to delete' }, 500)
    }
  })

export default route
