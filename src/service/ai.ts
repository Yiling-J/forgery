import { GoogleGenAI } from '@google/genai'
import { z } from 'zod'
import { settingService } from './setting'
import OpenAI from 'openai'
import { zodResponseFormat } from 'openai/helpers/zod'

// Generic AI service interface for flexibility
export interface AIService {
  generateText<T>(prompt: string, images: File[], schema?: z.ZodType<T>, step?: string): Promise<T>
  generateImage(prompt: string, referenceImages?: File[], step?: string): Promise<string>
  generateImageFromParts(
    parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }>,
  ): Promise<string>
}

// Configuration constants
const CONFIG_KEYS = {
  OPENAI_API_KEY: 'openai_api_key',
  OPENAI_BASE_URL: 'openai_base_url',
  GOOGLE_API_KEY: 'google_api_key',
  STEP_ANALYZE_MODEL: 'step_analyze_model',
  STEP_TEXTURE_MODEL: 'step_texture_model',
  STEP_BOUNDING_BOX_MODEL: 'step_bounding_box_model',
  STEP_REFINE_MODEL: 'step_refine_model',
}

export class UnifiedAIService implements AIService {
  private async getOpenAIClient(): Promise<OpenAI> {
    const apiKey = await settingService.get(CONFIG_KEYS.OPENAI_API_KEY)
    const baseURL = await settingService.get(CONFIG_KEYS.OPENAI_BASE_URL)

    if (!apiKey) {
      throw new Error('OpenAI API Key not configured')
    }

    return new OpenAI({
      apiKey,
      baseURL: baseURL || undefined,
    })
  }

  private async getGoogleClient(): Promise<GoogleGenAI> {
    const apiKey = await settingService.get(CONFIG_KEYS.GOOGLE_API_KEY)
    // Fallback to env var for backward compatibility if not in settings
    const finalApiKey = apiKey || process.env.API_KEY

    if (!finalApiKey) {
      throw new Error('Google API Key not configured')
    }

    return new GoogleGenAI({ apiKey: finalApiKey })
  }

  private async getModelForStep(step?: string): Promise<{ provider: 'openai' | 'google'; model: string }> {
    if (!step) {
      // Default to Google if no step specified (legacy behavior)
      return { provider: 'google', model: 'gemini-2.0-flash' }
    }

    const modelString = await settingService.get(step)
    if (!modelString) {
      // Fallback defaults if not configured
      if (step === CONFIG_KEYS.STEP_ANALYZE_MODEL || step === CONFIG_KEYS.STEP_BOUNDING_BOX_MODEL) {
        return { provider: 'google', model: 'gemini-2.0-flash' }
      }
      return { provider: 'google', model: 'gemini-2.0-flash' }
    }

    // Assuming model string is stored as "provider:model_name" or just "model_name"
    // But based on requirements, user selects provider/model.
    // Let's assume the value is stored as "provider:model" e.g. "openai:gpt-4o" or "google:gemini-1.5-pro"
    // If it doesn't have a prefix, we default to google for backward compat or error out.

    if (modelString.includes(':')) {
      const [provider, model] = modelString.split(':')
      return { provider: provider as 'openai' | 'google', model }
    }

    // Fallback if format is unexpected
    return { provider: 'google', model: modelString }
  }

  async generateText<T>(
    prompt: string,
    images: File[] = [],
    schema?: z.ZodType<T>,
    step?: string,
  ): Promise<T> {
    const { provider, model } = await this.getModelForStep(step)

    if (provider === 'openai') {
      return this.generateTextOpenAI(model, prompt, images, schema)
    } else {
      return this.generateTextGoogle(model, prompt, images, schema)
    }
  }

  private async generateTextOpenAI<T>(
    model: string,
    prompt: string,
    images: File[],
    schema?: z.ZodType<T>,
  ): Promise<T> {
    const client = await this.getOpenAIClient()

    const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
      { type: 'text', text: prompt },
    ]

    for (const image of images) {
      const buffer = await image.arrayBuffer()
      const base64 = Buffer.from(buffer).toString('base64')
      content.push({
        type: 'image_url',
        image_url: {
          url: `data:${image.type};base64,${base64}`,
        },
      })
    }

    const completion = await client.chat.completions.create({
      model: model,
      messages: [{ role: 'user', content }],
      response_format: schema ? zodResponseFormat(schema, 'result') : { type: 'json_object' },
    })

    const text = completion.choices[0].message.content
    if (!text) throw new Error('No text generated from OpenAI')

    try {
      const json = JSON.parse(text)
      return json as T
    } catch (e: unknown) {
      console.error('Failed to parse JSON from OpenAI', text)
      throw new Error(
        `Invalid JSON response from AI: ${e instanceof Error ? e.message : String(e)}`,
        { cause: e },
      )
    }
  }

  private async generateTextGoogle<T>(
    model: string,
    prompt: string,
    images: File[],
    schema?: z.ZodType<T>,
  ): Promise<T> {
    const client = await this.getGoogleClient()

    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = []

    for (const image of images) {
      const buffer = await image.arrayBuffer()
      const base64 = Buffer.from(buffer).toString('base64')
      parts.push({
        inlineData: {
          mimeType: image.type,
          data: base64,
        },
      })
    }

    parts.push({ text: prompt })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: any = {
      responseMimeType: 'application/json',
    }

    if (schema) {
      config.responseSchema = z.toJSONSchema(schema)
    }

    const result = await client.models.generateContent({
      model: model,
      contents: { parts },
      config: config,
    })

    // @ts-ignore
    const textProp = typeof result.text === 'function' ? result.text() : result.text
    const text = typeof textProp === 'string' ? textProp : undefined
    if (!text) throw new Error('No text generated from Google')

    try {
      const json = JSON.parse(text)
      if (schema) {
        return schema.parse(json)
      }
      return json as T
    } catch (e: unknown) {
      console.error('Failed to parse JSON from Google', text)
      throw new Error(
        `Invalid JSON response from AI: ${e instanceof Error ? e.message : String(e)}`,
        { cause: e },
      )
    }
  }

  async generateImage(prompt: string, referenceImages: File[] = [], step?: string): Promise<string> {
    const { provider, model } = await this.getModelForStep(step)

    if (provider === 'openai') {
      return this.generateImageOpenAI(model, prompt, referenceImages)
    } else {
      return this.generateImageGoogle(model, prompt, referenceImages)
    }
  }

  private async generateImageOpenAI(
    model: string,
    prompt: string,
    referenceImages: File[],
  ): Promise<string> {
    const client = await this.getOpenAIClient()

    // OpenAI DALL-E 3 does not support image-to-image in the standard way via API yet easily for editing
    // But if it's just generation based on prompt, we use embeddings or just prompt.
    // However, the requirement might be editing.
    // DALL-E 3 only takes text prompt.
    // If reference images are needed, OpenAI might not be the best fit unless using Vision to describe then Generate.
    // For now, if reference images are provided, we warn or try to describe them first?
    // Or we assume the user knows what they are doing selecting OpenAI for a step that requires image input.
    // Actually, `generateImage` in `extraction.ts` is used for Texture Sheet generation (from analyze result) and Refine Asset.
    // Refine Asset takes an image. Texture sheet takes the original file.
    // DALL-E 3 doesn't support input images directly for variations/edits in the same way.
    // But `dall-e-2` does edits.

    // For simplicity, if OpenAI is selected, we assume DALL-E 3 and just pass the prompt.
    // If input images are critical, this might fail or be suboptimal.
    // Let's implement standard generation.

    if (referenceImages.length > 0) {
       console.warn("OpenAI DALL-E 3 does not support input images directly. Using prompt only.")
    }

    const response = await client.images.generate({
      model: model,
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      response_format: 'b64_json',
    })

    const base64 = response.data[0].b64_json
    if (!base64) throw new Error('No image generated from OpenAI')

    return `data:image/png;base64,${base64}`
  }

  private async generateImageGoogle(
      model: string,
      prompt: string,
      referenceImages: File[] = [],
  ): Promise<string> {
      const client = await this.getGoogleClient()

      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = []

      for (const image of referenceImages) {
        const buffer = await image.arrayBuffer()
        const base64 = Buffer.from(buffer).toString('base64')
        parts.push({
          inlineData: {
            mimeType: image.type,
            data: base64,
          },
        })
      }

      parts.push({ text: prompt })

      return this.generateImageFromParts(parts, model, client)
  }

  async generateImageFromParts(
    parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }>,
    modelOverride?: string,
    clientOverride?: GoogleGenAI
  ): Promise<string> {
    // This method seems specific to Google's structure in previous code.
    // We default to Google if called directly or internal usage.

    const client = clientOverride || await this.getGoogleClient()
    const model = modelOverride || 'gemini-2.0-flash' // Default fallback

    const result = await client.models.generateContent({
      model: model,
      contents: { parts },
    })

    // Check for image in response
    const candidate = result.candidates?.[0]
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData?.mimeType?.startsWith('image/')) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
        }
      }
    }

    throw new Error('No image generated in response')
  }
}

export const aiService = new UnifiedAIService()
