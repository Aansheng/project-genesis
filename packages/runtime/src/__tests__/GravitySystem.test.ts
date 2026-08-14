/**
 * GravitySystem.test.ts — comprehensive test suite for DefaultGravitySystem.
 *
 * Target: 60+ tests
 * Coverage: construction, single entity, multiple entities, no position,
 *           empty world, gravity override, immutability, determinism,
 *           large worlds, update, updateWithResult
 */
import { describe, it, expect } from 'vitest'
import { DefaultGravitySystem } from '../systems/DefaultGravitySystem'
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
  it('should create a DefaultGravitySystem with default gravity', () => {
    const system = new DefaultGravitySystem()
    expect(system).toBeInstanceOf(DefaultGravitySystem)
  })

  it('should have name "GravitySystem"', () => {
    const system = new DefaultGravitySystem()
    expect(system.name).toBe('GravitySystem')
  })

  it('should implement GravitySystem interface', () => {
    const system = new DefaultGravitySystem()
    expect(typeof system.update).toBe('function')
    expect(typeof system.updateWithResult).toBe('function')
  })

  it('should accept custom gravity value', () => {
    const system = new DefaultGravitySystem(5)
    expect(system).toBeInstanceOf(DefaultGravitySystem)
  })

  it('should accept zero gravity', () => {
    const system = new DefaultGravitySystem(0)
    expect(system).toBeInstanceOf(DefaultGravitySystem)
  })

  it('should accept negative gravity (upward)', () => {
    const system = new DefaultGravitySystem(-1)
    expect(system).toBeInstanceOf(DefaultGravitySystem)
  })

  it('should accept fractional gravity', () => {
    const system = new DefaultGravitySystem(0.5)
    expect(system).toBeInstanceOf(DefaultGravitySystem)
  })
})

// ---------------------------------------------------------------------------
// Single entity
// ---------------------------------------------------------------------------

describe('single entity with position', () => {
  it('should move entity downward by default gravity', () => {
    const system = new DefaultGravitySystem()
    const world = createWorld([createEntity('player', 'player', 10, 10)])
    const result = system.update(world)
    expect(result.entities[0].y).toBe(11)
  })

  it('should move entity downward by custom gravity', () => {
    const system = new DefaultGravitySystem(5)
    const world = createWorld([createEntity('player', 'player', 10, 10)])
    const result = system.update(world)
    expect(result.entities[0].y).toBe(15)
  })

  it('should not change x coordinate', () => {
    const system = new DefaultGravitySystem()
    const world = createWorld([createEntity('player', 'player', 10, 10)])
    const result = system.update(world)
    expect(result.entities[0].x).toBe(10)
  })

  it('should preserve entity id', () => {
    const system = new DefaultGravitySystem()
    const world = createWorld([createEntity('mario', 'player', 0, 0)])
    const result = system.update(world)
    expect(result.entities[0].id).toBe('mario')
  })

  it('should preserve entity type', () => {
    const system = new DefaultGravitySystem()
    const world = createWorld([createEntity('mario', 'player', 0, 0)])
    const result = system.update(world)
    expect(result.entities[0].type).toBe('player')
  })

  it('should work with fractional gravity', () => {
    const system = new DefaultGravitySystem(0.5)
    const world = createWorld([createEntity('entity', 'entity', 0, 0)])
    const result = system.update(world)
    expect(result.entities[0].y).toBe(0.5)
  })

  it('should work with negative gravity (upward)', () => {
    const system = new DefaultGravitySystem(-3)
    const world = createWorld([createEntity('entity', 'entity', 0, 10)])
    const result = system.update(world)
    expect(result.entities[0].y).toBe(7)
  })

  it('should work with zero gravity', () => {
    const system = new DefaultGravitySystem(0)
    const world = createWorld([createEntity('entity', 'entity', 5, 5)])
    const result = system.update(world)
    expect(result.entities[0].y).toBe(5)
  })

  it('should update PositionComponent y value', () => {
    const system = new DefaultGravitySystem()
    const world = createWorld([createEntity('entity', 'entity', 0, 10)])
    const result = system.update(world)
    const component = result.entities[0].components?.[0]
    expect(component).toBeDefined()
    const pos = component as { type: string; properties: { x: number; y: number } }
    expect(pos.properties.y).toBe(11)
  })

  it('should update PositionComponent x value unchanged', () => {
    const system = new DefaultGravitySystem()
    const world = createWorld([createEntity('entity', 'entity', 15, 10)])
    const result = system.update(world)
    const component = result.entities[0].components?.[0]
    const pos = component as { type: string; properties: { x: number; y: number } }
    expect(pos.properties.x).toBe(15)
  })
})

// ---------------------------------------------------------------------------
// Multiple entities
// ---------------------------------------------------------------------------

describe('multiple entities with position', () => {
  it('should move all positioned entities', () => {
    const system = new DefaultGravitySystem(2)
    const world = createWorld([
      createEntity('a', 'type', 0, 0),
      createEntity('b', 'type', 0, 5),
      createEntity('c', 'type', 0, 10),
    ])
    const result = system.update(world)
    expect(result.entities[0].y).toBe(2)
    expect(result.entities[1].y).toBe(7)
    expect(result.entities[2].y).toBe(12)
  })

  it('should preserve entity count', () => {
    const system = new DefaultGravitySystem()
    const world = createWorld([
      createEntity('a', 'type', 0, 0),
      createEntity('b', 'type', 0, 0),
      createEntity('c', 'type', 0, 0),
    ])
    const result = system.update(world)
    expect(result.entities).toHaveLength(3)
  })

  it('should preserve entity order', () => {
    const system = new DefaultGravitySystem()
    const world = createWorld([
      createEntity('first', 'type', 0, 0),
      createEntity('second', 'type', 0, 0),
      createEntity('third', 'type', 0, 0),
    ])
    const result = system.update(world)
    expect(result.entities[0].id).toBe('first')
    expect(result.entities[1].id).toBe('second')
    expect(result.entities[2].id).toBe('third')
  })
})

// ---------------------------------------------------------------------------
// No position component
// ---------------------------------------------------------------------------

describe('entities without position component', () => {
  it('should not affect entities without position', () => {
    const system = new DefaultGravitySystem()
    const world = createWorld([createEntityWithoutPosition('a')])
    const result = system.update(world)
    expect(result.entities[0].y).toBe(0)
  })

  it('should skip entities without position in mixed world', () => {
    const system = new DefaultGravitySystem()
    const world = createWorld([
      createEntity('with-pos', 'type', 0, 0),
      createEntityWithoutPosition('no-pos'),
      createEntity('with-pos-2', 'type', 0, 5),
    ])
    const result = system.update(world)
    expect(result.entities[0].y).toBe(1)
    expect(result.entities[1].y).toBe(0)
    expect(result.entities[2].y).toBe(6)
  })

  it('should preserve entities without position as identity', () => {
    const system = new DefaultGravitySystem()
    const entity = createEntityWithoutPosition('no-pos')
    const world = createWorld([entity])
    const result = system.update(world)
    expect(result.entities[0]).toBe(entity)
  })
})

// ---------------------------------------------------------------------------
// Empty world
// ---------------------------------------------------------------------------

describe('empty world', () => {
  it('should handle empty entity array', () => {
    const system = new DefaultGravitySystem()
    const world = createWorld([])
    const result = system.update(world)
    expect(result.entities).toHaveLength(0)
  })

  it('should return frozen empty array', () => {
    const system = new DefaultGravitySystem()
    const world = createWorld([])
    const result = system.update(world)
    expect(Object.isFrozen(result.entities)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Gravity override
// ---------------------------------------------------------------------------

describe('gravity override', () => {
  it('should use default gravity of 1', () => {
    const system = new DefaultGravitySystem()
    const world = createWorld([createEntity('e', 'type', 0, 0)])
    const result = system.update(world)
    expect(result.entities[0].y).toBe(1)
  })

  it('should use custom gravity of 10', () => {
    const system = new DefaultGravitySystem(10)
    const world = createWorld([createEntity('e', 'type', 0, 0)])
    const result = system.update(world)
    expect(result.entities[0].y).toBe(10)
  })

  it('should use custom gravity of 100', () => {
    const system = new DefaultGravitySystem(100)
    const world = createWorld([createEntity('e', 'type', 0, 0)])
    const result = system.update(world)
    expect(result.entities[0].y).toBe(100)
  })

  it('should use custom gravity of 0 (no effect)', () => {
    const system = new DefaultGravitySystem(0)
    const world = createWorld([createEntity('e', 'type', 0, 5)])
    const result = system.update(world)
    expect(result.entities[0].y).toBe(5)
  })
})

// ---------------------------------------------------------------------------
// Immutability
// ---------------------------------------------------------------------------

describe('immutability', () => {
  it('should not mutate input world', () => {
    const system = new DefaultGravitySystem()
    const world = createWorld([createEntity('e', 'type', 0, 0)])
    const yBefore = world.entities[0].y
    system.update(world)
    expect(world.entities[0].y).toBe(yBefore)
  })

  it('should return frozen world', () => {
    const system = new DefaultGravitySystem()
    const world = createWorld([createEntity('e', 'type', 0, 0)])
    const result = system.update(world)
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('should return frozen entities array', () => {
    const system = new DefaultGravitySystem()
    const world = createWorld([createEntity('e', 'type', 0, 0)])
    const result = system.update(world)
    expect(Object.isFrozen(result.entities)).toBe(true)
  })

  it('should return frozen individual entities', () => {
    const system = new DefaultGravitySystem()
    const world = createWorld([createEntity('e', 'type', 0, 0)])
    const result = system.update(world)
    for (const entity of result.entities) {
      expect(Object.isFrozen(entity)).toBe(true)
    }
  })

  it('should return frozen components', () => {
    const system = new DefaultGravitySystem()
    const world = createWorld([createEntity('e', 'type', 0, 0)])
    const result = system.update(world)
    for (const entity of result.entities) {
      if (entity.components) {
        expect(Object.isFrozen(entity.components)).toBe(true)
      }
    }
  })

  it('should not mutate input entity y', () => {
    const system = new DefaultGravitySystem(5)
    const world = createWorld([createEntity('e', 'type', 0, 10)])
    const yBefore = world.entities[0].y
    system.update(world)
    expect(world.entities[0].y).toBe(yBefore)
  })
})

// ---------------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------------

describe('determinism', () => {
  it('should produce identical output for same input', () => {
    const system = new DefaultGravitySystem()
    const world = createWorld([createEntity('e', 'type', 0, 0)])
    const result1 = system.update(world)
    const result2 = system.update(world)
    expect(result1).toEqual(result2)
  })

  it('should produce identical output across multiple calls', () => {
    const system = new DefaultGravitySystem()
    const world = createWorld([createEntity('e', 'type', 0, 0)])
    const results = Array.from({ length: 10 }, () => system.update(world))
    const first = results[0]
    for (const result of results) {
      expect(result).toEqual(first)
    }
  })

  it('should produce identical output across multiple systems', () => {
    const world = createWorld([createEntity('e', 'type', 0, 0)])
    const system1 = new DefaultGravitySystem()
    const system2 = new DefaultGravitySystem()
    expect(system1.update(world)).toEqual(system2.update(world))
  })

  it('should produce same result for custom gravity', () => {
    const system = new DefaultGravitySystem(5)
    const world = createWorld([createEntity('e', 'type', 0, 0)])
    expect(system.update(world)).toEqual(system.update(world))
  })

  it('should preserve entity order deterministically', () => {
    const system = new DefaultGravitySystem()
    const world = createWorld([
      createEntity('a', 'type', 0, 0),
      createEntity('b', 'type', 0, 5),
    ])
    for (let i = 0; i < 10; i++) {
      const result = system.update(world)
      expect(result.entities[0].id).toBe('a')
      expect(result.entities[1].id).toBe('b')
    }
  })
})

// ---------------------------------------------------------------------------
// Large worlds
// ---------------------------------------------------------------------------

describe('large worlds', () => {
  it('should handle 100 entities with position', () => {
    const system = new DefaultGravitySystem()
    const entities = Array.from({ length: 100 }, (_, i) =>
      createEntity(`e${i}`, 'type', i, i),
    )
    const world = createWorld(entities)
    const result = system.update(world)
    expect(result.entities).toHaveLength(100)
    expect(result.entities[50].y).toBe(51)
  })

  it('should handle 1000 entities with position', () => {
    const system = new DefaultGravitySystem()
    const entities = Array.from({ length: 1000 }, (_, i) =>
      createEntity(`e${i}`, 'type', 0, i),
    )
    const world = createWorld(entities)
    const result = system.update(world)
    expect(result.entities).toHaveLength(1000)
    expect(result.entities[999].y).toBe(1000)
  })

  it('should handle mixed large world (position + no position)', () => {
    const system = new DefaultGravitySystem()
    const entities: Entity[] = []
    for (let i = 0; i < 500; i++) {
      entities.push(createEntity(`pos-${i}`, 'type', 0, i))
      entities.push(createEntityWithoutPosition(`nopos-${i}`))
    }
    const world = createWorld(entities)
    const result = system.update(world)
    expect(result.entities).toHaveLength(1000)
    // First entity (pos): y should be 0+1 = 1
    expect(result.entities[0].y).toBe(1)
    // Second entity (no pos): y should remain 0
    expect(result.entities[1].y).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// updateWithResult
// ---------------------------------------------------------------------------

describe('updateWithResult', () => {
  it('should return affectedEntities count', () => {
    const system = new DefaultGravitySystem()
    const world = createWorld([createEntity('e', 'type', 0, 0)])
    const { result } = system.updateWithResult(world)
    expect(result.affectedEntities).toBe(1)
  })

  it('should return gravity value in result', () => {
    const system = new DefaultGravitySystem(3)
    const world = createWorld([createEntity('e', 'type', 0, 0)])
    const { result } = system.updateWithResult(world)
    expect(result.gravity).toBe(3)
  })

  it('should return 0 affected entities for empty world', () => {
    const system = new DefaultGravitySystem()
    const world = createWorld([])
    const { result } = system.updateWithResult(world)
    expect(result.affectedEntities).toBe(0)
  })

  it('should return 0 affected entities when no position components', () => {
    const system = new DefaultGravitySystem()
    const world = createWorld([createEntityWithoutPosition('e')])
    const { result } = system.updateWithResult(world)
    expect(result.affectedEntities).toBe(0)
  })

  it('should return affectedEntities for multiple positioned entities', () => {
    const system = new DefaultGravitySystem()
    const world = createWorld([
      createEntity('a', 'type', 0, 0),
      createEntity('b', 'type', 0, 0),
      createEntity('c', 'type', 0, 0),
    ])
    const { result } = system.updateWithResult(world)
    expect(result.affectedEntities).toBe(3)
  })

  it('should return affectedEntities for mixed world', () => {
    const system = new DefaultGravitySystem()
    const world = createWorld([
      createEntity('a', 'type', 0, 0),
      createEntityWithoutPosition('b'),
      createEntity('c', 'type', 0, 0),
    ])
    const { result } = system.updateWithResult(world)
    expect(result.affectedEntities).toBe(2)
  })

  it('should return frozen result', () => {
    const system = new DefaultGravitySystem()
    const world = createWorld([createEntity('e', 'type', 0, 0)])
    const { result } = system.updateWithResult(world)
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('should return frozen world from updateWithResult', () => {
    const system = new DefaultGravitySystem()
    const world = createWorld([createEntity('e', 'type', 0, 0)])
    const { world: outputWorld } = system.updateWithResult(world)
    expect(Object.isFrozen(outputWorld)).toBe(true)
  })

  it('should update y with updateWithResult', () => {
    const system = new DefaultGravitySystem(2)
    const world = createWorld([createEntity('e', 'type', 0, 10)])
    const { world: outputWorld } = system.updateWithResult(world)
    expect(outputWorld.entities[0].y).toBe(12)
  })
})

// ---------------------------------------------------------------------------
// Multiple ticks
// ---------------------------------------------------------------------------

describe('multiple ticks', () => {
  it('should accumulate gravity over multiple ticks', () => {
    const system = new DefaultGravitySystem(2)
    let world = createWorld([createEntity('e', 'type', 0, 0)])

    for (let i = 1; i <= 5; i++) {
      world = system.update(world)
      expect(world.entities[0].y).toBe(i * 2)
    }
  })

  it('should accumulate gravity over many ticks', () => {
    const system = new DefaultGravitySystem(1)
    let world = createWorld([createEntity('e', 'type', 0, 0)])

    for (let i = 0; i < 100; i++) {
      world = system.update(world)
    }
    expect(world.entities[0].y).toBe(100)
  })

  it('should accumulate gravity on multiple entities over ticks', () => {
    const system = new DefaultGravitySystem(1)
    let world = createWorld([
      createEntity('a', 'type', 0, 0),
      createEntity('b', 'type', 0, 10),
    ])

    for (let i = 0; i < 5; i++) {
      world = system.update(world)
    }
    expect(world.entities[0].y).toBe(5)
    expect(world.entities[1].y).toBe(15)
  })
})

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('edge cases', () => {
  it('should handle entity with null components', () => {
    const entity = Object.freeze({
      id: 'e',
      type: 'type',
      x: 0,
      y: 0,
      components: null,
    }) as unknown as Entity
    const world = createWorld([entity])
    const system = new DefaultGravitySystem()
    const result = system.update(world)
    expect(result.entities[0].y).toBe(0)
  })

  it('should handle entity with empty components array', () => {
    const entity = Object.freeze({
      id: 'e',
      type: 'type',
      x: 0,
      y: 0,
      components: Object.freeze([]),
    }) as unknown as Entity
    const world = createWorld([entity])
    const system = new DefaultGravitySystem()
    const result = system.update(world)
    expect(result.entities[0].y).toBe(0)
  })

  it('should handle entity with undefined components', () => {
    const entity = Object.freeze({
      id: 'e',
      type: 'type',
      x: 0,
      y: 0,
    }) as unknown as Entity
    const world = createWorld([entity])
    const system = new DefaultGravitySystem()
    const result = system.update(world)
    expect(result.entities[0].y).toBe(0)
  })

  it('should handle very large gravity value', () => {
    const system = new DefaultGravitySystem(10000)
    const world = createWorld([createEntity('e', 'type', 0, 0)])
    const result = system.update(world)
    expect(result.entities[0].y).toBe(10000)
  })

  it('should handle negative starting y', () => {
    const system = new DefaultGravitySystem()
    const world = createWorld([createEntity('e', 'type', 0, -10)])
    const result = system.update(world)
    expect(result.entities[0].y).toBe(-9)
  })
})