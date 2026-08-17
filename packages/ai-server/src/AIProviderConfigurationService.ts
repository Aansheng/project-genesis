import type { AIConfiguration, GameWorldGenerationRequest, StructuredGenerationClient } from '@genesis/ai'
import { OpenAIStructuredGenerationClient } from './OpenAIStructuredGenerationClient'

export type AIProvider = 'openai' | 'openai-compatible'

export interface AIProviderPublicConfiguration {
  readonly provider: AIProvider
  readonly model: string
  readonly baseURL?: string
  readonly enabled: boolean
  readonly configured: boolean
}

export interface AIProviderConfigurationInput {
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
    const provider = input.provider ?? this.publicConfiguration.provider
    if (!isProvider(provider)) throw new AIProviderConfigurationError('Unsupported AI provider')
    const model = (input.model ?? this.publicConfiguration.model).trim()
    if (!model) throw new AIProviderConfigurationError('Model is required')
    const baseURL = validBaseURL(input.baseURL ?? this.publicConfiguration.baseURL)
    const apiKey = input.apiKey?.trim() || this.secretConfiguration.apiKey
    const enabled = input.enabled ?? this.publicConfiguration.enabled
    if (enabled && !apiKey) throw new AIProviderConfigurationError('API key is required when AI is enabled')
    const next: AIProviderPublicConfiguration = { provider, model, baseURL, enabled, configured: Boolean(apiKey) }
    const nextClient = enabled && apiKey ? this.createClient({ ...next, apiKey }) : unavailableClient()
    this.publicConfiguration = next
    this.secretConfiguration = { apiKey }
    this.client = nextClient
    return this.getPublicConfiguration()
  }

  async testConnection(): Promise<void> {
    if (!this.publicConfiguration.enabled || !this.secretConfiguration.apiKey) throw new AIProviderConfigurationError('AI provider is not configured')
    const request: GameWorldGenerationRequest = { input: 'connection test; return valid JSON', intent: { genre: 'sandbox', title: 'connection test' } }
    await this.client.generateStructured(request)
  }
}

function unavailableClient(): StructuredGenerationClient {
  return { generateStructured: async () => { throw new Error('AI provider is not configured') } }
}
