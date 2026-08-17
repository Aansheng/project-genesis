import { DefaultGameDesignPromptBuilder, type GameIntent, type GameWorldGenerationRequest, type StructuredGenerationClient } from '@genesis/ai'

export interface WorldGenerationRequest {
  readonly input: string
  readonly intent?: GameIntent
}

export interface WorldGenerationResponse {
  readonly candidate: unknown
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

function validateRequest(value: unknown): WorldGenerationRequest {
  if (!isRecord(value) || typeof value.input !== 'string' || value.input.trim() === '' || value.input.length > 4000) {
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
export function createAIGatewayHandler(client: StructuredGenerationClient | (() => StructuredGenerationClient), promptBuilder = new DefaultGameDesignPromptBuilder()) {
  return async (request: Request): Promise<Response> => {
    if (request.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 })
    try {
      const payload = validateRequest(await request.json())
      const providerRequest = toProviderRequest(payload)
      const activeClient = typeof client === 'function' ? client() : client
      const candidate = await activeClient.generateStructured(providerRequest, promptBuilder.build(providerRequest))
      if (candidate === undefined || JSON.stringify(candidate) === undefined) throw new Error('Invalid candidate')
      const response: WorldGenerationResponse = { candidate }
      return Response.json(response)
    } catch (error) {
      const status = error instanceof Error && error.message === 'Invalid generation request' ? 400 : 502
      return Response.json({ error: status === 400 ? 'Invalid generation request' : 'AI generation unavailable' }, { status })
    }
  }
}
