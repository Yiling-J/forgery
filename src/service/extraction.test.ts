import { describe, expect, test, mock, beforeAll } from 'bun:test'

// Mock dependencies
const generateTextMock = mock(async () => ({
  assets: [
    {
      item_name: 'Helmet',
      description: 'A rusty helmet',
      category: 'Headwear',
      sub_category: 'Helmet',
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

mock.module('sharp', () => {
  const sharpInstance = {
    metadata: () => Promise.resolve({ width: 300, height: 100 }),
    clone: () => ({
      extract: () => ({
        toBuffer: () => Promise.resolve(Buffer.from('mockCrop')),
      }),
    }),
  }
  return {
    default: () => sharpInstance,
  }
})

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
  })

  test('generateTextureSheet calls AI service', async () => {
    const file = new File(['dummy'], 'test.png', { type: 'image/png' })
    const assets = [
      {
        item_name: 'Helmet',
        description: 'desc',
        category: 'Headwear',
      },
    ]
    const result = await extractionService.generateTextureSheet(file, assets)
    expect(result).toBe('data:image/png;base64,mockImage')
  })

  test('cropAssets splits image based on grid', async () => {
    const assets = [
      {
        item_name: 'Helmet',
        description: 'desc',
        category: 'Headwear',
      },
    ]
    // 1 asset -> 1x3 grid. width 300 / 3 = 100. height 100 / 1 = 100.
    const result = await extractionService.cropAssets('data:image/png;base64,mockSheet', assets)
    expect(result.length).toBe(1)
    expect(result[0].name).toBe('Helmet')
    expect(result[0].base64).toContain('data:image/png;base64,')
  })

  test('refineAsset calls AI service with correct prompt', async () => {
    // Clear previous calls
    generateImageMock.mockClear()

    const base64 = 'data:image/png;base64,mockImageContent'
    const result = await extractionService.refineAsset(base64)

    expect(result).toBe('data:image/png;base64,mockImage')
    expect(generateImageMock).toHaveBeenCalled()

    const callArgs = generateImageMock.mock.calls[0]
    const prompt = callArgs[0]

    expect(prompt).toContain('CRITICAL: Detect and remove any straight lines, black borders, or frame-like artifacts')
    expect(prompt).toContain('These are cropping artifacts and MUST be removed')
  })
})
