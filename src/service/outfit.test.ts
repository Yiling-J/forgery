import { describe, it, expect, mock, afterEach } from 'bun:test'

const mockPrisma = {
  outfit: {
    findMany: mock(),
    create: mock(),
    update: mock(),
    delete: mock(),
  },
}

mock.module('../db', () => ({
  prisma: mockPrisma,
}))

describe('OutfitService', () => {
  afterEach(() => {
    mockPrisma.outfit.findMany.mockClear()
    mockPrisma.outfit.create.mockClear()
    mockPrisma.outfit.update.mockClear()
    mockPrisma.outfit.delete.mockClear()
  })

  it('listOutfits should return outfits', async () => {
    // @ts-ignore
    const { outfitService } = await import(`./outfit?v=${Date.now()}`)
    mockPrisma.outfit.findMany.mockResolvedValue([{ id: '1', name: 'Test Outfit', equipments: [] }])

    const result = await outfitService.listOutfits()
    expect(result).toHaveLength(1)
    expect(mockPrisma.outfit.findMany).toHaveBeenCalled()
  })

  it('createOutfit should create an outfit', async () => {
    // @ts-ignore
    const { outfitService } = await import(`./outfit?v=${Date.now()}`)
    const mockOutfit = { id: '1', name: 'New Outfit', equipments: [] }
    mockPrisma.outfit.create.mockResolvedValue(mockOutfit)

    const result = await outfitService.createOutfit({
      name: 'New Outfit',
      prompt: 'Test prompt',
      equipmentIds: ['eq1', 'eq2'],
    })

    expect(result).toEqual(mockOutfit)
    expect(mockPrisma.outfit.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'New Outfit',
          prompt: 'Test prompt',
          equipments: {
            create: [{ equipmentId: 'eq1' }, { equipmentId: 'eq2' }],
          },
        }),
      }),
    )
  })

  it('updateOutfit should update an outfit', async () => {
    // @ts-ignore
    const { outfitService } = await import(`./outfit?v=${Date.now()}`)
    const mockOutfit = { id: '1', name: 'Updated Outfit', equipments: [] }
    mockPrisma.outfit.update.mockResolvedValue(mockOutfit)

    const result = await outfitService.updateOutfit('1', {
      name: 'Updated Outfit',
      equipmentIds: ['eq3'],
    })

    expect(result).toEqual(mockOutfit)
    expect(mockPrisma.outfit.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: '1' },
        data: expect.objectContaining({
          name: 'Updated Outfit',
          equipments: {
            deleteMany: {},
            create: [{ equipmentId: 'eq3' }],
          },
        }),
      }),
    )
  })

  it('deleteOutfit should delete an outfit', async () => {
    // @ts-ignore
    const { outfitService } = await import(`./outfit?v=${Date.now()}`)
    mockPrisma.outfit.delete.mockResolvedValue({ id: '1' })

    await outfitService.deleteOutfit('1')
    expect(mockPrisma.outfit.delete).toHaveBeenCalledWith({
      where: { id: '1' },
    })
  })
})
