import { Hono } from 'hono'
import { existsSync, renameSync, mkdirSync, rmSync } from 'node:fs'
import { prisma } from '../db'

const app = new Hono()

app.post('/', async (c) => {
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
    // We expect the body to be the tar file content directly
    const proc = Bun.spawn(['tar', '-xf', '-', '-C', 'data'], {
      stdin: c.req.raw.body,
      stdout: 'pipe',
      stderr: 'pipe',
    })

    const exitCode = await proc.exited

    if (exitCode !== 0) {
      const stderr = await new Response(proc.stderr).text()
      throw new Error(`Tar extraction failed with code ${exitCode}: ${stderr}`)
    }

    // Remove the backup directory
    rmSync(backupDir, { recursive: true, force: true })

    // Reconnect prisma
    await prisma.$connect()

    return c.json({ success: true })
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

    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      500,
    )
  }
})

export default app
