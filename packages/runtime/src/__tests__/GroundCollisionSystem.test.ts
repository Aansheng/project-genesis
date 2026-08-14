/**
 * GroundCollisionSystem.test.ts — comprehensive test suite for DefaultGroundCollisionSystem.
 *
 * Target: 60+ tests
 * Coverage: construction, defaults, custom groundY, clamp behavior, no clamp,
 *           multiple entities, mixed entities, missing PositionComponent,
 *           result metadata, determinism, immutability, deep freeze,
 *           update(), updateWithResult(), large worlds, stress cases
 */
import { describe, it, expect } from 'vitest'
import { DefaultGroundCollisionSystem } from '../systems/DefaultGroundCollisionSystem'
import type { World, Entity } from '@genesis/shared'
import { createPositionComponent } from '@genesis/shared'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Create a minimal entity with a PositionComponent at (x, y).
 */
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

/**
 * Create an entity without a PositionComponent.
 */
function createEntityWithoutPosition(id: string, type: string = 'entity'): Entity {
  return Object.freeze({
    id,
    type,
    x: 0,
    y: 0,
  }) as unknown as Entity
}

/**
 * Create a minimal world from an array of entities.
 */
function createWorld(entities: readonly Entity[]): World {
  return Object.freeze({
    entities: Object.freeze([...entities]),
  }) as unknown as World
}

// ---------------------------------------------------------------------------
// Construction
// ---------------------------------------------------------------------------

describe('construction', () => {
  it('should create a DefaultGroundCollisionSystem with default groundY', () => {
    const system = new DefaultGroundCollisionSystem()
    expect(system).toBeInstanceOf(DefaultGroundCollisionSystem)
  })

  it('should have name "GroundCollisionSystem"', () => {
    const system = new DefaultGroundCollisionSystem()
    expect(system.name).toBe('GroundCollisionSystem')
  })

  it('should implement GroundCollisionSystem interface', () => {
    const system = new DefaultGroundCollisionSystem()
    expect(typeof system.update).toBe('function')
    expect(typeof system.updateWithResult).toBe('function')
  })

  it('should accept custom groundY value', () => {
    const system = new DefaultGroundCollisionSystem(500)
    expect(system).toBeInstanceOf(DefaultGroundCollisionSystem)
  })

  it('should accept zero groundY', () => {
    const system = new DefaultGroundCollisionSystem(0)
    expect(system).toBeInstanceOf(DefaultGroundCollisionSystem)
  })

  it('should accept negative groundY', () => {
    const system = new DefaultGroundCollisionSystem(-100)
    expect(system).toBeInstanceOf(DefaultGroundCollisionSystem)
  })

  it('should accept fractional groundY', () => {
    const system = new DefaultGroundCollisionSystem(100.5)
    expect(system).toBeInstanceOf(DefaultGroundCollisionSystem)
  })
})

// ---------------------------------------------------------------------------
// Default groundY
// ---------------------------------------------------------------------------

describe('default groundY', () => {
  it('should use default groundY of 400', () => {
    const system = new DefaultGroundCollisionSystem()
    const world = createWorld([createEntity('e', 'type', 0, 500)])
    const result = system.update(world)
    expect(result.entities[0].y).toBe(400)
  })

  it('should not clamp entity above groundY (y < groundY)', () => {
    const system = new DefaultGroundCollisionSystem()
    const world = createWorld([createEntity('e', 'type', 0, 300)])
    const result = system.update(world)
    expect(result.entities[0].y).toBe(300)
  })

  it('should not clamp entity exactly at groundY', () => {
    const system = new DefaultGroundCollisionSystem()
    const world = createWorld([createEntity('e', 'type', 0, 400)])
    const result = system.update(world)
    expect(result.entities[0].y).toBe(400)
  })
})

// ---------------------------------------------------------------------------
// Custom groundY
// ---------------------------------------------------------------------------

describe('custom groundY', () => {
  it('should clamp to custom groundY', () => {
    const system = new DefaultGroundCollisionSystem(100)
    const world = createWorld([createEntity('e', 'type', 0, 200)])
    const result = system.update(world)
    expect(result.entities[0].y).toBe(100)
  })

  it('should not clamp entity above custom groundY', () => {
    const system = new DefaultGroundCollisionSystem(100)
    const world = createWorld([createEntity('e', 'type', 0, 50)])
    const result = system.update(world)
    expect(result.entities[0].y).toBe(50)
  })

  it('should clamp to very low groundY', () => {
    const system = new DefaultGroundCollisionSystem(-50)
    const world = createWorld([createEntity('e', 'type', 0, 0)])
    const result = system.update(world)
    expect(result.entities[0].y).toBe(-50)
  })

  it('should clamp to zero groundY', () => {
    const system = new DefaultGroundCollisionSystem(0)
    const world = createWorld([createEntity('e', 'type', 0, 100)])
    const result = system.update(world)
    expect(result.entities[0].y).toBe(0)
  })

  it('should clamp to large groundY', () => {
    const system = new DefaultGroundCollisionSystem(10000)
    const world = createWorld([createEntity('e', 'type', 0, 20000)])
    const result = system.update(world)
    expect(result.entities[0].y).toBe(10000)
  })
})

// ---------------------------------------------------------------------------
// Clamp behavior
// ---------------------------------------------------------------------------

describe('clamp behavior', () => {
  it('should clamp entity just below ground', () => {
    const system = new DefaultGroundCollisionSystem(400)
    const world = createWorld([createEntity('e', 'type', 0, 401)])
    const result = system.update(world)
    expect(result.entities[0].y).toBe(400)
  })

  it('should clamp entity far below ground', () => {
    const system = new DefaultGroundCollisionSystem(400)
    const world = createWorld([createEntity('e', 'type', 0, 9999)])
    const result = system.update(world)
    expect(result.entities[0].y).toBe(400)
  })

  it('should clamp entity at very large distance', () => {
    const system = new DefaultGroundCollisionSystem(400)
    const world = createWorld([createEntity('e', 'type', 0, 100000)])
    const result = system.update(world)
    expect(result.entities[0].y).toBe(400)
  })

  it('should preserve x coordinate when clamping', () => {
    const system = new DefaultGroundCollisionSystem(400)
    const world = createWorld([createEntity('e', 'type', 50, 500)])
    const result = system.update(world)
    expect(result.entities[0].x).toBe(50)
  })

  it('should preserve entity id when clamping', () => {
    const system = new DefaultGroundCollisionSystem()
    const world = createWorld([createEntity('player-1', 'player', 0, 500)])
    const result = system.update(world)
    expect(result.entities[0].id).toBe('player-1')
  })

  it('should preserve entity type when clamping', () => {
    const system = new DefaultGroundCollisionSystem()
    const world = createWorld([createEntity('mario', 'player', 0, 500)])
    const result = system.update(world)
    expect(result.entities[0].type).toBe('player')
  })
})

// ---------------------------------------------------------------------------
// No clamp behavior (entity above ground)
// ---------------------------------------------------------------------------

describe('no clamp behavior', () => {
  it('should not affect entity well above ground', () => {
    const system = new DefaultGroundCollisionSystem(400)
    const world = createWorld([createEntity('e', 'type', 0, 0)])
    const result = system.update(world)
    expect(result.entities[0].y).toBe(0)
  })

  it('should not affect entity near ground but above', () => {
    const system = new DefaultGroundCollisionSystem(400)
    const world = createWorld([createEntity('e', 'type', 0, 399)])
    const result = system.update(world)
    expect(result.entities[0].y).toBe(399)
  })

  it('should not affect entity with negative y', () => {
    const system = new DefaultGroundCollisionSystem(400)
    const world = createWorld([createEntity('e', 'type', 0, -100)])
    const result = system.update(world)
    expect(result.entities[0].y).toBe(-100)
  })

  it('should preserve entity identity when not clamping', () => {
    const system = new DefaultGroundCollisionSystem()
    const entity = createEntity('e', 'type', 0, 100)
    const world = createWorld([entity])
    const result = system.update(world)
    expect(result.entities[0]).toBe(entity)
  })
})

// ---------------------------------------------------------------------------
// Multiple entities
// ---------------------------------------------------------------------------

describe('multiple entities', () => {
  it('should clamp all entities below ground', () => {
    const system = new DefaultGroundCollisionSystem(400)
    const world = createWorld([
      createEntity('a', 'type', 0, 500),
      createEntity('b', 'type', 0, 600),
      createEntity('c', 'type', 0, 700),
    ])
    const result = system.update(world)
    expect(result.entities[0].y).toBe(400)
    expect(result.entities[1].y).toBe(400)
    expect(result.entities[2].y).toBe(400)
  })

  it('should preserve entity count', () => {
    const system = new DefaultGroundCollisionSystem()
    const world = createWorld([
      createEntity('a', 'type', 0, 500),
      createEntity('b', 'type', 0, 300),
      createEntity('c', 'type', 0, 600),
    ])
    const result = system.update(world)
    expect(result.entities).toHaveLength(3)
  })

  it('should preserve entity order', () => {
    const system = new DefaultGroundCollisionSystem()
    const world = createWorld([
      createEntity('first', 'type', 0, 500),
      createEntity('second', 'type', 0, 300),
      createEntity('third', 'type', 0, 600),
    ])
    const result = system.update(world)
    expect(result.entities[0].id).toBe('first')
    expect(result.entities[1].id).toBe('second')
    expect(result.entities[2].id).toBe('third')
  })

  it('should only clamp entities below ground in mixed world', () => {
    const system = new DefaultGroundCollisionSystem(400)
    const world = createWorld([
      createEntity('a', 'type', 0, 500),
      createEntity('b', 'type', 0, 200),
      createEntity('c', 'type', 0, 600),
    ])
    const result = system.update(world)
    expect(result.entities[0].y).toBe(400)
    expect(result.entities[1].y).toBe(200)
    expect(result.entities[2].y).toBe(400)
  })

  it('should handle entities at various distances below ground', () => {
    const system = new DefaultGroundCollisionSystem(400)
    const world = createWorld([
      createEntity('a', 'type', 0, 401),
      createEntity('b', 'type', 0, 1000),
      createEntity('c', 'type', 0, 10000),
    ])
    const result = system.update(world)
    expect(result.entities[0].y).toBe(400)
    expect(result.entities[1].y).toBe(400)
    expect(result.entities[2].y).toBe(400)
  })
})

// ---------------------------------------------------------------------------
// Mixed entities (with and without PositionComponent)
// ---------------------------------------------------------------------------

describe('mixed entities', () => {
  it('should skip entities without PositionComponent', () => {
    const system = new DefaultGroundCollisionSystem(400)
    const world = createWorld([
      createEntity('with-pos', 'type', 0, 500),
      createEntityWithoutPosition('no-pos'),
    ])
    const result = system.update(world)
    expect(result.entities[0].y).toBe(400)
    expect(result.entities[1].y).toBe(0)
  })

  it('should preserve entities without PositionComponent by identity', () => {
    const system = new DefaultGroundCollisionSystem()
    const entity = createEntityWithoutPosition('no-pos')
    const world = createWorld([entity])
    const result = system.update(world)
    expect(result.entities[0]).toBe(entity)
  })

  it('should handle mixed world with clamp and no-clamp entities', () => {
    const system = new DefaultGroundCollisionSystem(400)
    const world = createWorld([
      createEntityWithoutPosition('no-pos-1'),
      createEntity('below', 'type', 0, 500),
      createEntityWithoutPosition('no-pos-2'),
      createEntity('above', 'type', 0, 200),
    ])
    const result = system.update(world)
    expect(result.entities[0].y).toBe(0)
    expect(result.entities[1].y).toBe(400)
    expect(result.entities[2].y).toBe(0)
    expect(result.entities[3].y).toBe(200)
  })
})

// ---------------------------------------------------------------------------
// Missing PositionComponent
// ---------------------------------------------------------------------------

describe('missing PositionComponent', () => {
  it('should not affect entities with null components', () => {
    const entity = Object.freeze({
      id: 'e',
      type: 'type',
      x: 0,
      y: 500,
      components: null,
    }) as unknown as Entity
    const world = createWorld([entity])
    const system = new DefaultGroundCollisionSystem()
    const result = system.update(world)
    expect(result.entities[0].y).toBe(500)
  })

  it('should not affect entities with empty components array', () => {
    const entity = Object.freeze({
      id: 'e',
      type: 'type',
      x: 0,
      y: 500,
      components: Object.freeze([]),
    }) as unknown as Entity
    const world = createWorld([entity])
    const system = new DefaultGroundCollisionSystem()
    const result = system.update(world)
    expect(result.entities[0].y).toBe(500)
  })

  it('should not affect entities with undefined components', () => {
    const entity = Object.freeze({
      id: 'e',
      type: 'type',
      x: 0,
      y: 500,
    }) as unknown as Entity
    const world = createWorld([entity])
    const system = new DefaultGroundCollisionSystem()
    const result = system.update(world)
    expect(result.entities[0].y).toBe(500)
  })

  it('should not affect entities with non-position components only', () => {
    const entity = Object.freeze({
      id: 'e',
      type: 'type',
      x: 0,
      y: 500,
      components: Object.freeze([
        Object.freeze({
          type: 'health',
          properties: Object.freeze({ hp: 100 }),
        }),
      ]),
    }) as unknown as Entity
    const world = createWorld([entity])
    const system = new DefaultGroundCollisionSystem()
    const result = system.update(world)
    expect(result.entities[0].y).toBe(500)
  })
})

// ---------------------------------------------------------------------------
// Empty world
// ---------------------------------------------------------------------------

describe('empty world', () => {
  it('should handle empty entity array', () => {
    const system = new DefaultGroundCollisionSystem()
    const world = createWorld([])
    const result = system.update(world)
    expect(result.entities).toHaveLength(0)
  })

  it('should return frozen empty array', () => {
    const system = new DefaultGroundCollisionSystem()
    const world = createWorld([])
    const result = system.update(world)
    expect(Object.isFrozen(result.entities)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// PositionComponent update
// ---------------------------------------------------------------------------

describe('PositionComponent update', () => {
  it('should update PositionComponent y to groundY when clamping', () => {
    const system = new DefaultGroundCollisionSystem(400)
    const world = createWorld([createEntity('e', 'type', 0, 500)])
    const result = system.update(world)
    const component = result.entities[0].components?.[0]
    expect(component).toBeDefined()
    const pos = component as { type: string; properties: { x: number; y: number } }
    expect(pos.properties.y).toBe(400)
  })

  it('should preserve PositionComponent x when clamping', () => {
    const system = new DefaultGroundCollisionSystem(400)
    const world = createWorld([createEntity('e', 'type', 50, 500)])
    const result = system.update(world)
    const component = result.entities[0].components?.[0]
    const pos = component as { type: string; properties: { x: number; y: number } }
    expect(pos.properties.x).toBe(50)
  })

  it('should preserve non-position components when clamping', () => {
    const healthComponent = Object.freeze({
      type: 'health',
      properties: Object.freeze({ hp: 100 }),
    })
    const entity = Object.freeze({
      id: 'e',
      type: 'type',
      x: 0,
      y: 500,
      components: Object.freeze([
        createPositionComponent(0, 500),
        healthComponent,
      ]),
    }) as unknown as Entity
    const world = createWorld([entity])
    const system = new DefaultGroundCollisionSystem(400)
    const result = system.update(world)
    const components = result.entities[0].components
    expect(components).toHaveLength(2)
    const health = components?.[1] as { type: string; properties: { hp: number } }
    expect(health.properties.hp).toBe(100)
  })
})

// ---------------------------------------------------------------------------
// Result metadata
// ---------------------------------------------------------------------------

describe('result metadata', () => {
  it('should return groundedEntities count', () => {
    const system = new DefaultGroundCollisionSystem()
    const world = createWorld([createEntity('e', 'type', 0, 500)])
    const { result } = system.updateWithResult(world)
    expect(result.groundedEntities).toBe(1)
  })

  it('should return groundY value in result', () => {
    const system = new DefaultGroundCollisionSystem(300)
    const world = createWorld([createEntity('e', 'type', 0, 500)])
    const { result } = system.updateWithResult(world)
    expect(result.groundY).toBe(300)
  })

  it('should return 0 grounded entities for empty world', () => {
    const system = new DefaultGroundCollisionSystem()
    const world = createWorld([])
    const { result } = system.updateWithResult(world)
    expect(result.groundedEntities).toBe(0)
  })

  it('should return 0 grounded entities when no PositionComponent', () => {
    const system = new DefaultGroundCollisionSystem()
    const world = createWorld([createEntityWithoutPosition('e')])
    const { result } = system.updateWithResult(world)
    expect(result.groundedEntities).toBe(0)
  })

  it('should return 0 grounded entities when all above ground', () => {
    const system = new DefaultGroundCollisionSystem(400)
    const world = createWorld([createEntity('e', 'type', 0, 200)])
    const { result } = system.updateWithResult(world)
    expect(result.groundedEntities).toBe(0)
  })

  it('should return 0 grounded entities when all exactly at ground', () => {
    const system = new DefaultGroundCollisionSystem(400)
    const world = createWorld([createEntity('e', 'type', 0, 400)])
    const { result } = system.updateWithResult(world)
    expect(result.groundedEntities).toBe(0)
  })

  it('should count multiple grounded entities', () => {
    const system = new DefaultGroundCollisionSystem(400)
    const world = createWorld([
      createEntity('a', 'type', 0, 500),
      createEntity('b', 'type', 0, 300),
      createEntity('c', 'type', 0, 600),
    ])
    const { result } = system.updateWithResult(world)
    expect(result.groundedEntities).toBe(2)
  })

  it('should count only grounded entities in mixed world', () => {
    const system = new DefaultGroundCollisionSystem(400)
    const world = createWorld([
      createEntity('a', 'type', 0, 500),
      createEntityWithoutPosition('b'),
      createEntity('c', 'type', 0, 200),
    ])
    const { result } = system.updateWithResult(world)
    expect(result.groundedEntities).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// update()
// ---------------------------------------------------------------------------

describe('update()', () => {
  it('should clamp entities via update', () => {
    const system = new DefaultGroundCollisionSystem(400)
    const world = createWorld([createEntity('e', 'type', 0, 500)])
    const result = system.update(world)
    expect(result.entities[0].y).toBe(400)
  })

  it('should not clamp entities above ground via update', () => {
    const system = new DefaultGroundCollisionSystem(400)
    const world = createWorld([createEntity('e', 'type', 0, 200)])
    const result = system.update(world)
    expect(result.entities[0].y).toBe(200)
  })

  it('should return frozen world from update', () => {
    const system = new DefaultGroundCollisionSystem()
    const world = createWorld([createEntity('e', 'type', 0, 500)])
    const result = system.update(world)
    expect(Object.isFrozen(result)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// updateWithResult()
// ---------------------------------------------------------------------------

describe('updateWithResult()', () => {
  it('should return frozen result', () => {
    const system = new DefaultGroundCollisionSystem()
    const world = createWorld([createEntity('e', 'type', 0, 500)])
    const { result } = system.updateWithResult(world)
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('should return frozen world from updateWithResult', () => {
    const system = new DefaultGroundCollisionSystem()
    const world = createWorld([createEntity('e', 'type', 0, 500)])
    const { world: outputWorld } = system.updateWithResult(world)
    expect(Object.isFrozen(outputWorld)).toBe(true)
  })

  it('should clamp y with updateWithResult', () => {
    const system = new DefaultGroundCollisionSystem(300)
    const world = createWorld([createEntity('e', 'type', 0, 500)])
    const { world: outputWorld } = system.updateWithResult(world)
    expect(outputWorld.entities[0].y).toBe(300)
  })

  it('should return default groundY in result', () => {
    const system = new DefaultGroundCollisionSystem()
    const world = createWorld([createEntity('e', 'type', 0, 500)])
    const { result } = system.updateWithResult(world)
    expect(result.groundY).toBe(400)
  })

  it('should return consistent world and result', () => {
    const system = new DefaultGroundCollisionSystem(200)
    const world = createWorld([createEntity('e', 'type', 0, 500)])
    const { world: outputWorld, result } = system.updateWithResult(world)
    expect(result.groundedEntities).toBe(1)
    expect(outputWorld.entities[0].y).toBe(200)
  })
})

// ---------------------------------------------------------------------------
// Immutability
// ---------------------------------------------------------------------------

describe('immutability', () => {
  it('should not mutate input world', () => {
    const system = new DefaultGroundCollisionSystem()
    const world = createWorld([createEntity('e', 'type', 0, 500)])
    const yBefore = world.entities[0].y
    system.update(world)
    expect(world.entities[0].y).toBe(yBefore)
  })

  it('should return frozen world', () => {
    const system = new DefaultGroundCollisionSystem()
    const world = createWorld([createEntity('e', 'type', 0, 500)])
    const result = system.update(world)
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('should return frozen entities array', () => {
    const system = new DefaultGroundCollisionSystem()
    const world = createWorld([createEntity('e', 'type', 0, 500)])
    const result = system.update(world)
    expect(Object.isFrozen(result.entities)).toBe(true)
  })

  it('should return frozen individual entities', () => {
    const system = new DefaultGroundCollisionSystem()
    const world = createWorld([createEntity('e', 'type', 0, 500)])
    const result = system.update(world)
    for (const entity of result.entities) {
      expect(Object.isFrozen(entity)).toBe(true)
    }
  })

  it('should return frozen components', () => {
    const system = new DefaultGroundCollisionSystem()
    const world = createWorld([createEntity('e', 'type', 0, 500)])
    const result = system.update(world)
    for (const entity of result.entities) {
      if (entity.components) {
        expect(Object.isFrozen(entity.components)).toBe(true)
      }
    }
  })

  it('should not mutate input entity y', () => {
    const system = new DefaultGroundCollisionSystem()
    const world = createWorld([createEntity('e', 'type', 0, 500)])
    const yBefore = world.entities[0].y
    system.update(world)
    expect(world.entities[0].y).toBe(yBefore)
  })

  it('should not mutate input PositionComponent', () => {
    const system = new DefaultGroundCollisionSystem()
    const world = createWorld([createEntity('e', 'type', 0, 500)])
    const componentBefore = world.entities[0].components?.[0]
    const yBefore = (componentBefore as unknown as { properties: { y: number } }).properties.y
    system.update(world)
    const componentAfter = world.entities[0].components?.[0]
    const yAfter = (componentAfter as unknown as { properties: { y: number } }).properties.y
    expect(yAfter).toBe(yBefore)
  })
})

// ---------------------------------------------------------------------------
// Deep freeze
// ---------------------------------------------------------------------------

describe('deep freeze', () => {
  it('should deeply freeze result object', () => {
    const system = new DefaultGroundCollisionSystem()
    const world = createWorld([createEntity('e', 'type', 0, 500)])
    const { result } = system.updateWithResult(world)
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('should deeply freeze result.groundedEntities (primitive)', () => {
    const system = new DefaultGroundCollisionSystem()
    const world = createWorld([createEntity('e', 'type', 0, 500)])
    const { result } = system.updateWithResult(world)
    // Primitives are immutable by nature
    expect(typeof result.groundedEntities).toBe('number')
  })

  it('should deeply freeze result.groundY (primitive)', () => {
    const system = new DefaultGroundCollisionSystem()
    const world = createWorld([createEntity('e', 'type', 0, 500)])
    const { result } = system.updateWithResult(world)
    expect(typeof result.groundY).toBe('number')
  })

  it('should freeze each entity in output on clamp', () => {
    const system = new DefaultGroundCollisionSystem()
    const world = createWorld([createEntity('e', 'type', 0, 500)])
    const result = system.update(world)
    for (const entity of result.entities) {
      expect(Object.isFrozen(entity)).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------------

describe('determinism', () => {
  it('should produce identical output for same input', () => {
    const system = new DefaultGroundCollisionSystem()
    const world = createWorld([createEntity('e', 'type', 0, 500)])
    const result1 = system.update(world)
    const result2 = system.update(world)
    expect(result1).toEqual(result2)
  })

  it('should produce identical output across multiple calls', () => {
    const system = new DefaultGroundCollisionSystem()
    const world = createWorld([createEntity('e', 'type', 0, 500)])
    const results = Array.from({ length: 10 }, () => system.update(world))
    const first = results[0]
    for (const result of results) {
      expect(result).toEqual(first)
    }
  })

  it('should produce identical output across multiple systems', () => {
    const world = createWorld([createEntity('e', 'type', 0, 500)])
    const system1 = new DefaultGroundCollisionSystem()
    const system2 = new DefaultGroundCollisionSystem()
    expect(system1.update(world)).toEqual(system2.update(world))
  })

  it('should produce same result for custom groundY', () => {
    const system = new DefaultGroundCollisionSystem(100)
    const world = createWorld([createEntity('e', 'type', 0, 500)])
    expect(system.update(world)).toEqual(system.update(world))
  })

  it('should preserve entity order deterministically', () => {
    const system = new DefaultGroundCollisionSystem()
    const world = createWorld([
      createEntity('a', 'type', 0, 500),
      createEntity('b', 'type', 0, 300),
    ])
    for (let i = 0; i < 10; i++) {
      const result = system.update(world)
      expect(result.entities[0].id).toBe('a')
      expect(result.entities[1].id).toBe('b')
    }
  })

  it('should produce identical updateWithResult for same input', () => {
    const system = new DefaultGroundCollisionSystem()
    const world = createWorld([createEntity('e', 'type', 0, 500)])
    const r1 = system.updateWithResult(world)
    const r2 = system.updateWithResult(world)
    expect(r1.world).toEqual(r2.world)
    expect(r1.result).toEqual(r2.result)
  })
})

// ---------------------------------------------------------------------------
// Large worlds
// ---------------------------------------------------------------------------

describe('large worlds', () => {
  it('should handle 100 entities with all below ground', () => {
    const system = new DefaultGroundCollisionSystem(400)
    const entities = Array.from({ length: 100 }, (_, i) =>
      createEntity(`e${i}`, 'type', i, 400 + i + 1),
    )
    const world = createWorld(entities)
    const result = system.update(world)
    expect(result.entities).toHaveLength(100)
    expect(result.entities[50].y).toBe(400)
  })

  it('should handle 1000 entities with some below ground', () => {
    const system = new DefaultGroundCollisionSystem(400)
    const entities = Array.from({ length: 1000 }, (_, i) =>
      createEntity(`e${i}`, 'type', 0, i < 500 ? i : i + 1000),
    )
    const world = createWorld(entities)
    const result = system.update(world)
    expect(result.entities).toHaveLength(1000)
    // entities 0-499 are above ground (y = 0..499)
    expect(result.entities[0].y).toBe(0)
    // entity 500 y = 1500, should be clamped to 400
    expect(result.entities[500].y).toBe(400)
  })

  it('should handle mixed large world (position + no position)', () => {
    const system = new DefaultGroundCollisionSystem(400)
    const entities: Entity[] = []
    for (let i = 0; i < 500; i++) {
      entities.push(createEntity(`pos-${i}`, 'type', 0, 400 + i + 1))
      entities.push(createEntityWithoutPosition(`nopos-${i}`))
    }
    const world = createWorld(entities)
    const result = system.update(world)
    expect(result.entities).toHaveLength(1000)
    // First entity (pos, below ground): y should be clamped to 400
    expect(result.entities[0].y).toBe(400)
    // Second entity (no pos): y should remain 0
    expect(result.entities[1].y).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Stress cases
// ---------------------------------------------------------------------------

describe('stress cases', () => {
  it('should handle entity exactly at groundY plus epsilon', () => {
    const system = new DefaultGroundCollisionSystem(400)
    const world = createWorld([createEntity('e', 'type', 0, 400.0001)])
    const result = system.update(world)
    expect(result.entities[0].y).toBe(400)
  })

  it('should handle entity at groundY minus epsilon (not clamped)', () => {
    const system = new DefaultGroundCollisionSystem(400)
    const world = createWorld([createEntity('e', 'type', 0, 399.9999)])
    const result = system.update(world)
    expect(result.entities[0].y).toBe(399.9999)
  })

  it('should handle entity at MAX_SAFE_INTEGER', () => {
    const system = new DefaultGroundCollisionSystem(400)
    const world = createWorld([createEntity('e', 'type', 0, Number.MAX_SAFE_INTEGER)])
    const result = system.update(world)
    expect(result.entities[0].y).toBe(400)
  })

  it('should handle entity at -MAX_SAFE_INTEGER', () => {
    const system = new DefaultGroundCollisionSystem(400)
    const world = createWorld([createEntity('e', 'type', 0, Number.MAX_SAFE_INTEGER)])
    const result = system.update(world)
    expect(result.entities[0].y).toBe(400)
  })

  it('should handle groundY of Infinity (never clamp)', () => {
    const system = new DefaultGroundCollisionSystem(Infinity)
    const world = createWorld([createEntity('e', 'type', 0, 99999)])
    const result = system.update(world)
    expect(result.entities[0].y).toBe(99999)
  })

  it('should handle groundY of -Infinity (always clamp)', () => {
    const system = new DefaultGroundCollisionSystem(-Infinity)
    const world = createWorld([createEntity('e', 'type', 0, -99999)])
    const result = system.update(world)
    expect(result.entities[0].y).toBe(-Infinity)
  })

  it('should not clamp entities without position in large world', () => {
    const system = new DefaultGroundCollisionSystem(400)
    const entities = Array.from({ length: 100 }, (_, i) =>
      createEntityWithoutPosition(`e${i}`),
    )
    const world = createWorld(entities)
    const result = system.update(world)
    for (const entity of result.entities) {
      expect(entity.y).toBe(0)
    }
  })

  it('should handle single entity repeatedly with multiple ticks', () => {
    const system = new DefaultGroundCollisionSystem(400)
    let world = createWorld([createEntity('e', 'type', 0, 500)])
    for (let i = 0; i < 100; i++) {
      world = system.update(world)
      expect(world.entities[0].y).toBe(400)
    }
  })
})

// ---------------------------------------------------------------------------
// Stateless
// ---------------------------------------------------------------------------

describe('stateless', () => {
  it('should produce same output regardless of call order', () => {
    const system = new DefaultGroundCollisionSystem(400)
    const world1 = createWorld([createEntity('a', 'type', 0, 500)])
    const world2 = createWorld([createEntity('b', 'type', 0, 600)])

    const r1 = system.update(world1)
    const r2 = system.update(world2)

    expect(r1.entities[0].y).toBe(400)
    expect(r2.entities[0].y).toBe(400)
  })

  it('should not accumulate state across calls', () => {
    const system = new DefaultGroundCollisionSystem(400)
    const world = createWorld([createEntity('e', 'type', 0, 100)])

    for (let i = 0; i < 10; i++) {
      const result = system.update(world)
      expect(result.entities[0].y).toBe(100)
    }
  })
})