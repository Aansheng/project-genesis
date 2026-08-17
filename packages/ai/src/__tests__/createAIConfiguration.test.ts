import { describe, it, expect } from 'vitest'
import { createAIConfiguration } from '../config/createAIConfiguration'

describe('createAIConfiguration', () => {
  it('should return mock defaults when no env provided', () => {
    const config = createAIConfiguration()
    expect(config.enabled).toBe(false)
    expect(config.provider).toBe('mock')
    expect(config.model).toBe('mock')
    expect(config.gatewayURL).toBeUndefined()
    expect(config.temperature).toBe(0.2)
    expect(config.maxTokens).toBe(800)
  })

  it('should create browser gateway config from env', () => {
    const config = createAIConfiguration({
      VITE_AI_PROVIDER: 'openai',
      VITE_AI_MODEL: 'gpt-4o',
      VITE_AI_GATEWAY_URL: '/api/ai/generate',
    })
    expect(config.provider).toBe('openai')
    expect(config.model).toBe('gpt-4o')
    expect(config.gatewayURL).toBe('/api/ai/generate')
  })

  it('should enable external generation only when explicitly configured', () => {
    expect(createAIConfiguration({ VITE_AI_ENABLED: 'true' }).enabled).toBe(true)
    expect(createAIConfiguration({ VITE_AI_ENABLED: 'false' }).enabled).toBe(false)
  })

  it('should use default model for openai when model not specified', () => {
    const config = createAIConfiguration({
      VITE_AI_PROVIDER: 'openai',
    })
    expect(config.model).toBe('gpt-4o-mini')
  })

  it('should create deepseek config from env', () => {
    const config = createAIConfiguration({
      VITE_AI_PROVIDER: 'deepseek',
    })
    expect(config.provider).toBe('deepseek')
    expect(config.model).toBe('deepseek-chat')
  })

  it('should parse temperature and maxTokens as numbers', () => {
    const config = createAIConfiguration({
      VITE_AI_PROVIDER: 'mock',
      VITE_AI_TEMPERATURE: '0.5',
      VITE_AI_MAX_TOKENS: '1000',
    })
    expect(config.temperature).toBe(0.5)
    expect(config.maxTokens).toBe(1000)
  })

  it('should never read browser provider credentials', () => {
    const config = createAIConfiguration({
      VITE_AI_PROVIDER: 'openai',
      VITE_AI_API_KEY: 'must-not-be-read',
    })
    expect(config.apiKey).toBeUndefined()
    expect(config.baseURL).toBeUndefined()
  })

  it('should use custom model when specified', () => {
    const config = createAIConfiguration({
      VITE_AI_PROVIDER: 'deepseek',
      VITE_AI_MODEL: 'deepseek-reasoner',
    })
    expect(config.model).toBe('deepseek-reasoner')
  })
})
