import type {
  Entity,
  EntityCategory,
  GameWorldModel,
  GameplayAction,
  GameplayActionValue,
  GameplayBooleanReference,
  GameplayContactDirection,
  GameplayCondition,
  GameplayEntityProperty,
  GameplayEntityRole,
  GameplayEvent,
  GameplayEntitySelector,
  GameplayNumericReference,
  GameplayNumericOperator,
  GameplayRuleConditionMode,
  GameplayRuleSet,
  GameplayRuleSpecification,
  World,
} from '@genesis/shared'
import {
  createHealthComponent,
  createVelocityComponent,
  isGameplayEntityRole,
  isHealthComponent,
  isVelocityComponent,
  resolveGameplayEntityRole,
} from '@genesis/shared'
import { DefaultWorldMutator } from '../mutation'
import type { WorldMutator } from '../mutation'
import {
  createComposedRuntimeEntity,
  findRuntimeEntityPositionWithMinimumSeparation,
  findSafeRuntimeEntityPosition,
} from '../composition'
import {
  applyRuntimeGameplayNumericChange,
  DefaultRuntimeGameplayProgressionStateStore,
} from './RuntimeGameplayProgressionState'
import {
  completeRuntimeGameplaySession,
  DefaultRuntimeGameplaySessionStateStore,
  failRuntimeGameplaySession,
} from './RuntimeGameplaySessionState'
import type { RuntimeGameplayProgressionState } from './RuntimeGameplayProgressionState'
import type {
  RuntimeGameplaySessionState,
  RuntimeGameplaySessionBinding,
} from './RuntimeGameplaySessionState'

const SEMANTIC_COMPONENT_TYPE = 'semantic'
const GAMEPLAY_STATE_COMPONENT_TYPE = 'gameplay-state'
const MAX_CONSUMED_EVENT_RULES = 512
const ENTITY_CATEGORIES: readonly EntityCategory[] = Object.freeze([
  'player',
  'npc',
  'enemy',
  'terrain',
  'building',
  'item',
  'quest',
])
const CONTACT_DIRECTIONS: readonly GameplayContactDirection[] = Object.freeze(['top', 'bottom', 'left', 'right'])

export type GameplayConditionEvaluationStatus = 'passed' | 'failed' | 'unsupported'

export interface GameplayConditionEvaluation {
  readonly status: GameplayConditionEvaluationStatus
  readonly conditions: readonly {
    readonly type: GameplayCondition['type']
    readonly status: GameplayConditionEvaluationStatus
    readonly reason?: string
  }[]
  readonly reason?: string
}

export interface GameplayRuleExecutionContext {
  readonly world: World
  readonly worldId?: string
  readonly sessionId?: string
  readonly semanticRevision?: number
  /** Current semantic authority; Runtime components remain the fallback for standalone callers. */
  readonly semanticWorld?: GameWorldModel
  /** Current Runtime-owned numeric state visible to typed rule conditions. */
  readonly progressionState?: RuntimeGameplayProgressionState
}

export interface GameplayRuleMatcher {
  match(
    event: GameplayEvent,
    ruleSet: GameplayRuleSet,
    context?: GameplayRuleExecutionContext,
  ): readonly GameplayRuleSpecification[]
}

export interface GameplayConditionEvaluator {
  evaluate(
    conditions: readonly GameplayCondition[],
    event: GameplayEvent,
    context: GameplayRuleExecutionContext,
    mode?: GameplayRuleConditionMode,
  ): GameplayConditionEvaluation
  evaluateRule(
    rule: GameplayRuleSpecification,
    event: GameplayEvent,
    context: GameplayRuleExecutionContext,
  ): GameplayConditionEvaluation
}

export type GameplayActionExecutionStatus = 'executed' | 'failed' | 'unsupported' | 'rolled_back' | 'no_op'

export interface GameplayActionExecutionRequest {
  readonly ruleId: string
  readonly event: GameplayEvent
  readonly action: GameplayAction
  readonly context: GameplayRuleExecutionContext
  readonly sessionState?: RuntimeGameplaySessionState
  readonly progressionState?: RuntimeGameplayProgressionState
}

export interface GameplayActionExecutionResult {
  readonly ruleId: string
  readonly eventId: string
  readonly actionType: GameplayAction['type']
  readonly status: GameplayActionExecutionStatus
  readonly targetEntityIds: readonly string[]
  readonly worldBefore: World
  readonly worldAfter: World
  readonly failureReason?: string
  readonly reason?: string
  readonly sessionStateAfter?: RuntimeGameplaySessionState
  readonly progressionStateAfter?: RuntimeGameplayProgressionState
  readonly mutation?:
    | {
        readonly type: 'ENTITY_REMOVED'
        readonly targetEntityId: string
        readonly health?: number
      }
    | {
        readonly type: 'ENTITY_ADDED'
        readonly targetEntityId: string
      }
    | {
        readonly type: 'VELOCITY_UPDATED'
        readonly targetEntityId: string
        readonly velocity: { readonly x: number; readonly y: number }
      }
    | {
        readonly type: 'HEALTH_UPDATED'
        readonly targetEntityId: string
        readonly health: { readonly current: number; readonly max: number }
        readonly damageAmount: number
      }
    | {
        readonly type: 'ENTITY_PROPERTY_UPDATED'
        readonly targetEntityId: string
        readonly property: GameplayEntityProperty
        readonly value: GameplayActionValue
        readonly previousValue?: GameplayActionValue
      }
    | {
        readonly type: 'GOAL_COMPLETED'
        readonly goalId?: string
      }
    | {
        readonly type: 'GOAL_COMPLETION_NOOP'
        readonly goalId?: string
      }
    | {
        readonly type: 'NUMERIC_STATE_UPDATED'
        readonly state: string
        readonly previousValue: number
        readonly value: number
        readonly amount: number
      }
}

export interface GameplayActionExecutor {
  execute(request: GameplayActionExecutionRequest): GameplayActionExecutionResult
}

export type GameplayRuleExecutionStatus =
  | 'matched'
  | 'conditions_failed'
  | 'executed'
  | 'execution_failed'
  | 'stale'
  | 'unsupported'

export interface GameplayRuleExecutionResult {
  readonly eventId: string
  readonly ruleId: string
  readonly matchedTrigger: GameplayEvent['type']
  readonly status: GameplayRuleExecutionStatus
  readonly committed: boolean
  readonly conditionResult?: GameplayConditionEvaluation
  readonly actionResults: readonly GameplayActionExecutionResult[]
  readonly affectedEntityIds: readonly string[]
  readonly reason?: string
}

export interface GameplayRuleExecutionBatch {
  readonly world: World
  readonly results: readonly GameplayRuleExecutionResult[]
  readonly sessionState?: RuntimeGameplaySessionState
  readonly progressionState?: RuntimeGameplayProgressionState
}

export interface GameplayRuleExecutor {
  execute(
    events: readonly GameplayEvent[],
    ruleSet: GameplayRuleSet,
    context: GameplayRuleExecutionContext,
  ): GameplayRuleExecutionBatch
  executeEvent(
    event: GameplayEvent,
    ruleSet: GameplayRuleSet,
    context: GameplayRuleExecutionContext,
  ): GameplayRuleExecutionBatch
}

export interface GameplayRuleExecutionObserver {
  observe(results: readonly GameplayRuleExecutionResult[]): void
}

interface SemanticFacts {
  readonly category?: EntityCategory
  readonly name?: string
  readonly gameplayRole?: GameplayEntityRole
}

function isEntityCategory(value: unknown): value is EntityCategory {
  return typeof value === 'string' && ENTITY_CATEGORIES.includes(value as EntityCategory)
}

function normalizeArchetype(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/gu, '-').replace(/^-|-$/gu, '')
}

function semanticFactsOf(
  entity: Entity,
  semanticWorld?: GameWorldModel,
): SemanticFacts {
  const authoritative = semanticWorld?.entities.find(item => item.id === entity.id)
  const component = entity.components?.find(item => item.type === SEMANTIC_COMPONENT_TYPE)
  const componentCategory = component?.properties.category
  const componentName = component?.properties.name
  const componentRole = component?.properties.gameplayRole
  const gameplayRole = authoritative
    ? resolveGameplayEntityRole(semanticWorld?.worldType ?? 'sandbox', authoritative)
    : isGameplayEntityRole(componentRole)
      ? componentRole
      : undefined
  return {
    ...(authoritative?.category
      ? { category: authoritative.category }
      : isEntityCategory(componentCategory)
        ? { category: componentCategory }
        : isEntityCategory(entity.type)
          ? { category: entity.type }
          : {}),
    ...(authoritative?.name
      ? { name: authoritative.name }
      : typeof componentName === 'string'
        ? { name: componentName }
        : {}),
    ...(gameplayRole ? { gameplayRole } : {}),
  }
}

function entityById(world: World, entityId: string | undefined): Entity | undefined {
  return entityId === undefined ? undefined : world.entities.find(entity => entity.id === entityId)
}

function selectorMatchesEntity(
  selector: GameplayEntitySelector,
  entity: Entity,
  event: GameplayEvent,
  semanticWorld?: GameWorldModel,
): boolean {
  switch (selector.kind) {
    case 'eventActor':
      return 'actorEntityId' in event && event.actorEntityId === entity.id
    case 'eventTarget':
      return 'targetEntityId' in event && event.targetEntityId === entity.id
    case 'exactEntityId':
      return selector.entityId === entity.id
    case 'category':
      return semanticFactsOf(entity, semanticWorld).category === selector.category
    case 'archetype':
      return normalizeArchetype(semanticFactsOf(entity, semanticWorld).name ?? '')
        === normalizeArchetype(selector.archetype)
    case 'role':
      // The validator defines role as a semantic category alias. Do not infer it from IDs.
      return semanticFactsOf(entity, semanticWorld).category === selector.role
  }
}

function resolveSelector(
  selector: GameplayEntitySelector,
  event: GameplayEvent,
  context: GameplayRuleExecutionContext,
): Entity | undefined {
  if (selector.kind === 'eventActor') {
    return 'actorEntityId' in event ? entityById(context.world, event.actorEntityId) : undefined
  }
  if (selector.kind === 'eventTarget') {
    return 'targetEntityId' in event ? entityById(context.world, event.targetEntityId) : undefined
  }
  if (selector.kind === 'exactEntityId') return entityById(context.world, selector.entityId)
  return context.world.entities.find(entity => selectorMatchesEntity(selector, entity, event, context.semanticWorld))
}

function finiteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function resolveNumericReference(
  reference: GameplayNumericReference,
  event: GameplayEvent,
  context: GameplayRuleExecutionContext,
): number | undefined {
  if (reference.kind === 'eventPayload') return finiteNumber(event.payload?.[reference.key])
  if (reference.kind === 'gameState') return finiteNumber(context.progressionState?.values[reference.key])

  const entity = resolveSelector(reference.entity, event, context)
  if (!entity) return undefined
  if (reference.property === 'x') return finiteNumber(entity.x)
  if (reference.property === 'y') return finiteNumber(entity.y)
  if (reference.property === 'velocityX') return finiteNumber(entity.components?.find(isVelocityComponent)?.properties.x)
  if (reference.property === 'velocityY') return finiteNumber(entity.components?.find(isVelocityComponent)?.properties.y)
  return finiteNumber(entity.components?.find(isHealthComponent)?.properties.current)
}

function resolveBooleanReference(
  reference: GameplayBooleanReference,
  event: GameplayEvent,
  context: GameplayRuleExecutionContext,
): boolean | undefined {
  if (reference.kind === 'eventPayload') {
    const value = event.payload?.[reference.key]
    return typeof value === 'boolean' ? value : undefined
  }
  if (reference.kind === 'gameState') return undefined

  const entity = resolveSelector(reference.entity, event, context)
  if (!entity) return undefined
  const state = entity.components?.find(component => component.type === GAMEPLAY_STATE_COMPONENT_TYPE)
  const value = state?.properties[reference.property]
  // A missing boolean flag is the typed false/default state. This lets a
  // later rule be truthfully gated before the first interaction commits it.
  if (value === undefined) return false
  return typeof value === 'boolean' ? value : undefined
}

function numericComparisonMatches(
  value: number,
  operator: GameplayNumericOperator,
  expected: number,
): boolean {
  switch (operator) {
    case 'eq': return value === expected
    case 'neq': return value !== expected
    case 'gt': return value > expected
    case 'gte': return value >= expected
    case 'lt': return value < expected
    case 'lte': return value <= expected
  }
}

function sameBinding(
  event: GameplayEvent,
  ruleSet: GameplayRuleSet,
  context?: GameplayRuleExecutionContext,
): boolean {
  if (ruleSet.bindingStatus !== 'current') return false
  const currentWorldId = context?.worldId ?? event.worldId
  if (ruleSet.worldId !== undefined && currentWorldId !== ruleSet.worldId) return false
  if (ruleSet.worldId !== undefined && event.worldId !== undefined && ruleSet.worldId !== event.worldId) return false
  if (ruleSet.sessionId !== undefined && context?.sessionId !== ruleSet.sessionId) return false
  if (context?.semanticRevision !== undefined) return ruleSet.semanticRevision === context.semanticRevision
  return ruleSet.semanticRevision === 0
}

function triggerParticipantMatches(
  selector: GameplayEntitySelector | undefined,
  entityId: string | undefined,
  event: GameplayEvent,
  context: GameplayRuleExecutionContext,
): boolean {
  if (selector === undefined) return true
  if (selector.kind === 'eventActor') {
    return entityId !== undefined && 'actorEntityId' in event && entityId === event.actorEntityId
  }
  if (selector.kind === 'eventTarget') {
    return entityId !== undefined && 'targetEntityId' in event && entityId === event.targetEntityId
  }
  const entity = entityById(context.world, entityId)
  if (entity === undefined && (event.type === 'ENTITY_ADDED' || event.type === 'ENTITY_REMOVED')) {
    const entityType = typeof event.payload?.entityType === 'string' ? event.payload.entityType : undefined
    const entityName = typeof event.payload?.entityName === 'string' ? event.payload.entityName : undefined
    if (selector.kind === 'category') return entityType === selector.category
    if (selector.kind === 'role') return entityType === selector.role
    if (selector.kind === 'archetype') return entityName !== undefined
      && normalizeArchetype(entityName) === normalizeArchetype(selector.archetype)
  }
  return entity !== undefined && selectorMatchesEntity(selector, entity, event, context.semanticWorld)
}

function spawnTemplate(
  action: Extract<GameplayAction, { readonly type: 'SPAWN_ENTITY' }>,
  semanticWorld: GameWorldModel,
): GameWorldModel['entities'][number] | undefined {
  return semanticWorld.entities.find(entity =>
    (action.entity.category === undefined || entity.category === action.entity.category)
    && (action.entity.role === undefined || entity.category === action.entity.role)
    && (action.entity.archetype === undefined
      || normalizeArchetype(entity.name) === normalizeArchetype(action.entity.archetype)),
  )
}

function uniqueSpawnId(world: World, templateId: string, tick: number): string {
  const base = `${templateId}-runtime-${Math.max(0, Math.floor(tick))}`
  if (!world.entities.some(entity => entity.id === base)) return base
  let suffix = 2
  while (world.entities.some(entity => entity.id === `${base}-${suffix}`)) suffix += 1
  return `${base}-${suffix}`
}

export class DefaultGameplayRuleMatcher implements GameplayRuleMatcher {
  match(
    event: GameplayEvent,
    ruleSet: GameplayRuleSet,
    context?: GameplayRuleExecutionContext,
  ): readonly GameplayRuleSpecification[] {
    if (!sameBinding(event, ruleSet, context)) return Object.freeze([])

    const candidates = ruleSet.rules
      .map((rule, index) => ({ rule, index }))
      .filter(({ rule }) => rule.enabled && rule.trigger.eventType === event.type)
      .filter(({ rule }) => triggerParticipantMatches(
        rule.trigger.actor,
        'actorEntityId' in event ? event.actorEntityId : undefined,
        event,
        context ?? { world: { entities: [] } },
      ))
      .filter(({ rule }) => triggerParticipantMatches(
        rule.trigger.target,
        'targetEntityId' in event ? event.targetEntityId : undefined,
        event,
        context ?? { world: { entities: [] } },
      ))
      .sort((left, right) => left.rule.priority - right.rule.priority
        || left.index - right.index
        || left.rule.ruleId.localeCompare(right.rule.ruleId))

    return Object.freeze(candidates.map(({ rule }) => rule))
  }
}

function conditionResult(
  type: GameplayCondition['type'],
  status: GameplayConditionEvaluationStatus,
  reason?: string,
): GameplayConditionEvaluation['conditions'][number] {
  return Object.freeze({ type, status, ...(status !== 'passed' && reason ? { reason } : {}) })
}

export class DefaultGameplayConditionEvaluator implements GameplayConditionEvaluator {
  evaluate(
    conditions: readonly GameplayCondition[],
    event: GameplayEvent,
    context: GameplayRuleExecutionContext,
    mode: GameplayRuleConditionMode = 'all',
  ): GameplayConditionEvaluation {
    const results = conditions.map(condition => this.evaluateCondition(condition, event, context))
    const unsupported = results.find(result => result.status === 'unsupported')
    const failed = results.find(result => result.status === 'failed')
    const passed = mode === 'any'
      ? results.some(result => result.status === 'passed')
      : results.every(result => result.status === 'passed')
    const status: GameplayConditionEvaluationStatus = unsupported
      ? 'unsupported'
      : failed
        ? 'failed'
        : passed
          ? 'passed'
          : 'failed'
    return Object.freeze({
      status,
      conditions: Object.freeze(results),
      ...(status !== 'passed' ? { reason: unsupported?.reason ?? failed?.reason ?? 'conditions_not_satisfied' } : {}),
    })
  }

  evaluateRule(
    rule: GameplayRuleSpecification,
    event: GameplayEvent,
    context: GameplayRuleExecutionContext,
  ): GameplayConditionEvaluation {
    return this.evaluate(rule.conditions, event, context, rule.conditionMode)
  }

  private evaluateCondition(
    condition: GameplayCondition,
    event: GameplayEvent,
    context: GameplayRuleExecutionContext,
  ): GameplayConditionEvaluation['conditions'][number] {
    if (condition.type === 'CONTACT_DIRECTION_EQUALS') {
      if (event.type !== 'ENTITY_CONTACT_STARTED' || !CONTACT_DIRECTIONS.includes(event.direction)) {
        return conditionResult(condition.type, 'unsupported', 'contact_direction_unavailable')
      }
      const matches = event.direction === condition.direction
      const passed = condition.negated ? !matches : matches
      return conditionResult(condition.type, passed ? 'passed' : 'failed', 'contact_direction_mismatch')
    }

    if (condition.type === 'NUMBER_COMPARE') {
      const expected = finiteNumber(condition.expected)
      if (expected === undefined) return conditionResult(condition.type, 'unsupported', 'numeric_expected_must_be_finite')
      const value = resolveNumericReference(condition.value, event, context)
      if (value === undefined) return conditionResult(condition.type, 'failed', 'numeric_value_unavailable')
      return conditionResult(
        condition.type,
        numericComparisonMatches(value, condition.operator, expected) ? 'passed' : 'failed',
        'numeric_comparison_mismatch',
      )
    }

    if (condition.type === 'BOOLEAN_EQUALS') {
      const value = resolveBooleanReference(condition.value, event, context)
      if (value === undefined) return conditionResult(condition.type, 'failed', 'boolean_value_unavailable')
      return conditionResult(
        condition.type,
        value === condition.expected ? 'passed' : 'failed',
        'boolean_comparison_mismatch',
      )
    }

    if (condition.type === 'ENTITY_ID_EQUALS') {
      const eventEntityId = condition.entity.kind === 'eventActor'
        ? ('actorEntityId' in event ? event.actorEntityId : undefined)
        : condition.entity.kind === 'eventTarget'
          ? ('targetEntityId' in event ? event.targetEntityId : undefined)
          : undefined
      if (eventEntityId !== undefined) {
        return conditionResult(condition.type, eventEntityId === condition.entityId ? 'passed' : 'failed', 'entity_id_mismatch')
      }
    }

    const entity = resolveSelector(condition.entity, event, context)
    if (!entity) return conditionResult(condition.type, 'failed', 'entity_not_found')

    if (condition.type === 'ENTITY_CATEGORY_EQUALS') {
      return conditionResult(condition.type, semanticFactsOf(entity, context.semanticWorld).category === condition.category ? 'passed' : 'failed', 'category_mismatch')
    }
    if (condition.type === 'ENTITY_ARCHETYPE_EQUALS') {
      return conditionResult(
        condition.type,
        normalizeArchetype(semanticFactsOf(entity, context.semanticWorld).name ?? '') === normalizeArchetype(condition.archetype) ? 'passed' : 'failed',
        'archetype_mismatch',
      )
    }
    if (condition.type === 'ENTITY_GAMEPLAY_ROLE_EQUALS') {
      return conditionResult(
        condition.type,
        semanticFactsOf(entity, context.semanticWorld).gameplayRole === condition.role ? 'passed' : 'failed',
        'gameplay_role_mismatch',
      )
    }
    if (condition.type === 'ENTITY_ID_EQUALS') {
      return conditionResult(condition.type, entity.id === condition.entityId ? 'passed' : 'failed', 'entity_id_mismatch')
    }
    return conditionResult(
      condition.type,
      entity.components?.some(component => component.type === condition.componentType) ? 'passed' : 'failed',
      'component_missing',
    )
  }
}

export class DefaultGameplayActionExecutor implements GameplayActionExecutor {
  constructor(private readonly worldMutator: WorldMutator = new DefaultWorldMutator()) {}

  execute(request: GameplayActionExecutionRequest): GameplayActionExecutionResult {
    const { action, context, event, ruleId } = request
    const base = {
      ruleId,
      eventId: event.eventId,
      actionType: action.type,
      targetEntityIds: Object.freeze([]) as readonly string[],
      worldBefore: context.world,
      worldAfter: context.world,
    }

    if (action.type === 'COMPLETE_GOAL') {
      if (event.worldId !== undefined && context.worldId !== undefined && event.worldId !== context.worldId) {
        return Object.freeze({
          ...base,
          status: 'failed' as const,
          failureReason: 'stale_event_binding',
        })
      }
      if (request.sessionState === undefined) {
        return Object.freeze({
          ...base,
          status: 'failed' as const,
          failureReason: 'session_state_unavailable',
        })
      }

      const goalId = action.goalId ?? ('targetEntityId' in event ? event.targetEntityId : undefined)
      const completion = completeRuntimeGameplaySession(request.sessionState, {
        ...(goalId ? { goalId } : {}),
        tick: event.tick,
      })
      const completed = completion.outcome === 'completed'
      const reason = completed
        ? undefined
        : completion.outcome === 'already_failed'
          ? 'session_failed'
          : 'goal_already_completed'
      return Object.freeze({
        ...base,
        status: completed ? 'executed' as const : 'no_op' as const,
        ...(reason ? { reason } : {}),
        sessionStateAfter: completion.state,
        mutation: Object.freeze({
          type: completed ? 'GOAL_COMPLETED' as const : 'GOAL_COMPLETION_NOOP' as const,
          ...(goalId ? { goalId } : {}),
        }),
      })
    }

    if (action.type === 'CHANGE_NUMERIC_STATE') {
      if (request.progressionState === undefined) {
        return Object.freeze({
          ...base,
          status: 'failed' as const,
          failureReason: 'progression_state_unavailable',
        })
      }
      const change = applyRuntimeGameplayNumericChange(
        request.progressionState,
        action.state,
        action.amount,
      )
      if (change === undefined) {
        return Object.freeze({
          ...base,
          status: 'failed' as const,
          failureReason: action.state.trim()
            ? 'numeric_state_change_must_remain_finite'
            : 'numeric_state_key_must_be_non_empty',
        })
      }
      return Object.freeze({
        ...base,
        status: 'executed' as const,
        progressionStateAfter: change.state,
        mutation: Object.freeze({
          type: 'NUMERIC_STATE_UPDATED' as const,
          state: change.key,
          previousValue: change.previousValue,
          value: change.value,
          amount: change.amount,
        }),
      })
    }

    if (action.type === 'SPAWN_ENTITY') {
      if (!context.semanticWorld) {
        return Object.freeze({
          ...base,
          status: 'failed' as const,
          failureReason: 'semantic_world_unavailable',
        })
      }
      const template = spawnTemplate(action, context.semanticWorld)
      if (!template) {
        return Object.freeze({
          ...base,
          status: 'failed' as const,
          failureReason: 'spawn_template_not_found',
        })
      }
      const id = uniqueSpawnId(context.world, template.id, event.tick)
      const targetEntityId = template.category === 'enemy'
        ? context.world.entities.find(entity => semanticFactsOf(entity, context.semanticWorld).category === 'player')?.id
        : undefined
      const isSurvivalEnemyReplacement = context.semanticWorld.worldType === 'survival'
        && template.category === 'enemy'
      if (isSurvivalEnemyReplacement && !targetEntityId) {
        return Object.freeze({
          ...base,
          status: 'failed' as const,
          failureReason: 'protected_player_position_unavailable',
        })
      }
      const position = isSurvivalEnemyReplacement
        ? findRuntimeEntityPositionWithMinimumSeparation(
          context.world.entities,
          id,
          template.category,
          { protectedEntityIds: [targetEntityId!] },
        )
        : findSafeRuntimeEntityPosition(context.world.entities, id, template.category)
      if (!position) {
        return Object.freeze({
          ...base,
          status: 'failed' as const,
          failureReason: 'fair_start_position_unavailable',
        })
      }
      const spawned = createComposedRuntimeEntity({
        id,
        semanticEntity: template,
        position,
        worldType: context.semanticWorld.worldType,
        ...(targetEntityId ? { targetEntityId } : {}),
      })
      const worldAfter = this.worldMutator.addEntity(context.world, spawned)
      if (!worldAfter.entities.some(entity => entity.id === id)) {
        return Object.freeze({
          ...base,
          status: 'failed' as const,
          failureReason: 'runtime_mutation_failed',
        })
      }
      return Object.freeze({
        ...base,
        status: 'executed' as const,
        targetEntityIds: Object.freeze([id]),
        worldAfter,
        mutation: Object.freeze({ type: 'ENTITY_ADDED' as const, targetEntityId: id }),
      })
    }

    if (action.type === 'SET_ENTITY_PROPERTY') {
      if (typeof action.value === 'number' && !Number.isFinite(action.value)) {
        return Object.freeze({
          ...base,
          status: 'failed' as const,
          failureReason: 'entity_property_value_must_be_finite',
        })
      }

      const target = resolveSelector(action.target, event, context)
      if (!target) {
        return Object.freeze({
          ...base,
          status: 'failed' as const,
          failureReason: 'target_entity_not_found',
        })
      }

      const existingState = target.components?.find(component => component.type === GAMEPLAY_STATE_COMPONENT_TYPE)
      const previousValue = existingState?.properties[action.property]
      if (previousValue === action.value) {
        return Object.freeze({
          ...base,
          status: 'no_op' as const,
          reason: 'entity_property_already_set',
        })
      }

      const nextState = Object.freeze({
        type: GAMEPLAY_STATE_COMPONENT_TYPE,
        properties: Object.freeze({
          ...(existingState?.properties ?? {}),
          [action.property]: action.value,
        }),
      })
      const components = [...(target.components ?? [])]
      const stateIndex = components.findIndex(component => component.type === GAMEPLAY_STATE_COMPONENT_TYPE)
      if (stateIndex === -1) components.push(nextState)
      else components[stateIndex] = nextState
      const worldAfter = this.worldMutator.replaceEntity(context.world, Object.freeze({
        ...target,
        components: Object.freeze(components),
      }) as unknown as Entity)
      const updated = worldAfter.entities.find(entity => entity.id === target.id)
      const updatedState = updated?.components?.find(component => component.type === GAMEPLAY_STATE_COMPONENT_TYPE)
      if (updatedState?.properties[action.property] !== action.value) {
        return Object.freeze({
          ...base,
          status: 'failed' as const,
          failureReason: 'runtime_mutation_failed',
        })
      }

      return Object.freeze({
        ...base,
        status: 'executed' as const,
        targetEntityIds: Object.freeze([target.id]),
        worldAfter,
        mutation: Object.freeze({
          type: 'ENTITY_PROPERTY_UPDATED' as const,
          targetEntityId: target.id,
          property: action.property,
          value: action.value,
          ...(typeof previousValue === 'string' || typeof previousValue === 'number' || typeof previousValue === 'boolean'
            ? { previousValue }
            : {}),
        }),
      })
    }

    if (action.type !== 'REMOVE_ENTITY' && action.type !== 'APPLY_VELOCITY' && action.type !== 'DAMAGE_ENTITY') {
      return Object.freeze({
        ...base,
        status: 'unsupported' as const,
        failureReason: 'action_not_executable',
      })
    }

    const target = resolveSelector(action.target, event, context)
    if (!target) {
      return Object.freeze({
        ...base,
        status: 'failed' as const,
        failureReason: 'target_entity_not_found',
      })
    }

    if (action.type === 'REMOVE_ENTITY') {
      const targetFacts = semanticFactsOf(target, context.semanticWorld)
      if (target.type === 'player' || targetFacts.category === 'player') {
        return Object.freeze({
          ...base,
          status: 'failed' as const,
          failureReason: 'player_removal_protected',
        })
      }

      const worldAfter = this.worldMutator.removeEntity(context.world, target.id)
      if (worldAfter.entities.some(entity => entity.id === target.id)) {
        return Object.freeze({
          ...base,
          status: 'failed' as const,
          failureReason: 'runtime_mutation_failed',
        })
      }

      return Object.freeze({
        ...base,
        status: 'executed' as const,
        targetEntityIds: Object.freeze([target.id]),
        worldAfter,
        mutation: Object.freeze({
          type: 'ENTITY_REMOVED' as const,
          targetEntityId: target.id,
          ...(target.components?.find(isHealthComponent)?.properties.current !== undefined
            ? { health: target.components.find(isHealthComponent)!.properties.current }
            : {}),
        }),
      })
    }

    if (action.type === 'DAMAGE_ENTITY') {
      if (!Number.isFinite(action.amount) || action.amount <= 0) {
        return Object.freeze({
          ...base,
          status: 'failed' as const,
          failureReason: 'damage_amount_must_be_positive_finite',
        })
      }

      const health = target.components?.find(isHealthComponent)
      if (!health) {
        return Object.freeze({
          ...base,
          status: 'failed' as const,
          failureReason: 'health_component_missing',
        })
      }

      const current = health.properties.current
      const max = health.properties.max
      if (!Number.isFinite(current) || !Number.isFinite(max) || max <= 0 || current < 0 || current > max) {
        return Object.freeze({
          ...base,
          status: 'failed' as const,
          failureReason: 'health_component_invalid',
        })
      }
      if (current <= 0) {
        return Object.freeze({
          ...base,
          status: 'failed' as const,
          failureReason: 'health_already_zero',
        })
      }

      const nextCurrent = Math.max(0, current - action.amount)
      const nextHealth = createHealthComponent(nextCurrent, max)
      const components = [...(target.components ?? [])]
      const healthIndex = components.findIndex(isHealthComponent)
      components[healthIndex] = nextHealth
      const worldAfter = this.worldMutator.replaceEntity(context.world, Object.freeze({
        ...target,
        components: Object.freeze(components),
      }) as unknown as Entity)
      const updated = worldAfter.entities.find(entity => entity.id === target.id)
      const updatedHealth = updated?.components?.find(isHealthComponent)
      if (!updatedHealth
        || updatedHealth.properties.current !== nextCurrent
        || updatedHealth.properties.max !== max) {
        return Object.freeze({
          ...base,
          status: 'failed' as const,
          failureReason: 'runtime_mutation_failed',
        })
      }

      const playerLethal = target.type === 'player'
        || semanticFactsOf(target, context.semanticWorld).category === 'player'
      const failure = playerLethal && nextCurrent === 0 && request.sessionState !== undefined
        ? failRuntimeGameplaySession(request.sessionState, {
            entityId: target.id,
            tick: event.tick,
          })
        : undefined

      return Object.freeze({
        ...base,
        status: 'executed' as const,
        targetEntityIds: Object.freeze([target.id]),
        worldAfter,
        ...(failure ? { sessionStateAfter: failure.state } : {}),
        mutation: Object.freeze({
          type: 'HEALTH_UPDATED' as const,
          targetEntityId: target.id,
          health: Object.freeze({ current: nextCurrent, max }),
          damageAmount: action.amount,
        }),
      })
    }

    const velocity = action.velocity
    const hasX = velocity.x !== undefined
    const hasY = velocity.y !== undefined
    if ((!hasX && !hasY) || (hasX && !Number.isFinite(velocity.x)) || (hasY && !Number.isFinite(velocity.y))) {
      return Object.freeze({
        ...base,
        status: 'failed' as const,
        failureReason: 'velocity_axes_must_be_finite',
      })
    }
    const mode = velocity.mode ?? 'set'
    if (mode !== 'set' && mode !== 'add') {
      return Object.freeze({
        ...base,
        status: 'failed' as const,
        failureReason: 'invalid_velocity_mode',
      })
    }

    const existingVelocity = target.components?.find(isVelocityComponent)
    const currentX = existingVelocity && Number.isFinite(existingVelocity.properties.x) ? existingVelocity.properties.x : 0
    const currentY = existingVelocity && Number.isFinite(existingVelocity.properties.y) ? existingVelocity.properties.y : 0
    const nextX = hasX
      ? mode === 'add' ? currentX + velocity.x! : velocity.x!
      : currentX
    const nextY = hasY
      ? mode === 'add' ? currentY + velocity.y! : velocity.y!
      : currentY
    if (!Number.isFinite(nextX) || !Number.isFinite(nextY)) {
      return Object.freeze({
        ...base,
        status: 'failed' as const,
        failureReason: 'velocity_result_must_be_finite',
      })
    }

    const nextVelocity = createVelocityComponent(nextX, nextY)
    const components = [...(target.components ?? [])]
    const velocityIndex = components.findIndex(isVelocityComponent)
    if (velocityIndex === -1) components.push(nextVelocity)
    else components[velocityIndex] = nextVelocity
    const worldAfter = this.worldMutator.replaceEntity(context.world, Object.freeze({
      ...target,
      components: Object.freeze(components),
    }) as unknown as Entity)
    const updated = worldAfter.entities.find(entity => entity.id === target.id)
    const updatedVelocity = updated?.components?.find(isVelocityComponent)
    if (!updatedVelocity || updatedVelocity.properties.x !== nextX || updatedVelocity.properties.y !== nextY) {
      return Object.freeze({
        ...base,
        status: 'failed' as const,
        failureReason: 'runtime_mutation_failed',
      })
    }

    return Object.freeze({
      ...base,
      status: 'executed' as const,
      targetEntityIds: Object.freeze([target.id]),
      worldAfter,
      mutation: Object.freeze({
        type: 'VELOCITY_UPDATED' as const,
        targetEntityId: target.id,
        velocity: Object.freeze({ x: nextX, y: nextY }),
      }),
    })
  }
}

function executionResult(
  event: GameplayEvent,
  rule: GameplayRuleSpecification,
  status: GameplayRuleExecutionStatus,
  options: {
    readonly committed?: boolean
    readonly conditionResult?: GameplayConditionEvaluation
    readonly actionResults?: readonly GameplayActionExecutionResult[]
    readonly affectedEntityIds?: readonly string[]
    readonly reason?: string
  } = {},
): GameplayRuleExecutionResult {
  return Object.freeze({
    eventId: event.eventId,
    ruleId: rule.ruleId,
    matchedTrigger: event.type,
    status,
    committed: options.committed ?? false,
    ...(options.conditionResult ? { conditionResult: options.conditionResult } : {}),
    actionResults: Object.freeze([...(options.actionResults ?? [])]),
    affectedEntityIds: Object.freeze([...(options.affectedEntityIds ?? [])]),
    ...(options.reason ? { reason: options.reason } : {}),
  })
}

function rolledBackActionResult(
  result: GameplayActionExecutionResult,
  rollbackWorld: World,
): GameplayActionExecutionResult {
  const {
    mutation: _mutation,
    sessionStateAfter: _sessionStateAfter,
    progressionStateAfter: _progressionStateAfter,
    ...withoutMutation
  } = result
  void _mutation
  void _sessionStateAfter
  void _progressionStateAfter
  return Object.freeze({
    ...withoutMutation,
    status: 'rolled_back' as const,
    worldAfter: rollbackWorld,
  })
}

function affectedEntityIds(actionResults: readonly GameplayActionExecutionResult[]): readonly string[] {
  return Object.freeze([...new Set(actionResults.flatMap(result => result.targetEntityIds))])
}

function sessionKey(ruleSet: GameplayRuleSet, context: GameplayRuleExecutionContext): string {
  return `${context.worldId ?? ruleSet.worldId ?? 'runtime'}:${context.sessionId ?? ruleSet.sessionId ?? 'session'}:${context.semanticRevision ?? ruleSet.semanticRevision}`
}

export class DefaultGameplayRuleExecutor implements GameplayRuleExecutor {
  private readonly consumedEventRules = new Set<string>()
  private activeSessionKey: string | undefined

  constructor(
    private readonly matcher: GameplayRuleMatcher = new DefaultGameplayRuleMatcher(),
    private readonly conditionEvaluator: GameplayConditionEvaluator = new DefaultGameplayConditionEvaluator(),
    private readonly actionExecutor: GameplayActionExecutor = new DefaultGameplayActionExecutor(),
    private readonly sessionStateStore = new DefaultRuntimeGameplaySessionStateStore(),
    private readonly progressionStateStore = new DefaultRuntimeGameplayProgressionStateStore(),
  ) {}

  execute(
    events: readonly GameplayEvent[],
    ruleSet: GameplayRuleSet,
    context: GameplayRuleExecutionContext,
  ): GameplayRuleExecutionBatch {
    const binding: RuntimeGameplaySessionBinding = {
      ...(context.worldId ?? ruleSet.worldId ? { worldId: context.worldId ?? ruleSet.worldId } : {}),
      ...(context.sessionId ?? ruleSet.sessionId ? { sessionId: context.sessionId ?? ruleSet.sessionId } : {}),
    }
    let sessionState = this.sessionStateStore.bind(binding)
    let progressionState = this.progressionStateStore.bind(binding)
    if (events.length === 0) {
      return Object.freeze({ world: context.world, results: Object.freeze([]), sessionState, progressionState })
    }

    const key = sessionKey(ruleSet, context)
    if (key !== this.activeSessionKey) {
      this.activeSessionKey = key
      this.consumedEventRules.clear()
    }

    let world = context.world
    const results: GameplayRuleExecutionResult[] = []
    for (const event of events) {
      if (!sameBinding(event, ruleSet, context)) {
        for (const rule of ruleSet.rules) {
          if (!rule.enabled || rule.trigger.eventType !== event.type) continue
          const consumedKey = `${event.eventId}\u0000${rule.ruleId}`
          if (this.consumedEventRules.has(consumedKey)) continue
          this.remember(consumedKey)
          results.push(executionResult(event, rule, 'stale', { reason: 'stale_rule_binding' }))
        }
        continue
      }
      if (sessionState.status === 'failed') continue
      const eventContext = Object.freeze({ ...context, world })
      const matchedRules = this.matcher.match(event, ruleSet, eventContext)
      for (const rule of matchedRules) {
        if (sessionState.status === 'failed') break
        const consumedKey = `${event.eventId}\u0000${rule.ruleId}`
        if (this.consumedEventRules.has(consumedKey)) continue
        this.remember(consumedKey)

        if (!ruleSet.execution.enabled || ruleSet.execution.status !== 'active') {
          results.push(executionResult(event, rule, 'unsupported', { reason: 'rule_execution_disabled' }))
          continue
        }
        if (rule.supportStatus !== 'supported') {
          results.push(executionResult(event, rule, 'unsupported', { reason: `rule_${rule.supportStatus}` }))
          continue
        }

        const conditionContext = Object.freeze({ ...context, world, progressionState })
        const conditionResult = this.conditionEvaluator.evaluateRule(rule, event, conditionContext)
        if (conditionResult.status !== 'passed') {
          results.push(executionResult(
            event,
            rule,
            conditionResult.status === 'unsupported' ? 'unsupported' : 'conditions_failed',
            { conditionResult, reason: conditionResult.reason },
          ))
          continue
        }

        if (rule.actions.length === 0) {
          results.push(executionResult(event, rule, 'unsupported', {
            conditionResult,
            reason: 'rule_has_no_actions',
          }))
          continue
        }

        const ruleStartWorld = world
        const ruleStartSessionState = sessionState
        const ruleStartProgressionState = progressionState
        let stagedWorld = ruleStartWorld
        let stagedSessionState = sessionState
        let stagedProgressionState = progressionState
        const actionResults: GameplayActionExecutionResult[] = []
        let failedAction: GameplayActionExecutionResult | undefined

        for (const action of rule.actions) {
          const actionResult = this.actionExecutor.execute({
            ruleId: rule.ruleId,
            event,
            action,
            context: Object.freeze({ ...context, world: stagedWorld, progressionState: stagedProgressionState }),
            sessionState: stagedSessionState,
            progressionState: stagedProgressionState,
          })
          actionResults.push(actionResult)
          if (actionResult.status !== 'executed' && actionResult.status !== 'no_op') {
            failedAction = actionResult
            break
          }
          stagedWorld = actionResult.worldAfter
          if (actionResult.sessionStateAfter !== undefined) stagedSessionState = actionResult.sessionStateAfter
          if (actionResult.progressionStateAfter !== undefined) stagedProgressionState = actionResult.progressionStateAfter
        }

        if (failedAction) {
          const rolledBackResults = actionResults.map((actionResult, index) =>
            index < actionResults.length - 1
              ? rolledBackActionResult(actionResult, ruleStartWorld)
              : actionResult,
          )
          results.push(executionResult(event, rule, 'execution_failed', {
            conditionResult,
            actionResults: rolledBackResults,
            affectedEntityIds: [],
            reason: failedAction.failureReason,
          }))
          world = ruleStartWorld
          sessionState = ruleStartSessionState
          progressionState = ruleStartProgressionState
          continue
        }

        world = stagedWorld
        sessionState = stagedSessionState
        progressionState = stagedProgressionState
        this.sessionStateStore.commit(sessionState)
        this.progressionStateStore.commit(progressionState)
        results.push(executionResult(event, rule, 'executed', {
          committed: actionResults.some(actionResult => actionResult.status === 'executed'),
          conditionResult,
          actionResults,
          affectedEntityIds: affectedEntityIds(actionResults),
          ...(actionResults.find(actionResult => actionResult.reason)?.reason
            ? { reason: actionResults.find(actionResult => actionResult.reason)?.reason }
            : {}),
        }))
      }
    }

    return Object.freeze({ world, results: Object.freeze(results), sessionState, progressionState })
  }

  executeEvent(
    event: GameplayEvent,
    ruleSet: GameplayRuleSet,
    context: GameplayRuleExecutionContext,
  ): GameplayRuleExecutionBatch {
    return this.execute([event], ruleSet, context)
  }

  private remember(key: string): void {
    this.consumedEventRules.add(key)
    while (this.consumedEventRules.size > MAX_CONSUMED_EVENT_RULES) {
      const first = this.consumedEventRules.values().next().value as string | undefined
      if (first === undefined) break
      this.consumedEventRules.delete(first)
    }
  }
}
