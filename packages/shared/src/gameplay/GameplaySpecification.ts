import type { EntityCategory } from '../game-world'

export type GameplaySupportStatus = 'supported' | 'partially_supported' | 'deferred' | 'unsupported'

export type GameplayMechanicKind =
  | 'movement'
  | 'interaction'
  | 'combat'
  | 'collection'
  | 'spawn'
  | 'progression'
  | 'goal'
  | 'failure'
  | 'state-change'

export type GameplayGoalKind =
  | 'reach-goal'
  | 'survive-duration'
  | 'defeat-boss'
  | 'collect-target'
  | 'protect-entity'

export type GameplayFailureConditionKind =
  | 'player-death'
  | 'timer-expired'
  | 'protected-object-destroyed'

export type GameplayProgressionMode =
  | 'none'
  | 'score'
  | 'experience'
  | 'levels'
  | 'waves'
  | 'upgrades'

export type GameplaySpawnRuleKind =
  | 'periodic'
  | 'on-interaction'
  | 'at-milestone'
  | 'manual'

export type GameplayCompletionMode = 'goal' | 'duration' | 'endless' | 'open-ended'

/** Narrow, provider-neutral parameters for the first gameplay domain slice. */
export interface GameplayMechanicParameters {
  readonly amount?: number
  readonly damage?: number
  readonly durationSeconds?: number
  readonly jumpImpulse?: number
  readonly speed?: number
  readonly spawnCount?: number
  readonly targetId?: string
  readonly targetRole?: string
}

export interface GameplayMechanicDefinition {
  readonly id: string
  readonly kind: GameplayMechanicKind
  readonly subject?: string
  readonly target?: string
  readonly description: string
  readonly enabled: boolean
  readonly parameters?: GameplayMechanicParameters
  /** Genesis capability truth; providers cannot override this value. */
  readonly supportStatus: GameplaySupportStatus
}

export type GameplayParticipantRole = 'subject' | 'target' | 'participant'

export interface GameplayParticipantReference {
  readonly role: GameplayParticipantRole
  readonly entityId?: string
  readonly entityCategory?: EntityCategory
  readonly entityName?: string
}

export interface GameplayInteractionSpecification {
  readonly id: string
  readonly participants: readonly GameplayParticipantReference[]
  readonly concept: string
  readonly outcome: string
  readonly supportStatus: GameplaySupportStatus
}

export interface GameplayGoalSpecification {
  readonly id: string
  readonly kind: GameplayGoalKind
  readonly description: string
  readonly targetEntityId?: string
  readonly targetCount?: number
  readonly optional: boolean
  readonly supportStatus: GameplaySupportStatus
}

export interface GameplayFailureConditionSpecification {
  readonly id: string
  readonly kind: GameplayFailureConditionKind
  readonly description: string
  readonly targetEntityId?: string
  readonly supportStatus: GameplaySupportStatus
}

export interface GameplayProgressionSpecification {
  readonly modes: readonly GameplayProgressionMode[]
  readonly description: string
  readonly supportStatus: GameplaySupportStatus
}

export interface GameplaySpawnRuleSpecification {
  readonly id: string
  readonly kind: GameplaySpawnRuleKind
  readonly description: string
  readonly entityCategory?: EntityCategory
  readonly entityName?: string
  readonly intervalSeconds?: number
  readonly supportStatus: GameplaySupportStatus
}

export interface GameLoopSpecification {
  readonly objective: string
  readonly repeatableActions: readonly string[]
  readonly challengeSources: readonly string[]
  readonly rewardSources: readonly string[]
  readonly progressionModes: readonly GameplayProgressionMode[]
  readonly completionMode: GameplayCompletionMode
  readonly success: string
  readonly failure: string
}

export interface GameplaySpecificationMetadata {
  readonly source: 'ai' | 'deterministic'
  readonly assumptions?: readonly string[]
  readonly warnings?: readonly string[]
  readonly architectureVersion?: string
}

/** Immutable design intent for how the current semantic world should play. */
export interface GameplaySpecification {
  readonly schemaVersion: 1
  readonly gameplayRevision: number
  readonly gameLoop: GameLoopSpecification
  /** IDs point into mechanics; definitions are not duplicated here. */
  readonly playerMechanics: readonly string[]
  readonly mechanics: readonly GameplayMechanicDefinition[]
  readonly interactions?: readonly GameplayInteractionSpecification[]
  readonly progression?: GameplayProgressionSpecification
  readonly goals?: readonly GameplayGoalSpecification[]
  readonly failureConditions?: readonly GameplayFailureConditionSpecification[]
  readonly spawnRules?: readonly GameplaySpawnRuleSpecification[]
  readonly metadata: GameplaySpecificationMetadata
}

export interface GameplayCapabilityDefinition {
  readonly id: string
  readonly description: string
  readonly mechanicIds: readonly string[]
}

export type GameplayRulePrimitiveKind = 'event' | 'condition' | 'action'

/** Genesis-owned truth for one rule vocabulary primitive. */
export interface GameplayRulePrimitiveCapability {
  readonly id: string
  readonly kind: GameplayRulePrimitiveKind
  readonly description: string
  readonly status: GameplaySupportStatus
}

export interface GameplayCapabilityCatalog {
  readonly version: 'v1'
  readonly capabilities: readonly GameplayCapabilityDefinition[]
  readonly supportedMechanicIds: readonly string[]
  /** Rule vocabulary truth; absent on older custom catalogs for compatibility. */
  readonly rulePrimitives?: readonly GameplayRulePrimitiveCapability[]
}

export const DEFAULT_GAMEPLAY_RULE_PRIMITIVE_CAPABILITIES: readonly GameplayRulePrimitiveCapability[] = Object.freeze([
  ...(['ENTITY_CONTACT_STARTED', 'ENTITY_JUMPED', 'ENTITY_LANDED', 'ENTITY_ADDED', 'ENTITY_REMOVED'] as const).map(type => Object.freeze({
    id: `event-${type.toLowerCase().replace(/_/gu, '-')}`,
    kind: 'event' as const,
    description: `${type} is emitted as a truthful Runtime gameplay fact.`,
    status: 'supported' as const,
  })),
  Object.freeze({ id: 'condition-entity-category-equals', kind: 'condition' as const, description: 'Compare an event participant with a current semantic entity category.', status: 'supported' as const }),
  Object.freeze({ id: 'condition-entity-archetype-equals', kind: 'condition' as const, description: 'Compare an event participant with a current semantic entity name/archetype.', status: 'supported' as const }),
  Object.freeze({ id: 'condition-entity-id-equals', kind: 'condition' as const, description: 'Compare an event participant with an existing stable semantic entity ID.', status: 'supported' as const }),
  Object.freeze({ id: 'condition-contact-direction-equals', kind: 'condition' as const, description: 'Compare the typed Runtime AABB contact direction, including a narrow negated form.', status: 'supported' as const }),
  Object.freeze({ id: 'condition-number-compare', kind: 'condition' as const, description: 'Compare finite numeric Runtime, event, or entity values with a typed operator.', status: 'supported' as const }),
  Object.freeze({ id: 'condition-boolean-equals', kind: 'condition' as const, description: 'Boolean Runtime/game-state comparisons await a trusted evaluator.', status: 'deferred' as const }),
  Object.freeze({ id: 'condition-component-exists', kind: 'condition' as const, description: 'Check a whitelisted Runtime component type on an entity.', status: 'supported' as const }),
  Object.freeze({ id: 'action-remove-entity', kind: 'action' as const, description: 'Remove an entity through the existing immutable World mutation primitive.', status: 'supported' as const }),
  Object.freeze({ id: 'action-spawn-entity', kind: 'action' as const, description: 'Create one composed Runtime entity through trusted immutable gameplay mutation.', status: 'supported' as const }),
  Object.freeze({ id: 'action-change-numeric-state', kind: 'action' as const, description: 'Apply a finite additive delta to the current Runtime-owned numeric progression state.', status: 'supported' as const }),
  Object.freeze({ id: 'action-set-entity-property', kind: 'action' as const, description: 'Set a whitelisted entity property; rule execution is not active.', status: 'deferred' as const }),
  Object.freeze({ id: 'action-apply-velocity', kind: 'action' as const, description: 'Set or add a Runtime VelocityComponent through immutable World mutation.', status: 'supported' as const }),
  Object.freeze({ id: 'action-complete-goal', kind: 'action' as const, description: 'Commit the current Runtime session from active to completed for a trusted goal contact; repeated completion is a no-op.', status: 'supported' as const }),
  Object.freeze({ id: 'action-damage-entity', kind: 'action' as const, description: 'Decrease a target Health component through immutable Runtime mutation; zero is state only.', status: 'supported' as const }),
])

/**
 * Current Runtime truth, intentionally limited to primitives already wired in
 * the production Studio path. This is a catalog, not a plugin registry.
 */
export const DEFAULT_GAMEPLAY_CAPABILITY_CATALOG: GameplayCapabilityCatalog = Object.freeze({
  version: 'v1',
  capabilities: Object.freeze([
    Object.freeze({
      id: 'movement',
      description: 'Player input can move entities through the existing movement systems.',
      mechanicIds: Object.freeze(['player-move']),
    }),
    Object.freeze({
      id: 'jump',
      description: 'The existing player jump system applies a grounded jump impulse.',
      mechanicIds: Object.freeze(['player-jump']),
    }),
    Object.freeze({
      id: 'gravity',
      description: 'The existing gravity and vertical-motion systems update player motion.',
      mechanicIds: Object.freeze(['gravity']),
    }),
    Object.freeze({
      id: 'basic-collision',
      description: 'The existing ground collision system clamps entities to the ground plane.',
      mechanicIds: Object.freeze(['basic-collision']),
    }),
    Object.freeze({
      id: 'entity-mutation',
      description: 'The existing semantic-to-Runtime synchronization path can add and remove entities.',
      mechanicIds: Object.freeze(['entity-add', 'entity-remove']),
    }),
    Object.freeze({
      id: 'gameplay-event-observation',
      description: 'Runtime emits bounded normalized gameplay facts; the supported remove-only RuleSet slice may interpret them after the system boundary.',
      mechanicIds: Object.freeze(['runtime-gameplay-events']),
    }),
    Object.freeze({
      id: 'jump-event-observation',
      description: 'Accepted jumps emit one normalized ENTITY_JUMPED fact.',
      mechanicIds: Object.freeze(['event-player-jump']),
    }),
    Object.freeze({
      id: 'landing-event-observation',
      description: 'Airborne-to-ground transitions emit one normalized ENTITY_LANDED fact.',
      mechanicIds: Object.freeze(['event-entity-landed']),
    }),
    Object.freeze({
      id: 'contact-event-observation',
      description: 'Explicit Runtime collision bounds produce deduplicated ENTITY_CONTACT_STARTED facts.',
      mechanicIds: Object.freeze(['event-entity-contact-started']),
    }),
    Object.freeze({
      id: 'enemy-stomp',
      description: 'A supported generic contact rule removes an enemy target and applies an upward player velocity.',
      mechanicIds: Object.freeze(['enemy-stomp']),
    }),
    Object.freeze({
      id: 'damage-health',
      description: 'Trusted generic contact rules can decrease entity Health; bounded composition may remove a defeated non-player entity.',
      mechanicIds: Object.freeze(['enemy-side-damage', 'contact-offense']),
    }),
    Object.freeze({
      id: 'goal-completion',
      description: 'A trusted generic COMPLETE_GOAL rule commits the current Runtime session completion state.',
      mechanicIds: Object.freeze(['reach-goal']),
    }),
    Object.freeze({
      id: 'numeric-progression',
      description: 'Gameplay rules can mutate Runtime-owned numeric progression values and evaluate typed thresholds.',
      mechanicIds: Object.freeze(['collect-reward', 'gain-experience', 'level-up']),
    }),
    Object.freeze({
      id: 'mutation-event-observation',
      description: 'Committed Runtime World ID-set changes emit ENTITY_ADDED or ENTITY_REMOVED facts.',
      mechanicIds: Object.freeze(['event-entity-added', 'event-entity-removed']),
    }),
    Object.freeze({
      id: 'runtime-entity-creation',
      description: 'Trusted gameplay rules can create one composed Runtime entity from current semantic identity without rebuilding the world.',
      mechanicIds: Object.freeze(['enemy-spawn']),
    }),
  ]),
  supportedMechanicIds: Object.freeze([
    'player-move',
    'player-jump',
    'gravity',
    'basic-collision',
    'entity-add',
    'entity-remove',
    'runtime-gameplay-events',
    'event-player-jump',
    'event-entity-landed',
    'event-entity-contact-started',
    'event-entity-added',
    'event-entity-removed',
    'enemy-stomp',
    'enemy-side-damage',
    'contact-offense',
    'enemy-spawn',
    'reach-goal',
    'collect-reward',
    'gain-experience',
    'level-up',
  ]),
  rulePrimitives: DEFAULT_GAMEPLAY_RULE_PRIMITIVE_CAPABILITIES,
})

export function isGameplayMechanicSupported(
  catalog: GameplayCapabilityCatalog,
  mechanicId: string,
): boolean {
  return catalog.supportedMechanicIds.includes(mechanicId)
}
