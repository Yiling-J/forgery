import { aiService } from './ai'
import sharp from 'sharp'
import { z } from 'zod'
import { EQUIPMENT_CATEGORIES } from '../lib/categories'

// Types for the extraction process
export interface ExtractedAsset {
  item_name: string
  description: string
  category: string
  sub_category?: string
}

export interface AnalysisResponse {
  assets: ExtractedAsset[]
}

export class ExtractionService {
  /**
   * Analyzes an image to identify extractable assets.
   */
  async analyzeImage(file: File): Promise<AnalysisResponse> {
    const categoriesJson = JSON.stringify(EQUIPMENT_CATEGORIES, null, 2)
    const prompt = `
Task: Character Asset Identification for Extraction

Instructions:
1. Analyze the character in the image and identify all distinct, extractable equipment and clothing items.
2. Filter for items that are clearly visible.
3. Limit to a maximum of 9 most prominent assets.
4. Assign a category and sub-category to each item based on the provided list.
   - Choose the best fitting "main_category" and "sub_categories".
   - If no suitable category/sub-category is found, use "Others".

Available Categories:
${categoriesJson}

Output Format (Strict JSON):
Return ONLY a JSON object with a list of assets.
`

    const schema = z.object({
      assets: z.array(
        z.object({
          item_name: z.string().describe('Name of the item'),
          description: z.string().describe('Description of the item'),
          category: z.string().describe('Main category of the item'),
          sub_category: z.string().optional().describe('Sub category of the item'),
        }),
      ),
    })

    return aiService.generateText<AnalysisResponse>(prompt, [file], schema, 'step_analyze_model')
  }

  public getGridDimensions(count: number): { rows: number; cols: number } {
    if (count <= 3) return { rows: 1, cols: 3 }
    if (count <= 4) return { rows: 2, cols: 2 }
    if (count <= 6) return { rows: 2, cols: 3 }
    return { rows: 3, cols: 3 }
  }

  /**
   * Generates a texture sheet with isolated assets on solid backgrounds.
   */
  async generateTextureSheet(file: File, assets: ExtractedAsset[]): Promise<string> {
    const { rows, cols } = this.getGridDimensions(assets.length)

    const assetList = assets
      .map((asset, index) => `${index + 1}. ${asset.item_name}: ${asset.description}`)
      .join('\n')

    const prompt = `
Task: Character Asset Extraction & Grid Generation

Instructions:
Analyze the character in the provided image and extract the following ${assets.length} specific assets into a new, single image organized in a ${rows}x${cols} grid layout.

Core Constraints:
1. Grid Layout: The output image must be a strict ${rows} rows x ${cols} columns grid.
2. Equal Cells: Every cell in the grid MUST have identical width and height.
3. Sequential Placement: Place the assets in the grid cells in the order listed below, starting from top-left, moving right, then down to the next row.
4. Empty Cells: If there are fewer assets than grid cells, leave the remaining cells at the end (bottom-right) completely empty (pure white).
5. Isolated Assets: Each item must be placed within its own distinct square tile. No overlapping.
6. Ghost Mannequin Style: Extract ONLY the items. Remove the character's body entirely. Clothing and armor must appear as empty, 3D shells as if worn by an invisible person.
7. Pure White Background: The entire background of the image and each cell must be pure white (#FFFFFF). No shadows, no gradients.
8. Output Format: Generate a square texture sheet. Ignore the original image aspect ratio for the final output canvas.
9. EXACT REPLICA: You MUST reproduce the items exactly as they appear in the original image. Maintain all textures, patterns, logos, weathering, materials, and small details. Do not simplify or stylize.

Assets to Extract (in order):
${assetList}

Output Requirement: High-resolution texture sheet, flat lay presentation, sharp edges, and uniform lighting across all assets.
`

    return aiService.generateImage(prompt, [file], 'step_texture_model')
  }

  /**
   * Crops assets from the texture sheet based on calculated grid.
   */
  async cropAssets(
    sheetBase64: string,
    assets: ExtractedAsset[],
  ): Promise<{ name: string; base64: string }[]> {
    const buffer = Buffer.from(sheetBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64')
    const image = sharp(buffer)
    const metadata = await image.metadata()

    if (!metadata.width || !metadata.height) throw new Error('Could not determine image dimensions')

    const { rows, cols } = this.getGridDimensions(assets.length)
    const cellWidth = Math.floor(metadata.width / cols)
    const cellHeight = Math.floor(metadata.height / rows)

    const croppedAssets = []

    for (let i = 0; i < assets.length; i++) {
      const row = Math.floor(i / cols)
      const col = i % cols

      // Calculate coordinates with 3px inner padding to avoid grid lines
      const padding = 3
      const left = col * cellWidth + padding
      const top = row * cellHeight + padding
      const width = cellWidth - padding * 2
      const height = cellHeight - padding * 2

      // Ensure we don't go out of bounds (though math implies we fit)
      const safeLeft = Math.max(0, left)
      const safeTop = Math.max(0, top)
      const safeWidth = Math.min(width, metadata.width - safeLeft)
      const safeHeight = Math.min(height, metadata.height - safeTop)

      if (safeWidth <= 0 || safeHeight <= 0) continue

      const cropBuffer = await image
        .clone()
        .extract({ left: safeLeft, top: safeTop, width: safeWidth, height: safeHeight })
        .toBuffer()

      croppedAssets.push({
        name: assets[i].item_name,
        base64: `data:image/png;base64,${cropBuffer.toString('base64')}`,
      })
    }

    return croppedAssets
  }

  /**
   * Refines a cropped asset (removes background, upscales).
   */
  async refineAsset(base64: string): Promise<string> {
    const buffer = Buffer.from(base64.replace(/^data:image\/\w+;base64,/, ''), 'base64')
    const file = new File([buffer], 'crop.png', { type: 'image/png' })

    const prompt = `
Task: Asset Refinement

Instructions:
1. Process the provided asset image.
2. Remove any remaining background artifacts and ensure a pure white or transparent background.
3. CRITICAL: Detect and remove any straight lines, black borders, or frame-like artifacts at the edges of the image. These are cropping artifacts and MUST be removed.
4. Upscale the image and enhance details for high-quality game asset presentation.
5. Ensure the object is centered and fully visible.
6. EXTREME DETAIL: Preserve every existing detail, texture, and pattern from the input image. Do not change the design. Only sharpen and clarify.
7. Return only the image.
`
    // Using generateImage with image input
    return aiService.generateImage(prompt, [file], 'step_refine_model')
  }
}

export const extractionService = new ExtractionService()
