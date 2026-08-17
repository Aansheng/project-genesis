import type { GameWorldGenerationCandidateProvider } from './GameWorldGenerationCandidateProvider'
import type { GameWorldGenerationRequest } from './GameWorldGenerationRequest'
import type { StructuredGenerationClient } from './StructuredGenerationClient'
import { DefaultGameDesignPromptBuilder, type GameDesignPromptBuilder } from './GameDesignPromptBuilder'

/** Converts an untrusted model response into an unknown candidate-shaped value. */
export class LLMGameWorldGenerationCandidateProvider implements GameWorldGenerationCandidateProvider {
  constructor(
    private readonly client: StructuredGenerationClient,
    private readonly promptBuilder: GameDesignPromptBuilder = new DefaultGameDesignPromptBuilder(),
  ) {}

  async generate(request: GameWorldGenerationRequest): Promise<unknown> {
    const response = await this.client.generateStructured(request, this.promptBuilder.build(request))
    if (typeof response !== 'string') return response
    if (response.trim() === '') throw new Error('Empty structured generation response')
    return JSON.parse(response) as unknown
  }
}
