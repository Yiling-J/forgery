import { describe, expect, test, mock, beforeAll } from 'bun:test'

// Mock dependencies
const generateTextMock = mock(async () => ({
  Headwear: [
    {
      name: 'Helmet',
      description: 'A rusty helmet',
      option: 'Heavy',
    },
  ],
}))
const generateImageMock = mock(async () => 'data:image/png;base64,mockImage')

// Mock Prisma
const prismaMock = {
  category: {
    findMany: mock(async () => [
      {
        name: 'Headwear',
        description: 'Head equipment',
        options: '["Heavy", "Light"]',
        maxCount: 9,
        enabled: true,
      }
    ]),
    findFirst: mock(async () => ({
      id: 'cat-1',
      name: 'Headwear',
      imagePrompt: '{"text": "Extract {{name}}", "imageIds": []}',
    })),
  },
  asset: {
    findUnique: mock(async () => null)
  }
}

mock.module('../db', () => ({
  prisma: prismaMock,
}))

mock.module('./ai', () => ({
  aiService: {
    generateText: generateTextMock,
    generateImage: generateImageMock,
  },
}))

describe('ExtractionService', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let extractionService: any

  beforeAll(async () => {
    // Dynamic import to ensure mocks are applied
    const mod = await import('./extraction')
    extractionService = mod.extractionService
  })

  test('analyzeImage calls AI service and returns keyed object', async () => {
    const file = new File(['dummy'], 'test.png', { type: 'image/png' })
    const result = await extractionService.analyzeImage(file)

    expect(prismaMock.category.findMany).toHaveBeenCalled()
    expect(generateTextMock).toHaveBeenCalled()

    expect(result).toHaveProperty('Headwear')
    expect(result.Headwear).toBeArray()
    expect(result.Headwear[0].name).toBe('Helmet')
  })

  test('extractAsset calls AI service with correct prompt from DB', async () => {
    // Clear previous calls
    generateImageMock.mockClear()

    const file = new File(['dummy'], 'test.png', { type: 'image/png' })
    const name = 'Magic Helmet'
    const category = 'Headwear'

    const result = await extractionService.extractAsset(file, category, { name })

    expect(result).toBe('data:image/png;base64,mockImage')
    expect(prismaMock.category.findFirst).toHaveBeenCalledWith({ where: { name: category } })
    expect(generateImageMock).toHaveBeenCalled()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const callArgs = generateImageMock.mock.calls[0] as unknown as any[]
    const prompt = callArgs[0] as string

    expect(prompt).toBe('Extract Magic Helmet')
  })
})
