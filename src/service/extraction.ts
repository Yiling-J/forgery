import { z } from 'zod'
import { prisma } from '../db'
import { aiService } from './ai'

export interface ExtractedItem {
  name: string
  description: string
  option?: string
}

export class ExtractionService {
  /**
   * Analyzes an image to identify extractable assets based on enabled categories.
   */
  async analyzeImage(fileOrPath: File | string): Promise<Record<string, ExtractedItem | ExtractedItem[]>> {
    const categories = await prisma.category.findMany({
      where: { enabled: true },
      select: { name: true, description: true, options: true, maxCount: true }
    })

    if (categories.length === 0) {
       throw new Error("No enabled categories found.")
    }

    const categoryDescriptions = categories.map(c => {
       const opts = JSON.parse(c.options || '[]')
       let desc = `- Category: "${c.name}"\n  Description: ${c.description}\n  Max Items: ${c.maxCount}`
       if (opts.length > 0) {
          desc += `\n  Options: ${opts.join(', ')} (Assign best fitting option to 'option' field)`
       }
       return desc
    }).join('\n')

    const prompt = `
Task: Character Asset Identification for Extraction

Instructions:
1. Analyze the character in the image.
2. For each of the following categories, identify extractable items.
3. Adhere to the "Max Items" limit for each category.
   - If Max Items is 1, return a single object as the value.
   - If Max Items > 1, return an array of objects as the value.
4. If a category has "Options", assign the best fitting one to the "option" field.

Categories:
${categoryDescriptions}

Output Format (Strict JSON):
Return ONLY a JSON object where the keys are the EXACT category names.
The value for each key must be either a single item object or an array of item objects, depending on the Max Items setting.
`

    const itemSchema = z.object({
        name: z.string(),
        description: z.string(),
        option: z.string().optional()
    })

    // Construct dynamic schema
    const schemaShape: Record<string, z.ZodTypeAny> = {}
    for (const cat of categories) {
        if (cat.maxCount > 1) {
            schemaShape[cat.name] = z.array(itemSchema)
        } else {
            schemaShape[cat.name] = itemSchema
        }
    }

    const responseSchema = z.object(schemaShape)

    const file = typeof fileOrPath === 'string' ? (Bun.file(fileOrPath) as unknown as File) : fileOrPath

    try {
        const result = await aiService.generateText(prompt, [file], responseSchema, 'step_analyze_model')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return result as Record<string, any>
    } catch (e) {
        console.error("Analysis failed", e)
        throw e
    }
  }

  /**
   * Extracts a specific asset using the category's image prompt.
   */
  async extractAsset(
    fileOrPath: File | string,
    categoryName: string,
    variables: Record<string, string>,
    model?: string
  ): Promise<string> {
     // 1. Get Category Prompt
     const category = await prisma.category.findFirst({ where: { name: categoryName } })
     if (!category) throw new Error(`Category ${categoryName} not found`)

     let imagePromptConfig: { text: string; imageIds: string[] }
     try {
         imagePromptConfig = JSON.parse(category.imagePrompt)
     } catch {
         // Fallback if invalid JSON
         imagePromptConfig = { text: category.imagePrompt, imageIds: [] }
     }

     let promptText = imagePromptConfig.text || ''

     // 2. Handlebars replacement
     for (const [key, value] of Object.entries(variables)) {
         promptText = promptText.replace(new RegExp(`{{${key}}}`, 'g'), value || '')
     }
     // Remove unused variables
     promptText = promptText.replace(/{{.*?}}/g, '')

     const file = typeof fileOrPath === 'string' ? (Bun.file(fileOrPath) as unknown as File) : fileOrPath

     // 3. Load reference images
     const referenceImages: File[] = []
     if (imagePromptConfig.imageIds && Array.isArray(imagePromptConfig.imageIds)) {
         for (const assetId of imagePromptConfig.imageIds) {
             const asset = await prisma.asset.findUnique({ where: { id: assetId } })
             if (asset) {
                 const fullPath = `data/files/${asset.path}`
                 const assetFile = Bun.file(fullPath)
                 if (await assetFile.exists()) {
                     referenceImages.push(assetFile as unknown as File)
                 }
             }
         }
     }

     return aiService.generateImage(promptText, [file, ...referenceImages], model || 'step_refine_model')
  }
}

export const extractionService = new ExtractionService()
