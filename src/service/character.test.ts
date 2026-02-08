import { describe, it, expect, mock, afterEach } from 'bun:test'

const mockPrisma = {
  character: {
    create: mock(),
    findMany: mock(),
    count: mock(),
    update: mock(),
    delete: mock(),
  },
}

mock.module('../db', () => ({
  prisma: mockPrisma,
}))

describe('CharacterService', () => {
  afterEach(() => {
    mockPrisma.character.create.mockClear()
    mockPrisma.character.findMany.mockClear()
    mockPrisma.character.count.mockClear()
    mockPrisma.character.update.mockClear()
    mockPrisma.character.delete.mockClear()
  })

  it('createCharacter should create character with image relation', async () => {
    // @ts-ignore
    const { characterService } = await import(`./character?v=${Date.now()}`)
    const data = { name: 'Test Char', description: 'Desc', imageId: 'img1' }
    mockPrisma.character.create.mockResolvedValue({ id: 'char1', ...data })

    const result = await characterService.createCharacter(data)

    expect(mockPrisma.character.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: data.name,
          imageId: data.imageId,
        }),
        include: { image: true },
      }),
    )
    expect(result.id).toBe('char1')
  })

  it('listCharacters should return paginated list', async () => {
    // @ts-ignore
    const { characterService } = await import(`./character?v=${Date.now()}`)
    mockPrisma.character.count.mockResolvedValue(10)
    mockPrisma.character.findMany.mockResolvedValue([{ id: 'char1' }])

    const result = await characterService.listCharacters({ page: 1, limit: 5 })

    expect(mockPrisma.character.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 5,
      }),
    )
    expect(result.total).toBe(10)
    expect(result.items).toHaveLength(1)
  })
})
