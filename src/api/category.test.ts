import { describe, expect, test, mock } from 'bun:test'

const categoryServiceMock = {
  listCategories: mock(),
  getCategory: mock(),
  createCategory: mock(),
  updateCategory: mock(),
  deleteCategory: mock(),
  listDataByCategory: mock(),
}

mock.module('../service/category', () => ({
  categoryService: categoryServiceMock,
}))

const collectionServiceMock = {
  listCollections: mock(),
}

mock.module('../service/collection', () => ({
  collectionService: collectionServiceMock,
}))

import app from './category'

describe('Category API', () => {
  test('GET / should list categories', async () => {
    categoryServiceMock.listCategories.mockResolvedValueOnce([
        { id: '1', name: 'Cat1', imagePrompt: '{}', options: '[]' }
    ])

    const res = await app.request('/?projectId=p1')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toBeArray()
    expect(body[0].name).toBe('Cat1')
  })

  test('POST / should create category', async () => {
    categoryServiceMock.createCategory.mockResolvedValueOnce({
        id: '2',
        name: 'New',
        imagePrompt: '{"text":"t","imageIds":[]}',
        options: '[]'
    })

    const res = await app.request('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'New',
            projectId: 'p1',
            imagePrompt: { text: 't', imageIds: [] },
            options: []
        })
    })

    expect(res.status).toBe(201)
    expect(categoryServiceMock.createCategory).toHaveBeenCalled()
  })

  test('PATCH /:id should update category', async () => {
    categoryServiceMock.updateCategory.mockResolvedValueOnce({
        id: '1',
        name: 'Upd',
        imagePrompt: '{}',
        options: '[]'
    })

    const res = await app.request('/1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Upd' })
    })

    expect(res.status).toBe(200)
    expect(categoryServiceMock.updateCategory).toHaveBeenCalled()
  })

  test('DELETE /:id should delete category', async () => {
    categoryServiceMock.deleteCategory.mockResolvedValueOnce({ id: '1' })

    const res = await app.request('/1', { method: 'DELETE' })
    expect(res.status).toBe(200)
    expect(categoryServiceMock.deleteCategory).toHaveBeenCalledWith('1')
  })

  test('GET /:id/data should list data', async () => {
    categoryServiceMock.listDataByCategory.mockResolvedValueOnce({ items: [], total: 0 })

    const res = await app.request('/1/data?page=1&limit=10&option=opt1')
    expect(res.status).toBe(200)
    expect(categoryServiceMock.listDataByCategory).toHaveBeenCalledWith('1', {
        page: 1,
        limit: 10,
        option: 'opt1'
    })
  })

  test('GET /:id/collections should list collections', async () => {
    collectionServiceMock.listCollections.mockResolvedValueOnce([])

    const res = await app.request('/1/collections?page=1&limit=10')
    expect(res.status).toBe(200)
    expect(collectionServiceMock.listCollections).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        categoryId: '1'
    })
  })
})
