import { describe, expect, it } from 'vitest'
import type {
  Entity,
  GameWorldModel,
  GameplayAction,
  GameplayEvent,
  GameplayRuleSet,
  GameplayRuleSpecification,
  GameplaySupportStatus,
  World,
} from '@genesis/shared'
import {
  createCollisionBoundsComponent,
  createPositionComponent,
} from '@genesis/shared'
import {
  DefaultEntityContactSystem,
  DefaultGameplayConditionEvaluator,
  DefaultGameplayRuleExecutor,
  DefaultGameplayRuleMatcher,
  DefaultRuntimeExecutionLoop,
  DefaultRuntimeGameplayEventCollector,
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
  options: { readonly bindingStatus?: 'current' | 'stale'; readonly semanticRevision?: number } = {},
): GameplayRuleSet {
  const semanticRevision = options.semanticRevision ?? 0
  return Object.freeze({
    schemaVersion: 1,
    gameplayRevision: 1,
    sourceGameplayRevision: 1,
    semanticRevision,
    sourceSemanticRevision: semanticRevision,
    worldId: 'world-1',
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

function context(world: World, semanticRevision = 0) {
  return Object.freeze({
    world,
    worldId: 'world-1',
    semanticRevision,
    semanticWorld,
  })
}

describe('Gameplay rule execution vertical slice', () => {
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
})
