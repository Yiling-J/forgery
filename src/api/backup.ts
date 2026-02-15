import { Hono } from 'hono'
import { backupService } from '../service/backup'

const app = new Hono()

app.get('/', async () => {
  const stream = backupService.createBackupStream()

  // @ts-ignore: Bun supports Readable in Response, but TS doesn't know fully
  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-tar',
      'Content-Disposition': 'attachment; filename="backup.tar"',
    },
  })
})

export default app
