import { existsSync, mkdirSync, renameSync, rmSync } from 'node:fs'
import { Readable, PassThrough } from 'node:stream'
import { create as createTar, extract as extractTar } from 'tar'
import { prisma } from '../db'

export class BackupService {
  /**
   * Creates a tar stream of the data directory.
   */
  createBackupStream(): Readable {
    const stream = new PassThrough()

    createTar(
      {
        gzip: false,
        cwd: 'data',
      },
      ['.']
    ).pipe(stream)

    return stream
  }

  /**
   * Restores the data directory from a tar stream.
   * Handles database disconnection, backup of existing data, and rollback on failure.
   */
  async restoreBackup(backupStream: Readable): Promise<void> {
    // Disconnect prisma before starting restore
    await prisma.$disconnect()

    const backupDir = `data_backup_${Date.now()}`

    try {
      // Move current data directory to backup location
      if (existsSync('data')) {
        renameSync('data', backupDir)
      }

      // Create new data directory
      mkdirSync('data')

      // Extract the uploaded tar stream to the new data directory
      await new Promise((resolve, reject) => {
        const extractor = extractTar({
          cwd: 'data',
          gzip: false,
        })

        backupStream.pipe(extractor)

        extractor.on('finish', resolve)
        extractor.on('error', reject)
        backupStream.on('error', reject)
      })

      // Remove the backup directory if successful
      rmSync(backupDir, { recursive: true, force: true })

      // Reconnect prisma
      await prisma.$connect()
    } catch (error) {
      console.error('Restore failed:', error)

      // Attempt to restore from backup
      try {
        if (existsSync('data')) {
          rmSync('data', { recursive: true, force: true })
        }
        if (existsSync(backupDir)) {
          renameSync(backupDir, 'data')
        }
      } catch (restoreError) {
        console.error('Critical: Failed to restore backup after error:', restoreError)
      }

      // Reconnect prisma even if restore failed
      try {
        await prisma.$connect()
      } catch (connectError) {
        console.error('Failed to reconnect prisma:', connectError)
      }

      throw error
    }
  }
}

export const backupService = new BackupService()
