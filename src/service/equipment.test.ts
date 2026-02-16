import { describe, it, expect, mock, afterEach } from 'bun:test'

const mockPrisma = {
  equipment: {
    findMany: mock(),
    count: mock(),
    update: mock(),
    delete: mock(),
    findUnique: mock(),
  },
  generationEquipment: {
    deleteMany: mock(),
  },
}

const mockAssetService = {
  deleteAsset: mock(),
}

mock.module('../db', () => ({
  prisma: mockPrisma,
}))

mock.module('./asset', () => ({
  assetService: mockAssetService,
}))

describe('EquipmentService', () => {
  afterEach(() => {
    mockPrisma.equipment.findMany.mockClear()
    mockPrisma.equipment.count.mockClear()
    mockPrisma.equipment.update.mockClear()
    mockPrisma.equipment.delete.mockClear()
    mockPrisma.equipment.findUnique.mockClear()
    mockPrisma.generationEquipment.deleteMany.mockClear()
    mockAssetService.deleteAsset.mockClear()
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

    await equipmentService.updateEquipment('1', {
      name: 'New Name',
      description: 'New Description',
    })

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

  it('deleteEquipment should delete equipment and associated asset', async () => {
    // @ts-ignore
    const { equipmentService } = await import(`./equipment?v=${Date.now()}`)
    mockPrisma.equipment.findUnique.mockResolvedValue({
      id: '1',
      imageId: 'asset-1',
    })
    mockPrisma.generationEquipment.deleteMany.mockResolvedValue({ count: 1 })
    mockPrisma.equipment.delete.mockResolvedValue({ id: '1' })
    mockAssetService.deleteAsset.mockResolvedValue(undefined)

    await equipmentService.deleteEquipment('1')

    expect(mockPrisma.equipment.findUnique).toHaveBeenCalledWith({ where: { id: '1' } })
    expect(mockPrisma.generationEquipment.deleteMany).toHaveBeenCalledWith({ where: { equipmentId: '1' } })
    expect(mockPrisma.equipment.delete).toHaveBeenCalledWith({ where: { id: '1' } })
    expect(mockAssetService.deleteAsset).toHaveBeenCalledWith('asset-1')
  })
})
