import type { GameWorldGenerationRequest, StructuredGenerationClient } from '@genesis/ai'

/** Keeps local development available when no server-side model credential is configured. */
export class UnavailableStructuredGenerationClient implements StructuredGenerationClient {
  async generateStructured(_request: GameWorldGenerationRequest): Promise<unknown> {
    throw new Error('AI_API_KEY is not configured')
  }
}
