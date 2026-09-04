import type {
  EntityCategory,
  GameWorldModel,
  GameplayAction,
  GameplayCapabilityCatalog,
  GameplayCondition,
  GameplayEntitySelector,
  GameplayRuleSet,
  GameplayRuleSpecification,
  GameplayRuleConditionMode,
  GameplaySpecification,
  GameplaySupportStatus,
  GameplayTrigger,
} from '@genesis/shared'
import {
  DEFAULT_GAMEPLAY_CAPABILITY_CATALOG,
  getGameplayRulePrimitiveCapability,
} from '@genesis/shared'
import type { GameplayRuleCandidate } from './GameplayRuleCandidate'

export interface GameplayRuleBuilderMetadata {
  readonly source?: 'ai' | 'deterministic'
  readonly warnings?: readonly string[]
  readonly architectureVersion?: string
}

export interface GameplayRuleBuilderInput {
  readonly semanticWorld: GameWorldModel
  readonly gameplaySpecification: GameplaySpecification
  readonly capabilities?: GameplayCapabilityCatalog
  /** A validated provider proposal. Undefined selects the deterministic baseline. */
  readonly candidate?: readonly GameplayRuleCandidate[]
  readonly worldId?: string
  readonly sessionId?: string
  readonly semanticRevision?: number
  readonly metadata?: GameplayRuleBuilderMetadata
}

export interface GameplayRuleBuilder {
  build(input: GameplayRuleBuilderInput): GameplayRuleSet
}

function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== 'object' || Object.isFrozen(value)) return value
  if (Array.isArray(value)) {
    value.forEach(item => deepFreeze(item))
  } else {
    Object.values(value as Record<string, unknown>).forEach(item => deepFreeze(item))
  }
  return Object.freeze(value)
}

function playerSelector(): { readonly kind: 'eventActor' } {
  return Object.freeze({ kind: 'eventActor' })
}

function targetSelector(): { readonly kind: 'eventTarget' } {
  return Object.freeze({ kind: 'eventTarget' })
}

function archetypeSelector(archetype: string): GameplayEntitySelector {
  return Object.freeze({ kind: 'archetype', archetype })
}

function interactionTrigger(
  player: ReturnType<typeof playerSelector>,
  target: ReturnType<typeof targetSelector>,
): GameplayTrigger {
  return Object.freeze({
    eventType: 'ENTITY_INTERACTION_REQUESTED' as const,
    actor: player,
    target,
  })
}

function categoryCondition(
  entity: GameplayEntitySelector,
  category: EntityCategory,
): GameplayCondition {
  return Object.freeze({ type: 'ENTITY_CATEGORY_EQUALS', entity, category })
}

function archetypeCondition(entity: GameplayEntitySelector, archetype: string): GameplayCondition {
  return Object.freeze({ type: 'ENTITY_ARCHETYPE_EQUALS', entity, archetype })
}

function idCondition(
  entity: GameplayEntitySelector,
  entityId: string,
): GameplayCondition {
  return Object.freeze({ type: 'ENTITY_ID_EQUALS', entity, entityId })
}

function componentCondition(
  entity: GameplayEntitySelector,
  componentType: 'health',
): GameplayCondition {
  return Object.freeze({ type: 'COMPONENT_EXISTS', entity, componentType })
}

function booleanEntityCondition(
  entity: GameplayEntitySelector,
  property: 'harvested' | 'questAccepted' | 'questCompleted',
  expected: boolean,
): GameplayCondition {
  return Object.freeze({
    type: 'BOOLEAN_EQUALS',
    value: Object.freeze({
      kind: 'entityProperty' as const,
      entity,
      property,
    }),
    expected,
  })
}

function contact(direction: 'top' | 'bottom' | 'left' | 'right', negated = false): GameplayCondition {
  return Object.freeze({ type: 'CONTACT_DIRECTION_EQUALS', direction, ...(negated ? { negated: true } : {}) })
}

function numericStateCondition(
  key: string,
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte',
  expected: number,
): GameplayCondition {
  return Object.freeze({
    type: 'NUMBER_COMPARE',
    value: Object.freeze({ kind: 'gameState' as const, key }),
    operator,
    expected,
  })
}

function numericEntityCondition(
  entity: ReturnType<typeof playerSelector> | ReturnType<typeof targetSelector>,
  property: 'health',
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte',
  expected: number,
): GameplayCondition {
  return Object.freeze({
    type: 'NUMBER_COMPARE',
    value: Object.freeze({ kind: 'entityProperty' as const, entity, property }),
    operator,
    expected,
  })
}

function rule(
  ruleId: string,
  name: string,
  sourceMechanicId: string | undefined,
  conditions: readonly GameplayCondition[],
  actions: readonly GameplayAction[],
  conditionMode: GameplayRuleConditionMode = 'all',
  trigger?: GameplayTrigger,
): GameplayRuleCandidate {
  return Object.freeze({
    ruleId,
    name,
    enabled: true,
    ...(sourceMechanicId ? { sourceMechanicId } : {}),
    trigger: Object.freeze(trigger ?? { eventType: 'ENTITY_CONTACT_STARTED' as const }),
    conditionMode,
    conditions: Object.freeze([...conditions]),
    actions: Object.freeze([...actions]),
    priority: 0,
  })
}

function hasMechanic(specification: GameplaySpecification, id: string): boolean {
  return specification.mechanics.some(mechanic => mechanic.id === id && mechanic.enabled)
}

function goalId(specification: GameplaySpecification, world: GameWorldModel): string | undefined {
  const fromSpecification = specification.goals?.find(goal => goal.targetEntityId)?.targetEntityId
  if (fromSpecification && world.entities.some(entity => entity.id === fromSpecification)) return fromSpecification
  return world.entities.find(entity => entity.id === 'goal' || /goal|flag|checkpoint/iu.test(entity.name))?.id
}

function collectible(world: GameWorldModel, excludedId: string | undefined): GameWorldModel['entities'][number] | undefined {
  return world.entities.find(entity =>
    entity.category === 'item'
      && entity.id !== excludedId
      && !/goal|flag|checkpoint|campfire/iu.test(entity.name),
  )
}

function farmHarvestable(world: GameWorldModel): GameWorldModel['entities'][number] | undefined {
  const harvestable = /field|crop|farmland|wheat|corn/iu
  return world.entities.find(entity =>
    entity.category === 'terrain'
      && (harvestable.test(entity.id) || harvestable.test(entity.name)),
  ) ?? world.entities.find(entity => entity.category === 'terrain')
}

function farmCompletionTarget(
  world: GameWorldModel,
  excludedId: string | undefined,
): GameWorldModel['entities'][number] | undefined {
  return world.entities.find(entity =>
    entity.category === 'quest'
      && entity.id !== excludedId
      && (/harvest|farm|crop|deliver|quest/iu.test(entity.id) || /harvest|farm|crop|deliver|quest/iu.test(entity.name)),
  ) ?? world.entities.find(entity => entity.category === 'quest' && entity.id !== excludedId)
}

function rpgQuestGiver(world: GameWorldModel): GameWorldModel['entities'][number] | undefined {
  return world.entities.find(entity =>
    entity.category === 'quest'
      && (/quest.?giver|giver/iu.test(entity.id) || /quest.?giver|giver/iu.test(entity.name)),
  ) ?? world.entities.find(entity => entity.category === 'quest')
}

function rpgCompletionTarget(
  world: GameWorldModel,
  excludedId: string | undefined,
): GameWorldModel['entities'][number] | undefined {
  return world.entities.find(entity =>
    entity.category === 'quest'
      && entity.id !== excludedId
      && (/main.?quest|final.?quest/iu.test(entity.id) || /main.?quest|final.?quest/iu.test(entity.name)),
  ) ?? world.entities.find(entity => entity.category === 'quest' && entity.id !== excludedId)
}

function deterministicRules(
  specification: GameplaySpecification,
  world: GameWorldModel,
): readonly GameplayRuleCandidate[] {
  const rules: GameplayRuleCandidate[] = []
  const player = playerSelector()
  const target = targetSelector()
  const targetGoalId = goalId(specification, world)
  const item = collectible(world, targetGoalId)
  const enemy = world.entities.find(entity => entity.category === 'enemy')

  if (item && hasMechanic(specification, 'collect-reward')) {
    rules.push(rule(
      'collect-reward',
      'Collectible contact',
      'collect-reward',
      [categoryCondition(player, 'player'), idCondition(target, item.id)],
      [
        Object.freeze({ type: 'REMOVE_ENTITY', target }),
        Object.freeze({ type: 'CHANGE_NUMERIC_STATE', state: 'experience', amount: 1 }),
      ],
    ))
  }

  if (item && hasMechanic(specification, 'collect-reward') && hasMechanic(specification, 'level-up')) {
    rules.push(rule(
      'level-up-at-experience-threshold',
      'Level up at experience threshold',
      'level-up',
      [
        idCondition(target, item.id),
        numericStateCondition('experience', 'gte', 1),
        numericStateCondition('level', 'lt', 2),
      ],
      [Object.freeze({ type: 'CHANGE_NUMERIC_STATE', state: 'level', amount: 1 })],
      'all',
      Object.freeze({
        eventType: 'ENTITY_CONTACT_STARTED' as const,
        actor: player,
        target,
      }),
    ))
  }

  if (enemy && hasMechanic(specification, 'enemy-stomp')) {
    rules.push(rule(
      'enemy-stomp',
      'Enemy stomp',
      'enemy-stomp',
      [categoryCondition(player, 'player'), categoryCondition(target, 'enemy'), contact('top')],
      [
        Object.freeze({ type: 'REMOVE_ENTITY', target }),
        Object.freeze({ type: 'APPLY_VELOCITY', target: player, velocity: Object.freeze({ y: -12, mode: 'set' as const }) }),
      ],
    ))
  }

  if (world.worldType !== 'survival' && enemy && hasMechanic(specification, 'enemy-side-damage')) {
    rules.push(rule(
      'enemy-contact-damage',
      'Enemy side contact damage',
      'enemy-side-damage',
      [
        categoryCondition(player, 'player'),
        categoryCondition(target, 'enemy'),
        componentCondition(player, 'health'),
        contact('top', true),
      ],
      [Object.freeze({ type: 'DAMAGE_ENTITY', target: player, amount: 1 })],
    ))
  }

  if (targetGoalId && hasMechanic(specification, 'reach-goal')) {
    rules.push(rule(
      'reach-goal',
      'Reach goal',
      'reach-goal',
      [categoryCondition(player, 'player'), idCondition(target, targetGoalId)],
      [Object.freeze({ type: 'COMPLETE_GOAL', goalId: targetGoalId })],
    ))
  }

  if (world.worldType === 'farm' && hasMechanic(specification, 'farm-interact')) {
    const interactable = farmHarvestable(world)
    if (interactable) {
      rules.push(rule(
        'farm-interaction',
        'Harvest farm field',
        'farm-interact',
        [
          categoryCondition(player, 'player'),
          categoryCondition(target, interactable.category),
          archetypeCondition(target, interactable.name),
        ],
        [
          Object.freeze({ type: 'SET_ENTITY_PROPERTY', target, property: 'activated', value: true }),
          Object.freeze({ type: 'SET_ENTITY_PROPERTY', target, property: 'harvested', value: true }),
        ],
        'all',
        interactionTrigger(player, target),
      ))
    }

    const completionTarget = farmCompletionTarget(world, interactable?.id)
    if (interactable && completionTarget && hasMechanic(specification, 'farm-complete-harvest-quest')) {
      rules.push(rule(
        'farm-complete-harvest-quest',
        'Complete harvest quest',
        'farm-complete-harvest-quest',
        [
          categoryCondition(player, 'player'),
          categoryCondition(target, completionTarget.category),
          archetypeCondition(target, completionTarget.name),
          booleanEntityCondition(archetypeSelector(interactable.name), 'harvested', true),
        ],
        [Object.freeze({ type: 'SET_ENTITY_PROPERTY', target, property: 'questCompleted', value: true })],
        'all',
        interactionTrigger(player, target),
      ))
    }
  }

  if (world.worldType === 'rpg' && hasMechanic(specification, 'rpg-interact')) {
    const interactable = rpgQuestGiver(world)
    if (interactable) {
      rules.push(rule(
        'rpg-interaction',
        'Accept RPG quest',
        'rpg-interact',
        [
          categoryCondition(player, 'player'),
          categoryCondition(target, interactable.category),
          archetypeCondition(target, interactable.name),
        ],
        [
          Object.freeze({ type: 'SET_ENTITY_PROPERTY', target, property: 'activated', value: true }),
          Object.freeze({ type: 'SET_ENTITY_PROPERTY', target, property: 'questAccepted', value: true }),
        ],
        'all',
        interactionTrigger(player, target),
      ))
    }

    const completionTarget = rpgCompletionTarget(world, interactable?.id)
    if (interactable && completionTarget && hasMechanic(specification, 'rpg-complete-main-quest')) {
      rules.push(rule(
        'rpg-complete-main-quest',
        'Complete main quest',
        'rpg-complete-main-quest',
        [
          categoryCondition(player, 'player'),
          categoryCondition(target, completionTarget.category),
          archetypeCondition(target, completionTarget.name),
          booleanEntityCondition(archetypeSelector(interactable.name), 'questAccepted', true),
        ],
        [Object.freeze({ type: 'SET_ENTITY_PROPERTY', target, property: 'questCompleted', value: true })],
        'all',
        interactionTrigger(player, target),
      ))
    }
  }

  const playerOffenseMechanicId = hasMechanic(specification, 'player-directed-offense')
    ? 'player-directed-offense'
    : hasMechanic(specification, 'contact-offense')
      ? 'contact-offense'
      : undefined

  if (world.worldType === 'survival' && enemy && playerOffenseMechanicId) {
    const attackTrigger = Object.freeze({
      eventType: 'ENTITY_ATTACK_REQUESTED' as const,
      actor: player,
      target,
    })
    rules.push(rule(
      'survival-player-offense',
      'Survival player-directed offense',
      playerOffenseMechanicId,
      [
        categoryCondition(player, 'player'),
        categoryCondition(target, 'enemy'),
        componentCondition(target, 'health'),
        numericStateCondition('level', 'lt', 2),
      ],
      [Object.freeze({ type: 'DAMAGE_ENTITY', target, amount: 25 })],
      'all',
      attackTrigger,
    ))
    rules.push(rule(
      'survival-player-offense-level-2',
      'Survival player-directed offense at Level 2+',
      playerOffenseMechanicId,
      [
        categoryCondition(player, 'player'),
        categoryCondition(target, 'enemy'),
        componentCondition(target, 'health'),
        numericStateCondition('level', 'gte', 2),
      ],
      [Object.freeze({ type: 'DAMAGE_ENTITY', target, amount: 50 })],
      'all',
      attackTrigger,
    ))
    rules.push(rule(
      'survival-enemy-defeat',
      'Survival enemy defeat',
      playerOffenseMechanicId,
      [
        categoryCondition(player, 'player'),
        categoryCondition(target, 'enemy'),
        numericEntityCondition(target, 'health', 'lte', 0),
      ],
      [
        Object.freeze({ type: 'REMOVE_ENTITY', target }),
        ...(hasMechanic(specification, 'gain-experience')
          ? [Object.freeze({ type: 'CHANGE_NUMERIC_STATE' as const, state: 'experience', amount: 1 })]
          : []),
      ],
      'all',
      attackTrigger,
    ))
    if (hasMechanic(specification, 'level-up')) {
      rules.push(rule(
        'survival-level-up-at-experience-threshold',
        'Survival level up at experience threshold',
        'level-up',
        [
          numericStateCondition('experience', 'gte', 1),
          numericStateCondition('level', 'lt', 2),
        ],
        [Object.freeze({ type: 'CHANGE_NUMERIC_STATE', state: 'level', amount: 1 })],
        'all',
        attackTrigger,
      ))
    }
  }

  if (world.worldType === 'survival' && enemy && hasMechanic(specification, 'enemy-side-damage')) {
    rules.push(rule(
      'survival-enemy-contact',
      'Survival enemy contact',
      'enemy-side-damage',
      [categoryCondition(player, 'player'), categoryCondition(target, 'enemy')],
      [Object.freeze({ type: 'DAMAGE_ENTITY', target: player, amount: 1 })],
    ))
  }

  if (world.worldType === 'survival' && enemy && hasMechanic(specification, 'enemy-spawn')) {
    rules.push(rule(
      'survival-enemy-replenishment',
      'Survival enemy replenishment',
      'enemy-spawn',
      [Object.freeze({
        type: 'NUMBER_COMPARE',
        value: Object.freeze({ kind: 'eventPayload' as const, key: 'health' as const }),
        operator: 'lte' as const,
        expected: 0,
      })],
      [Object.freeze({ type: 'SPAWN_ENTITY', entity: Object.freeze({ category: 'enemy' }) })],
      'all',
      Object.freeze({
        eventType: 'ENTITY_REMOVED',
        target: Object.freeze({ kind: 'category', category: 'enemy' }),
      }),
    ))
  }

  return Object.freeze(rules)
}

function primitiveStatus(
  catalog: GameplayCapabilityCatalog,
  kind: 'event' | 'condition' | 'action',
  value: string,
): GameplaySupportStatus {
  return getGameplayRulePrimitiveCapability(catalog, kind, value)?.status ?? 'deferred'
}

function combinedStatus(
  statuses: readonly GameplaySupportStatus[],
  actionStatuses: readonly GameplaySupportStatus[],
): GameplaySupportStatus {
  if (statuses.includes('unsupported')) return 'unsupported'
  if (statuses.includes('partially_supported')) return 'partially_supported'
  if (actionStatuses.length > 0 && actionStatuses.every(status => status === 'deferred')) return 'deferred'
  if (actionStatuses.some(status => status === 'deferred') && actionStatuses.some(status => status === 'supported')) return 'partially_supported'
  const deferred = statuses.includes('deferred')
  const supported = statuses.includes('supported')
  if (deferred && supported) return 'partially_supported'
  if (deferred) return 'deferred'
  return 'supported'
}

function buildRule(
  candidate: GameplayRuleCandidate,
  capabilities: GameplayCapabilityCatalog,
  metadata: GameplayRuleBuilderMetadata | undefined,
): GameplayRuleSpecification {
  const conditions = Object.freeze(candidate.conditions.map(condition => deepFreeze({ ...condition })))
  const actions = Object.freeze(candidate.actions.map(action => deepFreeze({ ...action })))
  const statuses: GameplaySupportStatus[] = [primitiveStatus(capabilities, 'event', candidate.trigger.eventType)]
  statuses.push(...conditions.map(condition => primitiveStatus(capabilities, 'condition', condition.type)))
  const actionStatuses = actions.map(action => primitiveStatus(capabilities, 'action', action.type))
  statuses.push(...actionStatuses)
  return deepFreeze({
    schemaVersion: 1 as const,
    ruleId: candidate.ruleId ?? candidate.id ?? 'invalid-rule',
    name: candidate.name ?? candidate.label ?? candidate.ruleId ?? candidate.id ?? 'Unnamed rule',
    ...(candidate.label ? { label: candidate.label } : {}),
    enabled: candidate.enabled ?? true,
    ...(candidate.sourceMechanicId ? { sourceMechanicId: candidate.sourceMechanicId } : {}),
    trigger: { ...candidate.trigger },
    conditionMode: candidate.conditionMode ?? 'all',
    conditions,
    actions,
    priority: candidate.priority ?? 0,
    supportStatus: combinedStatus(statuses, actionStatuses),
    ...(metadata ? {
      metadata: {
        source: metadata.source ?? 'deterministic',
        ...(metadata.warnings ? { warnings: [...metadata.warnings] } : {}),
        ...(metadata.architectureVersion ? { architectureVersion: metadata.architectureVersion } : {}),
      },
    } : {}),
  })
}

export class DefaultGameplayRuleBuilder implements GameplayRuleBuilder {
  constructor(private readonly defaultCapabilities: GameplayCapabilityCatalog = DEFAULT_GAMEPLAY_CAPABILITY_CATALOG) {}

  build(input: GameplayRuleBuilderInput): GameplayRuleSet {
    const capabilities = input.capabilities ?? this.defaultCapabilities
    const candidates = input.candidate ?? deterministicRules(input.gameplaySpecification, input.semanticWorld)
    const ids = new Set<string>()
    const rules = candidates.map(candidate => {
      const id = candidate.ruleId ?? candidate.id ?? ''
      if (ids.has(id)) throw new Error(`Duplicate gameplay rule ID: ${id}`)
      ids.add(id)
      return buildRule(candidate, capabilities, input.metadata)
    })
    const semanticRevision = Math.max(0, Math.trunc(input.semanticRevision ?? 0))
    const source = input.metadata?.source ?? input.gameplaySpecification.metadata.source
    return deepFreeze({
      schemaVersion: 1 as const,
      gameplayRevision: input.gameplaySpecification.gameplayRevision,
      sourceGameplayRevision: input.gameplaySpecification.gameplayRevision,
      semanticRevision,
      sourceSemanticRevision: semanticRevision,
      ...(input.worldId ? { worldId: input.worldId } : {}),
      ...(input.sessionId ? { sessionId: input.sessionId } : {}),
      bindingStatus: 'current' as const,
      capabilityCatalogVersion: capabilities.version,
      rules,
      execution: {
        enabled: true,
        status: 'active' as const,
        message: 'Runtime execution is active for supported rules; deferred rules remain gated.' as const,
      },
      metadata: {
        source,
        ...(input.metadata?.warnings ? { warnings: [...input.metadata.warnings] } : {}),
        ...(input.metadata?.architectureVersion ? { architectureVersion: input.metadata.architectureVersion } : {}),
      },
    })
  }
}

export type { GameplayRuleSpecification }
