import { OpenAIStructuredGenerationClient } from './OpenAIStructuredGenerationClient'
import { createServerAIConfiguration } from './createServerAIConfiguration'
import { startAIServer, stopAIServer, type AIServerHandle } from './server'

export function createAIServerClient(env: Record<string, string | undefined> = process.env): OpenAIStructuredGenerationClient {
  return new OpenAIStructuredGenerationClient(createServerAIConfiguration(env).ai)
}

export async function startConfiguredAIServer(
  env: Record<string, string | undefined> = process.env,
): Promise<AIServerHandle> {
  const config = createServerAIConfiguration(env)
  const server = await startAIServer(new OpenAIStructuredGenerationClient(config.ai), config)
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
