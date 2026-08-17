import type { GameWorldGenerationRequest } from './GameWorldGenerationRequest'

/** Raw provider port. Output remains untrusted until the validator accepts it. */
export interface GameWorldGenerationCandidateProvider {
  generate(request: GameWorldGenerationRequest): Promise<unknown>
}
