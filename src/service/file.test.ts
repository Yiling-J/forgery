import { describe, expect, test, mock, beforeAll } from 'bun:test'

// Mock sharp
mock.module('sharp', () => {
  const sharpInstance = {
    webp: () => ({
      toBuffer: () => Promise.resolve(Buffer.from([1, 2, 3])),
    }),
  }
  return {
    default: () => sharpInstance,
  }
})

// Mock Bun.write
const mockWrite = mock((path: string, content: string | Uint8Array) =>
  Promise.resolve(content.length),
)
// @ts-ignore
Bun.write = mockWrite

describe('FileService', () => {
  let fileService: any

  beforeAll(async () => {
    // Dynamic import to ensure mocks are applied
    const mod = await import('./file?v=' + Date.now())
    fileService = mod.fileService
  })

  // Valid 1x1 PNG Base64
  const VALID_PNG_BASE64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  const VALID_PNG_BUFFER = Buffer.from(VALID_PNG_BASE64, 'base64')

  test('saveFile saves a file and converts to webp if image', async () => {
    // Pass valid PNG buffer
    const file = new File([VALID_PNG_BUFFER], 'test.png', { type: 'image/png' })
    const result = await fileService.saveFile(file)

    expect(result.filename.endsWith('.webp')).toBe(true)
    expect(result.mimeType).toBe('image/webp')
    // Check if write was called
    expect(mockWrite).toHaveBeenCalled()
    // The first call's first argument (path) should contain data/files
    const writeCalls = mockWrite.mock.calls
    const lastCall = writeCalls[writeCalls.length - 1]
    expect(lastCall[0]).toContain('data/files')
  })

  test('saveBase64Image saves a base64 string as webp', async () => {
    // Pass valid base64
    const result = await fileService.saveBase64Image(VALID_PNG_BASE64)

    expect(result.filename.endsWith('.webp')).toBe(true)
    expect(mockWrite).toHaveBeenCalled()
  })
})
