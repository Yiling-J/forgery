import { hc } from 'hono/client'
import type { AppType } from '../../index'

// Create a typed client
// Since we are serving frontend and backend on the same origin (port 3000),
// we can use '/' as the base URL, or explicit localhost.
// However, 'hc' needs the base URL to construct requests.
// If running in browser, '/' works.
// Note: We need to point to '/api' because our routes are mounted under '/api'.
// But wait, AppType is exported from 'route' variable which is the API sub-app.
// The routes in AppType are like '/assets', '/extract', etc.
// But they are mounted at '/api'.
// So if we use hc<AppType>('/api'), it should work.

export const client = hc<AppType>('/api')
