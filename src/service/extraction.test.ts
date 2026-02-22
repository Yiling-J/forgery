import { describe, expect, test, mock, beforeAll } from 'bun:test'

// Mock dependencies
const generateTextMock = mock(async () => ({
  assets: [
    {
      item_name: 'Helmet',
      description: 'A rusty helmet',
      category: 'Headwear',
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

describe('ExtractionService', () => {
  let extractionService: any

  beforeAll(async () => {
    // Dynamic import to ensure mocks are applied
    const mod = await import('./extraction')
    extractionService = mod.extractionService
  })

  test('analyzeImage calls AI service', async () => {
    const file = new File(['dummy'], 'test.png', { type: 'image/png' })
    const result = await extractionService.analyzeImage(file)
    expect(result.assets.length).toBe(1)
    expect(result.assets[0].item_name).toBe('Helmet')
    expect(generateTextMock).toHaveBeenCalled()
  })

  test('extractAsset calls AI service with correct prompt', async () => {
    // Clear previous calls
    generateImageMock.mockClear()

    const file = new File(['dummy'], 'test.png', { type: 'image/png' })
    const name = 'Magic Helmet'
    const description = 'A glowing magical helmet'
    const category = 'Headwear'
    const hint = 'Focus on the glow'

    const result = await extractionService.extractAsset(file, name, description, category, undefined, hint)

    expect(result).toBe('data:image/png;base64,mockImage')
    expect(generateImageMock).toHaveBeenCalled()

    const callArgs = generateImageMock.mock.calls[0] as unknown as any[]
    const prompt = callArgs[0] as string

    expect(prompt).toContain('Task: Asset Extraction')
    expect(prompt).toContain('Target Item: Magic Helmet')
    expect(prompt).toContain('Description: A glowing magical helmet')
    expect(prompt).toContain('Category: Headwear')
    expect(prompt).toContain('User Hint: Focus on the glow')
  })
})
