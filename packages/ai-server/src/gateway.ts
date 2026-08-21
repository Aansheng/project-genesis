import {
  DefaultGameDesignPromptBuilder,
  DefaultWorldEvolutionPromptBuilder,
  type GameIntent,
  type GameWorldGenerationRequest,
  type GameplayGenerationRequest,
  DefaultGameplayPromptBuilder,
  type GameplayPromptBuilder,
  type StructuredGenerationClient,
  type WorldEvolutionStructuredGenerationRequest,
} from '@genesis/ai'

export interface WorldGenerationRequest {
  readonly input: string
  readonly intent?: GameIntent
}

export interface WorldGenerationResponse {
  readonly candidate: unknown
}

type GatewayRequest = WorldGenerationRequest | WorldEvolutionStructuredGenerationRequest | GameplayGenerationRequest

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

function validateRequest(value: unknown): GatewayRequest {
  if (!isRecord(value)) throw new Error('Invalid generation request')
  if (value.kind === 'gameplay-generation') {
    const context = value.context
    const game = isRecord(context) ? context.game : undefined
    const semanticWorld = isRecord(context) ? context.semanticWorld : undefined
    const capabilities = isRecord(context) ? context.capabilities : undefined
    if (
      typeof value.input !== 'string' || value.input.trim() === '' || value.input.length > 4000 ||
      !isRecord(context) || context.scope !== 'gameplay-generation' ||
      !isRecord(game) || typeof game.worldType !== 'string' ||
      !isRecord(semanticWorld) || !Array.isArray(semanticWorld.entities) ||
      !isRecord(capabilities) || !Array.isArray(capabilities.supportedMechanicIds) ||
      typeof context.instruction !== 'string' || context.instruction.length > 4000
    ) throw new Error('Invalid generation request')
    return value as unknown as GameplayGenerationRequest
  }
  if (value.kind === 'world-evolution') {
    const context = value.context
    const world = isRecord(context) ? context.semanticWorld : undefined
    if (
      typeof value.operationId !== 'string' || value.operationId.trim() === '' ||
      typeof value.instruction !== 'string' || value.instruction.trim() === '' || value.instruction.length > 4000 ||
      !isRecord(context) || typeof context.worldId !== 'string' || context.worldId.trim() === '' ||
      !isRecord(world) || typeof world.worldType !== 'string' || !Array.isArray(world.entities)
    ) throw new Error('Invalid generation request')
    return value as unknown as WorldEvolutionStructuredGenerationRequest
  }
  if (typeof value.input !== 'string' || value.input.trim() === '' || value.input.length > 4000) {
    throw new Error('Invalid generation request')
  }
  if (value.intent !== undefined) {
    if (!isRecord(value.intent) || typeof value.intent.genre !== 'string' || typeof value.intent.title !== 'string') {
      throw new Error('Invalid generation request')
    }
  }
  return value as unknown as WorldGenerationRequest
}

function toProviderRequest(request: WorldGenerationRequest): GameWorldGenerationRequest {
  return {
    input: request.input,
    intent: request.intent ?? { genre: 'sandbox', title: request.input },
  }
}

/** Framework-neutral server handler; adapt it to the host's HTTP runtime. */
export function createAIGatewayHandler(
  client: StructuredGenerationClient | (() => StructuredGenerationClient),
  promptBuilder = new DefaultGameDesignPromptBuilder(),
  evolutionPromptBuilder = new DefaultWorldEvolutionPromptBuilder(),
  gameplayPromptBuilder: GameplayPromptBuilder = new DefaultGameplayPromptBuilder(),
) {
  return async (request: Request): Promise<Response> => {
    if (request.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 })
    try {
      const payload = validateRequest(await request.json())
      const activeClient = typeof client === 'function' ? client() : client
      const candidate = 'kind' in payload && payload.kind === 'world-evolution'
        ? await activeClient.generateStructured(payload, evolutionPromptBuilder.build(payload))
        : 'kind' in payload && payload.kind === 'gameplay-generation'
          ? await activeClient.generateStructured(payload, gameplayPromptBuilder.build(payload))
          : await activeClient.generateStructured(toProviderRequest(payload as WorldGenerationRequest), promptBuilder.build(toProviderRequest(payload as WorldGenerationRequest)))
      if (candidate === undefined || JSON.stringify(candidate) === undefined) throw new Error('Invalid candidate')
      const response: WorldGenerationResponse = { candidate }
      return Response.json(response)
    } catch (error) {
      const status = error instanceof Error && error.message === 'Invalid generation request' ? 400 : 502
      return Response.json({ error: status === 400 ? 'Invalid generation request' : 'AI generation unavailable' }, { status })
    }
  }
}
