import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { z } from 'zod'
import { assetService } from '../service/asset'
import { equipmentService } from '../service/equipment'
import { extractionService } from '../service/extraction'
import { fileService } from '../service/file'

const app = new Hono()

const analyzeSchema = z.object({
  image: z.instanceof(File),
})

const itemExtractSchema = z.object({
  imagePath: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string().optional(),
  model: z.string().optional(),
  hint: z.string().optional(),
  previousEquipmentId: z.string().optional(), // New field for re-extraction
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
          data: JSON.stringify({ status: 'analyzing', message: 'Analyzing character assets...' }),
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
        // Map backend assets (item_name) to frontend CandidateAsset (name)
        const candidates = analysis.assets.map((a) => ({
          name: a.item_name,
          description: a.description,
          category: a.category,
        }))

        await stream.writeSSE({
          event: 'complete',
          data: JSON.stringify({
            assets: candidates,
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
    const { imagePath, name, description, category, model, hint, previousEquipmentId } = c.req.valid('json')

    try {
      // Extract asset
      const extractedBase64 = await extractionService.extractAsset(
        imagePath,
        name,
        description,
        category,
        model,
        hint,
      )

      // Save to file system
      const savedFile = await fileService.saveBase64Image(extractedBase64)

      // Create Asset record
      const assetRecord = await assetService.createAssetRecord({
        name: name,
        type: 'image/webp',
        path: savedFile.filename,
      })

      let equipment

      if (previousEquipmentId) {
        // Update existing equipment
        try {
          equipment = await equipmentService.updateEquipment(previousEquipmentId, {
            name: name,
            description: description,
            category: category || 'Others',
            imageId: assetRecord.id,
          })
        } catch (e) {
          console.warn(`Failed to update previous equipment ${previousEquipmentId}, creating new one`, e)
          // Fallback to create if update fails (e.g., record deleted)
          equipment = await equipmentService.createEquipment({
            name: name,
            description: description,
            imageId: assetRecord.id,
            category: category || 'Others',
          })
        }
      } else {
        // Create new equipment
        equipment = await equipmentService.createEquipment({
          name: name,
          description: description,
          imageId: assetRecord.id,
          category: category || 'Others',
        })
      }

      const result = {
        ...equipment,
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
