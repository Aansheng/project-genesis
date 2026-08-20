/**
 * Provider-independent Runtime synchronization contracts.
 *
 * The semantic applier owns the semantic snapshot. Runtime synchronization
 * consumes its immutable result and reports the exact Runtime delta without
 * depending on AI, Vue, Pixi, or an asset provider.
 */
import type { World } from '../types'
import type { SemanticWorldMutationResult } from './SemanticWorldDeltaApplier'
import type { WorldSemanticDeltaOperation } from './WorldEvolution'

export type RuntimeEvolutionStatus =
  | 'synchronized'
  | 'no_runtime_impact'
  | 'already_applied'
  | 'failed'

export type RuntimeEvolutionImpact = 'synchronized' | 'none'

export type RuntimeEvolutionFailureReason =
  | 'invalid_mutation'
  | 'invalid_runtime_world'
  | 'world_mismatch'
  | 'stale_revision'
  | 'duplicate_entity_id'
  | 'duplicate_operation'
  | 'entity_not_found'
  | 'entity_semantic_mismatch'
  | 'player_removal_unsupported'
  | 'unsupported_operation'

export interface RuntimeEvolutionSynchronizationOptions {
  /** Current world/session identity. */
  readonly worldId?: string
  /** Runtime's last committed semantic revision marker. */
  readonly runtimeRevision?: number
  /** Last semantic operation committed to Runtime in this session. */
  readonly lastAppliedOperationId?: string
}

export interface RuntimePreservedComponentFacts {
  readonly entityId: string
  readonly componentTypes: readonly string[]
  readonly position?: Readonly<{ x: number; y: number }>
}

/** Immutable result of one atomic semantic-to-Runtime synchronization. */
export interface RuntimeEvolutionResult {
  readonly status: RuntimeEvolutionStatus
  readonly runtimeImpact: RuntimeEvolutionImpact
  readonly worldId: string
  readonly operationId: string
  readonly previousWorld: World
  readonly updatedWorld: World
  readonly appliedOperations: readonly WorldSemanticDeltaOperation[]
  readonly affectedEntityIds: readonly string[]
  readonly addedEntityIds: readonly string[]
  readonly removedEntityIds: readonly string[]
  /** IDs present before and after the targeted synchronization. */
  readonly preservedEntityIds: readonly string[]
  readonly preservedComponentFacts: readonly RuntimePreservedComponentFacts[]
  readonly previousRevision: number
  readonly updatedRevision: number
  readonly failureReason?: RuntimeEvolutionFailureReason
}

export interface RuntimeWorldEvolutionSynchronizer {
  synchronize(
    runtimeWorld: World,
    semanticMutation: SemanticWorldMutationResult,
    options?: RuntimeEvolutionSynchronizationOptions,
  ): RuntimeEvolutionResult
}
