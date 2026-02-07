import { Hono } from 'hono'
import { GenerationService } from '../services/generation'

const generation = new Hono()

generation.get('/', async (c) => {
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '10')
  const characterId = c.req.query('characterId')
  const equipmentId = c.req.query('equipmentId')

  const result = await GenerationService.listGenerations(
    { page, limit },
    { characterId, equipmentId },
  )
  return c.json(result)
})

export default generation
