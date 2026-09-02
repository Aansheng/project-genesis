import { describe, expect, it } from 'vitest'
import {
  createPositionComponent,
  type Entity,
  type GameWorldModel,
  type GameplayEvent,
  type GameplayRuleSet,
  type World,
} from '@genesis/shared'
import type { InputKey, InputProvider } from '../input'
import {
  DefaultGameplayRuleExecutor,
  DefaultPlayerInteractionRequestSystem,
  DefaultRuntimeExecutionLoop,
  DefaultRuntimeSystemRegistry,
} from '../index'

class TestInputProvider implements InputProvider {
  pressed = false

  getState() {
    return Object.freeze({
      isPressed: (key: InputKey) => key === 'Enter' && this.pressed,
    })
  }
}

function entity(id: string, type: string, x: number, y: number): Entity {
  return Object.freeze({
    id,
    type,
    x,
    y,
    components: Object.freeze([createPositionComponent(x, y)]),
  }) as unknown as Entity
}

function world(...entities: Entity[]): World {
  return Object.freeze({ entities: Object.freeze(entities) }) as unknown as World
}

function interactionEvent(eventId: string, targetEntityId: string): GameplayEvent {
  return Object.freeze({
    eventId,
    worldId: 'world-1',
    tick: 1,
    sequence: 0,
    type: 'ENTITY_INTERACTION_REQUESTED' as const,
    actorEntityId: 'player',
    targetEntityId,
  })
}

function interactionRuleSet(): GameplayRuleSet {
  const actor = Object.freeze({ kind: 'eventActor' as const })
  const target = Object.freeze({ kind: 'eventTarget' as const })
  return Object.freeze({
    schemaVersion: 1 as const,
    gameplayRevision: 1,
    sourceGameplayRevision: 1,
    semanticRevision: 0,
    sourceSemanticRevision: 0,
    worldId: 'world-1',
    sessionId: 'session-1',
    bindingStatus: 'current' as const,
    capabilityCatalogVersion: 'v1' as const,
    rules: Object.freeze([Object.freeze({
      schemaVersion: 1 as const,
      ruleId: 'farm-interaction',
      name: 'Farm entity interaction',
      enabled: true,
      trigger: Object.freeze({
        eventType: 'ENTITY_INTERACTION_REQUESTED' as const,
        actor,
        target,
      }),
      conditionMode: 'all' as const,
      conditions: Object.freeze([
        Object.freeze({ type: 'ENTITY_CATEGORY_EQUALS' as const, entity: actor, category: 'player' as const }),
        Object.freeze({ type: 'ENTITY_CATEGORY_EQUALS' as const, entity: target, category: 'npc' as const }),
      ]),
      actions: Object.freeze([
        Object.freeze({ type: 'SET_ENTITY_PROPERTY' as const, target, property: 'activated' as const, value: true }),
      ]),
      priority: 0,
      supportStatus: 'supported' as const,
    })]),
    execution: Object.freeze({
      enabled: true,
      status: 'active' as const,
      message: 'supported interaction slice',
    }),
    metadata: Object.freeze({ source: 'deterministic' as const }),
  })
}

const semanticWorld: GameWorldModel = Object.freeze({
  worldType: 'farm',
  entities: Object.freeze([
    Object.freeze({ id: 'player', category: 'player', name: 'Player' }),
    Object.freeze({ id: 'npc-near', category: 'npc', name: 'Merchant' }),
    Object.freeze({ id: 'npc-tie-b', category: 'npc', name: 'Farmer' }),
    Object.freeze({ id: 'npc-tie-a', category: 'npc', name: 'Villager' }),
    Object.freeze({ id: 'item-nearer', category: 'item', name: 'Seed' }),
  ]),
})

describe('DefaultPlayerInteractionRequestSystem', () => {
  it('emits one Enter-edge request for the nearest explicitly eligible Runtime target', () => {
    const input = new TestInputProvider()
    const registry = new DefaultRuntimeSystemRegistry()
    registry.register(new DefaultPlayerInteractionRequestSystem(input, {
      targetCategories: ['npc', 'quest'],
      range: 48,
    }))
    const loop = new DefaultRuntimeExecutionLoop(registry)
    const source = world(
      entity('player', 'player', 0, 0),
      entity('npc-near', 'npc', 18, 0),
      entity('npc-far', 'npc', 40, 0),
      entity('item-nearer', 'item', 2, 0),
    )

    input.pressed = true
    const pressed = loop.tickWithResult(source)

    expect(pressed.world.entities).toEqual(source.entities)
    expect(pressed.gameplayEvents).toContainEqual(expect.objectContaining({
      type: 'ENTITY_INTERACTION_REQUESTED',
      actorEntityId: 'player',
      targetEntityId: 'npc-near',
      payload: { inputKey: 'Enter', targetCategory: 'npc', distance: 18, range: 48 },
    }))

    const held = loop.tickWithResult(pressed.world)
    expect(held.gameplayEvents).toEqual([])
  })

  it('uses stable Runtime IDs for equal-distance targets and emits nothing out of range', () => {
    const input = new TestInputProvider()
    const registry = new DefaultRuntimeSystemRegistry()
    registry.register(new DefaultPlayerInteractionRequestSystem(input, { targetCategories: ['npc'] }))
    const loop = new DefaultRuntimeExecutionLoop(registry)
    const tied = world(
      entity('player', 'player', 0, 0),
      entity('npc-z', 'npc', 30, 0),
      entity('npc-a', 'npc', -30, 0),
    )

    input.pressed = true
    const selected = loop.tickWithResult(tied)
    expect(selected.gameplayEvents).toContainEqual(expect.objectContaining({ targetEntityId: 'npc-a' }))

    input.pressed = false
    loop.tickWithResult(selected.world)
    const outside = world(
      entity('player', 'player', 0, 0),
      entity('npc-outside', 'npc', 49, 0),
    )
    input.pressed = true
    const noTarget = loop.tickWithResult(outside)
    expect(noTarget.gameplayEvents).toEqual([])
    expect(noTarget.world.entities).toEqual(outside.entities)
  })

  it('routes the generic request through a GameplayRule to immutable authoritative property state', () => {
    const runtimeWorld = world(
      entity('player', 'player', 0, 0),
      entity('npc-near', 'npc', 18, 0),
    )
    const event = interactionEvent('world-1:1:0', 'npc-near')
    const rules = interactionRuleSet()
    const executor = new DefaultGameplayRuleExecutor()
    const first = executor.execute([event], rules, {
      world: runtimeWorld,
      worldId: 'world-1',
      sessionId: 'session-1',
      semanticRevision: 0,
      semanticWorld,
    })

    expect(first.results[0]).toMatchObject({
      ruleId: 'farm-interaction',
      status: 'executed',
      committed: true,
      actionResults: [{
        actionType: 'SET_ENTITY_PROPERTY',
        status: 'executed',
        mutation: {
          type: 'ENTITY_PROPERTY_UPDATED',
          targetEntityId: 'npc-near',
          property: 'activated',
          value: true,
        },
      }],
    })
    expect(first.world.entities.find(item => item.id === 'npc-near')?.components).toContainEqual({
      type: 'gameplay-state',
      properties: { activated: true },
    })
    expect(runtimeWorld.entities.find(item => item.id === 'npc-near')?.components).not.toContainEqual(expect.objectContaining({
      type: 'gameplay-state',
    }))

    const repeated = executor.execute([
      interactionEvent('world-1:2:0', 'npc-near'),
    ], rules, {
      world: first.world,
      worldId: 'world-1',
      sessionId: 'session-1',
      semanticRevision: 0,
      semanticWorld,
    })
    expect(repeated.results[0]).toMatchObject({
      status: 'executed',
      committed: false,
      actionResults: [{ actionType: 'SET_ENTITY_PROPERTY', status: 'no_op' }],
    })
  })
})
