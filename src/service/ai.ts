import { GoogleGenAI } from '@google/genai'
import OpenAI, { toFile } from 'openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { z } from 'zod'
import { settingService } from './setting'

export interface AIPart {
  text?: string
  inlineData?: {
    mimeType: string
    data: string
  }
}

// Generic AI service interface for flexibility
export interface AIService {
  generateText<T>(prompt: string, images: File[], schema?: z.ZodType<T>, step?: string): Promise<T>
  generateImage(input: string | AIPart[], referenceImages?: File[], step?: string): Promise<string>
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
  STEP_GENERATION_MODEL: 'step_generation_model',
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

  private async getModelForStep(
    step?: string,
  ): Promise<{ provider: 'openai' | 'google'; model: string }> {
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

    const parts: AIPart[] = []

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      contents: { parts: parts as any[] }, // Type assertion due to slight mismatch or library version
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

  async generateImage(
    input: string | AIPart[],
    referenceImages: File[] = [],
    step?: string,
  ): Promise<string> {
    const { provider, model } = await this.getModelForStep(step)

    // Normalize input to AIPart[]
    let parts: AIPart[] = []
    if (typeof input === 'string') {
      parts.push({ text: input })
    } else {
      parts = input
    }

    // Append reference images if any (convert to parts)
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

    if (provider === 'openai') {
      return this.generateImageOpenAI(model, parts)
    } else {
      return this.generateImageGoogle(model, parts)
    }
  }

  private async generateImageOpenAI(model: string, parts: AIPart[]): Promise<string> {
    const client = await this.getOpenAIClient()
    const promptParts: string[] = []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const images: any[] = []

    for (const part of parts) {
      if (part.text) {
        promptParts.push(part.text)
      } else if (part.inlineData) {
        const buffer = Buffer.from(part.inlineData.data, 'base64')
        const file = await toFile(buffer, 'image.png', {
          type: part.inlineData.mimeType,
        })
        images.push(file)
      }
    }

    const prompt = promptParts.join('\n')

    // @ts-ignore - The OpenAI type definitions might not be fully updated for this specific usage
    const response = await client.images.edit({
      model: model,
      image: images, // Pass array of images as requested
      prompt: prompt,
    })

    if (response.data && response.data.length > 0) {
      const b64Json = response.data[0].b64_json
      if (b64Json) {
        return `data:image/png;base64,${b64Json}`
      }
    }

    throw new Error('No image generated from OpenAI Image Edit API')
  }

  private async generateImageGoogle(model: string, parts: AIPart[]): Promise<string> {
    return this.generateImageFromParts(parts, model)
  }

  private async generateImageFromParts(
    parts: AIPart[],
    modelOverride?: string,
    clientOverride?: GoogleGenAI,
  ): Promise<string> {
    const client = clientOverride || (await this.getGoogleClient())
    const model = modelOverride || 'gemini-2.0-flash'

    const result = await client.models.generateContent({
      model: model,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      contents: { parts: parts as any[] }, // Type assertion
    })

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
