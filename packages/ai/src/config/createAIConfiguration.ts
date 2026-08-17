import type { AIConfiguration } from './AIConfiguration'

/**
 * Create an AIConfiguration from a key-value environment map.
 *
 * Supported keys:
 *   VITE_AI_PROVIDER        — "mock" | "openai" | "deepseek"  (default: "mock")
 *   VITE_AI_ENABLED         — enable external model calls ("true"/"false") (default: false)
 *   VITE_AI_MODEL           — model identifier                  (default: varies by provider)
 *   VITE_AI_GATEWAY_URL     — browser-safe AI gateway endpoint
 *   VITE_AI_TEMPERATURE     — response randomness 0.0–2.0       (default: 0.2)
 *   VITE_AI_MAX_TOKENS      — max output tokens                 (default: 800)
 *   VITE_AI_STREAMING       — enable streaming ("true"/"false") (default: undefined)
 *   VITE_AI_TOOL_CALLING    — enable tool calling ("true"/"false") (default: undefined)
 *
 * @param env — Environment variable map (e.g. import.meta.env)
 */
export function createAIConfiguration(
  env: Record<string, string | undefined> = {},
): AIConfiguration {
  const enabled = env.VITE_AI_ENABLED === 'true'
  const provider = env.VITE_AI_PROVIDER || 'mock'
  const gatewayURL = env.VITE_AI_GATEWAY_URL || undefined
  const temperature = env.VITE_AI_TEMPERATURE ? Number(env.VITE_AI_TEMPERATURE) : 0.2
  const maxTokens = env.VITE_AI_MAX_TOKENS ? Number(env.VITE_AI_MAX_TOKENS) : 800
  const maxOutputTokens = env.VITE_AI_MAX_OUTPUT_TOKENS ? Number(env.VITE_AI_MAX_OUTPUT_TOKENS) : 4000
  const timeoutMs = env.VITE_AI_TIMEOUT_MS ? Number(env.VITE_AI_TIMEOUT_MS) : 30000
  const maxAttempts = env.VITE_AI_MAX_ATTEMPTS ? Number(env.VITE_AI_MAX_ATTEMPTS) : 2
  const streaming = env.VITE_AI_STREAMING === 'true' || undefined
  const toolCalling = env.VITE_AI_TOOL_CALLING === 'true' || undefined

  let model = env.VITE_AI_MODEL || ''
  if (!model) {
    switch (provider) {
      case 'mock':
        model = 'mock'
        break
      case 'openai':
        model = 'gpt-4o-mini'
        break
      case 'deepseek':
        model = 'deepseek-chat'
        break
      default:
        model = 'mock'
    }
  }

  const config: AIConfiguration = {
    enabled,
    provider,
    model,
    temperature,
    maxTokens,
    maxOutputTokens,
    timeoutMs,
    maxAttempts,
    gatewayURL,
    allowBrowser: false,
  }

  if (streaming !== undefined) config.streaming = streaming
  if (toolCalling !== undefined) config.toolCalling = toolCalling
  return config
}
