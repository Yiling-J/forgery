import { defineConfig } from 'prisma/config'
import path from 'node:path'

export default defineConfig({
  datasource: {
    url: `file:${path.join(process.cwd(), 'data', 'data.db')}`,
  },
})
