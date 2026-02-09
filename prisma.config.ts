import { defineConfig } from '@prisma/config'

export default defineConfig({
  datasources: [
    {
      provider: 'sqlite',
      url: 'file:./dev.db',
    },
  ],
})
