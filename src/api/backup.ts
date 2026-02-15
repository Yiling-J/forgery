import { Hono } from 'hono'
import { create as createTar } from 'tar'
import { PassThrough } from 'node:stream'

const app = new Hono()

app.get('/', async () => {
  // Create a PassThrough stream to pipe the tar output
  const stream = new PassThrough()

  // Create tar stream with gzip, archiving everything in the 'data' directory
  // We use cwd: 'data' so the archive structure starts relative to data folder
  createTar(
    {
      gzip: true,
      cwd: 'data',
    },
    ['.']
  ).pipe(stream)

  // @ts-ignore: Bun supports Readable in Response, but TS doesn't know fully
  return new Response(stream, {
    headers: {
      'Content-Type': 'application/gzip',
      'Content-Disposition': 'attachment; filename="backup.tar.gz"',
    },
  })
})

export default app
