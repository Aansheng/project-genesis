import type { GameWorldModel } from '@genesis/shared'

export interface GameWorldValidationResult {
  readonly valid: boolean
  readonly errors: readonly string[]
  readonly world?: GameWorldModel
}

/** Validates untrusted structured provider output before it enters the domain model. */
export interface GameWorldValidator {
  validate(candidate: unknown): GameWorldValidationResult
}
