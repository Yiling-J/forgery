import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { assetService } from '../service/asset'

const app = new Hono()

const uploadSchema = z.object({
  file: z.instanceof(File),
  name: z.string().min(1),
})

const route = app.post('/upload', zValidator('form', uploadSchema), async (c) => {
  const { file, name } = c.req.valid('form')

  try {
    const result = await assetService.createAsset(file as File, {
      name,
      type: (file as File).type,
    })
    return c.json(result, 201)
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Internal Server Error' }, 500)
  }
})

export default route
