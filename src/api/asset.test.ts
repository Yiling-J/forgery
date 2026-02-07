import { describe, it, expect, mock, afterEach } from 'bun:test'
import asset from './asset'

const mockAssetService = {
  createAsset: mock(),
}

mock.module('../services/asset', () => ({
  AssetService: mockAssetService,
}))

describe('Asset API', () => {
  afterEach(() => {
    mockAssetService.createAsset.mockClear()
  })

  it('POST /upload should create asset', async () => {
    mockAssetService.createAsset.mockResolvedValue({ id: '1', name: 'Test' })

    const formData = new FormData()
    formData.append('file', new File(['test'], 'test.png', { type: 'image/png' }))
    formData.append('name', 'Test Asset')

    const req = new Request('http://localhost/upload', {
      method: 'POST',
      body: formData,
    })

    const res = await asset.fetch(req)
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual({ id: '1', name: 'Test' })
    expect(mockAssetService.createAsset).toHaveBeenCalled()
  })
})
