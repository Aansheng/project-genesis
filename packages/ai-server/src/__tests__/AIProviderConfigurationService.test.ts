import { describe, expect, it, vi } from 'vitest'
import { AIProviderConfigurationError, AIProviderConfigurationService } from '../AIProviderConfigurationService'

describe('AIProviderConfigurationService', () => {
  it('returns public metadata without the secret and replaces the client', async () => {
    const oldClient = { generateStructured: vi.fn().mockResolvedValue('{}') }
    const newClient = { generateStructured: vi.fn().mockResolvedValue('{}') }
    const createClient = vi.fn().mockReturnValue(newClient)
    const service = new AIProviderConfigurationService(
      { provider: 'openai', model: 'gpt-4o-mini', enabled: false, configured: false },
      {}, oldClient, createClient,
    )

    const result = service.configure({ provider: 'openai-compatible', model: 'deepseek-chat', baseURL: 'https://example.test/v1/', apiKey: 'secret', enabled: true })

    expect(result).toEqual({ mode: 'api', provider: 'openai-compatible', model: 'deepseek-chat', baseURL: 'https://example.test/v1', enabled: true, configured: true })
    expect(JSON.stringify(result)).not.toContain('secret')
    expect(createClient).toHaveBeenCalledWith(expect.objectContaining({ apiKey: 'secret' }))
    expect(service.getClient()).toBe(newClient)
    await service.testConnection()
    expect(newClient.generateStructured).toHaveBeenCalledOnce()
  })

  it('selects Codex CLI without requiring an API key and switches back to API', () => {
    const apiClient = { generateStructured: vi.fn() }
    const codexClient = { generateStructured: vi.fn(), checkAvailability: vi.fn() }
    const createClient = vi.fn((configuration) => configuration.mode === 'codex-cli' ? codexClient : apiClient)
    const service = new AIProviderConfigurationService(
      { mode: 'api', provider: 'openai-compatible', model: 'deepseek-chat', enabled: false, configured: false }, {}, apiClient, createClient,
    )
    expect(service.configure({ mode: 'codex-cli', enabled: true })).toMatchObject({ mode: 'codex-cli', configured: true })
    expect(service.getClient()).toBe(codexClient)
    expect(JSON.stringify(service.getPublicConfiguration())).not.toContain('apiKey')
    expect(service.configure({ mode: 'api', apiKey: 'secret', enabled: true })).toMatchObject({ mode: 'api', configured: true })
    expect(service.getClient()).toBe(apiClient)
  })

  it('rejects unsafe or incomplete configuration without changing state', () => {
    const client = { generateStructured: vi.fn() }
    const service = new AIProviderConfigurationService(
      { provider: 'openai', model: 'gpt-4o-mini', enabled: false, configured: false }, {}, client,
    )
    expect(() => service.configure({ model: '', enabled: true })).toThrow(AIProviderConfigurationError)
    expect(() => service.configure({ baseURL: 'file:///tmp/key' })).toThrow(AIProviderConfigurationError)
    expect(service.getPublicConfiguration()).toEqual({ provider: 'openai', model: 'gpt-4o-mini', enabled: false, configured: false })
  })
})
