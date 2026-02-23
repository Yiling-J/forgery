import { describe, expect, test, mock, beforeAll } from 'bun:test'

// Mock dependencies
const generateTextMock = mock(async () => ({
  results: [
    {
      category: 'Equipment',
      data: [
        {
          name: 'Helmet',
          description: 'A rusty helmet',
          category: 'Headwear',
        },
      ],
    },
  ],
}))
const generateImageMock = mock(async () => 'data:image/png;base64,mockImage')

mock.module('./ai', () => ({
  aiService: {
    generateText: generateTextMock,
    generateImage: generateImageMock,
  },
}))

const mockCategory = {
  id: 'cat1',
  name: 'Equipment',
  description: 'Test category',
  maxCount: 9,
  fields: [
    { key: 'name', type: 'text', label: 'Name' },
    { key: 'description', type: 'text', label: 'Description' },
  ],
  imagePrompt: {
    text: 'Extract {{name}} with description {{description}}',
    imageIds: [],
  },
  enabled: true,
}

mock.module('./category', () => ({
  categoryService: {
    getAllCategories: mock(async () => [mockCategory]),
    getCategory: mock(async () => mockCategory),
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

  test('analyzeImage calls AI service', async () => {
    const file = new File(['dummy'], 'test.png', { type: 'image/png' })
    const result = await extractionService.analyzeImage(file)
    expect(result.results.length).toBe(1)
    const data = result.results[0].data as any[]
    expect(data[0].name).toBe('Helmet')
    expect(generateTextMock).toHaveBeenCalled()
  })

  test('extractAsset calls AI service with correct prompt', async () => {
    // Clear previous calls
    generateImageMock.mockClear()

    const file = new File(['dummy'], 'test.png', { type: 'image/png' })
    const values = {
      name: 'Magic Helmet',
      description: 'A glowing magical helmet',
    }
    const categoryId = 'cat1'

    const result = await extractionService.extractAsset(file, categoryId, values)

    expect(result).toBe('data:image/png;base64,mockImage')
    expect(generateImageMock).toHaveBeenCalled()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const callArgs = generateImageMock.mock.calls[0] as unknown as any[]
    const prompt = callArgs[0] as string

    // Check prompt generation via Handlebars
    expect(prompt).toContain('Extract Magic Helmet with description A glowing magical helmet')
  })
})
