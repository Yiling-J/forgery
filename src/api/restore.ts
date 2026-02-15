import { Hono } from 'hono'
import { existsSync, renameSync, mkdirSync, rmSync } from 'node:fs'
import { extract as extractTar } from 'tar'
import { prisma } from '../db'
import { Readable } from 'node:stream'

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

    // Convert request body to a readable stream for node-tar
    // Hono/Bun's Request.body is a web ReadableStream, node-tar needs a Node Readable
    // We can use Readable.fromWeb() if available in Bun (it should be) or handle chunks manually
    const webStream = c.req.raw.body
    if (!webStream) {
        throw new Error('No file uploaded')
    }

    // Use Readable.fromWeb to convert standard Web Stream to Node Stream
    // @ts-ignore: Bun implements fromWeb but types might be outdated in some environments
    const nodeStream = Readable.fromWeb(webStream)

    // Extract the uploaded tar stream to the new data directory
    await new Promise((resolve, reject) => {
        const extractor = extractTar({
            cwd: 'data',
            gzip: false
        })

        nodeStream.pipe(extractor)

        extractor.on('finish', resolve)
        extractor.on('error', reject)
        nodeStream.on('error', reject)
    })

    // Remove the backup directory if successful
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
