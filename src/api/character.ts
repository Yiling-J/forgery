import { Hono } from 'hono'
import { CharacterService } from '../service/character'

const character = new Hono()

character.get('/', async (c) => {
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '10')
  const result = await CharacterService.listCharacters({ page, limit })
  return c.json(result)
})

character.post('/', async (c) => {
  const body = await c.req.json()
  const { name, description, imageId } = body
  if (!name || !imageId) {
    return c.json({ error: 'Name and Image ID are required' }, 400)
  }
  const result = await CharacterService.createCharacter({ name, description, imageId })
  return c.json(result, 201)
})

character.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const result = await CharacterService.updateCharacter(id, body)
  return c.json(result)
})

character.delete('/:id', async (c) => {
  const id = c.req.param('id')
  await CharacterService.deleteCharacter(id)
  return c.json({ success: true }, 200)
})

export default character
