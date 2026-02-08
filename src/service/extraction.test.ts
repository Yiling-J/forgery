import { describe, expect, test, mock } from 'bun:test'
import { extractionService } from './extraction'

// Mock dependencies
mock.module('./ai', () => ({
  aiService: {
    generateText: mock(async () => ({
      assets: [
        {
          item_name: 'Helmet',
          description: 'A rusty helmet',
          background_color: 'Red',
          category: 'Head',
        },
      ],
    })),
    generateImage: mock(async () => 'data:image/png;base64,mockImage'),
  },
}))

mock.module('./file', () => ({
  fileService: {
    saveBase64Image: mock(async () => ({
      path: 'data/files/123.webp',
      filename: '123.webp',
      mimeType: 'image/webp',
    })),
  },
}))

mock.module('./category', () => ({
  categoryService: {
    findOrCreate: mock(async () => 'cat_123'),
  },
}))

mock.module('./asset', () => ({
  assetService: {
    createAssetRecord: mock(async () => ({ id: 'asset_123' })),
  },
}))

mock.module('./equipment', () => ({
  equipmentService: {
    createEquipment: mock(async () => ({ id: 'eq_123', name: 'Helmet' })),
  },
}))

mock.module('sharp', () => {
  return () => ({
    metadata: () => Promise.resolve({ width: 100, height: 100 }),
    clone: () => ({
      extract: () => ({
        toBuffer: () => Promise.resolve(Buffer.from('mockCrop')),
      }),
    }),
  })
})

describe('ExtractionService', () => {
  test('analyzeImage calls AI service', async () => {
    const file = new File(['dummy'], 'test.png', { type: 'image/png' })
    const result = await extractionService.analyzeImage(file)
    expect(result.assets.length).toBe(1)
    expect(result.assets[0].item_name).toBe('Helmet')
  })

  test('generateTextureSheet calls AI service', async () => {
    const file = new File(['dummy'], 'test.png', { type: 'image/png' })
    const result = await extractionService.generateTextureSheet(file, [])
    expect(result).toBe('data:image/png;base64,mockImage')
  })
})
