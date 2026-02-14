import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import { expressionService } from '../service/expression'

const app = new Hono()

// Zod schema for validation
const listSchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(20),
})

const createSchema = z.object({
  name: z.string().min(1),
  image: z.instanceof(File),
})

const route = app
  .get('/', zValidator('query', listSchema), async (c) => {
    const { page, limit } = c.req.valid('query')
    const expressions = await expressionService.listExpressions({ page, limit })
    return c.json(expressions)
  })
  .post('/', zValidator('form', createSchema), async (c) => {
    const { name, image } = c.req.valid('form')
    try {
      const expression = await expressionService.createExpression(name, image)
      return c.json(expression, 201)
    } catch (e) {
      console.error('Failed to create expression', e)
      return c.json({ error: e instanceof Error ? e.message : 'Unknown error' }, 500)
    }
  })
  .delete('/:id', async (c) => {
    const id = c.req.param('id')
    try {
      await expressionService.deleteExpression(id)
      return c.json({ success: true })
    } catch (e) {
      return c.json({ error: e instanceof Error ? e.message : 'Unknown error' }, 500)
    }
  })

export default route
