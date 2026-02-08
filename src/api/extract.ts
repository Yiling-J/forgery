import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { ExtractionService } from '../service/extraction'
import { FileService } from '../service/file'
import { EquipmentService } from '../service/equipment'
import { CategoryService } from '../service/category'
import { AssetService } from '../service/asset'

const extract = new Hono()

const extractSchema = z.object({
  image: z.instanceof(File),
})

extract.post('/', zValidator('form', extractSchema), async (c) => {
  const { image } = c.req.valid('form')
  const file = image as File

  return streamSSE(c, async (stream) => {
    try {
      // 1. Analyze
      await stream.writeSSE({
        event: 'status',
        data: JSON.stringify({ status: 'analyzing', message: 'Analyzing character assets...' })
      })

      let analysis;
      try {
        analysis = await ExtractionService.analyzeImage(file)
      } catch (err: unknown) {
        throw new Error(`Analysis failed: ${err instanceof Error ? err.message : String(err)}`, { cause: err });
      }

      if (!analysis.assets || analysis.assets.length === 0) {
        await stream.writeSSE({
          event: 'complete',
          data: JSON.stringify({ assets: [] })
        })
        return
      }

      // 2. Generate Texture Sheet
      await stream.writeSSE({
        event: 'status',
        data: JSON.stringify({ status: 'generating', message: 'Generating texture sheet...' })
      })

      let sheetBase64: string;
      try {
        sheetBase64 = await ExtractionService.generateTextureSheet(file, analysis.assets)
      } catch (err: unknown) {
         throw new Error(`Generation failed: ${err instanceof Error ? err.message : String(err)}`, { cause: err });
      }

      // 3. Detect Bounding Boxes
      await stream.writeSSE({
        event: 'status',
        data: JSON.stringify({ status: 'splitting', message: 'Detecting asset boundaries...' })
      })

      let boxes;
      try {
        boxes = await ExtractionService.detectBoundingBoxes(sheetBase64)
      } catch (err: unknown) {
        throw new Error(`Detection failed: ${err instanceof Error ? err.message : String(err)}`, { cause: err });
      }

      // 4. Crop Assets
      const crops = await ExtractionService.cropAssets(sheetBase64, boxes)

      // 5. Refine & Save
      await stream.writeSSE({
        event: 'status',
        data: JSON.stringify({ status: 'refining', message: 'Refining and saving assets...' })
      })

      const refinedAssets = []

      for (const crop of crops) {
        // Find matching asset from analysis to get category/description
        const originalMeta = analysis.assets.find(a => a.item_name === crop.name) || {
            item_name: crop.name,
            description: "Extracted asset",
            category: "Uncategorized",
            background_color: "unknown"
        }

        // Refine image
        const refinedBase64 = await ExtractionService.refineAsset(crop.base64)

        // Save to file system
        const savedFile = await FileService.saveBase64Image(refinedBase64)

        // Create Asset record (AssetService now has createAssetRecord)
        const asset = await AssetService.createAssetRecord({
            name: originalMeta.item_name,
            type: 'image/webp',
            path: savedFile.filename
        })

        // Find or create category
        const categoryId = await CategoryService.findOrCreate(originalMeta.category)

        // Create Equipment record linked to Asset and Category
        const equipment = await EquipmentService.createEquipment({
            name: originalMeta.item_name,
            description: originalMeta.description,
            imageId: asset.id,
            categoryId: categoryId
        })

        refinedAssets.push({
            ...equipment,
            imageUrl: `/files/${savedFile.filename}`, // Frontend needs URL
        })
      }

      await stream.writeSSE({
        event: 'complete',
        data: JSON.stringify({ assets: refinedAssets })
      })

    } catch (e: unknown) {
      console.error(e)
      const error = e instanceof Error ? e : new Error(String(e));
      await stream.writeSSE({
        event: 'error',
        data: JSON.stringify({ message: error.message || 'Extraction failed' })
      })
    }
  })
})

export default extract
