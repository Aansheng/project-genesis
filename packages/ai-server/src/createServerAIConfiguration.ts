import type { AIConfiguration } from '@genesis/ai'

export interface AIServerConfig {
  readonly provider: 'openai'
  readonly apiKey?: string
  readonly model: string
  readonly port: number
  readonly host: string
  readonly baseURL?: string
  readonly maxOutputTokens: number
  readonly timeoutMs: number
  readonly maxAttempts: number
  readonly ai: AIConfiguration
}

function numberFromEnv(value: string | undefined, fallback: number, name: string): number {
  if (value === undefined || value.trim() === '') return fallback
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 65535) {
    throw new Error(`${name} must be an integer between 0 and 65535`)
  }
  return parsed
}

function positiveNumberFromEnv(value: string | undefined, fallback: number, name: string, max: number): number {
  if (value === undefined || value.trim() === '') return fallback
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > max) throw new Error(`${name} must be a positive integer`)
  return parsed
}

/** Reads and validates server-only variables. Never use this module in the browser bundle. */
export function createServerAIConfiguration(env: Record<string, string | undefined> = process.env): AIServerConfig {
  const provider = (env.AI_PROVIDER || 'openai').trim()
  if (provider !== 'openai') throw new Error(`Unsupported AI_PROVIDER: ${provider}`)
  const apiKey = env.AI_API_KEY?.trim()
  const model = env.AI_MODEL?.trim() || 'gpt-4o-mini'
  const maxOutputTokens = positiveNumberFromEnv(env.AI_MAX_OUTPUT_TOKENS ?? env.AI_MAX_TOKENS, 4000, 'AI_MAX_OUTPUT_TOKENS', 100000)
  const timeoutMs = positiveNumberFromEnv(env.AI_TIMEOUT_MS, 30000, 'AI_TIMEOUT_MS', 300000)
  const maxAttempts = Math.min(2, positiveNumberFromEnv(env.AI_MAX_ATTEMPTS, 2, 'AI_MAX_ATTEMPTS', 2))
  const ai: AIConfiguration = {
    enabled: true,
    provider,
    model,
    temperature: env.AI_TEMPERATURE ? Number(env.AI_TEMPERATURE) : 0.2,
    maxTokens: maxOutputTokens,
    maxOutputTokens,
    timeoutMs,
    maxAttempts,
    ...(apiKey ? { apiKey } : {}),
    baseURL: env.AI_BASE_URL?.trim() || undefined,
  }
  return {
    provider,
    apiKey,
    model,
    port: numberFromEnv(env.AI_PORT, 8787, 'AI_PORT'),
    host: env.AI_HOST?.trim() || '127.0.0.1',
    baseURL: ai.baseURL,
    maxOutputTokens,
    timeoutMs,
    maxAttempts,
    ai,
  }
}
