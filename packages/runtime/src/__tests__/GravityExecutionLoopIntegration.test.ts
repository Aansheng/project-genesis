/**
 * GravityExecutionLoopIntegration.test.ts — integration tests verifying
 * GravitySystem works correctly within the RuntimeExecutionLoop.
 *
 * Verifies that the execution loop correctly invokes GravitySystem,
 * producing a world with updated y coordinates for positioned entities.
 *
 * Coverage:
 * - gravity system in execution loop
 * - multiple ticks with gravity
 * - mixed entities (position + no position)
 * - execution loop with gravity + movement
 * - empty world
 * - immutability
 * - determinism
 */
import { describe, it, expect } from 'vitest'
import { DefaultGravitySystem } from '../systems/DefaultGravitySystem'
import { DefaultMovementSystem } from '../systems/DefaultMovementSystem'
import { DefaultRuntimeSystemRegistry } from '../system/DefaultRuntimeSystemRegistry'
import { DefaultRuntimeExecutionLoop } from '../execution/DefaultRuntimeExecutionLoop'
import type { World, Entity } from '@genesis/shared'
import { createPositionComponent } from '@genesis/shared'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createEntity(
  id: string,
  type: string = 'entity',
  x: number = 0,
  y: number = 0,
): Entity {
  return Object.freeze({
    id,
    type,
    x,
    y,
    components: Object.freeze([createPositionComponent(x, y)]),
  }) as unknown as Entity
}

function createEntityWithoutPosition(id: string): Entity {
  return Object.freeze({
    id,
    type: 'entity',
    x: 0,
    y: 0,
  }) as unknown as Entity
}

function createWorld(entities: readonly Entity[]): World {
  return Object.freeze({
    entities: Object.freeze([...entities]),
  }) as unknown as World
}

// ---------------------------------------------------------------------------
// Gravity integration tests
// ---------------------------------------------------------------------------

describe('gravity execution loop integration', () => {
  it('should apply gravity to positioned entities through execution loop', () => {
    const registry = new DefaultRuntimeSystemRegistry()
    registry.register(new DefaultGravitySystem(2))
    const loop = new DefaultRuntimeExecutionLoop(registry)

    const world = createWorld([createEntity('player', 'player', 10, 10)])
    const result = loop.tick(world)

    expect(result.entities[0].y).toBe(12)
  })

  it('should apply gravity over multiple ticks', () => {
    const registry = new DefaultRuntimeSystemRegistry()
    registry.register(new DefaultGravitySystem(1))
    const loop = new DefaultRuntimeExecutionLoop(registry)

    let world = createWorld([createEntity('player', 'player', 0, 0)])
    world = loop.tick(world)
    world = loop.tick(world)
    world = loop.tick(world)

    expect(world.entities[0].y).toBe(3)
  })

  it('should handle mixed entities (position + no position)', () => {
    const registry = new DefaultRuntimeSystemRegistry()
    registry.register(new DefaultGravitySystem(1))
    const loop = new DefaultRuntimeExecutionLoop(registry)

    const world = createWorld([
      createEntity('pos', 'type', 0, 0),
      createEntityWithoutPosition('nopos'),
    ])
    const result = loop.tick(world)

    expect(result.entities[0].y).toBe(1)
    expect(result.entities[1].y).toBe(0)
  })

  it('should handle empty world', () => {
    const registry = new DefaultRuntimeSystemRegistry()
    registry.register(new DefaultGravitySystem())
    const loop = new DefaultRuntimeExecutionLoop(registry)

    const world = createWorld([])
    const result = loop.tick(world)

    expect(result.entities).toHaveLength(0)
  })

  it('should return frozen world from execution loop', () => {
    const registry = new DefaultRuntimeSystemRegistry()
    registry.register(new DefaultGravitySystem())
    const loop = new DefaultRuntimeExecutionLoop(registry)

    const world = createWorld([createEntity('e', 'type', 0, 0)])
    const result = loop.tick(world)

    expect(Object.isFrozen(result)).toBe(true)
  })

  it('should be deterministic with gravity', () => {
    const registry = new DefaultRuntimeSystemRegistry()
    registry.register(new DefaultGravitySystem(2))
    const loop = new DefaultRuntimeExecutionLoop(registry)

    const world = createWorld([createEntity('e', 'type', 0, 0)])
    const result1 = loop.tick(world)
    const result2 = loop.tick(world)

    expect(result1).toEqual(result2)
  })

  it('should preserve entity order', () => {
    const registry = new DefaultRuntimeSystemRegistry()
    registry.register(new DefaultGravitySystem(1))
    const loop = new DefaultRuntimeExecutionLoop(registry)

    const world = createWorld([
      createEntity('first', 'type', 0, 5),
      createEntity('second', 'type', 0, 10),
    ])
    const result = loop.tick(world)

    expect(result.entities[0].id).toBe('first')
    expect(result.entities[1].id).toBe('second')
  })

  it('should not affect entities without PositionComponent', () => {
    const registry = new DefaultRuntimeSystemRegistry()
    registry.register(new DefaultGravitySystem(5))
    const loop = new DefaultRuntimeExecutionLoop(registry)

    const entity = createEntityWithoutPosition('static')
    const world = createWorld([entity])
    const result = loop.tick(world)

    expect(result.entities[0]).toBe(entity)
  })

  it('should not mutate input world', () => {
    const registry = new DefaultRuntimeSystemRegistry()
    registry.register(new DefaultGravitySystem())
    const loop = new DefaultRuntimeExecutionLoop(registry)

    const world = createWorld([createEntity('e', 'type', 0, 0)])
    const yBefore = world.entities[0].y
    loop.tick(world)

    expect(world.entities[0].y).toBe(yBefore)
  })
})

// ---------------------------------------------------------------------------
// Gravity + movement system integration
// ---------------------------------------------------------------------------

describe('gravity + movement system integration', () => {
  it('should apply gravity and movement in sequence', () => {
    const registry = new DefaultRuntimeSystemRegistry()
    // Movement first (no-op with 0,0), then gravity
    registry.register(new DefaultMovementSystem(0, 0))
    registry.register(new DefaultGravitySystem(1))
    const loop = new DefaultRuntimeExecutionLoop(registry)

    const world = createWorld([createEntity('player', 'player', 10, 0)])
    const result = loop.tick(world)

    expect(result.entities[0].y).toBe(1)
  })

  it('should stack gravity over multiple ticks with execution loop', () => {
    const registry = new DefaultRuntimeSystemRegistry()
    registry.register(new DefaultGravitySystem(1))
    const loop = new DefaultRuntimeExecutionLoop(registry)

    let world = createWorld([createEntity('player', 'player', 0, 0)])
    for (let i = 0; i < 5; i++) {
      world = loop.tick(world)
    }

    expect(world.entities[0].y).toBe(5)
  })

  it('should handle large number of entities in execution loop', () => {
    const registry = new DefaultRuntimeSystemRegistry()
    registry.register(new DefaultGravitySystem(1))
    const loop = new DefaultRuntimeExecutionLoop(registry)

    const entities = Array.from({ length: 100 }, (_, i) =>
      createEntity(`e${i}`, 'type', 0, i),
    )
    const world = createWorld(entities)
    const result = loop.tick(world)

    expect(result.entities[99].y).toBe(100)
  })
})