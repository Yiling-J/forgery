import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import { categoryService } from '../service/category'

const app = new Hono()

const createCategorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  fields: z.array(z.any()), // Expecting JSON array
  imagePrompt: z.record(z.any()).optional().nullable(), // Expecting JSON object
  enabled: z.boolean().optional(),
  maxCount: z.number().int().min(1).default(1),
})

const updateCategorySchema = createCategorySchema.partial()

const route = app
  .get('/', async (c) => {
    const categories = await categoryService.getAllCategories()
    return c.json(categories)
  })
  .get('/:id', async (c) => {
    const id = c.req.param('id')
    const category = await categoryService.getCategory(id)
    if (!category) {
      return c.json({ error: 'Category not found' }, 404)
    }
    return c.json(category)
  })
  .post('/', zValidator('json', createCategorySchema), async (c) => {
    const body = c.req.valid('json')
    try {
      // Prisma handles JSON type directly, no need to stringify manually if passing to InputJsonValue
      // However, body.fields is Array, body.imagePrompt is Object.
      // Prisma expects InputJsonValue.

      const category = await categoryService.createCategory(body as any)
      return c.json(category, 201)
    } catch (e) {
      console.error(e)
      return c.json({ error: 'Failed to create category' }, 500)
    }
  })
  .put('/:id', zValidator('json', updateCategorySchema), async (c) => {
    const id = c.req.param('id')
    const body = c.req.valid('json')
    try {
      const category = await categoryService.updateCategory(id, body as any)
      return c.json(category)
    } catch (e) {
      console.error(e)
      return c.json({ error: 'Failed to update category' }, 500)
    }
  })
  .delete('/:id', async (c) => {
    const id = c.req.param('id')
    try {
      await categoryService.deleteCategory(id)
      return c.json({ success: true })
    } catch (e) {
      console.error(e)
      return c.json({ error: 'Failed to delete category' }, 500)
    }
  })

export default route
