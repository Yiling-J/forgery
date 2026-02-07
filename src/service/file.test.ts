import { describe, expect, test, mock } from 'bun:test'
import { FileService } from './file'

// Valid 1x1 PNG Base64
const VALID_PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const VALID_PNG_BUFFER = Buffer.from(VALID_PNG_BASE64, 'base64');

// Mock sharp
mock.module('sharp', () => {
  return () => ({
    webp: () => ({
      toBuffer: () => Promise.resolve(new Uint8Array([1, 2, 3]))
    })
  })
})

// Mock Bun.write
const mockWrite = mock((path: string, content: any) => Promise.resolve(content.length))
// @ts-ignore
Bun.write = mockWrite

describe('FileService', () => {
  test('saveFile saves a file and converts to webp if image', async () => {
    // Pass valid PNG buffer
    const file = new File([VALID_PNG_BUFFER], 'test.png', { type: 'image/png' })
    const result = await FileService.saveFile(file)

    expect(result.filename.endsWith('.webp')).toBe(true)
    expect(result.mimeType).toBe('image/webp')
    expect(mockWrite).toHaveBeenCalled()
    expect(mockWrite.mock.calls[0][0]).toContain('data/files')
  })

  test('saveBase64Image saves a base64 string as webp', async () => {
    // Pass valid base64
    const result = await FileService.saveBase64Image(VALID_PNG_BASE64)

    expect(result.filename.endsWith('.webp')).toBe(true)
    expect(mockWrite).toHaveBeenCalled()
  })
})
