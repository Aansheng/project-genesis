import type { AssetKind, AssetRequirement, AssetSpecification, AssetTarget } from '../asset-specification'
import type { VisualDesignSpecification } from '../visual-design'
import type { GameWorldModel } from '../game-world'
import type { SemanticWorldMutationResult } from '../world-evolution/SemanticWorldDeltaApplier'
import type { RuntimeEvolutionResult } from '../world-evolution/RuntimeWorldEvolution'
import type { EvolutionWorldProperty } from '../world-evolution/WorldEvolution'

export type VisualEvolutionStatus = 'planned' | 'no_visual_impact' | 'already_planned' | 'failed'

/** Execution state after a visual delta has been planned. */
export type VisualAssetExecutionStatus =
  | 'queued'
  | 'executing'
  | 'generated'
  | 'manifest_rebound'
  | 'completed'
  | 'failed'
  | 'stale'
  | 'already_synced'

/** Provider-independent execution facts safe for Observatory/UI consumption. */
export interface VisualAssetExecutionResult {
  readonly operationId: string
  readonly worldId: string
  readonly semanticRevision: number
  readonly visualRevision: number
  readonly status: VisualAssetExecutionStatus
  readonly generationRequiredAssetIds: readonly string[]
  readonly generatedCanonicalAssetIds: readonly string[]
  readonly reboundAssetIds: readonly string[]
  readonly removedAssetIds: readonly string[]
  readonly retainedAssetIds: readonly string[]
  readonly failedAssetIds: readonly string[]
  readonly fallbackAssetIds: readonly string[]
  readonly rendererAppliedEntityIds: readonly string[]
  readonly manifestRevision: number
  readonly previousVisualRetained: boolean
  readonly failureReason?: string
}

export type VisualEvolutionFailureReason =
  | 'invalid_mutation'
  | 'invalid_runtime_evolution'
  | 'world_mismatch'
  | 'stale_revision'
  | 'visual_state_missing'
  | 'duplicate_entity_id'
  | 'entity_not_found'
  | 'unsupported_visual_dependency'
  | 'duplicate_plan'

export type AssetImpactAction = 'UNCHANGED' | 'ADD' | 'REPLACE' | 'REMOVE' | 'REBIND' | 'REGENERATE'

export interface VisualArchetypeSnapshot {
  readonly identity: string
  readonly kind: AssetKind
  readonly target: AssetTarget
  readonly subject: string
  readonly visualArchetype?: string
  readonly assetIds: readonly string[]
  readonly entityIds: readonly string[]
  readonly eligibleForGeneration: boolean
}

export interface VisualRequirementReplacement {
  readonly before: AssetRequirement
  readonly after: AssetRequirement
  readonly action: 'REPLACE' | 'REGENERATE'
  readonly generationRequired: boolean
}

export interface VisualBindingChange {
  readonly entityId?: string
  readonly assetId?: string
  readonly beforeArchetype?: string
  readonly afterArchetype?: string
  readonly action: 'REBIND' | 'REMOVE' | 'ADD'
}

export interface VisualWorldImpact {
  readonly property: EvolutionWorldProperty
  readonly affectedAssetKinds: readonly AssetKind[]
  readonly affectedAssetIds: readonly string[]
  readonly reason: string
}

export interface AssetImpactEntry {
  readonly action: AssetImpactAction
  readonly before?: VisualArchetypeSnapshot
  readonly after?: VisualArchetypeSnapshot
  readonly generationRequired: boolean
  readonly orphaned: boolean
}

export interface AssetImpactPlan {
  readonly status: 'planned' | 'no_visual_impact' | 'failed'
  readonly entries: readonly AssetImpactEntry[]
  readonly generationRequired: readonly AssetRequirement[]
  readonly orphanedAssetIds: readonly string[]
  readonly unaffectedAssetIds: readonly string[]
  readonly unaffectedArchetypes: readonly string[]
  readonly noImpactReason?: string
}

export interface VisualEvolutionPlanningOptions {
  readonly worldId?: string
  /** Current semantic revision captured by the active world session. */
  readonly semanticRevision?: number
  /** Current Runtime revision captured by the active world session. */
  readonly runtimeRevision?: number
  readonly visualRevision?: number
  readonly lastPlannedOperationId?: string
}

export interface VisualEvolutionPlan {
  readonly status: VisualEvolutionStatus
  readonly operationId: string
  readonly worldId: string
  readonly semanticRevision: number
  readonly runtimeRevision: number
  readonly previousVisualRevision: number
  readonly updatedVisualRevision: number
  readonly affectedEntityIds: readonly string[]
  readonly oldArchetypes: readonly VisualArchetypeSnapshot[]
  readonly newArchetypes: readonly VisualArchetypeSnapshot[]
  readonly addedVisualRequirements: readonly AssetRequirement[]
  readonly removedVisualRequirements: readonly AssetRequirement[]
  readonly replacedVisualRequirements: readonly VisualRequirementReplacement[]
  readonly bindingOnlyChanges: readonly VisualBindingChange[]
  readonly worldLevelVisualImpact: readonly VisualWorldImpact[]
  readonly unaffectedAssetIds: readonly string[]
  readonly unaffectedArchetypes: readonly string[]
  readonly generationRequired: readonly AssetRequirement[]
  readonly noVisualImpactReason?: string
  readonly previousVisualDesign: VisualDesignSpecification
  readonly updatedVisualDesign: VisualDesignSpecification
  readonly previousAssetSpecification: AssetSpecification
  readonly updatedAssetSpecification: AssetSpecification
  readonly assetImpactPlan: AssetImpactPlan
  readonly failureReason?: VisualEvolutionFailureReason
}

export interface VisualEvolutionPlanner {
  plan(
    beforeSemanticWorld: GameWorldModel,
    afterSemanticWorld: GameWorldModel,
    semanticMutation: SemanticWorldMutationResult,
    runtimeEvolution: RuntimeEvolutionResult,
    currentVisualDesign: VisualDesignSpecification,
    currentAssetSpecification: AssetSpecification,
    options?: VisualEvolutionPlanningOptions,
  ): VisualEvolutionPlan
}
