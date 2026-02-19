import { describe, it, expect, mock, afterEach } from 'bun:test'
import equipment from './equipment'

const mockEquipmentService = {
  listEquipments: mock(),
  updateEquipment: mock(),
  deleteEquipment: mock(),
}

mock.module('../service/equipment', () => ({
  equipmentService: mockEquipmentService,
}))

describe('Equipment API', () => {
  afterEach(() => {
    mockEquipmentService.listEquipments.mockClear()
    mockEquipmentService.updateEquipment.mockClear()
    mockEquipmentService.deleteEquipment.mockClear()
  })

  it('GET / should list equipments with filters', async () => {
    mockEquipmentService.listEquipments.mockResolvedValue({ items: [], total: 0 })

    const req = new Request('http://localhost/?category=Headwear', {
      method: 'GET',
    })

    const res = await equipment.fetch(req)
    expect(res.status).toBe(200)
    expect(mockEquipmentService.listEquipments).toHaveBeenCalledWith(
      { page: 1, limit: 20 },
      { category: ['Headwear'] },
    )
  })

  it('PATCH /:id should update equipment', async () => {
    mockEquipmentService.updateEquipment.mockResolvedValue({ id: '1', name: 'Updated' })

    const req = new Request('http://localhost/1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Updated' }),
    })

    const res = await equipment.fetch(req)
    expect(res.status).toBe(200)
    expect(mockEquipmentService.updateEquipment).toHaveBeenCalledWith('1', {
      name: 'Updated',
    })
  })

  it('DELETE /:id should delete equipment', async () => {
    mockEquipmentService.deleteEquipment.mockResolvedValue({ id: '1' })

    const req = new Request('http://localhost/1', {
      method: 'DELETE',
    })

    const res = await equipment.fetch(req)
    expect(res.status).toBe(200)
    expect(mockEquipmentService.deleteEquipment).toHaveBeenCalledWith('1')
  })
})
