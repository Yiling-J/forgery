import { describe, expect, test, mock } from 'bun:test'
import backup from './backup'

const mockBackupService = {
  createBackupStream: mock(() => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('test'))
        controller.close()
      },
    })
    return stream
  }),
}

mock.module('../service/backup', () => ({
  backupService: mockBackupService,
}))

describe('Backup API', () => {
  test('GET / should return a tar stream', async () => {
    const res = await backup.request('/')
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('application/x-tar')
    expect(res.headers.get('Content-Disposition')).toBe('attachment; filename="backup.tar"')

    const blob = await res.blob()
    expect(await blob.text()).toBe('test')
    expect(mockBackupService.createBackupStream).toHaveBeenCalled()
  })
})
