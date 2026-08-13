/**
 * MovementExecutionLoopIntegration — verifies that MovementSystem works
 * end-to-end through the RuntimeExecutionLoop across multiple ticks.
 *
 * WO-S8-012 — Movement System Foundation
 * Architecture version v1.71
 *
 * Simulates the full runtime pipeline:
 *   World(t0) → tick() → World(t1) → tick() → World(t2) → ...
 *
 * Verifies that:
 * - Position changes accumulate correctly across ticks
 * - Entity count and structure are preserved
 * - Immutability guarantees are maintained
 * - Mixed entity types (positioned and non-positioned) behave correctly
 */

import { describe, it, expect } from 'vitest'
import type { World, Entity } from '@genesis/shared'
import { createPositionComponent } from '@genesis/shared'
import { DefaultMovementSystem } from '../systems'
import { DefaultRuntimeSystemRegistry } from '../system'
import { DefaultRuntimeExecutionLoop } from '../execution'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a single entity with a PositionComponent at (x, y). */
function createEntityWithPosition(
  id: string,
  x: number,
  y: number,
): Entity {
  return Object.freeze({
    id,
    type: 'test',
    x,
    y,
    components: Object.freeze([createPositionComponent(x, y)]),
  }) as unknown as Entity
}

/** Create a single entity without PositionComponent. */
function createEntityWithoutPosition(id: string, x: number, y: number): Entity {
  return Object.freeze({
    id,
    type: 'test',
    x,
    y,
    components: undefined,
  }) as unknown as Entity
}

/** Create a World with given entities. */
function createWorld(entities: Entity[]): World {
  return Object.freeze({
    entities: Object.freeze(entities),
  }) as unknown as World
}

/** Build a multi-tick pipeline result array. */
function simulateTicks(
  world: World,
  loop: DefaultRuntimeExecutionLoop,
  tickCount: number,
): World[] {
  const results: World[] = []
  let current = world
  for (let i = 0; i < tickCount; i++) {
    current = loop.tick(current)
    results.push(current)
  }
  return results
}

// ---------------------------------------------------------------------------
// Section 1 — Single Entity Movement Across Ticks
// ---------------------------------------------------------------------------

describe('single entity movement across ticks', () => {
  it('World(t0) → tick → World(t1) with correct position change', () => {
    const registry = new DefaultRuntimeSystemRegistry()
    registry.register(new DefaultMovementSystem(2, 3))
    const loop = new DefaultRuntimeExecutionLoop(registry)

    const entity = createEntityWithPosition('hero', 0, 0)
    const t0 = createWorld([entity])
    const t1 = loop.tick(t0)

    expect(t1.entities[0].x).toBe(2)
    expect(t1.entities[0].y).toBe(3)
    expect(t1.entities.length).toBe(1)
    expect(t1.entities[0].id).toBe('hero')
  })

  it('World(t0) → tick → World(t1) → tick → World(t2)', () => {
    const registry = new DefaultRuntimeSystemRegistry()
    registry.register(new DefaultMovementSystem(1, 1))
    const loop = new DefaultRuntimeExecutionLoop(registry)

    const entity = createEntityWithPosition('hero', 0, 0)
    const t0 = createWorld([entity])

    const t1 = loop.tick(t0)
    expect(t1.entities[0].x).toBe(1)
    expect(t1.entities[0].y).toBe(1)

    const t2 = loop.tick(t1)
    expect(t2.entities[0].x).toBe(2)
    expect(t2.entities[0].y).toBe(2)
  })

  it('three ticks accumulate (1,2) each tick → (3,6) total', () => {
    const registry = new DefaultRuntimeSystemRegistry()
    registry.register(new DefaultMovementSystem(1, 2))
    const loop = new DefaultRuntimeExecutionLoop(registry)

    const entity = createEntityWithPosition('hero', 0, 0)
    const t0 = createWorld([entity])

    const t1 = loop.tick(t0)
    const t2 = loop.tick(t1)
    const t3 = loop.tick(t2)

    expect(t3.entities[0].x).toBe(3)
    expect(t3.entities[0].y).toBe(6)
  })

  it('entity id and type are preserved across all ticks', () => {
    const registry = new DefaultRuntimeSystemRegistry()
    registry.register(new DefaultMovementSystem(1, 1))
    const loop = new DefaultRuntimeExecutionLoop(registry)

    const entity = createEntityWithPosition('persistent-hero', 0, 0)
    const t0 = createWorld([entity])
    const results = simulateTicks(t0, loop, 5)

    for (const world of results) {
      expect(world.entities[0].id).toBe('persistent-hero')
      expect(world.entities[0].type).toBe('test')
    }
  })
})

// ---------------------------------------------------------------------------
// Section 2 — Multiple Entities Across Ticks
// ---------------------------------------------------------------------------

describe('multiple entities across ticks', () => {
  it('two entities both move each tick', () => {
    const registry = new DefaultRuntimeSystemRegistry()
    registry.register(new DefaultMovementSystem(1, 1))
    const loop = new DefaultRuntimeExecutionLoop(registry)

    const entities = [
      createEntityWithPosition('hero', 0, 0),
      createEntityWithPosition('npc', 10, 20),
    ]
    const t0 = createWorld(entities)
    const results = simulateTicks(t0, loop, 3)

    // After 3 ticks of (1,1):
    expect(results[2].entities[0].x).toBe(3)
    expect(results[2].entities[0].y).toBe(3)
    expect(results[2].entities[1].x).toBe(13)
    expect(results[2].entities[1].y).toBe(23)
  })

  it('entity count remains constant across ticks', () => {
    const registry = new DefaultRuntimeSystemRegistry()
    registry.register(new DefaultMovementSystem(1, 1))
    const loop = new DefaultRuntimeExecutionLoop(registry)

    const entities = Array.from({ length: 5 }, (_, i) =>
      createEntityWithPosition(`e${i}`, i, i * 2),
    )
    const t0 = createWorld(entities)
    const results = simulateTicks(t0, loop, 10)

    for (const world of results) {
      expect(world.entities.length).toBe(5)
    }
  })

  it('entity order is preserved across ticks', () => {
    const registry = new DefaultRuntimeSystemRegistry()
    registry.register(new DefaultMovementSystem(1, 1))
    const loop = new DefaultRuntimeExecutionLoop(registry)

    const entities = [
      createEntityWithPosition('first', 0, 0),
      createEntityWithPosition('second', 0, 0),
      createEntityWithPosition('third', 0, 0),
    ]
    const t0 = createWorld(entities)
    const results = simulateTicks(t0, loop, 5)

    for (const world of results) {
      expect(world.entities[0].id).toBe('first')
      expect(world.entities[1].id).toBe('second')
      expect(world.entities[2].id).toBe('third')
    }
  })
})

// ---------------------------------------------------------------------------
// Section 3 — Mixed Entity Types Across Ticks
// ---------------------------------------------------------------------------

describe('mixed entity types across ticks', () => {
  it('positioned entity moves, non-positioned entity stays', () => {
    const registry = new DefaultRuntimeSystemRegistry()
    registry.register(new DefaultMovementSystem(3, 5))
    const loop = new DefaultRuntimeExecutionLoop(registry)

    const entities = [
      createEntityWithPosition('mover', 0, 0),
      createEntityWithoutPosition('static', 100, 200),
    ]
    const t0 = createWorld(entities)
    const results = simulateTicks(t0, loop, 4)

    // Mover should have moved 4 * (3,5) = (12,20)
    expect(results[3].entities[0].x).toBe(12)
    expect(results[3].entities[0].y).toBe(20)

    // Static should remain unchanged
    expect(results[3].entities[1].x).toBe(100)
    expect(results[3].entities[1].y).toBe(200)
  })

  it('non-positioned entity never moves across many ticks', () => {
    const registry = new DefaultRuntimeSystemRegistry()
    registry.register(new DefaultMovementSystem(10, 20))
    const loop = new DefaultRuntimeExecutionLoop(registry)

    const entity = createEntityWithoutPosition('rock', 50, 100)
    const t0 = createWorld([entity])
    const results = simulateTicks(t0, loop, 100)

    expect(results[99].entities[0].x).toBe(50)
    expect(results[99].entities[0].y).toBe(100)
  })
})

// ---------------------------------------------------------------------------
// Section 4 — Negative and Fractional Movement Across Ticks
// ---------------------------------------------------------------------------

describe('negative and fractional movement across ticks', () => {
  it('negative delta moves entity backward over multiple ticks', () => {
    const registry = new DefaultRuntimeSystemRegistry()
    registry.register(new DefaultMovementSystem(-2, -3))
    const loop = new DefaultRuntimeExecutionLoop(registry)

    const entity = createEntityWithPosition('hero', 100, 100)
    const t0 = createWorld([entity])
    const results = simulateTicks(t0, loop, 5)

    // 5 ticks * (-2, -3) = (-10, -15) → (90, 85)
    expect(results[4].entities[0].x).toBe(90)
    expect(results[4].entities[0].y).toBe(85)
  })

  it('fractional delta accumulates across ticks', () => {
    const registry = new DefaultRuntimeSystemRegistry()
    registry.register(new DefaultMovementSystem(0.5, 0.25))
    const loop = new DefaultRuntimeExecutionLoop(registry)

    const entity = createEntityWithPosition('hero', 0, 0)
    const t0 = createWorld([entity])
    const results = simulateTicks(t0, loop, 4)

    // 4 ticks * (0.5, 0.25) = (2.0, 1.0)
    expect(results[3].entities[0].x).toBe(2)
    expect(results[3].entities[0].y).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// Section 5 — Empty and Large Worlds
// ---------------------------------------------------------------------------

describe('empty and large worlds across ticks', () => {
  it('empty world remains empty after many ticks', () => {
    const registry = new DefaultRuntimeSystemRegistry()
    registry.register(new DefaultMovementSystem(1, 1))
    const loop = new DefaultRuntimeExecutionLoop(registry)

    const t0 = Object.freeze({
      entities: Object.freeze([]),
    }) as unknown as World
    const results = simulateTicks(t0, loop, 50)

    for (const world of results) {
      expect(world.entities.length).toBe(0)
    }
  })

  it('100 entities all move correctly across ticks', () => {
    const registry = new DefaultRuntimeSystemRegistry()
    registry.register(new DefaultMovementSystem(1, 2))
    const loop = new DefaultRuntimeExecutionLoop(registry)

    const entities = Array.from({ length: 100 }, (_, i) =>
      createEntityWithPosition(`e${i}`, i, i * 3),
    )
    const t0 = createWorld(entities)
    const results = simulateTicks(t0, loop, 10)

    // After 10 ticks of (1,2): each entity moved by (10, 20)
    for (let i = 0; i < 100; i++) {
      expect(results[9].entities[i].x).toBe(i + 10)
      expect(results[9].entities[i].y).toBe(i * 3 + 20)
    }
  })
})

// ---------------------------------------------------------------------------
// Section 6 — Immutability Across Ticks
// ---------------------------------------------------------------------------

describe('immutability across ticks', () => {
  it('each tick output is frozen', () => {
    const registry = new DefaultRuntimeSystemRegistry()
    registry.register(new DefaultMovementSystem(1, 1))
    const loop = new DefaultRuntimeExecutionLoop(registry)

    const entity = createEntityWithPosition('hero', 0, 0)
    const t0 = createWorld([entity])
    const results = simulateTicks(t0, loop, 5)

    for (const world of results) {
      expect(Object.isFrozen(world)).toBe(true)
      expect(Object.isFrozen(world.entities)).toBe(true)
      expect(Object.isFrozen(world.entities[0])).toBe(true)
    }
  })

  it('t0 is never mutated by the execution loop', () => {
    const registry = new DefaultRuntimeSystemRegistry()
    registry.register(new DefaultMovementSystem(10, 20))
    const loop = new DefaultRuntimeExecutionLoop(registry)

    const entity = createEntityWithPosition('hero', 5, 10)
    const t0 = createWorld([entity])

    loop.tick(t0)
    loop.tick(t0)
    loop.tick(t0)

    // t0 should still have the original values
    expect(t0.entities[0].x).toBe(5)
    expect(t0.entities[0].y).toBe(10)
  })
})

// ---------------------------------------------------------------------------
// Section 7 — Determinism Across Ticks
// ---------------------------------------------------------------------------

describe('determinism across ticks', () => {
  it('same pipeline produces identical tick sequences', () => {
    const registry1 = new DefaultRuntimeSystemRegistry()
    registry1.register(new DefaultMovementSystem(2, 3))
    const loop1 = new DefaultRuntimeExecutionLoop(registry1)

    const registry2 = new DefaultRuntimeSystemRegistry()
    registry2.register(new DefaultMovementSystem(2, 3))
    const loop2 = new DefaultRuntimeExecutionLoop(registry2)

    const entity = createEntityWithPosition('hero', 0, 0)
    const t0 = createWorld([entity])

    const results1 = simulateTicks(t0, loop1, 10)
    const results2 = simulateTicks(t0, loop2, 10)

    for (let i = 0; i < 10; i++) {
      expect(results1[i]).toEqual(results2[i])
    }
  })
})