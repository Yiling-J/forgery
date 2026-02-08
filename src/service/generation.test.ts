import { describe, it, expect, mock, afterEach } from 'bun:test'

const mockPrisma = {
  generation: {
    findMany: mock(),
    count: mock(),
  },
}

mock.module('../db', () => ({
  prisma: mockPrisma,
}))

describe('GenerationService', () => {
  afterEach(() => {
    mockPrisma.generation.findMany.mockClear()
    mockPrisma.generation.count.mockClear()
  })

  it('listGenerations should filter by equipment', async () => {
    // @ts-ignore
    const { generationService } = await import(`./generation?v=${Date.now()}`)
    mockPrisma.generation.count.mockResolvedValue(2)
    mockPrisma.generation.findMany.mockResolvedValue([])

    await generationService.listGenerations({ page: 1, limit: 10 }, { equipmentId: 'eq1' })

    expect(mockPrisma.generation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          equipments: {
            some: {
              equipmentId: 'eq1',
            },
          },
        }),
      }),
    )
  })
})
