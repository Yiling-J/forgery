import { describe, it, expect, mock, afterEach } from 'bun:test'

const mockPrisma = {
  equipment: {
    findMany: mock(),
    count: mock(),
    update: mock(),
  },
}

mock.module('../db', () => ({
  prisma: mockPrisma,
}))

describe('EquipmentService', () => {
  afterEach(() => {
    mockPrisma.equipment.findMany.mockClear()
    mockPrisma.equipment.count.mockClear()
    mockPrisma.equipment.update.mockClear()
  })

  it('listEquipments should filter by category', async () => {
    // @ts-ignore
    const { equipmentService } = await import(`./equipment?v=${Date.now()}`)
    mockPrisma.equipment.count.mockResolvedValue(5)
    mockPrisma.equipment.findMany.mockResolvedValue([])

    await equipmentService.listEquipments({ page: 1, limit: 10 }, { category: ['Headwear'] })

    expect(mockPrisma.equipment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          category: { in: ['Headwear'] },
        }),
      }),
    )
  })

  it('updateEquipment should update equipment details', async () => {
    // @ts-ignore
    const { equipmentService } = await import(`./equipment?v=${Date.now()}`)
    mockPrisma.equipment.update.mockResolvedValue({
      id: '1',
      name: 'New Name',
      description: 'New Description',
    })

    await equipmentService.updateEquipment('1', { name: 'New Name', description: 'New Description' })

    expect(mockPrisma.equipment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: '1' },
        data: expect.objectContaining({
          name: 'New Name',
          description: 'New Description',
        }),
      }),
    )
  })
})
