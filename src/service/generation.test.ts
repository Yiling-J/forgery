import { afterEach, describe, expect, it, mock } from 'bun:test'

const mockPrisma = {
  generation: {
    findMany: mock(),
    count: mock(),
    create: mock(),
    findUnique: mock(),
  },
  character: {
    findUnique: mock(),
  },
  equipment: {
    findMany: mock(),
  },
  generationEquipment: {
    createMany: mock(),
  },
  pose: {
    findUnique: mock(),
  },
  expression: {
    findUnique: mock(),
  },
}

mock.module('../db', () => ({
  prisma: mockPrisma,
}))

const mockAiService = {
  generateImage: mock().mockResolvedValue('data:image/png;base64,mockedbase64data'),
}

const mockAssetService = {
  createAssetFromBuffer: mock().mockResolvedValue({ id: 'asset1' }),
}

mock.module('./ai', () => ({
  aiService: mockAiService,
}))

mock.module('./asset', () => ({
  assetService: mockAssetService,
}))

// NOTE: removed mock.module('./pose') to avoid polluting pose.test.ts

describe('GenerationService', () => {
  const originalFile = Bun.file

  afterEach(() => {
    mockPrisma.generation.findMany.mockClear()
    mockPrisma.generation.count.mockClear()
    mockPrisma.generation.create.mockClear()
    mockPrisma.pose.findUnique.mockClear()
    mockAiService.generateImage.mockClear()
    Bun.file = originalFile
  })

  it('createGeneration should include userPrompt', async () => {
    // @ts-ignore
    const { generationService } = await import(`./generation?v=${Date.now()}`)

    mockPrisma.character.findUnique.mockResolvedValue({
      id: 'char1',
      name: 'Char1',
      image: { path: 'char.png', type: 'image/png' },
    })
    mockPrisma.equipment.findMany.mockResolvedValue([])

    // Mock Bun.file
    // @ts-ignore
    Bun.file = () => ({
      arrayBuffer: async () => new ArrayBuffer(8),
    })

    mockPrisma.generation.create.mockResolvedValue({ id: 'gen1' })
    mockPrisma.generation.findUnique.mockResolvedValue({ id: 'gen1' })

    await generationService.createGeneration('char1', [], 'Make it cool')

    // Verify AI service call includes user prompt
    expect(mockAiService.generateImage).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          text: expect.stringContaining('Make it cool'),
        }),
      ]),
      undefined,
      'step_generation_model',
    )

    // Verify DB creation includes userPrompt
    expect(mockPrisma.generation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userPrompt: 'Make it cool',
        }),
      }),
    )
  })

  it('createGeneration should handle poseId', async () => {
    // @ts-ignore
    const { generationService } = await import(`./generation?v=${Date.now()}`)

    mockPrisma.character.findUnique.mockResolvedValue({
      id: 'char1',
      name: 'Char1',
      image: { path: 'char.png', type: 'image/png' },
    })
    mockPrisma.equipment.findMany.mockResolvedValue([])

    // Mock pose lookup via Prisma
    mockPrisma.pose.findUnique.mockResolvedValue({
      id: 'pose1',
      name: 'Test Pose',
      image: { path: 'pose.webp', type: 'image/webp' },
    })

    // Mock Bun.file
    // @ts-ignore
    Bun.file = () => ({
      arrayBuffer: async () => new ArrayBuffer(8),
      type: 'image/webp',
    })

    mockPrisma.generation.create.mockResolvedValue({ id: 'gen1' })
    mockPrisma.generation.findUnique.mockResolvedValue({ id: 'gen1' })

    await generationService.createGeneration('char1', [], undefined, 'pose1')

    // Verify AI service called with pose image
    expect(mockAiService.generateImage).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          text: 'Target Pose Reference',
        }),
      ]),
      undefined,
      'step_generation_model',
    )

    // Verify prompt updated
    expect(mockAiService.generateImage).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          text: expect.stringContaining("Use the 'Target Pose Reference' image"),
        }),
      ]),
      undefined,
      'step_generation_model',
    )

    // Verify DB creation includes pose
    expect(mockPrisma.generation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          poseId: 'pose1',
        }),
      }),
    )
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
