import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import { categoryService } from '../service/category'

const app = new Hono()

// List
const listRoute = app.get('/', async (c) => {
  const result = await categoryService.listCategories()
  const mappedResult = result.map((cat) => {
    let imagePrompt = { text: '', imageIds: [] }
    let options: string[] = []
    try {
      imagePrompt = JSON.parse(cat.imagePrompt)
    } catch {
      // ignore
    }
    try {
      options = JSON.parse(cat.options)
    } catch {
      // ignore
    }

    return {
      ...cat,
      imagePrompt,
      options,
    }
  })
  return c.json(mappedResult)
})

const imagePromptSchema = z.object({
  text: z.string(),
  imageIds: z.array(z.string()),
})

// Create
const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().default(''),
  imagePrompt: imagePromptSchema.default({ text: '', imageIds: [] }),
  enabled: z.boolean().default(true),
  options: z.array(z.string()).default([]),
  maxCount: z.number().default(9),
  withImage: z.boolean().default(true),
})

const createRoute = listRoute.post('/', zValidator('json', createSchema), async (c) => {
  const { imagePrompt, options, ...rest } = c.req.valid('json')

  const data = {
    ...rest,
    imagePrompt: JSON.stringify(imagePrompt),
    options: JSON.stringify(options),
  }

  try {
    const result = await categoryService.createCategory(data)

    // Return parsed object
    return c.json(
      {
        ...result,
        imagePrompt: imagePrompt,
        options: options,
      },
      201,
    )
  } catch (e) {
    console.error('Failed to create category', e)
    return c.json({ error: 'Failed to create category' }, 500)
  }
})

// Update
const updateSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  imagePrompt: imagePromptSchema.optional(),
  enabled: z.boolean().optional(),
  options: z.array(z.string()).optional(),
  maxCount: z.number().optional(),
  withImage: z.boolean().optional(),
})

const updateRoute = createRoute.patch('/:id', zValidator('json', updateSchema), async (c) => {
  const { id } = c.req.param()
  const { imagePrompt, options, ...rest } = c.req.valid('json')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = { ...rest }
  if (imagePrompt) data.imagePrompt = JSON.stringify(imagePrompt)
  if (options) data.options = JSON.stringify(options)

  try {
    const result = await categoryService.updateCategory(id, data)

    // Parse back for response
    let resImagePrompt = { text: '', imageIds: [] }
    let resOptions = []
    try {
      resImagePrompt = JSON.parse(result.imagePrompt)
    } catch {
      /* ignore */
    }
    try {
      resOptions = JSON.parse(result.options)
    } catch {
      /* ignore */
    }

    return c.json({
      ...result,
      imagePrompt: resImagePrompt,
      options: resOptions,
    })
  } catch (e) {
    console.error('Failed to update category', e)
    return c.json({ error: 'Failed to update category' }, 500)
  }
})

// Delete
const deleteRoute = updateRoute.delete('/:id', async (c) => {
  const { id } = c.req.param()
  try {
    await categoryService.deleteCategory(id)
    return c.json({ success: true })
  } catch (e) {
    console.error('Failed to delete category', e)
    return c.json({ error: 'Failed to delete category' }, 500)
  }
})

// List Data by Category
const listDataSchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(20),
  option: z.string().optional(),
})

const routeWithData = deleteRoute.get(
  '/:id/data',
  zValidator('query', listDataSchema),
  async (c) => {
    const { id } = c.req.param()
    const { page, limit, option } = c.req.valid('query')
    const result = await categoryService.listDataByCategory(id, { page, limit, option })
    return c.json(result)
  },
)

export default routeWithData
