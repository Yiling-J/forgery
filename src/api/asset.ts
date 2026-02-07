import { Hono } from 'hono'
import { AssetService } from '../service/asset'

const asset = new Hono()

asset.post('/upload', async (c) => {
  const body = await c.req.parseBody()
  const file = body['file']
  const name = body['name'] as string

  if (!file || !(file instanceof File)) {
    return c.json({ error: 'File is required' }, 400)
  }

  if (!name) {
    return c.json({ error: 'Name is required' }, 400)
  }

  try {
    const result = await AssetService.createAsset(file, {
      name,
      type: file.type,
    })
    return c.json(result, 201)
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Internal Server Error' }, 500)
  }
})

export default asset
