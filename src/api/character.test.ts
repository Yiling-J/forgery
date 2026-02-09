import { describe, it, expect, mock, afterEach } from 'bun:test'
import character from './character'

const mockCharacterService = {
  createCharacter: mock(),
  listCharacters: mock(),
  updateCharacter: mock(),
  deleteCharacter: mock(),
  getCharacter: mock(),
}

mock.module('../service/character', () => ({
  characterService: mockCharacterService,
}))

describe('Character API', () => {
  afterEach(() => {
    mockCharacterService.createCharacter.mockClear()
    mockCharacterService.listCharacters.mockClear()
    mockCharacterService.updateCharacter.mockClear()
    mockCharacterService.deleteCharacter.mockClear()
  })

  it('GET / should list characters', async () => {
    mockCharacterService.listCharacters.mockResolvedValue({ items: [], total: 0 })

    const req = new Request('http://localhost/', {
      method: 'GET',
    })

    const res = await character.fetch(req)
    expect(res.status).toBe(200)
    expect(mockCharacterService.listCharacters).toHaveBeenCalledWith({ page: 1, limit: 10 })
  })

  it('POST / should create character', async () => {
    mockCharacterService.createCharacter.mockResolvedValue({ id: '1', name: 'Char' })

    const req = new Request('http://localhost/', {
      method: 'POST',
      body: JSON.stringify({ name: 'Char', imageId: 'img1' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await character.fetch(req)
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual({ id: '1', name: 'Char' })
  })

  it('GET /:id should get character', async () => {
    mockCharacterService.getCharacter.mockResolvedValue({ id: '1', name: 'Char' })

    const req = new Request('http://localhost/1', {
      method: 'GET',
    })

    const res = await character.fetch(req)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ id: '1', name: 'Char' })
    expect(mockCharacterService.getCharacter).toHaveBeenCalledWith('1')
  })
})
