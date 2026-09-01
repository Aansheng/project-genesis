import type { EntityCategory } from '../game-world'
import type { GameplayContactDirection, GameplayEventType } from './GameplayEvent'
export type { GameplayContactDirection } from './GameplayEvent'
import type {
  GameplayCapabilityCatalog,
  GameplayRulePrimitiveCapability,
  GameplaySupportStatus,
} from './GameplaySpecification'

export type GameplayRuleConditionMode = 'all' | 'any'

export type GameplaySelectorKind =
  | 'eventActor'
  | 'eventTarget'
  | 'exactEntityId'
  | 'category'
  | 'archetype'
  | 'role'

/** Data-only reference to a current entity or an event participant. */
export type GameplayEntitySelector =
  | { readonly kind: 'eventActor' }
  | { readonly kind: 'eventTarget' }
  | { readonly kind: 'exactEntityId'; readonly entityId: string }
  | { readonly kind: 'category'; readonly category: EntityCategory }
  | { readonly kind: 'archetype'; readonly archetype: string }
  | { readonly kind: 'role'; readonly role: string }

export type GameplayNumericOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte'

export type GameplayNumericReference =
  | { readonly kind: 'eventPayload'; readonly key: 'x' | 'y' | 'velocityX' | 'velocityY' | 'amount' | 'health' }
  | { readonly kind: 'entityProperty'; readonly entity: GameplayEntitySelector; readonly property: 'x' | 'y' | 'velocityX' | 'velocityY' | 'health' }
  | { readonly kind: 'gameState'; readonly key: string }

export type GameplayBooleanReference =
  | { readonly kind: 'eventPayload'; readonly key: 'isGrounded' | 'isActive' }
  | { readonly kind: 'entityProperty'; readonly entity: GameplayEntitySelector; readonly property: 'enabled' | 'activated' | 'visible' }
  | { readonly kind: 'gameState'; readonly key: string }

export type GameplayCondition =
  | {
      readonly type: 'ENTITY_CATEGORY_EQUALS'
      readonly entity: GameplayEntitySelector
      readonly category: EntityCategory
    }
  | {
      readonly type: 'ENTITY_ARCHETYPE_EQUALS'
      readonly entity: GameplayEntitySelector
      readonly archetype: string
    }
  | {
      readonly type: 'ENTITY_ID_EQUALS'
      readonly entity: GameplayEntitySelector
      readonly entityId: string
    }
  | {
      readonly type: 'CONTACT_DIRECTION_EQUALS'
      readonly direction: GameplayContactDirection
      /** Allows a narrow non-top contact rule without an expression language. */
      readonly negated?: boolean
    }
  | {
      readonly type: 'NUMBER_COMPARE'
      readonly value: GameplayNumericReference
      readonly operator: GameplayNumericOperator
      readonly expected: number
    }
  | {
      readonly type: 'BOOLEAN_EQUALS'
      readonly value: GameplayBooleanReference
      readonly expected: boolean
    }
  | {
      readonly type: 'COMPONENT_EXISTS'
      readonly entity: GameplayEntitySelector
      readonly componentType: 'position' | 'velocity' | 'collision-bounds' | 'semantic' | 'health'
    }

export type GameplayActionValue = string | number | boolean

export interface GameplaySpawnDescriptor {
  readonly category?: EntityCategory
  readonly archetype?: string
  readonly role?: string
}

export type GameplayAction =
  | { readonly type: 'REMOVE_ENTITY'; readonly target: GameplayEntitySelector }
  | { readonly type: 'SPAWN_ENTITY'; readonly entity: GameplaySpawnDescriptor }
  | { readonly type: 'CHANGE_NUMERIC_STATE'; readonly state: string; readonly amount: number }
  | { readonly type: 'SET_ENTITY_PROPERTY'; readonly target: GameplayEntitySelector; readonly property: 'activated' | 'enabled' | 'visible'; readonly value: GameplayActionValue }
  | { readonly type: 'APPLY_VELOCITY'; readonly target: GameplayEntitySelector; readonly velocity: { readonly x?: number; readonly y?: number; readonly mode?: 'set' | 'add' } }
  | { readonly type: 'COMPLETE_GOAL'; readonly goalId?: string }
  | { readonly type: 'DAMAGE_ENTITY'; readonly target: GameplayEntitySelector; readonly amount: number }

export type GameplayConditionType = GameplayCondition['type']
export type GameplayActionType = GameplayAction['type']

export interface GameplayTrigger {
  readonly eventType: GameplayEventType
  /** Optional participant selectors keep the trigger focused on event shape. */
  readonly actor?: GameplayEntitySelector
  readonly target?: GameplayEntitySelector
}

export interface GameplayRuleMetadata {
  readonly source: 'ai' | 'deterministic' | 'normalized'
  readonly warnings?: readonly string[]
  readonly architectureVersion?: string
}

export interface GameplayRuleSpecification {
  readonly schemaVersion: 1
  readonly ruleId: string
  readonly name: string
  readonly label?: string
  readonly enabled: boolean
  readonly sourceMechanicId?: string
  readonly trigger: GameplayTrigger
  readonly conditionMode: GameplayRuleConditionMode
  readonly conditions: readonly GameplayCondition[]
  readonly actions: readonly GameplayAction[]
  readonly priority: number
  /** Genesis-derived truth about the described trigger/conditions/actions. */
  readonly supportStatus: GameplaySupportStatus
  readonly metadata?: GameplayRuleMetadata
}

export type GameplayRuleSetBindingStatus = 'current' | 'stale'

export interface GameplayRuleExecutionInfo {
  readonly enabled: boolean
  readonly status: 'not-active' | 'active'
  readonly message: string
}

export interface GameplayRuleSetMetadata {
  readonly source: 'ai' | 'deterministic'
  readonly warnings?: readonly string[]
  readonly architectureVersion?: string
}

/** Immutable, session-scoped rule intent derived from one GameplaySpecification. */
export interface GameplayRuleSet {
  readonly schemaVersion: 1
  readonly gameplayRevision: number
  readonly sourceGameplayRevision: number
  readonly semanticRevision: number
  readonly sourceSemanticRevision: number
  readonly worldId?: string
  readonly sessionId?: string
  readonly bindingStatus: GameplayRuleSetBindingStatus
  readonly capabilityCatalogVersion: GameplayCapabilityCatalog['version']
  readonly rules: readonly GameplayRuleSpecification[]
  readonly execution: GameplayRuleExecutionInfo
  readonly metadata: GameplayRuleSetMetadata
}

export interface GameplayRuleSetBindingInput {
  readonly worldId?: string
  readonly sessionId?: string
  readonly semanticRevision?: number
}

export const GAMEPLAY_RULE_EVENT_TYPES: readonly GameplayEventType[] = Object.freeze([
  'ENTITY_CONTACT_STARTED',
  'ENTITY_ATTACK_REQUESTED',
  'ENTITY_JUMPED',
  'ENTITY_LANDED',
  'ENTITY_ADDED',
  'ENTITY_REMOVED',
])

export const GAMEPLAY_RULE_CONDITION_TYPES: readonly GameplayConditionType[] = Object.freeze([
  'ENTITY_CATEGORY_EQUALS',
  'ENTITY_ARCHETYPE_EQUALS',
  'ENTITY_ID_EQUALS',
  'CONTACT_DIRECTION_EQUALS',
  'NUMBER_COMPARE',
  'BOOLEAN_EQUALS',
  'COMPONENT_EXISTS',
])

export const GAMEPLAY_RULE_ACTION_TYPES: readonly GameplayActionType[] = Object.freeze([
  'REMOVE_ENTITY',
  'SPAWN_ENTITY',
  'CHANGE_NUMERIC_STATE',
  'SET_ENTITY_PROPERTY',
  'APPLY_VELOCITY',
  'COMPLETE_GOAL',
  'DAMAGE_ENTITY',
])

function kebab(value: string): string {
  return value.trim().toLowerCase().replace(/_/gu, '-').replace(/[^a-z0-9-]+/gu, '-').replace(/-+/gu, '-').replace(/^-|-$/gu, '')
}

export function gameplayRulePrimitiveId(kind: 'event' | 'condition' | 'action', value: string): string {
  return `${kind}-${kebab(value)}`
}

export function getGameplayRulePrimitiveCapability(
  catalog: GameplayCapabilityCatalog,
  kind: GameplayRulePrimitiveCapability['kind'],
  value: string,
): GameplayRulePrimitiveCapability | undefined {
  return catalog.rulePrimitives?.find(item => item.id === gameplayRulePrimitiveId(kind, value))
}

export function bindGameplayRuleSet(
  ruleSet: GameplayRuleSet,
  input: GameplayRuleSetBindingInput,
): GameplayRuleSet {
  const semanticRevision = input.semanticRevision ?? ruleSet.semanticRevision
  return Object.freeze({
    ...ruleSet,
    ...(input.worldId ? { worldId: input.worldId } : {}),
    ...(input.sessionId ? { sessionId: input.sessionId } : {}),
    semanticRevision,
    sourceSemanticRevision: semanticRevision,
    bindingStatus: 'current' as const,
  })
}

/** Keep the old rule facts visible while making an evolution boundary explicit. */
export function markGameplayRuleSetStale(
  ruleSet: GameplayRuleSet,
  semanticRevision: number,
): GameplayRuleSet {
  return Object.freeze({
    ...ruleSet,
    semanticRevision,
    bindingStatus: 'stale' as const,
    metadata: Object.freeze({
      ...ruleSet.metadata,
      warnings: Object.freeze([
        ...(ruleSet.metadata.warnings ?? []),
        'Semantic world changed; gameplay rule synchronization is deferred.',
      ]),
    }),
  })
}
