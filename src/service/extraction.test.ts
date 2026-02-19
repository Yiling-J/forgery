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
    // 1 asset -> 2x2 grid. width 300 / 2 = 150. height 100 / 2 = 50.
    // Padding is 3px.
    // Expected crop: left: 0+3=3, top: 0+3=3, width: 150-6=144, height: 50-6=44

    extractMock.mockClear()
    const result = await extractionService.cropAssets('data:image/png;base64,mockSheet', assets)

    expect(result.length).toBe(1)
    expect(result[0].name).toBe('Helmet')
    expect(result[0].base64).toContain('data:image/png;base64,')

    expect(extractMock).toHaveBeenCalled()
    // Cast to unknown then any array to avoid tuple length errors
    const callArgs = extractMock.mock.calls[0] as unknown as any[]
    const options = callArgs[0]

    expect(options?.left).toBe(3)
    expect(options?.top).toBe(3)
    expect(options?.width).toBe(144)
    expect(options?.height).toBe(44)
  })

  test('cropAssets uses splitConfig correctly', async () => {
    // 300x100 image mock
    const assets = [
      { item_name: 'A', description: 'd', category: 'c' }, // (0,0)
      { item_name: 'B', description: 'd', category: 'c' }, // (0,1)
      { item_name: 'C', description: 'd', category: 'c' }, // (1,0)
      { item_name: 'D', description: 'd', category: 'c' }, // (1,1)
    ]
    // 4 assets -> 2x2 grid.

    const splitConfig = {
      verticalLines: [0.3333333333333333], // x=100
      horizontalLines: [0.66], // y=66
    }

    extractMock.mockClear()

    await extractionService.cropAssets('data:image/png;base64,mockSheet', assets, splitConfig)

    // We expect 4 calls.
    expect(extractMock).toHaveBeenCalledTimes(4)

    // Call 0 (Item A): 0,0 -> x=0..100, y=0..66.
    // Padding 3.
    // Expected: left: 3, top: 3, width: 94, height: 60.
    const args0 = extractMock.mock.calls[0][0] as any
    expect(args0.left).toBe(3)
    expect(args0.top).toBe(3)
    expect(args0.width).toBe(94)
    expect(args0.height).toBe(60)

    // Call 1 (Item B): 0,1 -> x=100..300, y=0..66.
    // Expected: left: 103, top: 3, width: 194, height: 60.
    const args1 = extractMock.mock.calls[1][0] as any
    expect(args1.left).toBe(103)
    expect(args1.top).toBe(3)
    expect(args1.width).toBe(194)
    expect(args1.height).toBe(60)
  })

  test('refineAsset calls AI service with correct prompt', async () => {
    // Clear previous calls
    generateImageMock.mockClear()

    const base64 = 'data:image/png;base64,mockImageContent'
    const result = await extractionService.refineAsset(base64)

    expect(result).toBe('data:image/png;base64,mockImage')
    expect(generateImageMock).toHaveBeenCalled()

    const callArgs = generateImageMock.mock.calls[0] as unknown as any[]
    const prompt = callArgs[0] as string

    expect(prompt).toContain('Task: Asset Refinement')
    expect(prompt).toContain('Return only the image.')
  })
})
