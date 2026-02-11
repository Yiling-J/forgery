import { describe, it, expect, mock, afterEach } from 'bun:test'

const mockOutfitService = {
  listOutfits: mock(),
  createOutfit: mock(),
  updateOutfit: mock(),
  deleteOutfit: mock(),
}

mock.module('../service/outfit', () => ({
  outfitService: mockOutfitService,
}))

describe('Outfit API', () => {
  afterEach(() => {
    mockOutfitService.listOutfits.mockClear()
    mockOutfitService.createOutfit.mockClear()
    mockOutfitService.updateOutfit.mockClear()
    mockOutfitService.deleteOutfit.mockClear()
  })

  it('GET / should list outfits', async () => {
    const { default: outfit } = await import(`./outfit?v=${Date.now()}`)
    mockOutfitService.listOutfits.mockResolvedValue([])

    const req = new Request('http://localhost/', {
      method: 'GET',
    })

    const res = await outfit.fetch(req)
    expect(res.status).toBe(200)
    expect(mockOutfitService.listOutfits).toHaveBeenCalled()
  })

  it('POST / should create outfit', async () => {
    const { default: outfit } = await import(`./outfit?v=${Date.now()}`)
    mockOutfitService.createOutfit.mockResolvedValue({ id: '1' })

    const req = new Request('http://localhost/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'New Outfit',
        equipmentIds: ['eq1'],
      }),
    })

    const res = await outfit.fetch(req)
    expect(res.status).toBe(200)
    expect(mockOutfitService.createOutfit).toHaveBeenCalledWith({
      name: 'New Outfit',
      equipmentIds: ['eq1'],
      prompt: undefined,
    })
  })

  it('PUT /:id should update outfit', async () => {
    const { default: outfit } = await import(`./outfit?v=${Date.now()}`)
    mockOutfitService.updateOutfit.mockResolvedValue({ id: '1' })

    const req = new Request('http://localhost/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Updated Outfit',
      }),
    })

    const res = await outfit.fetch(req)
    expect(res.status).toBe(200)
    expect(mockOutfitService.updateOutfit).toHaveBeenCalledWith('1', {
      name: 'Updated Outfit',
    })
  })

  it('DELETE /:id should delete outfit', async () => {
    const { default: outfit } = await import(`./outfit?v=${Date.now()}`)
    mockOutfitService.deleteOutfit.mockResolvedValue({ id: '1' })

    const req = new Request('http://localhost/1', {
      method: 'DELETE',
    })

    const res = await outfit.fetch(req)
    expect(res.status).toBe(200)
    expect(mockOutfitService.deleteOutfit).toHaveBeenCalledWith('1')
  })
})
