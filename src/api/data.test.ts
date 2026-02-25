import { describe, expect, test, mock } from 'bun:test'

const dataServiceMock = {
  createData: mock(),
  updateData: mock(),
  deleteData: mock(),
}

mock.module('../service/data', () => ({
  dataService: dataServiceMock,
}))

import app from './data'

describe('Data API', () => {
  test('POST / should create data', async () => {
    dataServiceMock.createData.mockResolvedValueOnce({ id: '1', name: 'Item' })

    const res = await app.request('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Item',
            categoryId: 'c1'
        })
    })

    expect(res.status).toBe(201)
    expect(dataServiceMock.createData).toHaveBeenCalled()
  })

  test('PATCH /:id should update data', async () => {
    dataServiceMock.updateData.mockResolvedValueOnce({ id: '1', name: 'Upd' })

    const res = await app.request('/1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Upd' })
    })

    expect(res.status).toBe(200)
    expect(dataServiceMock.updateData).toHaveBeenCalled()
  })

  test('DELETE /:id should delete data', async () => {
    dataServiceMock.deleteData.mockResolvedValueOnce({ id: '1' })

    const res = await app.request('/1', { method: 'DELETE' })
    expect(res.status).toBe(200)
    expect(dataServiceMock.deleteData).toHaveBeenCalledWith('1')
  })
})
