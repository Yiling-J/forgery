// @ts-ignore
import index from './ui/index.html'
import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import { cors } from 'hono/cors'
import asset from './api/asset'
import character from './api/character'
import equipment from './api/equipment'
import generation from './api/generation'
import extract from './api/extract'

const app = new Hono()

// Enable CORS
app.use('/*', cors())

// API Sub-App
const api = new Hono()
const route = api
  .route('/assets', asset)
  .route('/characters', character)
  .route('/equipments', equipment)
  .route('/generations', generation)
  .route('/extract', extract)

// Mount API
app.route('/api', api)

// Serve static files from data/files under /files path
app.use('/files/*', serveStatic({ root: './data' }))

// Export type for RPC
export type AppType = typeof route

// Serve the frontend
const server = Bun.serve({
  port: 3000,
  routes: {
    // Serve index.html for root
    '/': index,

    // Proxy API requests to Hono
    '/api/*': app.fetch,
    '/files/*': app.fetch,

    // Catch-all for SPA routing (fallback to index.html)
    '/*': index,
  },
  development: process.env.NODE_ENV !== 'production',
})

console.log(`🚀 Server running at ${server.url}`)
