import type { GameWorldGenerationRequest } from './GameWorldGenerationRequest'
import type { StructuredGenerationAttempt } from './StructuredGenerationReliability'

/** Raw provider port. Output remains untrusted until the validator accepts it. */
export interface GameWorldGenerationCandidateProvider {
  getProviderMetadata?(): { readonly provider: string; readonly model?: string } | undefined
  generate(request: GameWorldGenerationRequest): Promise<unknown>
  getGenerationAttempts?(): readonly StructuredGenerationAttempt[]
}
