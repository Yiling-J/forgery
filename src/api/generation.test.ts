import { describe, it, expect, mock, afterEach } from 'bun:test'
import generation from './generation'

const mockGenerationService = {
  listGenerations: mock(),
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
})
