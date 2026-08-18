import type { AIConfiguration, GameWorldGenerationRequest, StructuredGenerationClient } from '@genesis/ai'
import { OpenAIStructuredGenerationClient } from './OpenAIStructuredGenerationClient'

export type AIProvider = 'openai' | 'openai-compatible'
export type GameDesignProviderMode = 'api' | 'codex-cli'

export interface AIProviderPublicConfiguration {
  readonly mode?: GameDesignProviderMode
  readonly provider: AIProvider
  readonly model: string
  readonly baseURL?: string
  readonly enabled: boolean
  readonly configured: boolean
}

export interface AIProviderConfigurationInput {
  readonly mode?: string
  readonly provider?: string
  readonly model?: string
  readonly baseURL?: string
  readonly apiKey?: string
  readonly enabled?: boolean
}

export interface AIProviderSecretConfiguration { readonly apiKey?: string }
export type AIProviderClientFactory = (configuration: AIProviderPublicConfiguration & AIProviderSecretConfiguration) => StructuredGenerationClient
export class AIProviderConfigurationError extends Error {}

function isProvider(value: string): value is AIProvider {
  return value === 'openai' || value === 'openai-compatible'
}

function isMode(value: string): value is GameDesignProviderMode {
  return value === 'api' || value === 'codex-cli'
}

function validBaseURL(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined
  try {
    const url = new URL(value)
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error()
    return url.toString().replace(/\/$/u, '')
  } catch {
    throw new AIProviderConfigurationError('Base URL must be a valid HTTP or HTTPS URL')
  }
}

export class AIProviderConfigurationService {
  private publicConfiguration: AIProviderPublicConfiguration
  private secretConfiguration: AIProviderSecretConfiguration
  private client: StructuredGenerationClient

  constructor(
    initial: AIProviderPublicConfiguration,
    secret: AIProviderSecretConfiguration,
    client: StructuredGenerationClient,
    private readonly createClient: AIProviderClientFactory = (configuration) => new OpenAIStructuredGenerationClient({
      enabled: configuration.enabled, provider: configuration.provider, model: configuration.model,
      temperature: 0.2, maxTokens: 4000, maxOutputTokens: 4000, timeoutMs: 30000, maxAttempts: 2,
      apiKey: configuration.apiKey, baseURL: configuration.baseURL,
    } satisfies AIConfiguration),
  ) {
    this.publicConfiguration = { ...initial, configured: Boolean(secret.apiKey) }
    this.secretConfiguration = { ...secret }
    this.client = client
  }

  getPublicConfiguration(): AIProviderPublicConfiguration { return { ...this.publicConfiguration } }
  getClient(): StructuredGenerationClient { return this.client }

  configure(input: AIProviderConfigurationInput): AIProviderPublicConfiguration {
    const mode = input.mode ?? this.publicConfiguration.mode ?? 'api'
    if (!isMode(mode)) throw new AIProviderConfigurationError('Unsupported game design provider mode')
    const provider = input.provider ?? this.publicConfiguration.provider
    if (!isProvider(provider)) throw new AIProviderConfigurationError('Unsupported AI provider')
    const model = (input.model ?? this.publicConfiguration.model).trim()
    if (!model) throw new AIProviderConfigurationError('Model is required')
    const baseURL = validBaseURL(input.baseURL ?? this.publicConfiguration.baseURL)
    const apiKey = input.apiKey?.trim() || this.secretConfiguration.apiKey
    const enabled = input.enabled ?? this.publicConfiguration.enabled
    if (enabled && mode === 'api' && !apiKey) throw new AIProviderConfigurationError('API key is required when API mode is enabled')
    const next: AIProviderPublicConfiguration = { mode, provider, model, baseURL, enabled, configured: mode === 'codex-cli' || Boolean(apiKey) }
    const nextClient = enabled && (mode === 'codex-cli' || apiKey) ? this.createClient({ ...next, apiKey }) : unavailableClient()
    this.publicConfiguration = next
    this.secretConfiguration = { apiKey }
    this.client = nextClient
    return this.getPublicConfiguration()
  }

  async testConnection(): Promise<void> {
    if (!this.publicConfiguration.enabled) throw new AIProviderConfigurationError('AI provider is not enabled')
    if ((this.publicConfiguration.mode ?? 'api') === 'codex-cli') {
      const client = this.client as StructuredGenerationClient & { checkAvailability?: () => Promise<void> }
      if (client.checkAvailability) return client.checkAvailability()
      throw new AIProviderConfigurationError('Codex CLI availability check is unavailable')
    }
    if (!this.secretConfiguration.apiKey) throw new AIProviderConfigurationError('AI provider is not configured')
    const request: GameWorldGenerationRequest = { input: 'connection test; return valid JSON', intent: { genre: 'sandbox', title: 'connection test' } }
    await this.client.generateStructured(request)
  }
}

function unavailableClient(): StructuredGenerationClient {
  return { generateStructured: async () => { throw new Error('AI provider is not configured') } }
}
