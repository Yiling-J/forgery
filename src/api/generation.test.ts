import { describe, it, expect, mock, afterEach } from 'bun:test'
import generation from './generation'

const mockGenerationService = {
  listGenerations: mock(),
  createGeneration: mock(),
}

mock.module('../service/generation', () => ({
  generationService: mockGenerationService,
}))

describe('Generation API', () => {
  afterEach(() => {
    mockGenerationService.listGenerations.mockClear()
  })

  it('GET / should list generations with filters', async () => {
    mockGenerationService.listGenerations.mockResolvedValue({ items: [], total: 0 })

    const req = new Request('http://localhost/?equipmentId=eq1', {
      method: 'GET',
    })

    const res = await generation.fetch(req)
    expect(res.status).toBe(200)
    expect(mockGenerationService.listGenerations).toHaveBeenCalledWith(
      { page: 1, limit: 10 },
      { characterId: undefined, equipmentId: 'eq1' },
    )
  })

  it('POST / should create generation', async () => {
    mockGenerationService.createGeneration.mockResolvedValue({ id: '1' })

    const req = new Request('http://localhost/', {
      method: 'POST',
      body: JSON.stringify({ characterId: 'char1', equipmentIds: ['eq1', 'eq2'] }),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await generation.fetch(req)
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual({ id: '1' })
    expect(mockGenerationService.createGeneration).toHaveBeenCalledWith(
      'char1',
      ['eq1', 'eq2'],
      undefined,
      undefined,
    )
  })

  it('POST / should create generation with userPrompt', async () => {
    mockGenerationService.createGeneration.mockResolvedValue({ id: '1' })

    const req = new Request('http://localhost/', {
      method: 'POST',
      body: JSON.stringify({
        characterId: 'char1',
        equipmentIds: ['eq1', 'eq2'],
        userPrompt: 'test prompt',
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await generation.fetch(req)
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual({ id: '1' })
    expect(mockGenerationService.createGeneration).toHaveBeenCalledWith(
      'char1',
      ['eq1', 'eq2'],
      'test prompt',
      undefined,
    )
  })
})
