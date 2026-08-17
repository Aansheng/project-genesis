import type { GameWorldGenerationCandidateProvider } from './GameWorldGenerationCandidateProvider'
import type { GameWorldGenerationRequest } from './GameWorldGenerationRequest'
import type { StructuredGenerationClient } from './StructuredGenerationClient'

/** Converts an untrusted model response into an unknown candidate-shaped value. */
export class LLMGameWorldGenerationCandidateProvider implements GameWorldGenerationCandidateProvider {
  constructor(private readonly client: StructuredGenerationClient) {}

  async generate(request: GameWorldGenerationRequest): Promise<unknown> {
    const response = await this.client.generateStructured(request)
    if (typeof response !== 'string') return response
    if (response.trim() === '') throw new Error('Empty structured generation response')
    return JSON.parse(response) as unknown
  }
}
