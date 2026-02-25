import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { z } from 'zod'
import { assetService } from '../service/asset'
import { dataService } from '../service/data'
import { extractionService } from '../service/extraction'
import { fileService } from '../service/file'
import { prisma } from '../db'

const app = new Hono()

const analyzeSchema = z.object({
  image: z.instanceof(File),
})

const itemExtractSchema = z.object({
  imagePath: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  option: z.string().optional(),
  model: z.string().optional(),
  hint: z.string().optional(),
  previousDataId: z.string().optional(),
})

const route = app
  .post('/analyze', zValidator('form', analyzeSchema), async (c) => {
    const { image } = c.req.valid('form')
    const file = image as File

    return streamSSE(c, async (stream) => {
      try {
        await stream.writeSSE({
          event: 'status',
          data: JSON.stringify({ status: 'analyzing', message: 'Uploading image...' }),
        })

        const savedFile = await fileService.saveFile(file)

        await stream.writeSSE({
          event: 'status',
          data: JSON.stringify({ status: 'analyzing', message: 'Analyzing character assets...' }),
        })

        const results = await extractionService.analyzeImage(savedFile.path)

        await stream.writeSSE({
          event: 'complete',
          data: JSON.stringify({
            results,
            imagePath: savedFile.path,
          }),
        })
      } catch (e: unknown) {
        console.error(e)
        const error = e instanceof Error ? e : new Error(String(e))
        await stream.writeSSE({
          event: 'error',
          data: JSON.stringify({ message: error.message || 'Analysis failed' }),
        })
      }
    })
  })
  .post('/item', zValidator('json', itemExtractSchema), async (c) => {
    const { imagePath, name, description, category, option, model, hint, previousDataId } = c.req.valid('json')

    try {
      // Extract asset
      const extractedBase64 = await extractionService.extractAsset(
        imagePath,
        category,
        { name, description, option: option || '', hint: hint || '' },
        model,
      )

      // Save to file system
      const savedFile = await fileService.saveBase64Image(extractedBase64)

      // Create Asset record
      const assetRecord = await assetService.createAssetRecord({
        name: name,
        type: 'image/webp',
        path: savedFile.filename,
      })

      // Get Category ID
      const categoryRecord = await prisma.category.findFirst({ where: { name: category } })
      if (!categoryRecord) {
          throw new Error(`Category ${category} not found`)
      }

      let dataItem

      if (previousDataId) {
        try {
          dataItem = await dataService.updateData(previousDataId, {
            name,
            description,
            option,
            category: { connect: { id: categoryRecord.id } },
            image: { connect: { id: assetRecord.id } },
          })
        } catch (e) {
          console.warn(`Failed to update previous data ${previousDataId}, creating new one`, e)
          dataItem = await dataService.createData({
            name,
            description,
            option,
            category: { connect: { id: categoryRecord.id } },
            image: { connect: { id: assetRecord.id } },
          })
        }
      } else {
        dataItem = await dataService.createData({
          name,
          description,
          option,
          category: { connect: { id: categoryRecord.id } },
          image: { connect: { id: assetRecord.id } },
        })
      }

      const result = {
        ...dataItem,
        imageUrl: `/files/${savedFile.filename}`,
      }

      return c.json(result)
    } catch (e: unknown) {
      console.error(e)
      const error = e instanceof Error ? e : new Error(String(e))
      return c.json({ error: error.message || 'Extraction failed' }, 500)
    }
  })

export default route
