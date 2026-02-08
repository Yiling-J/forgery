import { aiService } from './ai'
import sharp from 'sharp'
import { z } from 'zod'
import { EQUIPMENT_CATEGORIES } from '../lib/categories'

// Types for the extraction process
export interface ExtractedAsset {
  item_name: string
  description: string
  background_color: string
  category: string
  sub_category?: string
}

export interface AnalysisResponse {
  assets: ExtractedAsset[]
}

export interface BoundingBoxResponse {
  grid_dimensions: {
    rows: number
    cols: number
  }
  assets: {
    item_name: string
    coordinates: [number, number, number, number] // ymin, xmin, ymax, xmax
    bg_color_detected: string
  }[]
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
3. For each identified item, assign one of the following high-contrast background colors for future segmentation: Red, Yellow, Green, White, Blue, Black, Magenta, Cyan, Orange, Gray. Avoid repeating colors if possible.
4. Limit to a maximum of 9 most prominent assets.
5. Assign a category and sub-category to each item based on the provided list.
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
          background_color: z.string().describe('Background color assigned'),
          description: z.string().describe('Description of the item'),
          category: z.string().describe('Main category of the item'),
          sub_category: z.string().optional().describe('Sub category of the item'),
        }),
      ),
    })

    return aiService.generateText<AnalysisResponse>(prompt, [file], schema)
  }

  /**
   * Generates a texture sheet with isolated assets on solid backgrounds.
   */
  async generateTextureSheet(file: File, assets: ExtractedAsset[]): Promise<string> {
    const HEX_COLORS: Record<string, string> = {
      Red: '#FF0000',
      Yellow: '#FFFF00',
      Green: '#00FF00',
      White: '#FFFFFF',
      Blue: '#0000FF',
      Black: '#000000',
      Magenta: '#FF00FF',
      Cyan: '#00FFFF',
      Orange: '#FFA500',
      Gray: '#808080',
    }

    const mappingString = assets
      .map((asset) => {
        const colorName = asset.background_color
        const hex = HEX_COLORS[colorName] || '#000000'
        return `- ${asset.item_name}: ${colorName} Background (${hex}). ${asset.description}`
      })
      .join('\n')

    const prompt = `
Task: Character Asset Extraction & Grid Generation

Instructions:
Analyze the character in the provided image and extract the following ${assets.length} specific assets into a new, single image organized in a grid layout (e.g., 2x3, 3x3 depending on count).

Core Constraints:
1. Isolated Assets: Each item must be placed within its own distinct square tile. No overlapping.
2. Ghost Mannequin Style: Extract ONLY the items. Remove the character's body entirely. Clothing and armor must appear as empty, 3D shells as if worn by an invisible person.
3. Solid Chroma Key Backgrounds: Each tile must use the specific solid background color assigned below. Ensure zero shadows, highlights, or gradients on the background to facilitate clean digital segmentation.
4. Output Format: Generate a square texture sheet. Ignore the original image aspect ratio for the final output canvas.

Item & Background Mapping:
${mappingString}

Output Requirement: High-resolution texture sheet, flat lay presentation, sharp edges, and uniform lighting across all assets.
`

    return aiService.generateImage(prompt, [file])
  }

  /**
   * Detects bounding boxes for assets in the texture sheet.
   */
  async detectBoundingBoxes(
    sheetBase64: string,
    analyzedAssets: ExtractedAsset[],
  ): Promise<BoundingBoxResponse> {
    const buffer = Buffer.from(sheetBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64')
    const file = new File([buffer], 'sheet.png', { type: 'image/png' })

    const assetContext = analyzedAssets
      .map(
        (a) =>
          `- Name: ${a.item_name}, Description: ${a.description}, Background Color: ${a.background_color}`,
      )
      .join('\n')

    const prompt = `
Task: Spatial Asset Detection & Normalized Grid Mapping

Instructions:
1. Analyze the provided image consisting of character assets arranged in a grid.
2. Identify the bounding box for each distinct asset container (the colored square background tiles).
3. Return the coordinates for each box using a normalized scale of 0.0 to 1.0.
   - [ymin, xmin, ymax, xmax]
   - (0, 0) is the top-left corner; (1.0, 1.0) is the bottom-right corner.
4. Ensure the box coordinates strictly encompass the outer boundary of each colored tile.
5. Use the provided asset context to correctly identify which item is in which box.

Asset Context:
${assetContext}

Output Format (Strict JSON):
Return ONLY a JSON object. Provide the grid dimensions and a list of detected assets with their coordinates.
`

    // Create an enum from the analyzed asset names plus "unknown"
    const assetNames = analyzedAssets.map((a) => a.item_name)
    // Zod enum requires at least one value, and they must be unique
    const uniqueNames = Array.from(new Set([...assetNames, 'unknown'])) as [string, ...string[]]

    const schema = z.object({
      grid_dimensions: z.object({
        rows: z.number(),
        cols: z.number(),
      }),
      assets: z.array(
        z.object({
          item_name: z.enum(uniqueNames),
          coordinates: z
            .tuple([z.number(), z.number(), z.number(), z.number()])
            .describe('[ymin, xmin, ymax, xmax]'),
          bg_color_detected: z.string(),
        }),
      ),
    })

    return aiService.generateText<BoundingBoxResponse>(prompt, [file], schema)
  }

  /**
   * Crops assets from the texture sheet based on bounding boxes.
   */
  async cropAssets(
    sheetBase64: string,
    boxes: BoundingBoxResponse,
  ): Promise<{ name: string; base64: string }[]> {
    const buffer = Buffer.from(sheetBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64')
    const image = sharp(buffer)
    const metadata = await image.metadata()

    if (!metadata.width || !metadata.height) throw new Error('Could not determine image dimensions')

    const croppedAssets = []

    for (const box of boxes.assets) {
      if (box.item_name === 'unknown') continue

      const [ymin, xmin, ymax, xmax] = box.coordinates

      const left = Math.floor(xmin * metadata.width)
      const top = Math.floor(ymin * metadata.height)
      const width = Math.floor((xmax - xmin) * metadata.width)
      const height = Math.floor((ymax - ymin) * metadata.height)

      // Ensure we don't go out of bounds
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
        name: box.item_name,
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
2. Remove the existing colored background and replace it with a pure white background (#FFFFFF) (or transparent if possible, but white is safer for now).
3. Upscale the image and enhance details for high-quality game asset presentation.
4. Ensure the object is centered and fully visible.
5. Return only the image.
`
    // Using generateImage with image input
    return aiService.generateImage(prompt, [file])
  }
}

export const extractionService = new ExtractionService()
