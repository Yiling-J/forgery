import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  datasource: {
    provider: 'sqlite',
    url: env('DATABASE_URL'),
  },
})
