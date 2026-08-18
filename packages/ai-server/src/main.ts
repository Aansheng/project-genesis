import { OpenAIStructuredGenerationClient } from './OpenAIStructuredGenerationClient'
import { UnavailableStructuredGenerationClient } from './UnavailableStructuredGenerationClient'
import { createServerAIConfiguration } from './createServerAIConfiguration'
import { startAIServer, stopAIServer, type AIServerHandle } from './server'
import { AIProviderConfigurationService } from './AIProviderConfigurationService'
import { OpenAIImageGenerationProvider } from './image-generation/OpenAIImageGenerationProvider'
import { UnavailableImageGenerationProvider } from './image-generation/UnavailableImageGenerationProvider'
import { DashScopeImageGenerationProvider } from './image-generation/DashScopeImageGenerationProvider'
import { CodexCliImageGenerationProvider } from './image-generation/CodexCliImageGenerationProvider'
import { existsSync, readFileSync } from 'node:fs'

loadLocalServerEnv()

function loadLocalServerEnv(): void {
  const file = new URL('../.env.local', import.meta.url)
  if (!existsSync(file)) return
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/u)) {
    const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/u)
    if (match?.[1] !== undefined && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2]?.replace(/^['"]|['"]$/gu, '') ?? ''
    }
  }
}

export function createAIServerClient(env: Record<string, string | undefined> = process.env) {
  const config = createServerAIConfiguration(env)
  return config.apiKey ? new OpenAIStructuredGenerationClient(config.ai) : new UnavailableStructuredGenerationClient()
}

export async function startConfiguredAIServer(
  env: Record<string, string | undefined> = process.env,
): Promise<AIServerHandle> {
  const config = createServerAIConfiguration(env)
  const client = config.apiKey ? new OpenAIStructuredGenerationClient(config.ai) : new UnavailableStructuredGenerationClient()
  const imageProvider = config.image.provider === 'codex-cli'
    ? new CodexCliImageGenerationProvider({ timeoutMs: config.image.timeoutMs, maxAttempts: config.image.maxAttempts, cliPath: env.CODEX_CLI_PATH })
    : config.image.apiKey && config.image.provider === 'dashscope'
    ? new DashScopeImageGenerationProvider({ model: config.image.model, apiKey: config.image.apiKey, baseURL: config.image.baseURL, timeoutMs: config.image.timeoutMs, maxAttempts: config.image.maxAttempts })
    : config.image.apiKey
      ? new OpenAIImageGenerationProvider({ model: config.image.model, apiKey: config.image.apiKey, baseURL: config.image.baseURL, timeoutMs: config.image.timeoutMs, maxAttempts: config.image.maxAttempts })
    : new UnavailableImageGenerationProvider()
  const configurationService = new AIProviderConfigurationService(
    { provider: config.provider, model: config.model, baseURL: config.baseURL, enabled: Boolean(config.apiKey), configured: Boolean(config.apiKey) },
    { apiKey: config.apiKey },
    client,
    (next) => new OpenAIStructuredGenerationClient({ ...config.ai, provider: next.provider, model: next.model, baseURL: next.baseURL, apiKey: next.apiKey, enabled: next.enabled }),
  )
  if (!config.apiKey) console.warn('AI_API_KEY is not configured; AI requests will use the browser deterministic fallback')
  const server = await startAIServer(client, { ...config, configurationService, imageProvider, imageProviderName: config.image.provider })
  console.log(`Genesis AI Gateway listening on http://${server.host}:${server.port}`)
  return server
}

export function registerShutdown(
  server: AIServerHandle,
  exit: (code: number) => void = process.exit,
  stop: (server: AIServerHandle) => Promise<void> = stopAIServer,
): () => Promise<void> {
  let stopping: Promise<void> | undefined
  const shutdown = async (): Promise<void> => {
    stopping ??= stop(server).then(() => exit(0))
    await stopping
  }
  process.once('SIGINT', shutdown)
  process.once('SIGTERM', shutdown)
  return shutdown
}

async function main(): Promise<void> {
  const server = await startConfiguredAIServer()
  registerShutdown(server)
}

if (process.argv.slice(1).some((argument) => /(?:^|\/)main\.ts$/.test(argument))) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'AI server failed to start')
    process.exitCode = 1
  })
}
