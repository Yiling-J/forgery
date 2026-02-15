import { Hono } from 'hono'

const app = new Hono()

app.get('/', async () => {
  // Stream the content of the data directory as a tar file
  const proc = Bun.spawn(['tar', '-cf', '-', '-C', 'data', '.'])

  return new Response(proc.stdout, {
    headers: {
      'Content-Type': 'application/x-tar',
      'Content-Disposition': 'attachment; filename="backup.tar"',
    },
  })
})

export default app
