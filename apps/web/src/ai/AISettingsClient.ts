export interface AIProviderPublicConfiguration {
  mode: 'api' | 'codex-cli'
  provider: 'openai' | 'openai-compatible'
  model: string
  baseURL?: string
  enabled: boolean
  configured: boolean
}

const gatewayURL = import.meta.env.VITE_AI_GATEWAY_URL || 'http://127.0.0.1:8787/api/world-generation'
const configURL = gatewayURL.replace(/\/api\/world-generation\/?$/u, '/api/ai/config')
const testURL = configURL.replace(/\/config$/u, '/test')

export async function fetchAIConfiguration(fetcher = fetch): Promise<AIProviderPublicConfiguration> {
  const response = await fetcher(configURL)
  if (!response.ok) throw new Error('AI settings unavailable')
  return await response.json() as AIProviderPublicConfiguration
}

export async function saveAIConfiguration(
  value: { mode: 'api' | 'codex-cli'; provider: string; model: string; baseURL: string; apiKey: string; enabled: boolean },
  fetcher = fetch,
): Promise<AIProviderPublicConfiguration> {
  const response = await fetcher(configURL, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(value) })
  const body = await response.json() as AIProviderPublicConfiguration & { error?: string }
  if (!response.ok) throw new Error(body.error || 'Unable to save AI settings')
  return body
}

export async function testAIConfiguration(fetcher = fetch): Promise<{ success: boolean; error?: string }> {
  const response = await fetcher(testURL, { method: 'POST' })
  return await response.json() as { success: boolean; error?: string }
}
