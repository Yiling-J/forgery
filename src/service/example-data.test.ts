import { describe, it, expect, mock, beforeEach } from 'bun:test'

// 1. Mock node:fs for mkdirSync and existsSync
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockExistsSync = mock((path: string) => false)
const mockMkdirSync = mock(() => undefined)

mock.module('node:fs', () => ({
  existsSync: mockExistsSync,
  mkdirSync: mockMkdirSync,
}))

// 2. Mock Bun globals
const mockBunWrite = mock(() => Promise.resolve(0))
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockBunFile = mock((path: string) => ({
  exists: mock(() => Promise.resolve(false)),
  // @ts-ignore
  json: mock(() => Promise.resolve([])),
  arrayBuffer: mock(() => Promise.resolve(new ArrayBuffer(0))),
  text: mock(() => Promise.resolve('')),
}))

// @ts-ignore
global.Bun.write = mockBunWrite
// @ts-ignore
global.Bun.file = mockBunFile

// Mock prisma client
const mockPrisma = {
  character: {
    // @ts-ignore
    findMany: mock(() => Promise.resolve([])),
    // @ts-ignore
    create: mock(() => Promise.resolve({})),
    // @ts-ignore
    findUnique: mock(() => Promise.resolve({})),
  },
  equipment: {
    // @ts-ignore
    findMany: mock(() => Promise.resolve([])),
    // @ts-ignore
    create: mock(() => Promise.resolve({})),
  },
  pose: {
    // @ts-ignore
    findMany: mock(() => Promise.resolve([])),
    // @ts-ignore
    create: mock(() => Promise.resolve({})),
  },
  expression: {
    // @ts-ignore
    findMany: mock(() => Promise.resolve([])),
    // @ts-ignore
    create: mock(() => Promise.resolve({})),
  },
  generation: {
    // @ts-ignore
    findMany: mock(() => Promise.resolve([])),
    // @ts-ignore
    create: mock(() => Promise.resolve({})),
  },
  // @ts-ignore
  asset: { create: mock(() => Promise.resolve({ id: 'mock-asset-id' })) },
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  $transaction: mock((cb: any) => cb(mockPrisma)),
}

mock.module('../db', () => ({
  prisma: mockPrisma,
}))

// Mock asset service
const mockAssetService = {
  createAssetFromBuffer: mock(() => Promise.resolve({ id: 'new-asset-id', path: 'new-path.webp' })),
}

mock.module('./asset', () => ({
  assetService: mockAssetService,
}))

// Import the service to test
import { exampleDataService } from './example-data'

describe('ExampleDataService', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockExistsSync.mockClear()
    mockMkdirSync.mockClear()
    mockBunWrite.mockClear()
    mockBunFile.mockClear()

    mockPrisma.character.findMany.mockClear()
    mockPrisma.equipment.findMany.mockClear()
    mockPrisma.pose.findMany.mockClear()
    mockPrisma.expression.findMany.mockClear()
    mockPrisma.generation.findMany.mockClear()

    mockPrisma.character.create.mockClear()
    mockPrisma.character.findUnique.mockClear()
    mockPrisma.equipment.create.mockClear()
    mockPrisma.pose.create.mockClear()
    mockPrisma.expression.create.mockClear()
    mockPrisma.generation.create.mockClear()

    mockAssetService.createAssetFromBuffer.mockClear()
  })

  describe('export', () => {
    it('should export all data types to JSON files', async () => {
      // Setup mock return values for findMany
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockPrisma.character.findMany.mockResolvedValue([
        {
          id: 'c1',
          name: 'Char 1',
          description: 'Desc 1',
          image: { name: 'img1.png', type: 'image/png', path: 'img1.webp' },
        },
      ] as any)
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockPrisma.equipment.findMany.mockResolvedValue([
        {
          id: 'e1',
          name: 'Eq 1',
          description: 'Desc E1',
          category: 'Cat1',
          image: { name: 'imgE1.png', type: 'image/png', path: 'imgE1.webp' },
        },
      ] as any)
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockPrisma.pose.findMany.mockResolvedValue([
        {
          id: 'p1',
          name: 'Pose 1',
          image: { name: 'imgP1.png', type: 'image/png', path: 'imgP1.webp' },
        },
      ] as any)
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockPrisma.expression.findMany.mockResolvedValue([
        {
          id: 'ex1',
          name: 'Expr 1',
          image: { name: 'imgEx1.png', type: 'image/png', path: 'imgEx1.webp' },
        },
      ] as any)
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockPrisma.generation.findMany.mockResolvedValue([
        {
          id: 'g1',
          characterId: 'c1',
          userPrompt: 'prompt',
          pose: 'pose',
          expression: 'expr',
          image: { name: 'imgG1.png', type: 'image/png', path: 'imgG1.webp' },
          equipments: [{ equipmentId: 'e1' }],
        },
      ] as any)

      // Mock Bun.file to exist so copyAsset works
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockBunFile.mockImplementation((path: string) => ({
        exists: mock(() => Promise.resolve(path.startsWith('data/files'))),
        json: mock(() => Promise.resolve([])),
        arrayBuffer: mock(() => Promise.resolve(new ArrayBuffer(0))),
        text: mock(() => Promise.resolve('')),
      }))

      await exampleDataService.export()

      // Verify directories created
      expect(mockMkdirSync).toHaveBeenCalledTimes(2) // example-data and example-data/assets

      // Verify data fetching
      expect(mockPrisma.character.findMany).toHaveBeenCalled()
      expect(mockPrisma.equipment.findMany).toHaveBeenCalled()
      expect(mockPrisma.pose.findMany).toHaveBeenCalled()
      expect(mockPrisma.expression.findMany).toHaveBeenCalled()
      expect(mockPrisma.generation.findMany).toHaveBeenCalled()

      // Verify JSON writing
      // 5 JSON files + 5 Asset copies = 10 calls to Bun.write
      expect(mockBunWrite).toHaveBeenCalledTimes(10)

      const calls = mockBunWrite.mock.calls
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const writtenPaths = calls.map((c: any) => c[0])
      expect(writtenPaths).toContain('example-data/characters.json')
      expect(writtenPaths).toContain('example-data/equipments.json')
      expect(writtenPaths).toContain('example-data/poses.json')
      expect(writtenPaths).toContain('example-data/expressions.json')
      expect(writtenPaths).toContain('example-data/looks.json')
    })
  })

  describe('import', () => {
    it('should import data from JSON files', async () => {
      // Mock directory existence
      mockExistsSync.mockReturnValue(true)

      // Mock Bun.file for reading JSONs
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockBunFile.mockImplementation((path: string) => {
        const mockExists = mock(() => Promise.resolve(true))
        const mockJson = mock(() => {
          if (path.includes('characters.json'))
            return Promise.resolve([
              {
                id: 'c1',
                name: 'Char 1',
                description: 'Desc 1',
                asset: { name: 'img1', type: 'image/png', path: 'img1.webp' },
              },
            ])
          if (path.includes('equipments.json'))
            return Promise.resolve([
              {
                id: 'e1',
                name: 'Eq 1',
                description: 'Desc E1',
                category: 'Cat1',
                asset: { name: 'imgE1', type: 'image/png', path: 'imgE1.webp' },
              },
            ])
          if (path.includes('poses.json'))
            return Promise.resolve([
              {
                id: 'p1',
                name: 'Pose 1',
                asset: { name: 'imgP1', type: 'image/png', path: 'imgP1.webp' },
              },
            ])
          if (path.includes('expressions.json'))
            return Promise.resolve([
              {
                id: 'ex1',
                name: 'Expr 1',
                asset: { name: 'imgEx1', type: 'image/png', path: 'imgEx1.webp' },
              },
            ])
          if (path.includes('looks.json'))
            return Promise.resolve([
              {
                id: 'g1',
                characterId: 'c1',
                userPrompt: 'prompt',
                pose: 'pose',
                expression: 'expr',
                asset: { name: 'imgG1', type: 'image/png', path: 'imgG1.webp' },
                equipmentIds: ['e1'],
              },
            ])
          return Promise.resolve([])
        })
        const mockArrayBuffer = mock(() => Promise.resolve(new ArrayBuffer(10)))

        return {
          exists: mockExists,
          // @ts-ignore
          json: mockJson,
          arrayBuffer: mockArrayBuffer,
          text: mock(() => Promise.resolve('')),
        }
      })

      // Mock Prisma finds needed for validation
      // @ts-ignore
      mockPrisma.character.findUnique.mockResolvedValue({ id: 'c1' })

      await exampleDataService.import()

      // Verify asset creation (5 assets)
      expect(mockAssetService.createAssetFromBuffer).toHaveBeenCalledTimes(5)

      // Verify DB creation
      expect(mockPrisma.character.create).toHaveBeenCalledTimes(1)
      expect(mockPrisma.equipment.create).toHaveBeenCalledTimes(1)
      expect(mockPrisma.pose.create).toHaveBeenCalledTimes(1)
      expect(mockPrisma.expression.create).toHaveBeenCalledTimes(1)
      expect(mockPrisma.generation.create).toHaveBeenCalledTimes(1)
    })

    it('should skip import if example data folder does not exist', async () => {
      mockExistsSync.mockReturnValue(false)
      await exampleDataService.import()
      expect(mockBunFile).not.toHaveBeenCalled()
    })
  })
})
