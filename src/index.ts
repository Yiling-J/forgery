import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import asset from './api/asset'
import character from './api/character'
import equipment from './api/equipment'
import generation from './api/generation'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

// Serve static files from data/files
app.use('/files/*', serveStatic({ root: './data' }))

app.route('/assets', asset)
app.route('/characters', character)
app.route('/equipments', equipment)
app.route('/generations', generation)

export default app
