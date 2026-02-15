import { describe, expect, test, mock } from 'bun:test'
import restore from './restore'

const mockBackupService = {
  restoreBackup: mock(() => Promise.resolve()),
}

mock.module('../service/backup', () => ({
  backupService: mockBackupService,
}))

describe('Restore API', () => {
  test('POST / should restore data', async () => {
    const file = new File(['test'], 'backup.tar', { type: 'application/x-tar' })
    const res = await restore.request('/', {
      method: 'POST',
      body: file,
    })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })
    expect(mockBackupService.restoreBackup).toHaveBeenCalled()
  })

  test('POST / should handle restore failure', async () => {
    mockBackupService.restoreBackup.mockRejectedValueOnce(new Error('Test Error'))

    const file = new File(['test'], 'backup.tar', { type: 'application/x-tar' })
    const res = await restore.request('/', {
      method: 'POST',
      body: file,
    })

    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ success: false, error: 'Test Error' })
  })
})
