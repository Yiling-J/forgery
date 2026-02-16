// @ts-ignore
import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import { cors } from 'hono/cors'
import { existsSync, mkdirSync } from 'node:fs'
import asset from './api/asset'
import backup from './api/backup'
import character from './api/character'
import equipment from './api/equipment'
import extract from './api/extract'
import expression from './api/expression'
import generation from './api/generation'
import outfit from './api/outfit'
import pose from './api/pose'
import restore from './api/restore'
import setting from './api/setting'
import { prisma } from './db'
import { exampleDataService } from './service/example-data'
import { settingService } from './service/setting'
import index from './ui/index.html'

// Ensure data directories exist
if (!existsSync('data/files')) {
  mkdirSync('data/files', { recursive: true })
}

const app = new Hono()

// Enable CORS
app.use('/*', cors())

// API Sub-App
const api = new Hono()
const route = api
  .route('/assets', asset)
  .route('/backup', backup)
  .route('/characters', character)
  .route('/equipments', equipment)
  .route('/generations', generation)
  .route('/extract', extract)
  .route('/outfits', outfit)
  .route('/poses', pose)
  .route('/restore', restore)
  .route('/expressions', expression)
  .route('/settings', setting)

// Mount API
app.route('/api', route)

// Serve static files from data/files under /files path
app.use('/files/*', serveStatic({ root: './data' }))

// Serve static files from public/poses under /poses path
app.use('/poses/*', serveStatic({ root: './public' }))

// Serve static files from public/expressions under /expressions path
app.use('/expressions/*', serveStatic({ root: './public' }))

// Serve built frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use('/*', serveStatic({ root: './dist' }))
  app.get('*', serveStatic({ path: './dist/index.html' }))
}

// Export type for RPC
export type AppType = typeof route

// Check and seed example data
const initialized = await settingService.get('system_initialized')
if (!initialized) {
  try {
    const hasData = (await prisma.character.count()) > 0
    if (!hasData) {
      console.log('🌱 Seeding example data...')
      await exampleDataService.import()
      console.log('✅ Example data seeded')
    }
    await settingService.set('system_initialized', 'true')
  } catch (error) {
    console.error('Failed to seed example data:', error)
  }
}

// Serve the frontend
const server = Bun.serve({
  port: 3000,
  fetch: app.fetch,
  routes:
    process.env.NODE_ENV === 'production'
      ? undefined
      : {
          // Serve index.html for root
          '/': index,

          // Proxy API requests to Hono
          '/api/*': app.fetch,
          '/files/*': app.fetch,
          '/poses/*': app.fetch,
          '/expressions/*': app.fetch,

          // Catch-all for SPA routing (fallback to index.html)
          '/*': index,
        },
  development: process.env.NODE_ENV !== 'production',
  idleTimeout: 200,
})

console.log(`🚀 Server running at ${server.url}`)
