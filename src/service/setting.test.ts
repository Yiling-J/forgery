import { describe, expect, it, mock, beforeEach, beforeAll } from 'bun:test'

const mockPrisma = {
  setting: {
    findUnique: mock(),
    upsert: mock(),
    findMany: mock(),
    delete: mock(),
  },
}

// We need to mock the db module BEFORE importing the service
mock.module('../db', () => {
  return {
    prisma: mockPrisma,
  }
})

// We need to use dynamic import for the service to ensure mocks are applied
describe('SettingService', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let settingService: any

  beforeAll(async () => {
      // Use cache busting to ensure we get a fresh module with the mock applied
      const module = await import(`./setting?v=${Date.now()}`)
      settingService = module.settingService
  })

  beforeEach(() => {
    mockPrisma.setting.findUnique.mockReset()
    mockPrisma.setting.upsert.mockReset()
    mockPrisma.setting.findMany.mockReset()
    mockPrisma.setting.delete.mockReset()
  })

  it('should get a setting value', async () => {
    mockPrisma.setting.findUnique.mockResolvedValue({ key: 'test_key', value: 'test_value' })
    const value = await settingService.get('test_key')
    expect(value).toBe('test_value')
    expect(mockPrisma.setting.findUnique).toHaveBeenCalledWith({ where: { key: 'test_key' } })
  })

  it('should return null if setting not found', async () => {
    mockPrisma.setting.findUnique.mockResolvedValue(null)
    const value = await settingService.get('non_existent')
    expect(value).toBeNull()
  })

  it('should set a setting value', async () => {
    mockPrisma.setting.upsert.mockResolvedValue({ key: 'test_key', value: 'new_value' })
    await settingService.set('test_key', 'new_value')
    expect(mockPrisma.setting.upsert).toHaveBeenCalledWith({
      where: { key: 'test_key' },
      update: { value: 'new_value' },
      create: { key: 'test_key', value: 'new_value' },
    })
  })

  it('should get all settings', async () => {
    mockPrisma.setting.findMany.mockResolvedValue([
      { key: 'key1', value: 'val1' },
      { key: 'key2', value: 'val2' },
    ])
    const settings = await settingService.getAll()
    expect(settings).toEqual({ key1: 'val1', key2: 'val2' })
  })

  it('should delete a setting', async () => {
    mockPrisma.setting.delete.mockResolvedValue({ key: 'test_key' })
    await settingService.delete('test_key')
    expect(mockPrisma.setting.delete).toHaveBeenCalledWith({ where: { key: 'test_key' } })
  })
})
