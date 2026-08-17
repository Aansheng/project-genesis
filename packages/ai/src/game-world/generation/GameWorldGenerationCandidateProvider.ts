import type { GameWorldGenerationRequest } from './GameWorldGenerationRequest'
import type { StructuredGenerationAttempt } from './StructuredGenerationReliability'

/** Raw provider port. Output remains untrusted until the validator accepts it. */
export interface GameWorldGenerationCandidateProvider {
  generate(request: GameWorldGenerationRequest): Promise<unknown>
  getGenerationAttempts?(): readonly StructuredGenerationAttempt[]
}
