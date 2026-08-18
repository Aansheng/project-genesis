import { describe, expect, it, vi } from 'vitest'
import { createServerAIConfiguration } from '../createServerAIConfiguration'
import { registerShutdown } from '../main'

describe('AI server composition root', () => {
  it('validates and parses server configuration', () => {
    const config = createServerAIConfiguration({ AI_PROVIDER: 'openai', AI_API_KEY: ' secret ', AI_PORT: '8788' })
    expect(config).toMatchObject({ provider: 'openai', apiKey: 'secret', port: 8788, host: '127.0.0.1' })
  })

  it('allows local startup without a key, but rejects unsupported providers and invalid ports', () => {
    expect(createServerAIConfiguration({ AI_PROVIDER: 'openai' })).toMatchObject({ provider: 'openai', apiKey: undefined })
    expect(() => createServerAIConfiguration({ AI_PROVIDER: 'unknown', AI_API_KEY: 'x' })).toThrow('Unsupported')
    expect(() => createServerAIConfiguration({ AI_PROVIDER: 'openai', AI_API_KEY: 'x', AI_PORT: '70000' })).toThrow('AI_PORT')
  })

  it('keeps image provider configuration separate and server-only', () => {
    const config = createServerAIConfiguration({ IMAGE_AI_API_KEY: 'image-secret', IMAGE_AI_MODEL: 'gpt-image-1', IMAGE_AI_TIMEOUT_MS: '120000' })
    expect(config.image).toMatchObject({ model: 'gpt-image-1', timeoutMs: 120000, maxAttempts: 1 })
    expect(JSON.stringify(config.image)).toContain('image-secret')
  })

  it('supports native DashScope image configuration', () => {
    const config = createServerAIConfiguration({ IMAGE_AI_PROVIDER: 'dashscope', IMAGE_AI_API_KEY: 'secret' })
    expect(config.image).toMatchObject({ provider: 'dashscope', model: 'qwen-image-3.0-pro' })
  })

  it('shuts down only once for repeated signals', async () => {
    const exit = vi.fn()
    const stop = vi.fn().mockResolvedValue(undefined)
    const server = { server: { listening: true } as never, host: '127.0.0.1', port: 0 }
    const shutdown = registerShutdown(server, exit, stop)
    await Promise.all([shutdown(), shutdown()])
    expect(stop).toHaveBeenCalledOnce()
    expect(exit).toHaveBeenCalledWith(0)
  })
})
