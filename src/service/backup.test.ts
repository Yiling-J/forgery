import { describe, expect, mock, test } from 'bun:test'
import { PassThrough } from 'node:stream'

// 1. Mock Prisma
const mockPrisma = {
  $connect: mock(() => Promise.resolve()),
  $disconnect: mock(() => Promise.resolve()),
}

mock.module('../db', () => ({
  prisma: mockPrisma,
}))

// 2. Mock node:fs to prevent side effects
const mockFs = {
  existsSync: mock(() => true),
  mkdirSync: mock(),
  renameSync: mock(),
  rmSync: mock(),
  // For other functions if used
  writeFileSync: mock(),
  readFileSync: mock(),
}

mock.module('node:fs', () => mockFs)

// 3. Mock tar to avoid actual compression/extraction
mock.module('tar', () => ({
  create: () => {
    const stream = new PassThrough()
    // Emit some data immediately to simulate a tar stream
    stream.write(Buffer.from('mock-tar-content'))
    stream.end()
    return stream
  },
  extract: () => {
    const stream = new PassThrough()
    // Simulate async completion
    setTimeout(() => stream.emit('finish'), 10)
    return stream
  },
}))

// Import service after mocking
// @ts-ignore
const { backupService } = await import(`./backup?v=${Date.now()}`)

describe('BackupService', () => {
  test('createBackupStream should return a readable tar stream', async () => {
    const stream = backupService.createBackupStream()
    expect(stream).toBeDefined()

    // Read stream
    const chunks: Buffer[] = []
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk))
    }
    const buffer = Buffer.concat(chunks)

    expect(buffer.toString()).toBe('mock-tar-content')
  })

  test('restoreBackup should attempt to move data, extract, and clean up', async () => {
    const dummyStream = new PassThrough()
    dummyStream.end()

    await backupService.restoreBackup(dummyStream)

    // Verify steps
    expect(mockPrisma.$disconnect).toHaveBeenCalled()
    expect(mockFs.existsSync).toHaveBeenCalledWith('data')
    // backupService logic: if exists('data') -> renameSync('data', backupDir)
    expect(mockFs.renameSync).toHaveBeenCalled()
    expect(mockFs.mkdirSync).toHaveBeenCalledWith('data')
    // extraction happens via mocked tar.extract
    // clean up: rmSync(backupDir, ...)
    expect(mockFs.rmSync).toHaveBeenCalled()
    expect(mockPrisma.$connect).toHaveBeenCalled()
  })

  test('restoreBackup should rollback on failure', async () => {
    // Force failure in extraction
    mock.module('tar', () => ({
      create: () => new PassThrough(),
      extract: () => {
        const stream = new PassThrough()
        setTimeout(() => stream.emit('error', new Error('Extraction failed')), 10)
        return stream
      },
    }))

    // Re-import service to pick up new mock
    // @ts-ignore
    const { backupService: failService } = await import(`./backup?v=${Date.now() + 1}`)

    const dummyStream = new PassThrough()
    dummyStream.end()

    try {
      await failService.restoreBackup(dummyStream)
    } catch (e) {
      expect((e as Error).message).toBe('Extraction failed')
    }

    // Verify rollback attempt
    // It should try to remove the broken 'data' and move backup back
    // (mockFs.rmSync and mockFs.renameSync would be called again in catch block)
    expect(mockFs.rmSync).toHaveBeenCalled()
    expect(mockFs.renameSync).toHaveBeenCalled()

    // Even after failure, it should try to reconnect prisma
    expect(mockPrisma.$connect).toHaveBeenCalled()
  })
})
