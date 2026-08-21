import { describe, expect, it } from 'vitest'
import type {
  Entity,
  World,
} from '@genesis/shared'
import {
  createCollisionBoundsComponent,
  createPositionComponent,
  createVelocityComponent,
} from '@genesis/shared'
import {
  DefaultEntityContactSystem,
  DefaultGroundCollisionSystem,
  DefaultJumpSystem,
  DefaultRuntimeExecutionLoop,
  DefaultRuntimeGameplayEventCollector,
  DefaultRuntimeSystemRegistry,
  DefaultRuntimeWorldStore,
} from '../index'
import type { InputKey, InputProvider, InputState } from '../input'
import { DefaultInputState } from '../input'

class TestInput implements InputProvider {
  readonly pressed = new Set<InputKey>()

  getState(): InputState {
    return new DefaultInputState(this.pressed)
  }
}

function entity(
  id: string,
  type: string,
  x: number,
  y: number,
  withBounds = false,
  velocityY?: number,
): Entity {
  return Object.freeze({
    id,
    type,
    x: 0,
    y: 0,
    components: Object.freeze([
      createPositionComponent(x, y),
      ...(withBounds ? [createCollisionBoundsComponent(24, 24)] : []),
      ...(velocityY !== undefined ? [createVelocityComponent(0, velocityY)] : []),
    ]),
  }) as unknown as Entity
}

function world(...entities: Entity[]): World {
  return Object.freeze({ entities: Object.freeze(entities) }) as unknown as World
}

function batch(
  collector: DefaultRuntimeGameplayEventCollector,
  tick: number,
  run: () => void,
) {
  collector.beginTick(tick)
  run()
  return collector.endTick()
}

describe('Runtime gameplay event observation', () => {
  it('emits one accepted jump and none for a held or rejected input', () => {
    const input = new TestInput()
    const registry = new DefaultRuntimeSystemRegistry()
    registry.register(new DefaultJumpSystem(input))
    const collector = new DefaultRuntimeGameplayEventCollector()
    const loop = new DefaultRuntimeExecutionLoop(registry, collector)
    const initial = world(entity('player', 'player', 80, 400, true, 0))

    input.pressed.add('Space')
    const jumped = loop.tickWithResult(initial)
    expect(jumped.gameplayEvents).toHaveLength(1)
    expect(jumped.gameplayEvents?.[0]).toMatchObject({
      type: 'ENTITY_JUMPED',
      actorEntityId: 'player',
      tick: 1,
      sequence: 0,
    })

    const held = loop.tickWithResult(jumped.world)
    expect(held.gameplayEvents).toHaveLength(0)

    const airborne = loop.tickWithResult(world(entity('player', 'player', 80, 200, true, 1)))
    expect(airborne.gameplayEvents).toHaveLength(0)
  })

  it('emits landing only on airborne-to-ground transitions', () => {
    const collector = new DefaultRuntimeGameplayEventCollector()
    const collision = new DefaultGroundCollisionSystem(400)
    collision.setGameplayEventSink(collector)

    expect(batch(collector, 1, () => collision.update(world(entity('player', 'player', 80, 350))))).toHaveLength(0)
    expect(batch(collector, 2, () => collision.update(world(entity('player', 'player', 80, 410))))).toMatchObject([
      { type: 'ENTITY_LANDED', actorEntityId: 'player', tick: 2 },
    ])
    expect(batch(collector, 3, () => collision.update(world(entity('player', 'player', 80, 400))))).toHaveLength(0)
    expect(batch(collector, 4, () => collision.update(world(entity('player', 'player', 80, 350))))).toHaveLength(0)
    expect(batch(collector, 5, () => collision.update(world(entity('player', 'player', 80, 410))))).toHaveLength(1)
  })

  it('deduplicates entity contact until separation and re-entry', () => {
    const collector = new DefaultRuntimeGameplayEventCollector()
    const contact = new DefaultEntityContactSystem()
    contact.setGameplayEventSink(collector)
    const overlap = world(
      entity('player', 'player', 100, 100, true),
      entity('coin-1', 'item', 108, 100, true),
    )
    const separated = world(
      entity('player', 'player', 100, 100, true),
      entity('coin-1', 'item', 200, 100, true),
    )

    expect(batch(collector, 1, () => contact.update(overlap))).toMatchObject([{
      type: 'ENTITY_CONTACT_STARTED',
      actorEntityId: 'player',
      targetEntityId: 'coin-1',
      direction: 'left',
    }])
    expect(batch(collector, 2, () => contact.update(overlap))).toHaveLength(0)
    expect(batch(collector, 3, () => contact.update(separated))).toHaveLength(0)
    expect(batch(collector, 4, () => contact.update(overlap))).toHaveLength(1)
    expect(batch(collector, 5, () => contact.update(world(entity('player', 'player', 100, 100, true)))).length).toBe(0)
    expect(batch(collector, 6, () => contact.update(overlap))).toHaveLength(1)
  })

  it('derives top, bottom, left, and right from previous AABB crossings', () => {
    const cases = [
      { direction: 'top' as const, initial: [100, 70] as const, contact: [100, 95] as const },
      { direction: 'bottom' as const, initial: [100, 130] as const, contact: [100, 105] as const },
      { direction: 'left' as const, initial: [70, 100] as const, contact: [95, 100] as const },
      { direction: 'right' as const, initial: [130, 100] as const, contact: [105, 100] as const },
    ]

    for (const [index, testCase] of cases.entries()) {
      const collector = new DefaultRuntimeGameplayEventCollector()
      const contact = new DefaultEntityContactSystem()
      contact.setGameplayEventSink(collector)
      const target = entity('target', 'enemy', 100, 100, true)
      const initial = world(entity('player', 'player', testCase.initial[0], testCase.initial[1], true), target)
      const entered = world(entity('player', 'player', testCase.contact[0], testCase.contact[1], true), target)

      expect(batch(collector, index * 2 + 1, () => contact.update(initial))).toHaveLength(0)
      expect(batch(collector, index * 2 + 2, () => contact.update(entered))).toMatchObject([{
        type: 'ENTITY_CONTACT_STARTED',
        direction: testCase.direction,
      }])
    }
  })

  it('emits entity mutations only after committed ID-set changes', () => {
    const collector = new DefaultRuntimeGameplayEventCollector()
    const store = new DefaultRuntimeWorldStore(world(entity('player', 'player', 80, 400)), collector)

    store.setWorld(world(entity('player', 'player', 80, 400), entity('coin-1', 'item', 100, 400, true)))
    store.setWorld(world(entity('player', 'player', 80, 400), entity('coin-1', 'item', 100, 400, true)))
    const added = batch(collector, 1, () => undefined)
    expect(added).toMatchObject([{ type: 'ENTITY_ADDED', targetEntityId: 'coin-1' }])

    store.setWorld(world(entity('player', 'player', 80, 400)))
    const removed = batch(collector, 2, () => undefined)
    expect(removed).toMatchObject([{ type: 'ENTITY_REMOVED', targetEntityId: 'coin-1' }])
  })

  it('keeps deterministic IDs, ordering, immutability, and a bounded batch', () => {
    const collector = new DefaultRuntimeGameplayEventCollector('world-1')
    const events = batch(collector, 7, () => {
      collector.emit({ type: 'ENTITY_JUMPED', actorEntityId: 'player' })
      collector.emit({ type: 'ENTITY_LANDED', actorEntityId: 'player' })
    })
    expect(events.map((event) => event.eventId)).toEqual([
      'world-1:7:0',
      'world-1:7:1',
    ])
    expect(events.map((event) => event.sequence)).toEqual([0, 1])
    expect(Object.isFrozen(events)).toBe(true)
    expect(Object.isFrozen(events[0])).toBe(true)

    const bounded = new DefaultRuntimeGameplayEventCollector()
    bounded.beginTick(1)
    for (let index = 0; index < 150; index += 1) {
      bounded.emit({ type: 'ENTITY_JUMPED', actorEntityId: `player-${index}` })
    }
    expect(bounded.endTick()).toHaveLength(100)
    expect(bounded.endTick()).toHaveLength(0)
  })
})
