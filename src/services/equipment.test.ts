import { describe, it, expect, mock, afterEach } from 'bun:test'

const mockPrisma = {
  equipment: {
    findMany: mock(),
    count: mock(),
  },
}

mock.module('../db', () => ({
  prisma: mockPrisma,
}))

describe('EquipmentService', () => {
  afterEach(() => {
    mockPrisma.equipment.findMany.mockClear()
    mockPrisma.equipment.count.mockClear()
  })

  it('listEquipments should filter by category', async () => {
    // @ts-ignore
    const { EquipmentService } = await import(`./equipment?v=${Date.now()}`)
    mockPrisma.equipment.count.mockResolvedValue(5)
    mockPrisma.equipment.findMany.mockResolvedValue([])

    await EquipmentService.listEquipments({ page: 1, limit: 10 }, { categoryId: 'cat1' })

    expect(mockPrisma.equipment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          categoryId: 'cat1',
        }),
      }),
    )
  })
})
