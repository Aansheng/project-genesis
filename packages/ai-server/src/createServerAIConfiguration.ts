import type { AIConfiguration } from '@genesis/ai'

/** Reads server-only variables. Never use this module in the browser bundle. */
export function createServerAIConfiguration(env: Record<string, string | undefined> = {}): AIConfiguration {
  const provider = env.AI_PROVIDER || 'deterministic'
  return {
    enabled: provider !== 'deterministic',
    provider,
    model: env.AI_MODEL || 'gpt-4o-mini',
    temperature: env.AI_TEMPERATURE ? Number(env.AI_TEMPERATURE) : 0.2,
    maxTokens: env.AI_MAX_TOKENS ? Number(env.AI_MAX_TOKENS) : 800,
    apiKey: env.AI_API_KEY,
    baseURL: env.AI_BASE_URL,
  }
}
