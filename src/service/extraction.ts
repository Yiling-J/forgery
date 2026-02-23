import Handlebars from 'handlebars'
import { z } from 'zod'
import { aiService } from './ai'
import { categoryService } from './category'

// Types for the extraction process
export interface ExtractedItem {
  [key: string]: any
}

export interface CategoryResult {
  category: string
  data: ExtractedItem | ExtractedItem[]
}

export interface AnalysisResponse {
  results: CategoryResult[]
}

export class ExtractionService {
  /**
   * Analyzes an image to identify extractable assets across all enabled categories.
   * @param fileOrPath A File object or a string path to the file
   */
  async analyzeImage(fileOrPath: File | string): Promise<AnalysisResponse> {
    const categories = await categoryService.getAllCategories()
    const enabledCategories = categories.filter((c) => c.enabled)

    if (enabledCategories.length === 0) {
      return { results: [] }
    }

    // Build dynamic prompt and schema
    let categoriesDescription = ''
    const properties: Record<string, z.ZodTypeAny> = {}

    for (const cat of enabledCategories) {
      categoriesDescription += `- Category: "${cat.name}"\n`
      categoriesDescription += `  Description: ${cat.description || 'No description'}\n`
      categoriesDescription += `  Max Items: ${cat.maxCount}\n`

      try {
        const fields = cat.fields as any[]
        if (Array.isArray(fields)) {
          const fieldDescriptions = fields.map((f: any) => `${f.key} (${f.type}): ${f.label}`).join(', ')
          categoriesDescription += `  Fields to Extract: ${fieldDescriptions}\n\n`
        }
      } catch (e) {
        console.warn(`Invalid fields format for category ${cat.name}`, e)
      }
    }

    const prompt = `
Task: Image Analysis and Data Extraction

Instructions:
1. Analyze the input image and identify items belonging to the following categories:
${categoriesDescription}

2. For each category, extract the specified fields.
3. Respect the "Max Items" limit for each category.
   - If Max Items is 1, return a single object.
   - If Max Items > 1, return an array of objects.
4. If a category has no matching items in the image, return an empty array or null (depending on Max Items).

Output Format (Strict JSON):
Return a JSON object with a key "results" containing a list of category results.
Each result must have:
- "category": The category name.
- "data": The extracted data (object or array of objects).
`

    const resultSchema = z.object({
      results: z.array(
        z.object({
          category: z.string(),
          data: z.union([z.record(z.any()), z.array(z.record(z.any()))]),
        }),
      ),
    })

    const file =
      typeof fileOrPath === 'string' ? (Bun.file(fileOrPath) as unknown as File) : fileOrPath

    try {
      return await aiService.generateText<AnalysisResponse>(
        prompt,
        [file],
        resultSchema,
        'step_analyze_model',
      )
    } catch (e) {
      console.error('Analysis failed', e)
      throw e
    }
  }

  /**
   * Extracts a specific asset from the image.
   */
  async extractAsset(
    fileOrPath: File | string,
    categoryId: string,
    values: Record<string, any>,
    model?: string,
  ): Promise<string> {
    const file =
      typeof fileOrPath === 'string' ? (Bun.file(fileOrPath) as unknown as File) : fileOrPath

    const category = await categoryService.getCategory(categoryId)
    if (!category) {
      throw new Error(`Category ${categoryId} not found`)
    }

    if (!category.imagePrompt) {
        throw new Error(`Category ${category.name} has no image extraction prompt configured`)
    }

    // category.imagePrompt is now Json type (InputJsonValue | null)
    const imagePromptConfig = category.imagePrompt as Record<string, any>

    // Check if valid object
    if (typeof imagePromptConfig !== 'object' || !imagePromptConfig) {
      throw new Error(`Invalid imagePrompt format for category ${category.name}`)
    }

    const template = imagePromptConfig.text || ''
    if (!template) {
         throw new Error(`Empty text prompt for category ${category.name}`)
    }

    // Compile prompt with Handlebars
    const compiledPrompt = Handlebars.compile(template)(values)

    return aiService.generateImage(compiledPrompt, [file], model || 'step_refine_model')
  }
}

export const extractionService = new ExtractionService()
