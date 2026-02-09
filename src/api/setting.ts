import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { settingService } from '../service/setting'

const app = new Hono()
  .get('/', async (c) => {
    const settings = await settingService.getAll()
    return c.json(settings)
  })
  .put(
    '/:key',
    zValidator(
      'json',
      z.object({
        value: z.string(),
      }),
    ),
    async (c) => {
      const key = c.req.param('key')
      const { value } = c.req.valid('json')
      await settingService.set(key, value)
      return c.json({ success: true })
    },
  )
  .delete('/:key', async (c) => {
    const key = c.req.param('key')
    await settingService.delete(key)
    return c.json({ success: true })
  })

export default app
