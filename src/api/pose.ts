import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import { poseService } from '../service/pose'

const app = new Hono()

// Zod schema for validation
const createSchema = z.object({
  name: z.string().min(1),
  image: z.instanceof(File),
})

const route = app
  .get('/', async (c) => {
    const poses = await poseService.listPoses()
    return c.json(poses)
  })
  .post('/', zValidator('form', createSchema), async (c) => {
    const { name, image } = c.req.valid('form')
    try {
      const pose = await poseService.createPose(name, image)
      return c.json(pose, 201)
    } catch (e) {
      console.error('Failed to create pose', e)
      return c.json({ error: e instanceof Error ? e.message : 'Unknown error' }, 500)
    }
  })
  .delete('/:id', async (c) => {
    const id = c.req.param('id')
    try {
      await poseService.deletePose(id)
      return c.json({ success: true })
    } catch (e) {
      return c.json({ error: e instanceof Error ? e.message : 'Unknown error' }, 500)
    }
  })

export default route
