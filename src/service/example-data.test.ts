import { describe, it, expect, mock, beforeEach } from 'bun:test'

// 1. Define mocks before importing the module under test
// Mock filesystem operations
// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockExistsSync = mock((path: string) => false)
const mockMkdirSync = mock(() => undefined)
// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockReadFileSync = mock((path: string) => Buffer.from(''))
const mockWriteFileSync = mock(() => undefined)
const mockCopyFileSync = mock(() => undefined)

mock.module('node:fs', () => ({
  existsSync: mockExistsSync,
  mkdirSync: mockMkdirSync,
  readFileSync: mockReadFileSync,
  writeFileSync: mockWriteFileSync,
  copyFileSync: mockCopyFileSync,
}))

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

// 2. Import the service to test
import { exampleDataService } from './example-data'

describe('ExampleDataService', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockExistsSync.mockClear()
    mockMkdirSync.mockClear()
    mockReadFileSync.mockClear()
    mockWriteFileSync.mockClear()
    mockCopyFileSync.mockClear()

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
          subCategory: null,
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

      // Mock existsSync to return true for source files so copyFileSync is called
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockExistsSync.mockImplementation((path: any) => path.startsWith('data/files'))

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
      expect(mockWriteFileSync).toHaveBeenCalledTimes(5)

      // Check content of written files (can check calls arguments)
      const calls = mockWriteFileSync.mock.calls
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const writtenFiles = calls.map((c: any) => c[0])
      expect(writtenFiles).toContain('example-data/characters.json')
      expect(writtenFiles).toContain('example-data/equipments.json')
      expect(writtenFiles).toContain('example-data/poses.json')
      expect(writtenFiles).toContain('example-data/expressions.json')
      expect(writtenFiles).toContain('example-data/looks.json')

      // Verify asset copying
      // 1 char + 1 equip + 1 pose + 1 expr + 1 gen = 5 assets
      expect(mockCopyFileSync).toHaveBeenCalledTimes(5)
    })
  })

  describe('import', () => {
    it('should import data from JSON files', async () => {
      // Mock file existence to simulate data present
      mockExistsSync.mockImplementation(() => true)

      // Mock reading JSON files
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockReadFileSync.mockImplementation((path: any) => {
        if (path.includes('characters.json'))
          return JSON.stringify([
            {
              id: 'c1',
              name: 'Char 1',
              description: 'Desc 1',
              asset: { name: 'img1', type: 'image/png', path: 'img1.webp' },
            },
          ])
        if (path.includes('equipments.json'))
          return JSON.stringify([
            {
              id: 'e1',
              name: 'Eq 1',
              description: 'Desc E1',
              category: 'Cat1',
              subCategory: null,
              asset: { name: 'imgE1', type: 'image/png', path: 'imgE1.webp' },
            },
          ])
        if (path.includes('poses.json'))
          return JSON.stringify([
            {
              id: 'p1',
              name: 'Pose 1',
              asset: { name: 'imgP1', type: 'image/png', path: 'imgP1.webp' },
            },
          ])
        if (path.includes('expressions.json'))
          return JSON.stringify([
            {
              id: 'ex1',
              name: 'Expr 1',
              asset: { name: 'imgEx1', type: 'image/png', path: 'imgEx1.webp' },
            },
          ])
        if (path.includes('looks.json'))
          return JSON.stringify([
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
        // Mock reading asset file
        return Buffer.from('fake-image-data')
      })

      // Mock Prisma finds needed for validation (e.g. check character exists for generation)
      // @ts-ignore
      mockPrisma.character.findUnique.mockResolvedValue({ id: 'c1' })

      await exampleDataService.import()

      // Verify asset creation (5 assets)
      expect(mockAssetService.createAssetFromBuffer).toHaveBeenCalledTimes(5)

      // Verify DB creation
      expect(mockPrisma.character.create).toHaveBeenCalledTimes(1)
      expect(mockPrisma.character.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ id: 'c1', name: 'Char 1' }),
        }),
      )

      expect(mockPrisma.equipment.create).toHaveBeenCalledTimes(1)
      expect(mockPrisma.equipment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ id: 'e1', name: 'Eq 1' }),
        }),
      )

      expect(mockPrisma.pose.create).toHaveBeenCalledTimes(1)
      expect(mockPrisma.pose.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ id: 'p1', name: 'Pose 1' }),
        }),
      )

      expect(mockPrisma.expression.create).toHaveBeenCalledTimes(1)
      expect(mockPrisma.expression.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ id: 'ex1', name: 'Expr 1' }),
        }),
      )

      expect(mockPrisma.generation.create).toHaveBeenCalledTimes(1)
      expect(mockPrisma.generation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            id: 'g1',
            characterId: 'c1',
            equipments: {
              create: [{ equipment: { connect: { id: 'e1' } } }],
            },
          }),
        }),
      )
    })

    it('should skip import if example data folder does not exist', async () => {
      mockExistsSync.mockReturnValue(false)

      await exampleDataService.import()

      expect(mockReadFileSync).not.toHaveBeenCalled()
      expect(mockPrisma.character.create).not.toHaveBeenCalled()
    })

    it('should skip generation import if referenced character is missing', async () => {
      mockExistsSync.mockImplementation(() => true)

      // Only return looks.json
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockReadFileSync.mockImplementation((path: any) => {
        if (path.includes('looks.json'))
          return JSON.stringify([
            {
              id: 'g1',
              characterId: 'missing-char',
              userPrompt: 'prompt',
              pose: 'pose',
              expression: 'expr',
              asset: { name: 'imgG1', type: 'image/png', path: 'imgG1.webp' },
              equipmentIds: ['e1'],
            },
          ])
        return Buffer.from('')
      })

      // Return null for character lookup
      // @ts-ignore
      mockPrisma.character.findUnique.mockResolvedValue(null)

      // Prevent reading other files to focus test
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockExistsSync.mockImplementation((path: any) =>
        path.includes('looks.json') || path.includes('assets'),
      )

      await exampleDataService.import()

      expect(mockPrisma.generation.create).not.toHaveBeenCalled()
    })
  })
})
