import type { GameDesignSpecification, GameWorldModel } from '@genesis/shared'
import type { StructuredGenerationAttempt, StructuredGenerationFailureReason } from './StructuredGenerationReliability'

export type GameWorldGenerationSource = 'ai' | 'deterministic'

export type GameGenerationStageName =
  | 'REQUEST'
  | 'PROMPT_ASSEMBLY'
  | 'MODEL_GENERATION'
  | 'CANDIDATE_PARSE'
  | 'VALIDATION'
  | 'DESIGN_SPECIFICATION'
  | 'WORLD_COMPILATION'
  | 'RUNTIME_INJECTION'

export type GameGenerationStageStatus =
  | 'pending'
  | 'success'
  | 'failed'
  | 'fallback'
  | 'not-applicable'

export interface GameGenerationTraceStage {
  readonly name: GameGenerationStageName
  readonly status: GameGenerationStageStatus
  readonly error?: string
}

export interface GameGenerationTrace {
  readonly id: string
  readonly source: GameWorldGenerationSource
  readonly status: 'success' | 'fallback' | 'failed'
  readonly stages: readonly GameGenerationTraceStage[]
  readonly attempts?: readonly StructuredGenerationAttempt[]
  readonly failureReason?: StructuredGenerationFailureReason
}

export interface GameWorldGenerationDiagnostics {
  readonly source: GameWorldGenerationSource
  readonly candidate?: unknown
  readonly validationStatus: 'valid' | 'invalid'
  readonly validationErrors: readonly string[]
  readonly specification?: GameDesignSpecification
  readonly worldEntityIds: readonly string[]
  readonly fallbackReason?: string
  readonly failureReason?: StructuredGenerationFailureReason
  readonly trace?: GameGenerationTrace
}

export interface GameWorldGenerationResult {
  readonly world: GameWorldModel
  readonly diagnostics: GameWorldGenerationDiagnostics
}
