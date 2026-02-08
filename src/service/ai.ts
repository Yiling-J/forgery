import { GoogleGenAI } from '@google/genai'
import { z } from 'zod'
import zodToJsonSchema from 'zod-to-json-schema'

// Generic AI service interface for flexibility
export interface AIService {
  generateText<T>(prompt: string, images: File[], schema?: z.ZodType<T>): Promise<T>
  generateImage(prompt: string, referenceImages?: File[]): Promise<string>
}

export class GeminiService implements AIService {
  private genAI: GoogleGenAI

  constructor() {
    this.genAI = new GoogleGenAI({ apiKey: process.env.API_KEY || '' })
  }

  // Generates JSON output from text and images using Gemini
  async generateText<T>(prompt: string, images: File[] = [], schema?: z.ZodType<T>): Promise<T> {
    const model = 'gemini-3-pro-preview'

    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = []

    // Convert files to base64 parts
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      config.responseSchema = zodToJsonSchema(schema as any)
    }

    const result = await this.genAI.models.generateContent({
      model: model,
      contents: { parts },
      config: config,
    })

    // @ts-ignore - The property exists on the response object
    const textProp = typeof result.text === 'function' ? result.text() : result.text
    const text = typeof textProp === 'string' ? textProp : undefined
    if (!text) throw new Error('No text generated')

    try {
      // Clean up markdown if present
      const cleanText = text.replace(/^```(json)?\n?|\n?```$/g, '').trim()
      const json = JSON.parse(cleanText)

      if (schema) {
        return schema.parse(json)
      }
      return json as T
    } catch (e: unknown) {
      console.error('Failed to parse JSON', text)
      throw new Error(
        `Invalid JSON response from AI: ${e instanceof Error ? e.message : String(e)}`,
        { cause: e },
      )
    }
  }

  // Generates an image based on prompt and optional reference images
  async generateImage(prompt: string, referenceImages: File[] = []): Promise<string> {
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

    const result = await this.genAI.models.generateContent({
      model: 'gemini-2.5-flash-image',
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

export const aiService = new GeminiService()
