import { describe, expect, test, mock, beforeAll } from 'bun:test'

const prismaMock = {
  category: {
    findMany: mock(),
    findUnique: mock(),
    create: mock(),
    update: mock(),
    delete: mock(),
  },
  data: {
    findMany: mock(),
    count: mock(),
  },
}

mock.module('../db', () => ({
  prisma: prismaMock,
}))

describe('CategoryService', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let categoryService: any

  beforeAll(async () => {
    const mod = await import(`./category?v=${Date.now()}`)
    categoryService = mod.categoryService
  })

  test('listCategories should return categories', async () => {
    prismaMock.category.findMany.mockResolvedValueOnce([{ id: '1', name: 'Test' }])
    const result = await categoryService.listCategories('p1')
    expect(result).toEqual([{ id: '1', name: 'Test' }])
    expect(prismaMock.category.findMany).toHaveBeenCalledWith({ where: { projectId: 'p1' }, orderBy: { name: 'asc' } })
  })

  test('getCategory should return a category', async () => {
    prismaMock.category.findUnique.mockResolvedValueOnce({ id: '1', name: 'Test' })
    const result = await categoryService.getCategory('1')
    expect(result).toEqual({ id: '1', name: 'Test' })
    expect(prismaMock.category.findUnique).toHaveBeenCalledWith({ where: { id: '1' } })
  })

  test('createCategory should create a category', async () => {
    const input = { name: 'New Cat', description: 'Desc' }
    prismaMock.category.create.mockResolvedValueOnce({ id: '2', ...input })
    const result = await categoryService.createCategory(input)
    expect(result).toEqual({ id: '2', ...input })
    expect(prismaMock.category.create).toHaveBeenCalledWith({ data: input })
  })

  test('updateCategory should update a category', async () => {
    const input = { name: 'Updated Cat' }
    prismaMock.category.update.mockResolvedValueOnce({ id: '1', ...input })
    const result = await categoryService.updateCategory('1', input)
    expect(result).toEqual({ id: '1', ...input })
    expect(prismaMock.category.update).toHaveBeenCalledWith({ where: { id: '1' }, data: input })
  })

  test('deleteCategory should delete a category', async () => {
    prismaMock.category.delete.mockResolvedValueOnce({ id: '1' })
    const result = await categoryService.deleteCategory('1')
    expect(result).toEqual({ id: '1' })
    expect(prismaMock.category.delete).toHaveBeenCalledWith({ where: { id: '1' } })
  })

  test('listDataByCategory should return paginated data', async () => {
    prismaMock.data.findMany.mockResolvedValueOnce([{ id: 'd1', name: 'Data 1' }])
    prismaMock.data.count.mockResolvedValueOnce(1)

    const result = await categoryService.listDataByCategory('cat1', { page: 1, limit: 10 })

    expect(result.items).toHaveLength(1)
    expect(result.total).toBe(1)
    expect(result.totalPages).toBe(1)
    expect(prismaMock.data.findMany).toHaveBeenCalled()
    expect(prismaMock.data.count).toHaveBeenCalled()
  })

  test('listDataByCategory should filter by option', async () => {
    prismaMock.data.findMany.mockResolvedValueOnce([])
    prismaMock.data.count.mockResolvedValueOnce(0)

    await categoryService.listDataByCategory('cat1', { option: 'Opt1' })

    expect(prismaMock.data.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ option: 'Opt1' })
    }))
  })
})
