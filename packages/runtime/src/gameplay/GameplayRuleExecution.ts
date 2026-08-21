import type {
  Entity,
  EntityCategory,
  GameWorldModel,
  GameplayAction,
  GameplayCondition,
  GameplayEvent,
  GameplayEntitySelector,
  GameplayRuleConditionMode,
  GameplayRuleSet,
  GameplayRuleSpecification,
  World,
} from '@genesis/shared'
import { DefaultWorldMutator } from '../mutation'
import type { WorldMutator } from '../mutation'

const SEMANTIC_COMPONENT_TYPE = 'semantic'
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

export type GameplayActionExecutionStatus = 'executed' | 'failed' | 'unsupported'

export interface GameplayActionExecutionRequest {
  readonly ruleId: string
  readonly event: GameplayEvent
  readonly action: GameplayAction
  readonly context: GameplayRuleExecutionContext
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
  readonly mutation?: {
    readonly type: 'ENTITY_REMOVED'
    readonly targetEntityId: string
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
  readonly conditionResult?: GameplayConditionEvaluation
  readonly actionResults: readonly GameplayActionExecutionResult[]
  readonly affectedEntityIds: readonly string[]
  readonly reason?: string
}

export interface GameplayRuleExecutionBatch {
  readonly world: World
  readonly results: readonly GameplayRuleExecutionResult[]
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
  return entity !== undefined && selectorMatchesEntity(selector, entity, event, context.semanticWorld)
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
    if (
      condition.type === 'CONTACT_DIRECTION_EQUALS'
      || condition.type === 'NUMBER_COMPARE'
      || condition.type === 'BOOLEAN_EQUALS'
    ) {
      return conditionResult(condition.type, 'unsupported', 'condition_not_executable')
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

    if (action.type !== 'REMOVE_ENTITY') {
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
      mutation: Object.freeze({ type: 'ENTITY_REMOVED' as const, targetEntityId: target.id }),
    })
  }
}

function executionResult(
  event: GameplayEvent,
  rule: GameplayRuleSpecification,
  status: GameplayRuleExecutionStatus,
  options: {
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
    ...(options.conditionResult ? { conditionResult: options.conditionResult } : {}),
    actionResults: Object.freeze([...(options.actionResults ?? [])]),
    affectedEntityIds: Object.freeze([...(options.affectedEntityIds ?? [])]),
    ...(options.reason ? { reason: options.reason } : {}),
  })
}

function sessionKey(ruleSet: GameplayRuleSet, context: GameplayRuleExecutionContext): string {
  return `${ruleSet.worldId ?? context.worldId ?? 'runtime'}:${ruleSet.sessionId ?? context.sessionId ?? 'session'}:${ruleSet.semanticRevision}`
}

export class DefaultGameplayRuleExecutor implements GameplayRuleExecutor {
  private readonly consumedEventRules = new Set<string>()
  private activeSessionKey: string | undefined

  constructor(
    private readonly matcher: GameplayRuleMatcher = new DefaultGameplayRuleMatcher(),
    private readonly conditionEvaluator: GameplayConditionEvaluator = new DefaultGameplayConditionEvaluator(),
    private readonly actionExecutor: GameplayActionExecutor = new DefaultGameplayActionExecutor(),
  ) {}

  execute(
    events: readonly GameplayEvent[],
    ruleSet: GameplayRuleSet,
    context: GameplayRuleExecutionContext,
  ): GameplayRuleExecutionBatch {
    if (events.length === 0) return Object.freeze({ world: context.world, results: Object.freeze([]) })

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
      const eventContext = Object.freeze({ ...context, world })
      const matchedRules = this.matcher.match(event, ruleSet, eventContext)
      for (const rule of matchedRules) {
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

        const conditionResult = this.conditionEvaluator.evaluateRule(rule, event, eventContext)
        if (conditionResult.status !== 'passed') {
          results.push(executionResult(
            event,
            rule,
            conditionResult.status === 'unsupported' ? 'unsupported' : 'conditions_failed',
            { conditionResult, reason: conditionResult.reason },
          ))
          continue
        }

        // S15-004 deliberately has no multi-action transaction. A one-action
        // whitelist keeps future partial-action semantics from appearing accidentally.
        if (rule.actions.length !== 1 || rule.actions[0].type !== 'REMOVE_ENTITY') {
          results.push(executionResult(event, rule, 'unsupported', {
            conditionResult,
            reason: 'only_single_remove_entity_action_is_executable',
          }))
          continue
        }

        const actionResult = this.actionExecutor.execute({
          ruleId: rule.ruleId,
          event,
          action: rule.actions[0],
          context: eventContext,
        })
        const status = actionResult.status === 'executed' ? 'executed' as const : actionResult.status === 'unsupported' ? 'unsupported' as const : 'execution_failed' as const
        results.push(executionResult(event, rule, status, {
          conditionResult,
          actionResults: [actionResult],
          affectedEntityIds: actionResult.targetEntityIds,
          reason: actionResult.failureReason,
        }))
        if (actionResult.status === 'executed') world = actionResult.worldAfter
      }
    }

    return Object.freeze({ world, results: Object.freeze(results) })
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
