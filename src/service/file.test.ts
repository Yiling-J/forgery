import { describe, expect, test, mock, beforeAll } from 'bun:test'

// Mock ulidx
mock.module('ulidx', () => ({
  ulid: () => 'test-ulid',
}))

// Mock sharp
const sharpChain: any = {
  resize: mock(() => sharpChain),
  webp: mock(() => sharpChain),
  toBuffer: mock(() => Promise.resolve(Buffer.from([1, 2, 3]))),
}

mock.module('sharp', () => {
  return {
    default: () => sharpChain,
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

    expect(result.filename).toBe('test-ulid.webp')
    expect(result.mimeType).toBe('image/webp')
    // Check if write was called
    expect(mockWrite).toHaveBeenCalled()
    // The first call's first argument (path) should contain data/files
    const writeCalls = mockWrite.mock.calls
    const lastCall = writeCalls[writeCalls.length - 1]
    expect(lastCall[0]).toContain('data/files')

    // Check if sharp resize was called
    expect(sharpChain.resize).toHaveBeenCalled()
    expect(sharpChain.resize).toHaveBeenCalledWith({
        width: 2048,
        height: 2048,
        fit: 'outside',
        withoutEnlargement: true,
    })
  })

  test('saveBase64Image saves a base64 string as webp', async () => {
    // Pass valid base64
    const result = await fileService.saveBase64Image(VALID_PNG_BASE64)

    expect(result.filename).toBe('test-ulid.webp')
    expect(mockWrite).toHaveBeenCalled()
    expect(sharpChain.resize).toHaveBeenCalled()
  })

  test('saveBuffer saves a buffer and converts to webp if mimeType is image', async () => {
      const result = await fileService.saveBuffer(VALID_PNG_BUFFER, 'test.png', 'image/png')

      expect(result.filename).toBe('test-ulid.webp')
      expect(result.mimeType).toBe('image/webp')
      expect(mockWrite).toHaveBeenCalled()
      expect(sharpChain.resize).toHaveBeenCalled()
  })

  test('saveBuffer saves original if not image', async () => {
      const result = await fileService.saveBuffer(VALID_PNG_BUFFER, 'test.bin', 'application/octet-stream')

      expect(result.filename).toBe('test-ulid.bin')
      expect(result.mimeType).toBe('application/octet-stream')
      expect(mockWrite).toHaveBeenCalled()
  })
})
