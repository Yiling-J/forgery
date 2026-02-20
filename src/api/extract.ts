import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { extractionService } from '../service/extraction'
import { fileService } from '../service/file'
import { equipmentService } from '../service/equipment'
import { assetService } from '../service/asset'

const app = new Hono()

const analyzeSchema = z.object({
  image: z.instanceof(File),
})

const refineSchema = z.object({
  assets: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      category: z.string(),
      base64: z.string(),
    }),
  ),
})

const route = app
  .post('/analyze', zValidator('form', analyzeSchema), async (c) => {
    const { image } = c.req.valid('form')
    const file = image as File

    return streamSSE(c, async (stream) => {
      try {
        // 1. Analyze
        await stream.writeSSE({
          event: 'status',
          data: JSON.stringify({ status: 'analyzing', message: 'Analyzing character assets...' }),
        })

        let analysis
        try {
          analysis = await extractionService.analyzeImage(file)
        } catch (err: unknown) {
          throw new Error(`Analysis failed: ${err instanceof Error ? err.message : String(err)}`, {
            cause: err,
          })
        }

        if (!analysis.assets || analysis.assets.length === 0) {
          await stream.writeSSE({
            event: 'complete',
            data: JSON.stringify({ assets: [] }),
          })
          return
        }

        // 2. Generate Texture Sheet
        await stream.writeSSE({
          event: 'status',
          data: JSON.stringify({ status: 'generating', message: 'Generating texture sheet...' }),
        })

        let sheetBase64: string
        try {
          sheetBase64 = await extractionService.generateTextureSheet(file, analysis.assets)
        } catch (err: unknown) {
          throw new Error(
            `Generation failed: ${err instanceof Error ? err.message : String(err)}`,
            {
              cause: err,
            },
          )
        }

        // 2.5 Emit texture sheet to client
        const dimensions = extractionService.getGridDimensions(analysis.assets.length)
        await stream.writeSSE({
          event: 'texture_generated',
          data: JSON.stringify({
            image: sheetBase64,
            grid: dimensions,
          }),
        })

        // 3. Crop Assets (Splitting)
        await stream.writeSSE({
          event: 'status',
          data: JSON.stringify({ status: 'splitting', message: 'Splitting texture sheet...' }),
        })

        let crops
        try {
          crops = await extractionService.cropAssets(sheetBase64, analysis.assets)
        } catch (err: unknown) {
          throw new Error(`Splitting failed: ${err instanceof Error ? err.message : String(err)}`, {
            cause: err,
          })
        }

        // 4. Combine crops with metadata and return
        const candidates = crops.map((crop) => {
          const originalMeta = analysis.assets.find((a) => a.item_name === crop.name) || {
            item_name: crop.name,
            description: 'Extracted asset',
            category: 'Others',
          }
          return {
            name: originalMeta.item_name,
            description: originalMeta.description,
            category: originalMeta.category,
            base64: crop.base64,
          }
        })

        await stream.writeSSE({
          event: 'complete',
          data: JSON.stringify({ assets: candidates }),
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
  .post('/refine', zValidator('json', refineSchema), async (c) => {
    const { assets } = c.req.valid('json')

    return streamSSE(c, async (stream) => {
      try {
        await stream.writeSSE({
          event: 'status',
          data: JSON.stringify({ status: 'refining', message: 'Refining and saving assets...' }),
        })

        const refinedAssets = []

        for (const asset of assets) {
          // Refine image
          const refinedBase64 = await extractionService.refineAsset(
            asset.base64,
            asset.name,
            asset.description,
          )

          // Save to file system
          const savedFile = await fileService.saveBase64Image(refinedBase64)

          // Create Asset record
          const assetRecord = await assetService.createAssetRecord({
            name: asset.name,
            type: 'image/webp',
            path: savedFile.filename,
          })

          // Create Equipment record
          const equipment = await equipmentService.createEquipment({
            name: asset.name,
            description: asset.description,
            imageId: assetRecord.id,
            category: asset.category,
          })

          const refinedAsset = {
            ...equipment,
            imageUrl: `/files/${savedFile.filename}`,
          }

          refinedAssets.push(refinedAsset)

          // Stream event for progressive display
          await stream.writeSSE({
            event: 'asset_refined',
            data: JSON.stringify({ asset: refinedAsset }),
          })
        }

        await stream.writeSSE({
          event: 'complete',
          data: JSON.stringify({ assets: refinedAssets }),
        })
      } catch (e: unknown) {
        console.error(e)
        const error = e instanceof Error ? e : new Error(String(e))
        await stream.writeSSE({
          event: 'error',
          data: JSON.stringify({ message: error.message || 'Refinement failed' }),
        })
      }
    })
  })

export default route
