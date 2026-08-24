import type { GameWorldModel } from '../game-world'
import type { GameplayCapabilityCatalog, GameplaySpecification } from './GameplaySpecification'
import type { GameplayRuleSet } from './GameplayRule'
import type { SemanticWorldMutationResult } from '../world-evolution/SemanticWorldDeltaApplier'

export type GameplayRuleReconciliationAction =
  | 'preserved'
  | 'revalidated'
  | 'rebuilt'
  | 'removed'
  | 'deferred'

export interface GameplayRuleReconciliationFact {
  readonly ruleId: string
  readonly action: GameplayRuleReconciliationAction
  readonly reason?: string
}

export interface GameplayRuleReconciliationInput {
  readonly semanticWorld: GameWorldModel
  readonly gameplaySpecification: GameplaySpecification
  readonly currentRuleSet: GameplayRuleSet
  readonly semanticMutation: SemanticWorldMutationResult
  readonly capabilities?: GameplayCapabilityCatalog
}

export interface GameplayRuleReconciliationResult {
  readonly status: 'reconciled' | 'failed'
  readonly operationId: string
  readonly worldId: string
  readonly semanticRevision: number
  readonly ruleSet?: GameplayRuleSet
  readonly facts: readonly GameplayRuleReconciliationFact[]
  readonly preservedRuleIds: readonly string[]
  readonly revalidatedRuleIds: readonly string[]
  readonly rebuiltRuleIds: readonly string[]
  readonly removedRuleIds: readonly string[]
  readonly deferredRuleIds: readonly string[]
  readonly failureReason?: string
}

export interface GameplayRuleReconciler {
  reconcile(input: GameplayRuleReconciliationInput): GameplayRuleReconciliationResult
}
