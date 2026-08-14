/**
 * GroundCollisionExecutionLoopIntegration.test.ts — integration tests verifying
 * GravitySystem + GroundCollisionSystem work correctly within the
 * RuntimeExecutionLoop.
 *
 * Verifies the pipeline:
 *   GravitySystem (entity falls down) → GroundCollisionSystem (clamps at ground)
 *
 * Coverage:
 * - Gravity + collision integrated
 * - Entity falls → hits ground → stops
 * - Repeated ticks
 * - Multiple entities
 * - Different ground heights
 * - Execution order verification
 * - Empty world
 * - Immutability
 * - Determinism
 * - Mixed entities
 */
import { describe, it, expect } from 'vitest'
import { DefaultGravitySystem } from '../systems/DefaultGravitySystem'
import { DefaultGroundCollisionSystem } from '../systems/DefaultGroundCollisionSystem'
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
// Gravity + Collision execution loop integration
// ---------------------------------------------------------------------------

describe('gravity + collision execution loop integration', () => {
  it('should apply gravity then clamp entity at ground level', () => {
    const registry = new DefaultRuntimeSystemRegistry()
    registry.register(new DefaultGravitySystem(5))
    registry.register(new DefaultGroundCollisionSystem(400))
    const loop = new DefaultRuntimeExecutionLoop(registry)

    // Entity starts at y=395, first tick: gravity = 400, no clamp needed
    const world = createWorld([createEntity('player', 'player', 10, 395)])
    const result = loop.tick(world)

    expect(result.entities[0].y).toBe(400)
  })

  it('should stop entity at ground level after falling', () => {
    const registry = new DefaultRuntimeSystemRegistry()
    registry.register(new DefaultGravitySystem(10))
    registry.register(new DefaultGroundCollisionSystem(400))
    const loop = new DefaultRuntimeExecutionLoop(registry)

    // Entity starts at y=0, after gravity it'll be at 10, 20, ... until 400
    let world = createWorld([createEntity('player', 'player', 0, 0)])

    // Simulate enough ticks to pass ground
    for (let i = 0; i < 50; i++) {
      world = loop.tick(world)
    }

    // Should be clamped at ground level
    expect(world.entities[0].y).toBe(400)
  })

  it('should keep entity at ground level after repeated ticks', () => {
    const registry = new DefaultRuntimeSystemRegistry()
    registry.register(new DefaultGravitySystem(5))
    registry.register(new DefaultGroundCollisionSystem(400))
    const loop = new DefaultRuntimeExecutionLoop(registry)

    let world = createWorld([createEntity('player', 'player', 0, 390)])

    // Tick once: gravity 390→395, no clamp yet
    world = loop.tick(world)
    expect(world.entities[0].y).toBe(395)

    // Tick twice: gravity 395→400, clamp to 400
    world = loop.tick(world)
    expect(world.entities[0].y).toBe(400)

    // More ticks: stays at 400
    for (let i = 0; i < 10; i++) {
      world = loop.tick(world)
      expect(world.entities[0].y).toBe(400)
    }
  })

  it('should handle entity starting below ground in first tick', () => {
    const registry = new DefaultRuntimeSystemRegistry()
    registry.register(new DefaultGravitySystem(10))
    registry.register(new DefaultGroundCollisionSystem(400))
    const loop = new DefaultRuntimeExecutionLoop(registry)

    // Entity starts below ground (already fallen through)
    const world = createWorld([createEntity('player', 'player', 0, 500)])
    const result = loop.tick(world)

    // Gravity would push to 510, but collision clamps to 400
    expect(result.entities[0].y).toBe(400)
  })

  it('should handle multiple entities with different start positions', () => {
    const registry = new DefaultRuntimeSystemRegistry()
    registry.register(new DefaultGravitySystem(5))
    registry.register(new DefaultGroundCollisionSystem(400))
    const loop = new DefaultRuntimeExecutionLoop(registry)

    const world = createWorld([
      createEntity('far-above', 'type', 0, 0),
      createEntity('near-ground', 'type', 0, 390),
      createEntity('below-ground', 'type', 0, 500),
    ])
    const result = loop.tick(world)

    // far-above: 0→5, near-ground: 390→395, below-ground: 500→400(clamped)
    expect(result.entities[0].y).toBe(5)
    expect(result.entities[1].y).toBe(395)
    expect(result.entities[2].y).toBe(400)
  })

  it('should handle multiple entities converging at ground', () => {
    const registry = new DefaultRuntimeSystemRegistry()
    registry.register(new DefaultGravitySystem(10))
    registry.register(new DefaultGroundCollisionSystem(400))
    const loop = new DefaultRuntimeExecutionLoop(registry)

    let world = createWorld([
      createEntity('a', 'type', 0, 350),
      createEntity('b', 'type', 0, 360),
      createEntity('c', 'type', 0, 370),
    ])

    // After enough ticks, all should be at ground level
    for (let i = 0; i < 20; i++) {
      world = loop.tick(world)
    }

    expect(world.entities[0].y).toBe(400)
    expect(world.entities[1].y).toBe(400)
    expect(world.entities[2].y).toBe(400)
  })

  it('should handle different ground heights with custom groundY', () => {
    const registry = new DefaultRuntimeSystemRegistry()
    registry.register(new DefaultGravitySystem(10))
    registry.register(new DefaultGroundCollisionSystem(200))
    const loop = new DefaultRuntimeExecutionLoop(registry)

    let world = createWorld([createEntity('player', 'player', 0, 0)])

    for (let i = 0; i < 30; i++) {
      world = loop.tick(world)
    }

    // Should stop at custom groundY = 200
    expect(world.entities[0].y).toBe(200)
  })

  it('should handle zero groundY', () => {
    const registry = new DefaultRuntimeSystemRegistry()
    registry.register(new DefaultGravitySystem(10))
    registry.register(new DefaultGroundCollisionSystem(0))
    const loop = new DefaultRuntimeExecutionLoop(registry)

    let world = createWorld([createEntity('player', 'player', 0, -50)])

    for (let i = 0; i < 20; i++) {
      world = loop.tick(world)
    }

    // Should stop at groundY = 0
    expect(world.entities[0].y).toBe(0)
  })

  it('should handle large groundY', () => {
    const registry = new DefaultRuntimeSystemRegistry()
    registry.register(new DefaultGravitySystem(100))
    registry.register(new DefaultGroundCollisionSystem(10000))
    const loop = new DefaultRuntimeExecutionLoop(registry)

    let world = createWorld([createEntity('player', 'player', 0, 0)])

    for (let i = 0; i < 200; i++) {
      world = loop.tick(world)
    }

    // Should stop at custom groundY = 10000
    expect(world.entities[0].y).toBe(10000)
  })
})

// ---------------------------------------------------------------------------
// Execution order verification
// ---------------------------------------------------------------------------

describe('execution order verification', () => {
  it('should apply gravity before collision in execution loop', () => {
    const registry = new DefaultRuntimeSystemRegistry()
    // Register in wrong order: collision before gravity
    registry.register(new DefaultGroundCollisionSystem(400))
    registry.register(new DefaultGravitySystem(10))
    const loop = new DefaultRuntimeExecutionLoop(registry)

    // Entity at y=0: collision runs first (no-op), then gravity makes it fall
    let world = createWorld([createEntity('player', 'player', 0, 0)])

    // After first tick: collision is no-op, gravity: 0→10
    world = loop.tick(world)
    expect(world.entities[0].y).toBe(10)
  })

  it('should work with correct order (gravity then collision)', () => {
    const registry = new DefaultRuntimeSystemRegistry()
    registry.register(new DefaultGravitySystem(5))
    registry.register(new DefaultGroundCollisionSystem(400))
    const loop = new DefaultRuntimeExecutionLoop(registry)

    let world = createWorld([createEntity('player', 'player', 0, 0)])

    for (let i = 0; i < 100; i++) {
      world = loop.tick(world)
    }

    expect(world.entities[0].y).toBe(400)
  })

  it('should not clamp entities without PositionComponent', () => {
    const registry = new DefaultRuntimeSystemRegistry()
    registry.register(new DefaultGravitySystem(10))
    registry.register(new DefaultGroundCollisionSystem(400))
    const loop = new DefaultRuntimeExecutionLoop(registry)

    const entity = createEntityWithoutPosition('static')
    const world = createWorld([entity])
    const result = loop.tick(world)

    // Entity without position should be identity-preserved
    expect(result.entities[0]).toBe(entity)
  })
})

// ---------------------------------------------------------------------------
// Immutability in integration
// ---------------------------------------------------------------------------

describe('immutability in integration', () => {
  it('should return frozen world from execution loop', () => {
    const registry = new DefaultRuntimeSystemRegistry()
    registry.register(new DefaultGravitySystem(1))
    registry.register(new DefaultGroundCollisionSystem(400))
    const loop = new DefaultRuntimeExecutionLoop(registry)

    const world = createWorld([createEntity('e', 'type', 0, 500)])
    const result = loop.tick(world)

    expect(Object.isFrozen(result)).toBe(true)
  })

  it('should not mutate input world', () => {
    const registry = new DefaultRuntimeSystemRegistry()
    registry.register(new DefaultGravitySystem(5))
    registry.register(new DefaultGroundCollisionSystem(400))
    const loop = new DefaultRuntimeExecutionLoop(registry)

    const world = createWorld([createEntity('e', 'type', 0, 100)])
    const yBefore = world.entities[0].y
    loop.tick(world)

    expect(world.entities[0].y).toBe(yBefore)
  })

  it('should handle empty world', () => {
    const registry = new DefaultRuntimeSystemRegistry()
    registry.register(new DefaultGravitySystem(5))
    registry.register(new DefaultGroundCollisionSystem(400))
    const loop = new DefaultRuntimeExecutionLoop(registry)

    const world = createWorld([])
    const result = loop.tick(world)

    expect(result.entities).toHaveLength(0)
  })

  it('should be deterministic with gravity + collision', () => {
    const registry = new DefaultRuntimeSystemRegistry()
    registry.register(new DefaultGravitySystem(5))
    registry.register(new DefaultGroundCollisionSystem(400))
    const loop = new DefaultRuntimeExecutionLoop(registry)

    const world = createWorld([createEntity('e', 'type', 0, 300)])
    const result1 = loop.tick(world)
    const result2 = loop.tick(world)

    expect(result1).toEqual(result2)
  })

  it('should preserve entity order', () => {
    const registry = new DefaultRuntimeSystemRegistry()
    registry.register(new DefaultGravitySystem(5))
    registry.register(new DefaultGroundCollisionSystem(400))
    const loop = new DefaultRuntimeExecutionLoop(registry)

    const world = createWorld([
      createEntity('first', 'type', 0, 500),
      createEntity('second', 'type', 0, 100),
    ])
    const result = loop.tick(world)

    expect(result.entities[0].id).toBe('first')
    expect(result.entities[1].id).toBe('second')
  })
})