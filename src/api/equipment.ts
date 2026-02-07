import { Hono } from 'hono'
import { EquipmentService } from '../services/equipment'

const equipment = new Hono()

equipment.get('/', async (c) => {
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '10')
  const categoryId = c.req.query('categoryId')
  const subCategoryId = c.req.query('subCategoryId')

  const result = await EquipmentService.listEquipments(
    { page, limit },
    { categoryId, subCategoryId },
  )
  return c.json(result)
})

export default equipment
