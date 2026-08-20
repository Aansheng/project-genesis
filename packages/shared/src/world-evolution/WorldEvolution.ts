import type { EntityCategory, GameWorldModel } from '../game-world'

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
}

export interface WorldEvolutionRequest {
  readonly operationId: string
  readonly instruction: string
  readonly context: WorldEvolutionWorldContext
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
  readonly source: WorldEvolutionSource
  readonly provider?: string
  readonly model?: string
  readonly kind?: WorldEvolutionOperationKind
  readonly scope?: EvolutionScope
  readonly resolvedTargetIds: readonly string[]
  readonly deltaSummary?: string
  readonly failureReason?: string
  readonly stages: readonly WorldEvolutionStage[]
  readonly events: readonly WorldEvolutionEvent[]
}
