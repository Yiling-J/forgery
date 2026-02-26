import { hc } from 'hono/client'
import type { AppType } from '../index'

export const client = hc<AppType>('/api')
