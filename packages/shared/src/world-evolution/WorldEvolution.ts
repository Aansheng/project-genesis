import type { EntityCategory, GameWorldModel } from '../game-world'
import type { VisualAssetExecutionResult } from '../visual-evolution/VisualEvolution'
import type {
  GenerationContextTraceMetadata,
  WorldEvolutionGenerationContext,
} from '../generation-context'

/** The semantic breadth of an evolution request. */
export type EvolutionScope = 'entity' | 'archetype-group' | 'world'

/** The operation family understood by the evolution planner. */
export type EvolutionOperationFamily = 'add' | 'remove' | 'replace' | 'update'

/** The bounded v1 operation vocabulary. */
export type WorldEvolutionOperationKind =
  | 'add-entity'
  | 'remove-entity'
  | 'replace-entity-semantic'
  | 'update-entity-property'
  | 'update-world-property'

export type EvolutionTargetMatch = 'one' | 'all'

/** Semantic selector proposed by a planner, before Genesis resolves IDs. */
export interface EvolutionTargetSelector {
  readonly entityId?: string
  readonly semantic?: string
  readonly category?: EntityCategory
  readonly role?: string
  readonly match?: EvolutionTargetMatch
}

/** Semantic entity description used by intent and delta operations. */
export interface EvolutionEntitySemantic {
  readonly name: string
  readonly category?: EntityCategory
  readonly role?: string
}

/** Semantic fields that are safe to extend later without a JSON-patch system. */
export type EvolutionEntityProperty = 'movementSpeed'
export type EvolutionValueOperation = 'set' | 'multiply'
export type EvolutionWorldProperty = 'theme' | 'timeOfDay'

/** World-level semantic properties currently owned by the semantic session. */
export interface WorldSemanticProperties {
  readonly theme?: string
  readonly timeOfDay?: string
}

/** Compact, provider-independent intent model. */
export type WorldEvolutionIntent =
  | {
      readonly kind: 'add-entity'
      readonly scope: 'entity'
      readonly semantic: EvolutionEntitySemantic
      readonly count: number
    }
  | {
      readonly kind: 'remove-entity'
      readonly scope: 'entity' | 'archetype-group'
      readonly target: EvolutionTargetSelector
    }
  | {
      readonly kind: 'replace-entity-semantic'
      readonly scope: 'entity' | 'archetype-group'
      readonly target: EvolutionTargetSelector
      readonly replacement: EvolutionEntitySemantic
      readonly preserveIdentity: boolean
    }
  | {
      readonly kind: 'update-entity-property'
      readonly scope: 'entity' | 'archetype-group'
      readonly target: EvolutionTargetSelector
      readonly property: EvolutionEntityProperty
      readonly operation: EvolutionValueOperation
      readonly value: number | string
    }
  | {
      readonly kind: 'update-world-property'
      readonly scope: 'world'
      readonly property: EvolutionWorldProperty
      readonly value: string
    }

/** The only semantic context needed to plan an existing-world change. */
export interface WorldEvolutionWorldContext {
  readonly worldId: string
  readonly semanticWorld: GameWorldModel
  readonly properties?: WorldSemanticProperties
  /** Monotonic semantic revision captured when the request was planned. */
  readonly semanticRevision?: number
  /** Runtime semantic revision relevant to a later visual/application guard. */
  readonly runtimeSemanticRevision?: number
  /** Current visual revision when the operation was requested. */
  readonly visualRevision?: number
  /** Real Studio interaction focus, if it targets a current semantic entity. */
  readonly selectedEntityId?: string
}

export interface WorldEvolutionRequest {
  readonly operationId: string
  readonly instruction: string
  readonly context: WorldEvolutionWorldContext
  /** Immutable capability snapshot derived from `context`; never an authority. */
  readonly generationContext?: WorldEvolutionGenerationContext
  readonly createdAt?: string
}

/** Resolved entity semantic used in an immutable delta. */
export interface ResolvedEvolutionEntitySemantic {
  readonly name: string
  readonly category: EntityCategory
  readonly role?: string
}

export type WorldSemanticDeltaOperation =
  | {
      readonly kind: 'add-entity'
      readonly scope: 'entity'
      readonly semantic: ResolvedEvolutionEntitySemantic
      readonly count: number
    }
  | {
      readonly kind: 'remove-entity'
      readonly scope: 'entity' | 'archetype-group'
      readonly targetIds: readonly string[]
    }
  | {
      readonly kind: 'replace-entity-semantic'
      readonly scope: 'entity' | 'archetype-group'
      readonly targetIds: readonly string[]
      readonly from: readonly ResolvedEvolutionEntitySemantic[]
      readonly replacement: ResolvedEvolutionEntitySemantic
      readonly preserveIdentity: boolean
    }
  | {
      readonly kind: 'update-entity-property'
      readonly scope: 'entity' | 'archetype-group'
      readonly targetIds: readonly string[]
      readonly property: EvolutionEntityProperty
      readonly operation: EvolutionValueOperation
      readonly value: number | string
    }
  | {
      readonly kind: 'update-world-property'
      readonly scope: 'world'
      readonly property: EvolutionWorldProperty
      readonly from?: string
      readonly to: string
    }

/** Immutable, validated semantic change plan. It does not apply itself. */
export interface WorldSemanticDelta {
  readonly operationId: string
  readonly worldId: string
  /** Revision of the semantic world used for target resolution. */
  readonly semanticRevision?: number
  readonly operations: readonly WorldSemanticDeltaOperation[]
  readonly summary: string
}

export type WorldEvolutionPlanStatus =
  | 'planning'
  | 'validated'
  | 'needs_clarification'
  | 'unsupported'
  | 'failed'

export type WorldEvolutionOperationStatus =
  | WorldEvolutionPlanStatus
  | 'applying_semantic'
  | 'semantic_applied'
  | 'semantic_application_failed'
  | 'runtime_syncing'
  | 'runtime_synchronized'
  | 'runtime_sync_failed'
  | 'gameplay_reconciliation_failed'
  | 'visual_impact_analyzing'
  | 'visual_delta_planned'
  | 'visual_planning_failed'
  | 'asset_execution_started'
  | 'asset_generation_started'
  | 'asset_generated'
  | 'manifest_rebound'
  | 'asset_resolved'
  | 'renderer_applied'
  | 'visual_sync_completed'
  | 'visual_sync_failed'
  | 'asset_execution_stale'
  | 'asset_execution_already_synced'

export type WorldEvolutionStageName =
  | 'REQUEST_RECEIVED'
  | 'PROMPT_ASSEMBLY'
  | 'STRUCTURED_GENERATION'
  | 'CANDIDATE_PARSE'
  | 'TARGET_RESOLUTION'
  | 'DELTA_VALIDATION'
  | 'SEMANTIC_APPLICATION_STARTED'
  | 'SEMANTIC_APPLICATION_COMPLETED'
  | 'SEMANTIC_APPLICATION_FAILED'
  | 'RUNTIME_SYNC_STARTED'
  | 'RUNTIME_SYNC_COMPLETED'
  | 'RUNTIME_SYNC_FAILED'
  | 'GAMEPLAY_RECONCILIATION_STARTED'
  | 'GAMEPLAY_RECONCILIATION_COMPLETED'
  | 'GAMEPLAY_RECONCILIATION_FAILED'
  | 'VISUAL_IMPACT_STARTED'
  | 'VISUAL_DELTA_PLANNED'
  | 'VISUAL_DELTA_FAILED'
  | 'ASSET_EXECUTION_STARTED'
  | 'ASSET_GENERATION_STARTED'
  | 'ASSET_GENERATED'
  | 'MANIFEST_REBOUND'
  | 'ASSET_RESOLVED'
  | 'RENDERER_APPLIED'
  | 'VISUAL_SYNC_COMPLETED'
  | 'VISUAL_SYNC_FAILED'

export type WorldEvolutionStageStatus = 'success' | 'failed' | 'not-applicable'

export interface WorldEvolutionStage {
  readonly name: WorldEvolutionStageName
  readonly status: WorldEvolutionStageStatus
  readonly timestamp: string
  readonly error?: string
}

export type WorldEvolutionEventType =
  | 'world.evolution.requested'
  | 'world.evolution.planned'
  | 'world.evolution.validation_failed'
  | 'world.evolution.needs_clarification'
  | 'world.evolution.semantic_application_started'
  | 'world.evolution.semantic_applied'
  | 'world.evolution.semantic_application_failed'
  | 'world.evolution.runtime_sync_started'
  | 'world.evolution.runtime_synced'
  | 'world.evolution.runtime_sync_failed'
  | 'world.evolution.gameplay_reconciliation_started'
  | 'world.evolution.gameplay_reconciliation_completed'
  | 'world.evolution.gameplay_reconciliation_failed'
  | 'world.evolution.visual_impact_started'
  | 'world.evolution.visual_delta_planned'
  | 'world.evolution.visual_delta_failed'
  | 'world.evolution.asset_execution_started'
  | 'world.evolution.asset_generation_started'
  | 'world.evolution.asset_generated'
  | 'world.evolution.manifest_rebound'
  | 'world.evolution.renderer_applied'
  | 'world.evolution.visual_sync_completed'
  | 'world.evolution.visual_sync_failed'

export interface WorldEvolutionEvent {
  readonly id: string
  readonly operationId: string
  readonly worldId: string
  readonly type: WorldEvolutionEventType
  readonly timestamp: string
  readonly message: string
}

export type WorldEvolutionSource = 'ai' | 'deterministic'

/** Read-only/session facts exposed to History, Diff, Timeline, and Trace. */
export interface WorldEvolutionOperation {
  readonly operationId: string
  readonly worldId: string
  readonly instruction: string
  readonly status: WorldEvolutionOperationStatus
  readonly createdAt: string
  readonly completedAt?: string
  readonly semanticRevision?: number
  readonly runtimeSemanticRevision?: number
  readonly runtimeSynchronization?: 'pending' | 'synchronized' | 'no_runtime_impact' | 'failed'
  readonly gameplayReconciliation?: 'pending' | 'reconciled' | 'failed'
  readonly gameplayRuleSetRevision?: number
  readonly gameplayRulesPreserved?: number
  readonly gameplayRulesRevalidated?: number
  readonly gameplayRulesRebuilt?: number
  readonly gameplayRulesRemoved?: number
  readonly gameplayRulesDeferred?: number
  readonly visualRevision?: number
  readonly visualPlanning?: 'pending' | 'planned' | 'no_visual_impact' | 'failed'
  readonly visualGenerationRequired?: number
  readonly assetExecution?: 'pending' | 'running' | 'completed' | 'failed' | 'stale' | 'already_synced'
  readonly assetGenerationStarted?: number
  readonly assetGenerated?: number
  readonly assetManifestRevision?: number
  readonly assetRebound?: number
  readonly assetRemoved?: number
  readonly assetRendererApplied?: number
  readonly visualSynchronization?: 'pending' | 'synchronized' | 'failed' | 'previous_retained'
  readonly visualExecution?: VisualAssetExecutionResult
  readonly source: WorldEvolutionSource
  readonly provider?: string
  readonly model?: string
  readonly contextMetadata?: GenerationContextTraceMetadata
  readonly kind?: WorldEvolutionOperationKind
  readonly scope?: EvolutionScope
  readonly resolvedTargetIds: readonly string[]
  readonly deltaSummary?: string
  readonly failureReason?: string
  readonly stages: readonly WorldEvolutionStage[]
  readonly events: readonly WorldEvolutionEvent[]
}
