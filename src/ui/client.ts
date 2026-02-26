import { hc } from 'hono/client'
import type { AppType } from '../index'

// Use absolute URL to avoid issues with relative paths in some environments
const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
export const client = hc<AppType>(`${origin}/api`)
