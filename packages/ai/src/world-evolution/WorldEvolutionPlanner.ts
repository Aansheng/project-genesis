import type {
  WorldEvolutionIntent,
  WorldEvolutionOperation,
  WorldEvolutionRequest,
  WorldEvolutionSource,
  WorldEvolutionStage,
  WorldSemanticDelta,
  SemanticWorldMutationResult,
  RuntimeEvolutionResult,
  VisualEvolutionPlan,
} from '@genesis/shared'
import type { GameDesignPrompt } from '../game-world/generation/GameDesignPromptBuilder'

export interface WorldEvolutionCandidateProvider {
  readonly source?: WorldEvolutionSource
  getProviderMetadata?(): { readonly provider: string; readonly model?: string } | undefined
  generate(request: WorldEvolutionRequest, prompt?: GameDesignPrompt): Promise<unknown>
}

export interface WorldEvolutionTargetResolution {
  readonly status: 'resolved' | 'unresolved' | 'ambiguous'
  readonly targetIds: readonly string[]
  readonly reason?: string
}

export interface WorldEvolutionSemanticResolution {
  readonly status: 'resolved' | 'unresolved'
  readonly semantic?: {
    readonly name: string
    readonly category: import('@genesis/shared').EntityCategory
    readonly role?: string
  }
  readonly reason?: string
}

export interface WorldEvolutionTargetResolver {
  resolveTargets(
    target: import('@genesis/shared').EvolutionTargetSelector,
    request: WorldEvolutionRequest,
  ): WorldEvolutionTargetResolution

  resolveSemantic(
    semantic: import('@genesis/shared').EvolutionEntitySemantic,
    fallbackCategory?: import('@genesis/shared').EntityCategory,
  ): WorldEvolutionSemanticResolution
}

export interface WorldSemanticDeltaValidationResult {
  readonly valid: boolean
  readonly errors: readonly string[]
}

export interface WorldSemanticDeltaValidator {
  validate(delta: WorldSemanticDelta, request: WorldEvolutionRequest): WorldSemanticDeltaValidationResult
}

export type WorldEvolutionPlanResult =
  | {
      readonly status: 'validated'
      readonly request: WorldEvolutionRequest
      readonly intent: WorldEvolutionIntent
      readonly delta: WorldSemanticDelta
      readonly operation: WorldEvolutionOperation
      readonly mutation?: SemanticWorldMutationResult
      readonly runtimeSync?: RuntimeEvolutionResult
      readonly visualPlan?: VisualEvolutionPlan
    }
  | {
      readonly status: 'needs_clarification' | 'unsupported' | 'failed'
      readonly request: WorldEvolutionRequest
      readonly operation: WorldEvolutionOperation
      readonly reason: string
    }

export interface WorldEvolutionPlanner {
  plan(request: WorldEvolutionRequest): Promise<WorldEvolutionPlanResult>
}

/** Safe, fixed vocabulary for planner failures; provider messages stay private. */
export type WorldEvolutionFailureReason =
  | 'invalid_request'
  | 'provider_error'
  | 'candidate_invalid'
  | 'unsupported_operation'
  | 'target_unresolved'
  | 'ambiguous_target'
  | 'delta_invalid'

export function freezeStages(stages: readonly WorldEvolutionStage[]): readonly WorldEvolutionStage[] {
  return Object.freeze(stages.map(stage => Object.freeze({ ...stage })))
}
