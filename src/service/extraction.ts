import sharp from 'sharp'
import { z } from 'zod'
import { EQUIPMENT_CATEGORIES } from '../lib/categories'
import { aiService } from './ai'

// Types for the extraction process
export interface ExtractedAsset {
  item_name: string
  description: string
  category: string
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
4. Assign a category to each item based on the provided list.
   - Choose the best fitting "main_category".
   - If no suitable category is found, use "Others".

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
        }),
      ),
    })

    return aiService.generateText<AnalysisResponse>(prompt, [file], schema, 'step_analyze_model')
  }

  public getGridDimensions(count: number): { rows: number; cols: number } {
    if (count <= 4) return { rows: 2, cols: 2 }
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
Analyze the character in the provided image and extract the following ${assets.length} specific assets into a new, single image organized in a ${rows}x${cols} grid layout. The out put image should be square(1:1 aspect ratio) and each grid should be equal size.

Core Constraints:
1. Grid Layout: The output image must be a strict ${rows} rows x ${cols} columns grid. The grid layout should split by black line. The grid must take all available space of the image, no border padding.
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
   * Crops assets from the texture sheet based on calculated grid or provided split configuration.
   */
  async cropAssets(
    sheetBase64: string,
    assets: ExtractedAsset[],
    splitConfig?: { verticalLines: number[]; horizontalLines: number[] },
  ): Promise<{ name: string; base64: string }[]> {
    const buffer = Buffer.from(sheetBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64')
    const image = sharp(buffer)
    const metadata = await image.metadata()

    if (!metadata.width || !metadata.height) throw new Error('Could not determine image dimensions')

    const { rows, cols } = this.getGridDimensions(assets.length)
    const croppedAssets = []

    // Helper to get pixel position from percentage
    const getPos = (pct: number, dim: number) => Math.floor(pct * dim)

    // Construct grid boundaries
    let vLines = splitConfig?.verticalLines || []
    let hLines = splitConfig?.horizontalLines || []

    // Ensure lines are sorted
    vLines.sort((a, b) => a - b)
    hLines.sort((a, b) => a - b)

    // If no config (or empty arrays), use default equal grid logic
    // We populate the lines arrays to simulate the equal grid for consistent processing
    if (!splitConfig || (vLines.length === 0 && hLines.length === 0)) {
      vLines = Array.from({ length: cols - 1 }, (_, i) => (i + 1) / cols)
      hLines = Array.from({ length: rows - 1 }, (_, i) => (i + 1) / rows)
    }

    // Add boundaries (0 and 1)
    const colBoundaries = [0, ...vLines, 1]
    const rowBoundaries = [0, ...hLines, 1]

    for (let i = 0; i < assets.length; i++) {
      const row = Math.floor(i / cols)
      const col = i % cols

      // Ensure we have boundaries for this cell
      if (col + 1 >= colBoundaries.length || row + 1 >= rowBoundaries.length) {
        console.warn(`Grid mismatch for asset ${i}: row=${row}, col=${col}. Skipping.`)
        continue
      }

      // Get boundaries for this cell
      const startX = colBoundaries[col]
      const endX = colBoundaries[col + 1]
      const startY = rowBoundaries[row]
      const endY = rowBoundaries[row + 1]

      // Convert to pixels
      const left = getPos(startX, metadata.width!)
      const top = getPos(startY, metadata.height!)
      const right = getPos(endX, metadata.width!)
      const bottom = getPos(endY, metadata.height!)

      const width = right - left
      const height = bottom - top

      // Apply padding
      const padding = 3
      const paddedLeft = left + padding
      const paddedTop = top + padding
      const paddedWidth = width - padding * 2
      const paddedHeight = height - padding * 2

      // Safe bounds
      const safeLeft = Math.max(0, paddedLeft)
      const safeTop = Math.max(0, paddedTop)
      const safeWidth = Math.min(paddedWidth, metadata.width! - safeLeft)
      const safeHeight = Math.min(paddedHeight, metadata.height! - safeTop)

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
2. Remove any remaining background artifacts and ensure a pure white background.
3. Upscale the image and enhance details for high-quality game asset presentation.
4. Ensure the object is centered and fully visible.
5. EXTREME DETAIL: Preserve every existing detail, texture, and pattern from the input image. Do not change the design. Only sharpen and clarify.
6. Return only the image.
`
    // Using generateImage with image input
    return aiService.generateImage(prompt, [file], 'step_refine_model')
  }
}

export const extractionService = new ExtractionService()
