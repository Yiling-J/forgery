import { describe, expect, test, mock, beforeAll } from 'bun:test'

const prismaMock = {
  data: {
    findUnique: mock(),
    create: mock(),
    update: mock(),
    delete: mock(),
  },
}

mock.module('../db', () => ({
  prisma: prismaMock,
}))

describe('DataService', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let dataService: any

  beforeAll(async () => {
    const mod = await import(`./data?v=${Date.now()}`)
    dataService = mod.dataService
  })

  test('getData should return data item', async () => {
    prismaMock.data.findUnique.mockResolvedValueOnce({ id: '1', name: 'Item' })
    const result = await dataService.getData('1')
    expect(result).toEqual({ id: '1', name: 'Item' })
    expect(prismaMock.data.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: { image: true, category: true }
    })
  })

  test('createData should create data item', async () => {
    const input = { name: 'New Item', categoryId: 'c1' }
    prismaMock.data.create.mockResolvedValueOnce({ id: '2', ...input })
    const result = await dataService.createData(input)
    expect(result).toEqual({ id: '2', ...input })
    expect(prismaMock.data.create).toHaveBeenCalledWith({ data: input })
  })

  test('updateData should update data item', async () => {
    const input = { name: 'Updated Item' }
    prismaMock.data.update.mockResolvedValueOnce({ id: '1', ...input })
    const result = await dataService.updateData('1', input)
    expect(result).toEqual({ id: '1', ...input })
    expect(prismaMock.data.update).toHaveBeenCalledWith({ where: { id: '1' }, data: input })
  })

  test('deleteData should delete data item', async () => {
    prismaMock.data.delete.mockResolvedValueOnce({ id: '1' })
    const result = await dataService.deleteData('1')
    expect(result).toEqual({ id: '1' })
    expect(prismaMock.data.delete).toHaveBeenCalledWith({ where: { id: '1' } })
  })
})
