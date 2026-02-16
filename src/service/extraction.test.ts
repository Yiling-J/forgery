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

// Create a spy for the extract method to verify dimensions
const extractMock = mock(() => ({
  toBuffer: () => Promise.resolve(Buffer.from('mockCrop')),
}))

mock.module('sharp', () => {
  const sharpInstance = {
    metadata: () => Promise.resolve({ width: 300, height: 100 }),
    clone: () => ({
      extract: extractMock,
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

  test('cropAssets splits image based on grid with padding', async () => {
    const assets = [
      {
        item_name: 'Helmet',
        description: 'desc',
        category: 'Headwear',
      },
    ]
    // 1 asset -> 1x3 grid. width 300 / 3 = 100. height 100 / 1 = 100.
    // Padding is 3px.
    // Expected crop: left: 0+3=3, top: 0+3=3, width: 100-6=94, height: 100-6=94

    extractMock.mockClear()
    const result = await extractionService.cropAssets('data:image/png;base64,mockSheet', assets)

    expect(result.length).toBe(1)
    expect(result[0].name).toBe('Helmet')
    expect(result[0].base64).toContain('data:image/png;base64,')

    expect(extractMock).toHaveBeenCalled()
    const callArgs = extractMock.mock.calls[0]
    const options = callArgs[0]

    expect(options.left).toBe(3)
    expect(options.top).toBe(3)
    expect(options.width).toBe(94)
    expect(options.height).toBe(94)
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
