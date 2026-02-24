import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { z } from 'zod'
import { assetService } from '../service/asset'
import { dataService } from '../service/data'
import { extractionService } from '../service/extraction'
import { fileService } from '../service/file'

const app = new Hono()

const analyzeSchema = z.object({
  image: z.instanceof(File),
})

// Generic extraction request schema
const extractItemSchema = z.object({
  categoryId: z.string(),
  imagePath: z.string(),
  values: z.record(z.string(), z.any()), // Text values extracted in Step 1
  model: z.string().optional(),
  previousDataId: z.string().optional(), // For re-extraction/update
})

const route = app
  .post('/analyze', zValidator('form', analyzeSchema), async (c) => {
    const { image } = c.req.valid('form')
    const file = image as File

    return streamSSE(c, async (stream) => {
      try {
        // 1. Save file
        await stream.writeSSE({
          event: 'status',
          data: JSON.stringify({ status: 'analyzing', message: 'Uploading image...' }),
        })

        const savedFile = await fileService.saveFile(file)

        // 2. Analyze
        await stream.writeSSE({
          event: 'status',
          data: JSON.stringify({ status: 'analyzing', message: 'Analyzing image assets...' }),
        })

        let analysis
        try {
          analysis = await extractionService.analyzeImage(savedFile.path)
        } catch (err: unknown) {
          throw new Error(`Analysis failed: ${err instanceof Error ? err.message : String(err)}`, {
            cause: err,
          })
        }

        // 3. Return candidates and image path
        // The structure is { results: [{ category: string, data: ... }] }
        // We pass this directly to frontend to handle.
        await stream.writeSSE({
          event: 'complete',
          data: JSON.stringify({
            results: analysis.results,
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
  .post('/item', zValidator('json', extractItemSchema), async (c) => {
    const { imagePath, categoryId, values, model, previousDataId } = c.req.valid('json')

    try {
      // 1. Extract Asset (Image)
      // This step generates the image based on values and category prompt
      const extractedBase64 = await extractionService.extractAsset(
        imagePath,
        categoryId,
        values,
        model,
      )

      // 2. Save Image File
      const savedFile = await fileService.saveBase64Image(extractedBase64)

      // 3. Create Asset Record
      // Use a name from values if available, or generic
      const assetName = values.name || 'Extracted Asset'
      const assetRecord = await assetService.createAssetRecord({
        name: assetName,
        type: 'image/webp',
        path: savedFile.filename,
      })

      // 4. Update values with image asset ID
      // We assume the field key for image is "image" based on our migration script.
      // But we should probably look up the category schema to be sure, or just assume "image" is the convention.
      // The user schema example: `[{ "key": "image", "type": "image" }]`.
      // So we set `values.image = assetRecord.id`.
      const finalValues = {
        ...values,
        image: assetRecord.id,
      }

      let dataItem

      if (previousDataId) {
        // Update existing Data
        try {
          dataItem = await dataService.updateData(previousDataId, {
            values: finalValues,
          })
        } catch (e) {
          console.warn(`Failed to update previous data ${previousDataId}, creating new one`, e)
          dataItem = await dataService.createData({
            category: { connect: { id: categoryId } },
            values: finalValues,
          })
        }
      } else {
        // Create new Data
        dataItem = await dataService.createData({
          category: { connect: { id: categoryId } },
          values: finalValues,
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
