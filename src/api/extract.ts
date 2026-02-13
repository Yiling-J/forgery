import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { extractionService } from '../service/extraction'
import { fileService } from '../service/file'
import { equipmentService } from '../service/equipment'
import { assetService } from '../service/asset'

const app = new Hono()

const extractSchema = z.object({
  image: z.instanceof(File),
})

const route = app.post('/', zValidator('form', extractSchema), async (c) => {
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
        throw new Error(`Generation failed: ${err instanceof Error ? err.message : String(err)}`, {
          cause: err,
        })
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

      // 4. Refine & Save
      await stream.writeSSE({
        event: 'status',
        data: JSON.stringify({ status: 'refining', message: 'Refining and saving assets...' }),
      })

      const refinedAssets = []

      for (const crop of crops) {
        // Find matching asset from analysis to get category/description
        // Since crop.name comes from analysis.assets, this should always find it.
        const originalMeta = analysis.assets.find((a) => a.item_name === crop.name) || {
          item_name: crop.name,
          description: 'Extracted asset',
          category: 'Others',
          sub_category: 'Others',
        }

        // Refine image
        const refinedBase64 = await extractionService.refineAsset(crop.base64)

        // Save to file system
        const savedFile = await fileService.saveBase64Image(refinedBase64)

        // Create Asset record (AssetService now has createAssetRecord)
        const asset = await assetService.createAssetRecord({
          name: originalMeta.item_name,
          type: 'image/webp',
          path: savedFile.filename,
        })

        // Create Equipment record linked to Asset and using string categories
        const equipment = await equipmentService.createEquipment({
          name: originalMeta.item_name,
          description: originalMeta.description,
          imageId: asset.id,
          category: originalMeta.category,
          subCategory: originalMeta.sub_category,
        })

        const refinedAsset = {
          ...equipment,
          imageUrl: `/files/${savedFile.filename}`, // Frontend needs URL
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
        data: JSON.stringify({ message: error.message || 'Extraction failed' }),
      })
    }
  })
})

export default route
