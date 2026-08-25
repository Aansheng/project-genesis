import type { GameWorldModel } from '@genesis/shared'
import type { GameDesignSpecification } from '@genesis/shared'

export type GameWorldCandidateFailureKind = 'structurally_invalid' | 'product_incomplete'

export interface GameWorldValidationResult {
  readonly valid: boolean
  readonly errors: readonly string[]
  readonly failureKind?: GameWorldCandidateFailureKind
  readonly world?: GameWorldModel
  readonly specification?: GameDesignSpecification
}

/** Validates untrusted structured provider output before it enters the domain model. */
export interface GameWorldValidator {
  validate(candidate: unknown): GameWorldValidationResult
}
