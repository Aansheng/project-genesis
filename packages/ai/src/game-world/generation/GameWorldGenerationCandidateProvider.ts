import type { GameWorldGenerationCandidate } from './GameWorldGenerationCandidate'
import type { GameWorldGenerationRequest } from './GameWorldGenerationRequest'

/** Raw provider port. Implementations may be backed by an LLM later. */
export interface GameWorldGenerationCandidateProvider {
  generate(request: GameWorldGenerationRequest): Promise<GameWorldGenerationCandidate>
}
