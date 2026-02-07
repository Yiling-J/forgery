import { describe, it, expect, mock, afterEach } from 'bun:test'
import equipment from './equipment'

const mockEquipmentService = {
  listEquipments: mock(),
}

mock.module('../service/equipment', () => ({
  EquipmentService: mockEquipmentService,
}))

describe('Equipment API', () => {
  afterEach(() => {
    mockEquipmentService.listEquipments.mockClear()
  })

  it('GET / should list equipments with filters', async () => {
    mockEquipmentService.listEquipments.mockResolvedValue({ items: [], total: 0 })

    const req = new Request('http://localhost/?categoryId=cat1', {
      method: 'GET',
    })

    const res = await equipment.fetch(req)
    expect(res.status).toBe(200)
    expect(mockEquipmentService.listEquipments).toHaveBeenCalledWith(
      { page: 1, limit: 10 },
      { categoryId: 'cat1', subCategoryId: undefined },
    )
  })
})
