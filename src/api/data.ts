import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import { dataService } from '../service/data'

const app = new Hono()

const createDataSchema = z.object({
  categoryId: z.string(),
  values: z.record(z.any()), // Expecting JSON object
})

const updateDataSchema = createDataSchema.partial()

const route = app
  .get('/', async (c) => {
    const categoryId = c.req.query('categoryId')
    const search = c.req.query('search')

    const data = await dataService.getAllData({ categoryId, search })
    return c.json(data)
  })
  .get('/:id', async (c) => {
    const id = c.req.param('id')
    const item = await dataService.getData(id)
    if (!item) {
      return c.json({ error: 'Data not found' }, 404)
    }
    return c.json(item)
  })
  .post('/', zValidator('json', createDataSchema), async (c) => {
    const body = c.req.valid('json')
    try {
      const item = await dataService.createData(body as any)
      return c.json(item, 201)
    } catch (e) {
      console.error(e)
      return c.json({ error: 'Failed to create data' }, 500)
    }
  })
  .put('/:id', zValidator('json', updateDataSchema), async (c) => {
    const id = c.req.param('id')
    const body = c.req.valid('json')
    try {
      const item = await dataService.updateData(id, body as any)
      return c.json(item)
    } catch (e) {
      console.error(e)
      return c.json({ error: 'Failed to update data' }, 500)
    }
  })
  .delete('/:id', async (c) => {
    const id = c.req.param('id')
    try {
      await dataService.deleteData(id)
      return c.json({ success: true })
    } catch (e) {
      console.error(e)
      return c.json({ error: 'Failed to delete data' }, 500)
    }
  })

export default route
