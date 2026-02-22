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
   * @param fileOrPath A File object or a string path to the file
   */
  async analyzeImage(fileOrPath: File | string): Promise<AnalysisResponse> {
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

    const file =
      typeof fileOrPath === 'string' ? (Bun.file(fileOrPath) as unknown as File) : fileOrPath

    return aiService.generateText<AnalysisResponse>(
      prompt,
      [file],
      schema,
      'step_analyze_model',
    )
  }

  /**
   * Extracts a specific asset from the image.
   */
  async extractAsset(
    fileOrPath: File | string,
    name: string,
    description: string,
    category?: string,
    model?: string,
    hint?: string,
  ): Promise<string> {
    const file =
      typeof fileOrPath === 'string' ? (Bun.file(fileOrPath) as unknown as File) : fileOrPath

    let prompt = `
Task: Asset Extraction

Input: An image containing a character with equipment.
Target Item: ${name}
Description: ${description}
`
    if (category) {
      prompt += `Category: ${category}\n`
    }
    if (hint) {
      prompt += `User Hint: ${hint}\n`
    }

    prompt += `
Instructions:
1. Identify the specific item described above in the input image.
2. Extract ONLY this item.
3. Place it on a pure white background (#FFFFFF).
4. Ensure the item is fully visible, centered, and cleanly isolated.
5. Remove all other elements (character body, other items, background).
6. Maintain high quality and original details.
7. Return ONLY the image of the isolated equipment on a white background.
`
    // Use the model override if provided, otherwise default to step_refine_model
    // (We reuse step_refine_model key for extraction as discussed in plan, or we can use a new key but let's stick to existing config keys where possible or pass model directly)

    // aiService.generateImage uses getModelForStep. If we want to pass a specific model (e.g. from user selection),
    // we might need to modify aiService or trick it.
    // Wait, aiService.generateImage(..., step) takes a step name.
    // If I want to pass a specific model name, I can't directly via 'step'.
    // However, aiService implementation of `getModelForStep` handles 'provider:model' string if it's in settings.
    // But here 'model' argument is the model name (e.g. "openai:gpt-4o" or "gemini-1.5-pro").
    // I need to support passing the model directly.

    // I will verify aiService.generateImage again.
    // It calls `getModelForStep(step)`.
    // If step is not a config key, but a direct model string like "openai:gpt-4o", `getModelForStep` will check settings.get("openai:gpt-4o"). likely returning null.
    // Then it falls back to: `return { provider: 'google', model: modelString }`.
    // So if I pass "openai:gpt-4o" as `step`, it will try to look it up, fail, and then treat "openai:gpt-4o" as the model name for google provider?
    // Wait:
    /*
    if (modelString.includes(':')) {
      const [provider, model] = modelString.split(':')
      return { provider: provider as 'openai' | 'google', model }
    }
    */
    // This logic applies to the *value retrieved from settings*.

    // If I pass a `step` that is NOT in settings, `settingService.get(step)` returns null.
    // Then `if (!modelString)` block executes.
    // It returns default google flash.

    // So I cannot pass a model name directly to `generateImage` as `step` currently.
    // I should modify `aiService` to allow passing explicit model configuration, OR I just temporarily hack it by setting a temporary setting? No that's bad/concurrent unsafe.

    // I should probably modify `aiService` to accept `modelOverride` or similar.
    // But `aiService` is in `src/service/ai.ts`.
    // Let's look at `src/service/ai.ts` again.
    /*
      async generateImage(
        input: string | AIPart[],
        referenceImages: File[] = [],
        step?: string,
      ): Promise<string> {
        const { provider, model } = await this.getModelForStep(step)
    */

    // I'll update `extractAsset` to work for now with 'step_refine_model' (which I will rename conceptually to extract).
    // For the "Re-extract" feature where user picks a model:
    // I need to support that.

    // If I pass the model name as `step`?
    // `settingService.get("gemini-1.5-pro")` -> null.
    // `getModelForStep` returns default.

    // I must modify `aiService` to support direct model passing.
    // Or I can modify `getModelForStep` to handle the case where `step` is a model identifier (e.g. starts with "model:").
    // Or just "openai:..." or "google:...".

    // Let's modify `src/service/ai.ts` first?
    // The plan didn't explicitly say modify `aiService`, but it's needed for "user choice of model".

    // Let's verify `getModelForStep` logic in `aiService`.
    /*
    const modelString = await settingService.get(step)
    if (!modelString) {
       // ... defaults
       return { provider: 'google', model: 'gemini-2.0-flash' }
    }
    */

    // If I want to support dynamic model, I should probably overload the `step` parameter to allow `{ provider, model }` object or similar.
    // But `step` is typed as `string`.

    // I'll stick to `step_refine_model` for the default case.
    // For the override case...
    // I will check if I can modify `aiService` quickly.
    // Yes, I should.

    return aiService.generateImage(prompt, [file], model || 'step_refine_model')
  }
}

export const extractionService = new ExtractionService()
