import { describe, it, expect, mock, afterEach } from 'bun:test'

const mockPrisma = {
  asset: {
    create: mock(),
    findUnique: mock(),
  },
}

const mockFileSystem = {
  writeFile: mock(),
}

mock.module('../db', () => ({
  prisma: mockPrisma,
}))

mock.module('../lib/fileSystem', () => mockFileSystem)

describe('AssetService', () => {
  afterEach(() => {
    mockPrisma.asset.create.mockClear()
    mockPrisma.asset.findUnique.mockClear()
    mockFileSystem.writeFile.mockClear()
  })

  it('createAsset should save file and create db record', async () => {
    // @ts-ignore
    const { AssetService } = await import(`./asset?v=${Date.now()}`)
    const file = new File(['content'], 'test.png', { type: 'image/png' })
    const meta = { name: 'Test Asset', type: 'image/png' }

    mockPrisma.asset.create.mockResolvedValue({
      id: '01HRKV...',
      name: meta.name,
      type: meta.type,
      path: 'data/files/01HRKV....png',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const result = await AssetService.createAsset(file, meta)

    expect(mockFileSystem.writeFile).toHaveBeenCalled()
    expect(mockPrisma.asset.create).toHaveBeenCalled()
    expect(result.name).toBe(meta.name)
  })
})
