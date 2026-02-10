import { describe, expect, it, mock, beforeEach, beforeAll } from 'bun:test'

const mockSettingService = {
  get: mock(),
}

// Mock the setting service import
mock.module('./setting', () => ({
  settingService: mockSettingService,
}))

// Mock OpenAI
const mockOpenAIClient = {
  chat: {
    completions: {
      create: mock(),
    },
  },
  images: {
    generate: mock(),
  },
  responses: {
    create: mock(),
  },
}

// We mock the default export which is the class, and also named exports
mock.module('openai', () => {
  return {
    default: class {
      constructor() {
        return mockOpenAIClient
      }
    },
    // Mock helper function
    zodResponseFormat: (schema: any) => ({ type: 'json_schema', json_schema: { schema } }),
  }
})

mock.module('openai/helpers/zod', () => ({
  zodResponseFormat: (schema: any) => ({ type: 'json_schema', json_schema: { schema } }),
}))

// Mock Google GenAI
const mockGoogleGenAIClient = {
  models: {
    generateContent: mock(),
  },
}

mock.module('@google/genai', () => ({
  GoogleGenAI: class {
    constructor() {
      return mockGoogleGenAIClient
    }
  },
}))

describe('UnifiedAIService', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let aiService: any

  beforeAll(async () => {
    const module = await import(`./ai?v=${Date.now()}`)
    aiService = module.aiService
  })

  beforeEach(() => {
    mockSettingService.get.mockReset()
    mockOpenAIClient.chat.completions.create.mockReset()
    mockOpenAIClient.images.generate.mockReset()
    mockOpenAIClient.responses.create.mockReset()
    mockGoogleGenAIClient.models.generateContent.mockReset()
  })

  it('should use OpenAI for text generation when configured', async () => {
    // Setup settings
    mockSettingService.get.mockImplementation(async (key: string) => {
      if (key === 'openai_api_key') return 'test_key'
      if (key === 'openai_base_url') return ''
      if (key === 'step_analyze_model') return 'openai:gpt-4o'
      return null
    })

    // Setup OpenAI response
    mockOpenAIClient.chat.completions.create.mockResolvedValue({
      choices: [{ message: { content: '{"result": "success"}' } }],
    })

    const result = await aiService.generateText('prompt', [], undefined, 'step_analyze_model')

    expect(result).toEqual({ result: 'success' })
    expect(mockOpenAIClient.chat.completions.create).toHaveBeenCalled()
    // Verify arguments roughly
    const callArgs = mockOpenAIClient.chat.completions.create.mock.calls[0][0]
    expect(callArgs.model).toBe('gpt-4o')
    expect(mockGoogleGenAIClient.models.generateContent).not.toHaveBeenCalled()
  })

  it('should use Google for text generation when configured', async () => {
    mockSettingService.get.mockImplementation(async (key: string) => {
      if (key === 'google_api_key') return 'test_key'
      if (key === 'step_analyze_model') return 'google:gemini-1.5-pro'
      return null
    })

    // Setup Google response
    mockGoogleGenAIClient.models.generateContent.mockResolvedValue({
      text: () => '{"result": "success"}',
    })

    const result = await aiService.generateText('prompt', [], undefined, 'step_analyze_model')

    expect(result).toEqual({ result: 'success' })
    expect(mockGoogleGenAIClient.models.generateContent).toHaveBeenCalled()
    const callArgs = mockGoogleGenAIClient.models.generateContent.mock.calls[0][0]
    expect(callArgs.model).toBe('gemini-1.5-pro')
    expect(mockOpenAIClient.chat.completions.create).not.toHaveBeenCalled()
  })

  it('should use OpenAI Responses API for image generation when configured', async () => {
    mockSettingService.get.mockImplementation(async (key: string) => {
      if (key === 'openai_api_key') return 'test_key'
      if (key === 'step_generation_model') return 'openai:gpt-5'
      return null
    })

    // Setup OpenAI response for image generation
    mockOpenAIClient.responses.create.mockResolvedValue({
      output: [
        {
          type: 'image_generation_call',
          result: 'base64image',
        },
      ],
    })

    const parts = [{ text: 'test prompt' }]
    const result = await aiService.generateImage(parts, [], 'step_generation_model')

    expect(result).toBe('data:image/png;base64,base64image')
    expect(mockOpenAIClient.responses.create).toHaveBeenCalled()
    const callArgs = mockOpenAIClient.responses.create.mock.calls[0][0]
    expect(callArgs.model).toBe('gpt-5')
    expect(callArgs.tools).toEqual([{ type: 'image_generation' }])
    expect(callArgs.input).toEqual([{ type: 'input_text', text: 'test prompt' }])
  })

  it('should use Google for image generation when configured', async () => {
    mockSettingService.get.mockImplementation(async (key: string) => {
      if (key === 'google_api_key') return 'test_key'
      if (key === 'step_generation_model') return 'google:gemini-2.0-flash'
      return null
    })

    mockGoogleGenAIClient.models.generateContent.mockResolvedValue({
      candidates: [
        {
          content: {
            parts: [
              {
                inlineData: {
                  mimeType: 'image/png',
                  data: 'base64image',
                },
              },
            ],
          },
        },
      ],
    })

    const parts = [{ text: 'test prompt' }]
    const result = await aiService.generateImage(parts, [], 'step_generation_model')

    expect(result).toBe('data:image/png;base64,base64image')
    expect(mockGoogleGenAIClient.models.generateContent).toHaveBeenCalled()
    expect(mockOpenAIClient.responses.create).not.toHaveBeenCalled()
  })
})
