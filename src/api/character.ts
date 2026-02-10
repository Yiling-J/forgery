import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { characterService } from '../service/character'

const app = new Hono()

const listSchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(10),
})

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  imageId: z.string().min(1),
})

const updateSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  imageId: z.string().optional(),
})

const route = app
  .get('/', zValidator('query', listSchema), async (c) => {
    const { page, limit } = c.req.valid('query')
    const result = await characterService.listCharacters({ page, limit })
    return c.json({
      ...result,
      items: result.items.map((item) => ({
        ...item,
        looksCount: item._count.generations,
      })),
    })
  })
  .post('/', zValidator('json', createSchema), async (c) => {
    const { name, description, imageId } = c.req.valid('json')
    const result = await characterService.createCharacter({ name, description, imageId })
    return c.json(result, 201)
  })
  .get('/:id', async (c) => {
    const id = c.req.param('id')
    const character = await characterService.getCharacter(id)
    if (!character) {
      // @ts-ignore
      return c.json({ error: 'Character not found' }, 404)
    }
    return c.json(character)
  })
  .put('/:id', zValidator('json', updateSchema), async (c) => {
    const id = c.req.param('id')
    const body = c.req.valid('json')
    const result = await characterService.updateCharacter(id, body)
    return c.json(result)
  })
  .delete('/:id', async (c) => {
    const id = c.req.param('id')
    await characterService.deleteCharacter(id)
    return c.json({ success: true }, 200)
  })

export default route
