import { describe, expect, it } from 'vitest'
import type {
  Entity,
  GameWorldModel,
  GameplayEventSink,
  GameplayAction,
  GameplayEvent,
  GameplayRuleSet,
  GameplayRuleSpecification,
  GameplaySupportStatus,
  World,
} from '@genesis/shared'
import {
  createCollisionBoundsComponent,
  createHealthComponent,
  createPositionComponent,
  createVelocityComponent,
  isHealthComponent,
  isVelocityComponent,
} from '@genesis/shared'
import {
  DefaultEntityContactSystem,
  DefaultGameplayActionExecutor,
  DefaultGameplayConditionEvaluator,
  DefaultGameplayRuleExecutor,
  DefaultGameplayRuleMatcher,
  DefaultRuntimeExecutionLoop,
  DefaultRuntimeGameplayEventCollector,
  DefaultRuntimeGameplayProgressionStateStore,
  DefaultRuntimeGameplaySessionStateStore,
  DefaultRuntimeSystemRegistry,
  DefaultRuntimeWorldStore,
} from '../index'

const semanticWorld: GameWorldModel = Object.freeze({
  worldType: 'platformer',
  entities: Object.freeze([
    Object.freeze({ id: 'player', category: 'player', name: 'Player' }),
    Object.freeze({ id: 'coin-1', category: 'item', name: 'Coin' }),
    Object.freeze({ id: 'ground', category: 'terrain', name: 'Ground' }),
  ]),
})

function entity(
  id: string,
  type: string,
  name: string,
  x: number,
  y: number,
  withBounds = false,
): Entity {
  return Object.freeze({
    id,
    type,
    x,
    y,
    components: Object.freeze([
      Object.freeze({
        type: 'semantic',
        properties: Object.freeze({ category: type, name }),
      }),
      createPositionComponent(x, y),
      ...(['player', 'enemy', 'npc'].includes(type) ? [createHealthComponent()] : []),
      ...(withBounds ? [createCollisionBoundsComponent(type === 'player' ? 32 : 24, type === 'player' ? 48 : 24)] : []),
    ]),
  }) as unknown as Entity
}

function runtimeWorld(): World {
  return Object.freeze({
    entities: Object.freeze([
      entity('player', 'player', 'Player', 0, 0, true),
      entity('coin-1', 'item', 'Coin', 8, 0, true),
      entity('ground', 'terrain', 'Ground', 0, 100),
    ]),
  }) as unknown as World
}

function contactEvent(eventId = 'world-1:1:0'): GameplayEvent {
  return Object.freeze({
    eventId,
    worldId: 'world-1',
    tick: 1,
    sequence: 0,
    type: 'ENTITY_CONTACT_STARTED',
    actorEntityId: 'player',
    targetEntityId: 'coin-1',
    direction: 'left',
  })
}

function rule(
  options: {
    readonly ruleId?: string
    readonly supportStatus?: GameplaySupportStatus
    readonly priority?: number
    readonly actions?: readonly GameplayAction[]
    readonly conditions?: GameplayRuleSpecification['conditions']
  } = {},
): GameplayRuleSpecification {
  const target = Object.freeze({ kind: 'eventTarget' as const })
  const actor = Object.freeze({ kind: 'eventActor' as const })
  return Object.freeze({
    schemaVersion: 1,
    ruleId: options.ruleId ?? 'collect-reward',
    name: 'Collectible contact',
    enabled: true,
    trigger: Object.freeze({ eventType: 'ENTITY_CONTACT_STARTED' as const }),
    conditionMode: 'all' as const,
    conditions: Object.freeze(options.conditions ?? [
      Object.freeze({ type: 'ENTITY_CATEGORY_EQUALS' as const, entity: actor, category: 'player' as const }),
      Object.freeze({ type: 'ENTITY_CATEGORY_EQUALS' as const, entity: target, category: 'item' as const }),
    ]),
    actions: Object.freeze(options.actions ?? [Object.freeze({ type: 'REMOVE_ENTITY' as const, target })]),
    priority: options.priority ?? 0,
    supportStatus: options.supportStatus ?? 'supported',
  })
}

function ruleSet(
  rules: readonly GameplayRuleSpecification[] = [rule()],
  options: { readonly bindingStatus?: 'current' | 'stale'; readonly semanticRevision?: number; readonly sessionId?: string; readonly worldId?: string } = {},
): GameplayRuleSet {
  const semanticRevision = options.semanticRevision ?? 0
  return Object.freeze({
    schemaVersion: 1,
    gameplayRevision: 1,
    sourceGameplayRevision: 1,
    semanticRevision,
    sourceSemanticRevision: semanticRevision,
    worldId: options.worldId ?? 'world-1',
    ...(options.sessionId ? { sessionId: options.sessionId } : {}),
    bindingStatus: options.bindingStatus ?? 'current',
    capabilityCatalogVersion: 'v1' as const,
    rules: Object.freeze([...rules]),
    execution: Object.freeze({
      enabled: true,
      status: 'active' as const,
      message: 'supported slice',
    }),
    metadata: Object.freeze({ source: 'deterministic' as const }),
  })
}

function progressionRule(amount = 1): GameplayRuleSpecification {
  return Object.freeze({
    schemaVersion: 1,
    ruleId: 'gain-experience',
    name: 'Gain experience',
    enabled: true,
    trigger: Object.freeze({ eventType: 'ENTITY_JUMPED' as const }),
    conditionMode: 'all' as const,
    conditions: Object.freeze([]),
    actions: Object.freeze([
      Object.freeze({ type: 'CHANGE_NUMERIC_STATE' as const, state: 'experience', amount }),
    ]),
    priority: 0,
    supportStatus: 'supported' as const,
  })
}

function levelUpRule(): GameplayRuleSpecification {
  return Object.freeze({
    schemaVersion: 1,
    ruleId: 'level-up-at-experience-threshold',
    name: 'Level up at experience threshold',
    enabled: true,
    trigger: Object.freeze({ eventType: 'ENTITY_JUMPED' as const }),
    conditionMode: 'all' as const,
    conditions: Object.freeze([
      Object.freeze({
        type: 'NUMBER_COMPARE' as const,
        value: Object.freeze({ kind: 'gameState' as const, key: 'experience' }),
        operator: 'gte' as const,
        expected: 1,
      }),
      Object.freeze({
        type: 'NUMBER_COMPARE' as const,
        value: Object.freeze({ kind: 'gameState' as const, key: 'level' }),
        operator: 'lt' as const,
        expected: 2,
      }),
    ]),
    actions: Object.freeze([
      Object.freeze({ type: 'CHANGE_NUMERIC_STATE' as const, state: 'level', amount: 1 }),
    ]),
    priority: 0,
    supportStatus: 'supported' as const,
  })
}

function jumpEvent(eventId: string, tick: number, worldId = 'world-1'): GameplayEvent {
  return Object.freeze({
    eventId,
    worldId,
    tick,
    sequence: 0,
    type: 'ENTITY_JUMPED' as const,
    actorEntityId: 'player',
  })
}

class GameplayJumpEventSystem {
  readonly name = 'GameplayJumpEventSystem'
  private eventSink: GameplayEventSink | undefined

  setGameplayEventSink(sink: GameplayEventSink): void {
    this.eventSink = sink
  }

  update(world: World): World {
    this.eventSink?.emit({ type: 'ENTITY_JUMPED', actorEntityId: 'player' })
    return world
  }
}

function context(world: World, semanticRevision = 0, sessionId = 'session-1', worldId = 'world-1') {
  return Object.freeze({
    world,
    worldId,
    sessionId,
    semanticRevision,
    semanticWorld,
  })
}

describe('Gameplay rule execution vertical slice', () => {
  it('evaluates event participant IDs after an earlier same-event rule removes the target', () => {
    const worldWithoutCoin = Object.freeze({
      entities: Object.freeze([
        entity('player', 'player', 'Player', 0, 0, true),
        entity('ground', 'terrain', 'Ground', 0, 100),
      ]),
    }) as unknown as World
    const result = new DefaultGameplayConditionEvaluator().evaluate([
      Object.freeze({
        type: 'ENTITY_ID_EQUALS' as const,
        entity: Object.freeze({ kind: 'eventTarget' as const }),
        entityId: 'coin-1',
      }),
    ], contactEvent(), context(worldWithoutCoin))

    expect(result).toMatchObject({
      status: 'passed',
      conditions: [{ type: 'ENTITY_ID_EQUALS', status: 'passed' }],
    })
  })

  it('matches deterministically, removes one collectible, and emits removal at the next boundary', () => {
    const initialWorld = runtimeWorld()
    const collector = new DefaultRuntimeGameplayEventCollector('world-1')
    const worldStore = new DefaultRuntimeWorldStore(initialWorld, collector)
    const registry = new DefaultRuntimeSystemRegistry()
    registry.register(new DefaultEntityContactSystem())
    const rules = ruleSet()
    const loop = new DefaultRuntimeExecutionLoop(registry, collector, {
      getRuleSet: () => rules,
      getWorldId: () => 'world-1',
      getSemanticRevision: () => 0,
      getSemanticWorld: () => semanticWorld,
    })

    const first = loop.tickWithResult(initialWorld)

    expect(first.gameplayEvents).toMatchObject([{
      type: 'ENTITY_CONTACT_STARTED',
      actorEntityId: 'player',
      targetEntityId: 'coin-1',
    }])
    expect(first.gameplayRuleResults).toMatchObject([{
      eventId: 'world-1:1:0',
      ruleId: 'collect-reward',
      status: 'executed',
      committed: true,
      affectedEntityIds: ['coin-1'],
      actionResults: [{ actionType: 'REMOVE_ENTITY', status: 'executed' }],
    }])
    expect(first.world.entities.map(item => item.id)).toEqual(['player', 'ground'])
    expect(initialWorld.entities.map(item => item.id)).toEqual(['player', 'coin-1', 'ground'])

    // Renderer/world synchronization commits the rule result after the batch.
    worldStore.setWorld(first.world)
    const second = loop.tickWithResult(first.world)
    expect(second.gameplayEvents).toMatchObject([{
      type: 'ENTITY_REMOVED',
      targetEntityId: 'coin-1',
    }])
    expect(second.gameplayRuleResults).toHaveLength(0)
  })

  it('keeps the same Runtime execution loop active when the current RuleSet advances its semantic revision', () => {
    const collector = new DefaultRuntimeGameplayEventCollector('world-1')
    const registry = new DefaultRuntimeSystemRegistry()
    registry.register(new DefaultEntityContactSystem())
    let revision = 0
    let rules = ruleSet([], { semanticRevision: 0 })
    const loop = new DefaultRuntimeExecutionLoop(registry, collector, {
      getRuleSet: () => rules,
      getWorldId: () => 'world-1',
      getSemanticRevision: () => revision,
      getSemanticWorld: () => semanticWorld,
    })

    const initial = loop.tickWithResult(runtimeWorld())
    expect(initial.gameplayRuleResults).toHaveLength(0)

    rules = ruleSet([rule()], { semanticRevision: 1 })
    revision = 1
    const evolvedWorld = Object.freeze({
      entities: Object.freeze([
        entity('player', 'player', 'Player', 0, 0, true),
        entity('coin-2', 'item', 'Coin', 8, 0, true),
        entity('ground', 'terrain', 'Ground', 0, 100),
      ]),
    }) as unknown as World
    const evolved = loop.tickWithResult(evolvedWorld)

    expect(evolved.gameplayEvents).toMatchObject([{ targetEntityId: 'coin-2' }])
    expect(evolved.gameplayRuleResults).toMatchObject([{ ruleId: 'collect-reward', status: 'executed', committed: true }])
    expect(evolved.world.entities.map(item => item.id)).toEqual(['player', 'ground'])
  })

  it('executes authoritative numeric progression, retains it across semantic revision, and resets on a new session', () => {
    const registry = new DefaultRuntimeSystemRegistry()
    registry.register(new GameplayJumpEventSystem())
    let revision = 0
    let sessionId = 'session-1'
    let rules = ruleSet([progressionRule()], { semanticRevision: revision, sessionId })
    const loop = new DefaultRuntimeExecutionLoop(registry, new DefaultRuntimeGameplayEventCollector('world-1'), {
      getRuleSet: () => rules,
      getWorldId: () => 'world-1',
      getSessionId: () => sessionId,
      getSemanticRevision: () => revision,
      getSemanticWorld: () => semanticWorld,
    })
    const initialWorld = runtimeWorld()

    const first = loop.tickWithResult(initialWorld)
    expect(first.gameplayRuleResults).toMatchObject([{
      ruleId: 'gain-experience',
      status: 'executed',
      committed: true,
      actionResults: [{
        actionType: 'CHANGE_NUMERIC_STATE',
        status: 'executed',
        mutation: {
          type: 'NUMERIC_STATE_UPDATED',
          state: 'experience',
          previousValue: 0,
          value: 1,
          amount: 1,
        },
      }],
    }])
    expect(first.gameplayProgressionState).toEqual({ values: { experience: 1, level: 1 } })

    const second = loop.tickWithResult(first.world)
    expect(second.gameplayProgressionState).toEqual({ values: { experience: 2, level: 1 } })

    revision = 1
    rules = ruleSet([progressionRule()], { semanticRevision: revision, sessionId })
    const evolved = loop.tickWithResult(second.world)
    expect(evolved.gameplayProgressionState).toEqual({ values: { experience: 3, level: 1 } })

    sessionId = 'session-2'
    rules = ruleSet([progressionRule()], { semanticRevision: revision, sessionId })
    const newSession = loop.tickWithResult(evolved.world)
    expect(newSession.gameplayProgressionState).toEqual({ values: { experience: 1, level: 1 } })
  })

  it('commits one deterministic XP threshold transition and blocks repeated level-up evaluation', () => {
    const executor = new DefaultGameplayRuleExecutor()
    const initialRules = ruleSet([progressionRule(), levelUpRule()], { semanticRevision: 0, sessionId: 'session-1' })

    const first = executor.executeEvent(
      jumpEvent('world-1:1:0', 1),
      initialRules,
      context(runtimeWorld()),
    )
    expect(first.progressionState).toEqual({ values: { experience: 1, level: 2 } })
    expect(first.results).toMatchObject([
      { ruleId: 'gain-experience', status: 'executed', committed: true },
      {
        ruleId: 'level-up-at-experience-threshold',
        status: 'executed',
        committed: true,
        conditionResult: { status: 'passed' },
        actionResults: [{
          actionType: 'CHANGE_NUMERIC_STATE',
          status: 'executed',
          mutation: { state: 'level', previousValue: 1, value: 2, amount: 1 },
        }],
      },
    ])

    const repeated = executor.executeEvent(
      jumpEvent('world-1:2:0', 2),
      initialRules,
      context(first.world),
    )
    expect(repeated.progressionState).toEqual({ values: { experience: 2, level: 2 } })
    expect(repeated.results).toMatchObject([
      { ruleId: 'gain-experience', status: 'executed' },
      {
        ruleId: 'level-up-at-experience-threshold',
        status: 'conditions_failed',
        committed: false,
        conditionResult: { status: 'failed', reason: 'numeric_comparison_mismatch' },
        actionResults: [],
      },
    ])

    const evolvedRules = ruleSet([progressionRule(), levelUpRule()], { semanticRevision: 1, sessionId: 'session-1' })
    const evolved = executor.executeEvent(
      jumpEvent('world-1:3:0', 3),
      evolvedRules,
      context(repeated.world, 1),
    )
    expect(evolved.progressionState).toEqual({ values: { experience: 3, level: 2 } })

    const worldB = runtimeWorld()
    const worldBRules = ruleSet([progressionRule(), levelUpRule()], {
      worldId: 'world-2',
      sessionId: 'session-2',
    })
    const reset = executor.execute([], worldBRules, context(worldB, 0, 'session-2', 'world-2'))
    expect(reset.progressionState).toEqual({ values: { experience: 0, level: 1 } })

    const worldBResult = executor.executeEvent(
      jumpEvent('world-2:1:0', 1, 'world-2'),
      worldBRules,
      context(worldB, 0, 'session-2', 'world-2'),
    )
    expect(worldBResult.progressionState).toEqual({ values: { experience: 1, level: 2 } })

    const stale = executor.executeEvent(
      jumpEvent('world-1:4:0', 4),
      initialRules,
      context(worldB, 0, 'session-2', 'world-2'),
    )
    expect(stale.results).toHaveLength(2)
    expect(stale.results.every(result => result.status === 'stale' && result.reason === 'stale_rule_binding')).toBe(true)
    expect(stale.progressionState).toEqual({ values: { experience: 1, level: 2 } })
  })

  it('commits Runtime session completion, remains idempotent, preserves it across evolution, and rebinds on a new world', () => {
    const goalWorld = Object.freeze({
      entities: Object.freeze([
        entity('player', 'player', 'Player', 0, 0, true),
        entity('goal', 'item', 'Goal', 8, 0, true),
      ]),
    }) as unknown as World
    const goalRule = rule({
      ruleId: 'reach-goal',
      actions: [Object.freeze({ type: 'COMPLETE_GOAL' as const, goalId: 'goal' })],
    })
    const executor = new DefaultGameplayRuleExecutor()
    const first = executor.executeEvent(
      Object.freeze({ ...contactEvent('world-1:1:0'), targetEntityId: 'goal' }),
      ruleSet([goalRule]),
      context(goalWorld),
    )

    expect(first.sessionState).toEqual({
      status: 'completed',
      completedByGoalId: 'goal',
      completedAtTick: 1,
    })
    expect(first.results).toMatchObject([{
      status: 'executed',
      committed: true,
      actionResults: [{
        actionType: 'COMPLETE_GOAL',
        status: 'executed',
        mutation: { type: 'GOAL_COMPLETED', goalId: 'goal' },
      }],
    }])

    const evolved = executor.executeEvent(
      Object.freeze({ ...contactEvent('world-1:2:0'), targetEntityId: 'goal', tick: 2 }),
      ruleSet([goalRule], { semanticRevision: 1 }),
      context(goalWorld, 1),
    )
    expect(evolved.sessionState?.status).toBe('completed')
    expect(evolved.results).toMatchObject([{
      status: 'executed',
      committed: false,
      reason: 'goal_already_completed',
      actionResults: [{ actionType: 'COMPLETE_GOAL', status: 'no_op' }],
    }])

    const worldB = Object.freeze({
      entities: Object.freeze([
        entity('player-b', 'player', 'Player', 0, 0, true),
        entity('goal-b', 'item', 'Goal B', 8, 0, true),
      ]),
    }) as unknown as World
    const goalRuleB = rule({
      ruleId: 'reach-goal-b',
      actions: [Object.freeze({ type: 'COMPLETE_GOAL' as const, goalId: 'goal-b' })],
    })
    const worldBResult = executor.executeEvent(
      Object.freeze({
        ...contactEvent('world-2:1:0'),
        worldId: 'world-2',
        actorEntityId: 'player-b',
        targetEntityId: 'goal-b',
      }),
      ruleSet([goalRuleB], { worldId: 'world-2', sessionId: 'session-2' }),
      context(worldB, 0, 'session-2', 'world-2'),
    )
    expect(worldBResult.sessionState).toEqual({
      status: 'completed',
      completedByGoalId: 'goal-b',
      completedAtTick: 1,
    })

    const stale = executor.executeEvent(
      Object.freeze({ ...contactEvent('world-1:3:0'), targetEntityId: 'goal' }),
      ruleSet([goalRule]),
      context(worldB, 0, 'session-2', 'world-2'),
    )
    expect(stale.results).toMatchObject([{ status: 'stale', reason: 'stale_rule_binding' }])
    expect(stale.sessionState).toEqual({
      status: 'completed',
      completedByGoalId: 'goal-b',
      completedAtTick: 1,
    })
  })

  it('orders matching rules by priority, then stable rule-set order', () => {
    const matcher = new DefaultGameplayRuleMatcher()
    const matched = matcher.match(
      contactEvent(),
      ruleSet([
        rule({ ruleId: 'late', priority: 2 }),
        rule({ ruleId: 'first-at-priority', priority: 1 }),
        rule({ ruleId: 'second-at-priority', priority: 1 }),
      ]),
      context(runtimeWorld()),
    )

    expect(matched.map(item => item.ruleId)).toEqual([
      'first-at-priority',
      'second-at-priority',
      'late',
    ])
  })

  it('uses current semantic facts for archetypes and never infers them from IDs', () => {
    const world = Object.freeze({
      entities: Object.freeze([
        entity('npc-coin-shaped-id', 'npc', 'Sheep', 0, 0, true),
      ]),
    }) as unknown as World
    const event = Object.freeze({
      ...contactEvent('world-1:2:0'),
      targetEntityId: 'npc-coin-shaped-id',
    })
    const evaluator = new DefaultGameplayConditionEvaluator()
    const result = evaluator.evaluate([
      {
        type: 'ENTITY_ARCHETYPE_EQUALS',
        entity: { kind: 'eventTarget' },
        archetype: 'Sheep',
      },
    ], event, Object.freeze({
      world,
      worldId: 'world-1',
      semanticRevision: 0,
      semanticWorld: Object.freeze({
        worldType: 'platformer',
        entities: Object.freeze([{ id: 'npc-coin-shaped-id', category: 'npc', name: 'Sheep' }]),
      }) as GameWorldModel,
    }))

    expect(result.status).toBe('passed')
  })

  it('evaluates contact direction with truthful negation and no guessing', () => {
    const evaluator = new DefaultGameplayConditionEvaluator()
    const top = Object.freeze({ ...contactEvent('world-1:2:1'), direction: 'top' as const })
    const right = Object.freeze({ ...contactEvent('world-1:2:2'), direction: 'right' as const })
    const executionContext = context(runtimeWorld())

    expect(evaluator.evaluate([
      { type: 'CONTACT_DIRECTION_EQUALS', direction: 'top' },
    ], top, executionContext).status).toBe('passed')
    expect(evaluator.evaluate([
      { type: 'CONTACT_DIRECTION_EQUALS', direction: 'top' },
    ], right, executionContext).status).toBe('failed')
    expect(evaluator.evaluate([
      { type: 'CONTACT_DIRECTION_EQUALS', direction: 'top', negated: true },
    ], top, executionContext).status).toBe('failed')
    expect(evaluator.evaluate([
      { type: 'CONTACT_DIRECTION_EQUALS', direction: 'top', negated: true },
    ], right, executionContext).status).toBe('passed')
    expect(evaluator.evaluate([
      { type: 'CONTACT_DIRECTION_EQUALS', direction: 'top' },
    ], Object.freeze({ ...top, direction: undefined }) as unknown as GameplayEvent, executionContext).status).toBe('unsupported')
  })

  it('executes the generic two-action enemy stomp and commits both mutations', () => {
    const stompWorld = Object.freeze({
      entities: Object.freeze([
        entity('player', 'player', 'Player', 0, 0, true),
        entity('enemy-1', 'enemy', 'Enemy', 8, 0, true),
      ]),
    }) as unknown as World
    const stompSemanticWorld = Object.freeze({
      worldType: 'platformer' as const,
      entities: Object.freeze([
        Object.freeze({ id: 'player', category: 'player' as const, name: 'Player' }),
        Object.freeze({ id: 'enemy-1', category: 'enemy' as const, name: 'Enemy' }),
      ]),
    })
    const actor = Object.freeze({ kind: 'eventActor' as const })
    const target = Object.freeze({ kind: 'eventTarget' as const })
    const stompRule = rule({
      ruleId: 'enemy-stomp',
      conditions: [
        { type: 'ENTITY_CATEGORY_EQUALS', entity: actor, category: 'player' },
        { type: 'ENTITY_CATEGORY_EQUALS', entity: target, category: 'enemy' },
        { type: 'CONTACT_DIRECTION_EQUALS', direction: 'top' },
      ],
      actions: [
        { type: 'REMOVE_ENTITY', target },
        { type: 'APPLY_VELOCITY', target: actor, velocity: { y: -12, mode: 'set' } },
      ],
    })
    const result = new DefaultGameplayRuleExecutor().executeEvent(
      Object.freeze({ ...contactEvent('world-1:6:0'), targetEntityId: 'enemy-1', direction: 'top' }),
      ruleSet([stompRule]),
      Object.freeze({ ...context(stompWorld), semanticWorld: stompSemanticWorld }),
    )

    expect(result.results).toMatchObject([{
      ruleId: 'enemy-stomp',
      status: 'executed',
      committed: true,
      affectedEntityIds: ['enemy-1', 'player'],
      actionResults: [
        { actionType: 'REMOVE_ENTITY', status: 'executed' },
        { actionType: 'APPLY_VELOCITY', status: 'executed' },
      ],
    }])
    expect(result.world.entities.map(item => item.id)).toEqual(['player'])
    expect(result.world.entities[0]?.components?.find(isVelocityComponent)?.properties).toEqual({ x: 0, y: -12 })
  })

  it('executes generic side-contact damage and decreases only current Health', () => {
    const damageWorld = Object.freeze({
      entities: Object.freeze([
        entity('player', 'player', 'Player', 0, 0, true),
        entity('enemy-1', 'enemy', 'Enemy', 24, 0, true),
      ]),
    }) as unknown as World
    const damageSemanticWorld = Object.freeze({
      worldType: 'platformer' as const,
      entities: Object.freeze([
        Object.freeze({ id: 'player', category: 'player' as const, name: 'Player' }),
        Object.freeze({ id: 'enemy-1', category: 'enemy' as const, name: 'Enemy' }),
      ]),
    })
    const actor = Object.freeze({ kind: 'eventActor' as const })
    const target = Object.freeze({ kind: 'eventTarget' as const })
    const damageRule = rule({
      ruleId: 'enemy-contact-damage',
      conditions: [
        { type: 'ENTITY_CATEGORY_EQUALS', entity: actor, category: 'player' },
        { type: 'ENTITY_CATEGORY_EQUALS', entity: target, category: 'enemy' },
        { type: 'COMPONENT_EXISTS', entity: actor, componentType: 'health' },
        { type: 'CONTACT_DIRECTION_EQUALS', direction: 'top', negated: true },
      ],
      actions: [{ type: 'DAMAGE_ENTITY', target: actor, amount: 3 }],
    })

    const result = new DefaultGameplayRuleExecutor().executeEvent(
      Object.freeze({ ...contactEvent('world-1:11:0'), targetEntityId: 'enemy-1', direction: 'left' }),
      ruleSet([damageRule]),
      Object.freeze({
        ...context(damageWorld),
        semanticWorld: damageSemanticWorld,
      }),
    )
    const player = result.world.entities.find(item => item.id === 'player')
    const health = player?.components?.find(isHealthComponent)

    expect(result.results).toMatchObject([{
      ruleId: 'enemy-contact-damage',
      status: 'executed',
      committed: true,
      affectedEntityIds: ['player'],
      actionResults: [{
        actionType: 'DAMAGE_ENTITY',
        status: 'executed',
        mutation: {
          type: 'HEALTH_UPDATED',
          targetEntityId: 'player',
          health: { current: 97, max: 100 },
          damageAmount: 3,
        },
      }],
    }])
    expect(health?.properties).toEqual({ current: 97, max: 100 })
    expect(damageWorld.entities.find(item => item.id === 'player')?.components?.find(isHealthComponent)?.properties)
      .toEqual({ current: 100, max: 100 })
  })

  it('commits Runtime failure at lethal player damage and blocks completion until respawn', () => {
    const baselinePlayer = entity('player', 'player', 'Player', 0, 0, true)
    const lethalPlayer = Object.freeze({
      ...baselinePlayer,
      components: Object.freeze(baselinePlayer.components?.map(component =>
        isHealthComponent(component) ? createHealthComponent(1, 100) : component,
      )),
    }) as unknown as Entity
    const lethalWorld = Object.freeze({
      entities: Object.freeze([lethalPlayer, entity('enemy-1', 'enemy', 'Enemy', 24, 0, true)]),
    }) as unknown as World
    const actor = Object.freeze({ kind: 'eventActor' as const })
    const target = Object.freeze({ kind: 'eventTarget' as const })
    const damageRule = rule({
      ruleId: 'lethal-enemy-contact-damage',
      conditions: [
        { type: 'ENTITY_CATEGORY_EQUALS', entity: actor, category: 'player' },
        { type: 'ENTITY_CATEGORY_EQUALS', entity: target, category: 'enemy' },
        { type: 'COMPONENT_EXISTS', entity: actor, componentType: 'health' },
        { type: 'CONTACT_DIRECTION_EQUALS', direction: 'top', negated: true },
      ],
      actions: [{ type: 'DAMAGE_ENTITY', target: actor, amount: 3 }],
    })
    const executor = new DefaultGameplayRuleExecutor()
    const lethal = executor.executeEvent(
      Object.freeze({ ...contactEvent('world-1:12:0'), targetEntityId: 'enemy-1', direction: 'left' }),
      ruleSet([damageRule]),
      Object.freeze({ ...context(lethalWorld), semanticWorld }),
    )

    expect(lethal.sessionState).toEqual({
      status: 'failed',
      failedByEntityId: 'player',
      failedAtTick: 1,
    })
    expect(lethal.world.entities.find(item => item.id === 'player')?.components?.find(isHealthComponent)?.properties)
      .toEqual({ current: 0, max: 100 })
    expect(lethal.results).toMatchObject([{
      status: 'executed',
      committed: true,
      actionResults: [{
        actionType: 'DAMAGE_ENTITY',
        status: 'executed',
        sessionStateAfter: { status: 'failed', failedByEntityId: 'player', failedAtTick: 1 },
      }],
    }])

    const goalAttempt = executor.executeEvent(
      Object.freeze({ ...contactEvent('world-1:13:0'), targetEntityId: 'goal' }),
      ruleSet([rule({
        ruleId: 'reach-goal-after-failure',
        actions: [Object.freeze({ type: 'COMPLETE_GOAL' as const, goalId: 'goal' })],
      })]),
      Object.freeze({ ...context(lethal.world), semanticWorld }),
    )
    expect(goalAttempt.results).toEqual([])
    expect(goalAttempt.sessionState?.status).toBe('failed')
  })

  it('respawns a failed player in the same Runtime world without resetting progression', () => {
    const baselinePlayer = entity('player', 'player', 'Player', 12, 34, true)
    const failedPlayer = Object.freeze({
      ...baselinePlayer,
      components: Object.freeze([
        ...(baselinePlayer.components ?? []).map(component =>
          isHealthComponent(component) ? createHealthComponent(0, 100) : component,
        ),
        createVelocityComponent(8, -6),
      ]),
    }) as unknown as Entity
    const failedWorld = Object.freeze({
      entities: Object.freeze([failedPlayer, entity('coin-1', 'item', 'Coin', 80, 0, true)]),
    }) as unknown as World
    const sessionStateStore = new DefaultRuntimeGameplaySessionStateStore()
    const progressionStateStore = new DefaultRuntimeGameplayProgressionStateStore()
    sessionStateStore.bind({ worldId: 'world-1', sessionId: 'session-1' })
    sessionStateStore.commit({ status: 'failed', failedByEntityId: 'player', failedAtTick: 7 })
    progressionStateStore.bind({ worldId: 'world-1', sessionId: 'session-1' })
    progressionStateStore.commit({ values: { experience: 4, level: 3 } })
    const registry = new DefaultRuntimeSystemRegistry()
    registry.register(new GameplayJumpEventSystem())
    const loop = new DefaultRuntimeExecutionLoop(registry, new DefaultRuntimeGameplayEventCollector('world-1'), {
      getRuleSet: () => ruleSet([progressionRule()], { sessionId: 'session-1' }),
      getWorldId: () => 'world-1',
      getSessionId: () => 'session-1',
      getSemanticRevision: () => 0,
      sessionStateStore,
      progressionStateStore,
    })

    const blocked = loop.tickWithResult(failedWorld)
    expect(blocked.executedSystems).toEqual([])
    expect(blocked.gameplayRuleResults).toEqual([])
    expect(blocked.gameplaySessionState).toEqual({
      status: 'failed',
      failedByEntityId: 'player',
      failedAtTick: 7,
    })
    expect(blocked.gameplayProgressionState).toEqual({ values: { experience: 4, level: 3 } })

    const respawn = loop.respawnGameplay(failedWorld)

    expect(respawn.respawned).toBe(true)
    expect(respawn.gameplaySessionState).toEqual({ status: 'active' })
    expect(respawn.gameplayProgressionState).toEqual({ values: { experience: 4, level: 3 } })
    expect(respawn.world.entities.find(item => item.id === 'coin-1')).toBeDefined()
    expect(respawn.world.entities.find(item => item.id === 'player')?.components?.find(isHealthComponent)?.properties)
      .toEqual({ current: 100, max: 100 })
    expect(respawn.world.entities.find(item => item.id === 'player')?.components?.find(isVelocityComponent)?.properties)
      .toEqual({ x: 0, y: 0 })
    expect(failedWorld.entities.find(item => item.id === 'player')?.components?.find(isHealthComponent)?.properties)
      .toEqual({ current: 0, max: 100 })

    const resumed = loop.tickWithResult(respawn.world)
    expect(resumed.executedSystems).toEqual(['GameplayJumpEventSystem'])
    expect(resumed.gameplayEvents).toMatchObject([{ type: 'ENTITY_JUMPED', actorEntityId: 'player' }])
    expect(resumed.gameplaySessionState).toEqual({ status: 'active' })
  })

  it('fails damage safely when the target has no valid Health component', () => {
    const world = Object.freeze({
      entities: Object.freeze([Object.freeze({
        id: 'player',
        type: 'player',
        x: 0,
        y: 0,
        components: Object.freeze([
          Object.freeze({ type: 'semantic', properties: Object.freeze({ category: 'player', name: 'Player' }) }),
          createPositionComponent(0, 0),
        ]),
      })]),
    }) as unknown as World
    const result = new DefaultGameplayActionExecutor().execute({
      ruleId: 'damage-without-health',
      event: Object.freeze({ ...contactEvent('world-1:12:0'), targetEntityId: 'player' }),
      action: { type: 'DAMAGE_ENTITY', target: { kind: 'eventActor' }, amount: 1 },
      context: Object.freeze({ ...context(world), semanticWorld: Object.freeze({
        worldType: 'platformer' as const,
        entities: Object.freeze([{ id: 'player', category: 'player' as const, name: 'Player' }]),
      }) }),
    })

    expect(result.status).toBe('failed')
    expect(result.failureReason).toBe('health_component_missing')
  })

  it('rolls back earlier staged actions when a later action fails', () => {
    const removeExecutor = new DefaultGameplayActionExecutor()
    const failingExecutor = {
      execute(request: Parameters<DefaultGameplayActionExecutor['execute']>[0]) {
        if (request.action.type === 'REMOVE_ENTITY') return removeExecutor.execute(request)
        return Object.freeze({
          ruleId: request.ruleId,
          eventId: request.event.eventId,
          actionType: request.action.type,
          status: 'failed' as const,
          targetEntityIds: Object.freeze([]),
          worldBefore: request.context.world,
          worldAfter: request.context.world,
          failureReason: 'injected_failure',
        })
      },
    }
    const actor = Object.freeze({ kind: 'eventActor' as const })
    const target = Object.freeze({ kind: 'eventTarget' as const })
    const result = new DefaultGameplayRuleExecutor(
      new DefaultGameplayRuleMatcher(),
      new DefaultGameplayConditionEvaluator(),
      failingExecutor,
    ).executeEvent(
      contactEvent('world-1:7:0'),
      ruleSet([rule({
        ruleId: 'staged-failure',
        actions: [
          { type: 'REMOVE_ENTITY', target },
          { type: 'APPLY_VELOCITY', target: actor, velocity: { y: -12, mode: 'set' } },
        ],
      })]),
      context(runtimeWorld()),
    )

    expect(result.world.entities.map(item => item.id)).toEqual(['player', 'coin-1', 'ground'])
    expect(result.results).toMatchObject([{
      status: 'execution_failed',
      committed: false,
      affectedEntityIds: [],
      actionResults: [
        { actionType: 'REMOVE_ENTITY', status: 'rolled_back' },
        { actionType: 'APPLY_VELOCITY', status: 'failed', failureReason: 'injected_failure' },
      ],
    }])
    expect(result.results[0]?.actionResults[0]).not.toHaveProperty('mutation')
  })

  it('rolls back a staged numeric change when a later action fails', () => {
    const event = Object.freeze({
      eventId: 'world-1:13:0',
      worldId: 'world-1',
      tick: 13,
      sequence: 0,
      type: 'ENTITY_JUMPED' as const,
      actorEntityId: 'player',
    })
    const result = new DefaultGameplayRuleExecutor().executeEvent(
      event,
      ruleSet([Object.freeze({
        ...progressionRule(),
        ruleId: 'atomic-progression',
        actions: Object.freeze([
          Object.freeze({ type: 'CHANGE_NUMERIC_STATE' as const, state: 'experience', amount: 1 }),
          Object.freeze({ type: 'APPLY_VELOCITY' as const, target: { kind: 'eventActor' as const }, velocity: { x: Number.NaN } }),
        ]),
      })]),
      context(runtimeWorld()),
    )

    expect(result.progressionState).toEqual({ values: { experience: 0, level: 1 } })
    expect(result.results).toMatchObject([{
      status: 'execution_failed',
      committed: false,
      actionResults: [
        { actionType: 'CHANGE_NUMERIC_STATE', status: 'rolled_back' },
        { actionType: 'APPLY_VELOCITY', status: 'failed', failureReason: 'velocity_axes_must_be_finite' },
      ],
    }])
    expect(result.results[0]?.actionResults[0]).not.toHaveProperty('mutation')
  })

  it('rejects empty or non-finite numeric changes without committing state', () => {
    const executor = new DefaultGameplayRuleExecutor()
    const event = Object.freeze({
      eventId: 'world-1:14:0',
      worldId: 'world-1',
      tick: 14,
      sequence: 0,
      type: 'ENTITY_JUMPED' as const,
      actorEntityId: 'player',
    })
    const emptyKey = executor.executeEvent(
      event,
      ruleSet([Object.freeze({ ...progressionRule(), ruleId: 'empty-key', actions: Object.freeze([{ type: 'CHANGE_NUMERIC_STATE' as const, state: '  ', amount: 1 }]) })]),
      context(runtimeWorld()),
    )
    expect(emptyKey.results).toMatchObject([{ status: 'execution_failed', reason: 'numeric_state_key_must_be_non_empty' }])
    expect(emptyKey.progressionState).toEqual({ values: { experience: 0, level: 1 } })

    const nonFinite = new DefaultGameplayRuleExecutor().executeEvent(
      Object.freeze({ ...event, eventId: 'world-1:15:0', tick: 15 }),
      ruleSet([Object.freeze({ ...progressionRule(), ruleId: 'non-finite', actions: Object.freeze([{ type: 'CHANGE_NUMERIC_STATE' as const, state: 'experience', amount: Number.POSITIVE_INFINITY }]) })]),
      context(runtimeWorld()),
    )
    expect(nonFinite.results).toMatchObject([{ status: 'execution_failed', reason: 'numeric_state_change_must_remain_finite' }])
    expect(nonFinite.progressionState).toEqual({ values: { experience: 0, level: 1 } })
  })

  it('supports set, add, component creation, and non-player entity selectors generically', () => {
    const genericWorld = Object.freeze({
      entities: Object.freeze([entity('npc-1', 'npc', 'Merchant', 0, 0)]),
    }) as unknown as World
    const event = Object.freeze({
      eventId: 'world-1:8:0',
      worldId: 'world-1',
      tick: 8,
      sequence: 0,
      type: 'ENTITY_JUMPED' as const,
      actorEntityId: 'npc-1',
    })
    const executor = new DefaultGameplayActionExecutor()
    const baseContext = context(genericWorld)
    const set = executor.execute({
      ruleId: 'velocity-set',
      event,
      action: { type: 'APPLY_VELOCITY', target: { kind: 'eventActor' }, velocity: { y: -12 } },
      context: baseContext,
    })
    expect(set.status).toBe('executed')
    expect(set.worldAfter.entities[0]?.components?.find(isVelocityComponent)?.properties).toEqual({ x: 0, y: -12 })

    const add = executor.execute({
      ruleId: 'velocity-add',
      event,
      action: { type: 'APPLY_VELOCITY', target: { kind: 'eventActor' }, velocity: { x: 3, y: 2, mode: 'add' } },
      context: Object.freeze({ ...baseContext, world: set.worldAfter }),
    })
    expect(add.status).toBe('executed')
    expect(add.worldAfter.entities[0]?.components?.find(isVelocityComponent)?.properties).toEqual({ x: 3, y: -10 })
    expect(add.mutation).toMatchObject({ type: 'VELOCITY_UPDATED', targetEntityId: 'npc-1' })
  })

  it('blocks deferred and stale rules without mutating the current World', () => {
    const world = runtimeWorld()
    const deferred = rule({
      ruleId: 'deferred-damage',
      supportStatus: 'deferred',
      actions: [Object.freeze({ type: 'DAMAGE_ENTITY' as const, target: { kind: 'eventActor' as const }, amount: 1 })],
    })
    const deferredResult = new DefaultGameplayRuleExecutor().executeEvent(
      contactEvent('world-1:3:0'),
      ruleSet([deferred]),
      context(world),
    )
    expect(deferredResult.results).toMatchObject([{ status: 'unsupported', reason: 'rule_deferred' }])
    expect(deferredResult.world.entities.map(item => item.id)).toEqual(['player', 'coin-1', 'ground'])

    const staleResult = new DefaultGameplayRuleExecutor().executeEvent(
      contactEvent('world-1:4:0'),
      ruleSet([rule()], { bindingStatus: 'stale', semanticRevision: 1 }),
      context(world, 1),
    )
    expect(staleResult.results).toMatchObject([{ status: 'stale', reason: 'stale_rule_binding' }])
    expect(staleResult.world.entities.map(item => item.id)).toEqual(['player', 'coin-1', 'ground'])
  })

  it('executes an event/rule pair once and protects the Player from removal', () => {
    const world = runtimeWorld()
    const executor = new DefaultGameplayRuleExecutor()
    const event = contactEvent('world-1:5:0')
    const rules = ruleSet()
    const first = executor.executeEvent(event, rules, context(world))
    const second = executor.executeEvent(event, rules, context(world))

    expect(first.results).toHaveLength(1)
    expect(second.results).toHaveLength(0)

    const playerTarget = rule({
      ruleId: 'protect-player',
      conditions: [{ type: 'ENTITY_CATEGORY_EQUALS', entity: { kind: 'eventActor' }, category: 'player' }],
      actions: [Object.freeze({ type: 'REMOVE_ENTITY' as const, target: { kind: 'eventActor' as const } })],
    })
    const protectedResult = new DefaultGameplayRuleExecutor().executeEvent(
      event,
      ruleSet([playerTarget]),
      context(world),
    )
    expect(protectedResult.results).toMatchObject([{
      status: 'execution_failed',
      reason: 'player_removal_protected',
    }])
    expect(protectedResult.world.entities.map(item => item.id)).toContain('player')
  })

  it('does not let a World A event affect a RuleSet bound to World B', () => {
    const worldB = runtimeWorld()
    const worldBRuleSet = Object.freeze({ ...ruleSet(), worldId: 'world-2' })
    const result = new DefaultGameplayRuleExecutor().executeEvent(
      contactEvent('world-1:9:0'),
      worldBRuleSet,
      Object.freeze({ ...context(worldB), worldId: 'world-2' }),
    )

    expect(result.world).toBe(worldB)
    expect(result.world.entities.map(item => item.id)).toEqual(['player', 'coin-1', 'ground'])
    expect(result.results).toMatchObject([{ status: 'stale', committed: false, reason: 'stale_rule_binding' }])
    expect(result.progressionState).toEqual({ values: { experience: 0, level: 1 } })
  })

  it('does not let a session-bound RuleSet execute in another Runtime session', () => {
    const world = runtimeWorld()
    const sessionRuleSet = Object.freeze({ ...ruleSet(), sessionId: 'session-a' })
    const result = new DefaultGameplayRuleExecutor().executeEvent(
      contactEvent('world-1:10:0'),
      sessionRuleSet,
      context(world, 0, 'session-b'),
    )

    expect(result.world).toBe(world)
    expect(result.results).toMatchObject([{ status: 'stale', committed: false, reason: 'stale_rule_binding' }])
  })
})
