import { describe, it, expect, mock, afterEach } from 'bun:test'

const mockPrisma = {
  asset: {
    create: mock(),
    findUnique: mock(),
  },
}

mock.module('ulidx', () => ({
  ulid: () => 'mocked-ulid',
}))

mock.module('../db', () => ({
  prisma: mockPrisma,
}))

const mockFileService = {
  saveFile: mock(() => Promise.resolve({ path: 'data/files/mock.webp', filename: 'mock.webp', mimeType: 'image/webp' })),
  saveBuffer: mock(() => Promise.resolve({ path: 'data/files/mock.webp', filename: 'mock.webp', mimeType: 'image/webp' })),
}

mock.module('./file', () => ({
  fileService: mockFileService,
}))

describe('AssetService', () => {
  afterEach(() => {
    mockPrisma.asset.create.mockClear()
    mockPrisma.asset.findUnique.mockClear()
    mockFileService.saveFile.mockClear()
    mockFileService.saveBuffer.mockClear()
  })

  it('createAsset should save file and create db record', async () => {
    // @ts-ignore
    const { assetService } = await import(`./asset?v=${Date.now()}`)
    const file = new File(['content'], 'test.png', { type: 'image/png' })
    const meta = { name: 'Test Asset', type: 'image/png' }

    mockPrisma.asset.create.mockResolvedValue({
      id: 'mocked-ulid',
      name: meta.name,
      type: 'image/webp',
      path: 'mock.webp',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const result = await assetService.createAsset(file, meta)

    expect(mockFileService.saveFile).toHaveBeenCalled()
    expect(mockPrisma.asset.create).toHaveBeenCalled()

    // Check call arguments
    // Use expect.objectContaining for partial match
    const createCall = mockPrisma.asset.create.mock.calls[0][0]
    expect(createCall.data).toEqual(expect.objectContaining({
        type: 'image/webp',
        path: 'mock.webp',
        id: 'mocked-ulid'
    }))

    expect(result.name).toBe(meta.name)
  })
})
