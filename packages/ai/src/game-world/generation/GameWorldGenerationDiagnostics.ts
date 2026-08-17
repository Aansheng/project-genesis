import type { GameDesignSpecification, GameWorldModel } from '@genesis/shared'

export type GameWorldGenerationSource = 'ai' | 'deterministic'

export interface GameWorldGenerationDiagnostics {
  readonly source: GameWorldGenerationSource
  readonly candidate?: unknown
  readonly validationStatus: 'valid' | 'invalid'
  readonly validationErrors: readonly string[]
  readonly specification?: GameDesignSpecification
  readonly worldEntityIds: readonly string[]
  readonly fallbackReason?: string
}

export interface GameWorldGenerationResult {
  readonly world: GameWorldModel
  readonly diagnostics: GameWorldGenerationDiagnostics
}
