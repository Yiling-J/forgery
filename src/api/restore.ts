import { Hono } from 'hono'
import { Readable } from 'node:stream'
import { backupService } from '../service/backup'

const app = new Hono()

app.post('/', async (c) => {
  try {
    const webStream = c.req.raw.body
    if (!webStream) {
      throw new Error('No file uploaded')
    }

    // Use Readable.fromWeb to convert standard Web Stream to Node Stream
    // @ts-ignore: Bun implements fromWeb but types might be outdated in some environments
    const nodeStream = Readable.fromWeb(webStream)

    await backupService.restoreBackup(nodeStream)

    return c.json({ success: true })
  } catch (error) {
    console.error('Restore failed:', error)
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
