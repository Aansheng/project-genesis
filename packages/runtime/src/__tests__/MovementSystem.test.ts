/**
 * MovementSystem — verifies the MovementSystem interface, DefaultMovementSystem
 * implementation, and MovementSystemResult type.
 *
 * WO-S8-012 — Movement System Foundation
 * Architecture version v1.71
 *
 * Coverage:
 * - construction (interface, name, deltaX, deltaY)
 * - single entity with PositionComponent
 * - multiple entities with PositionComponent
 * - entity without PositionComponent
 * - negative movement (delta)
 * - fractional movement (floating point delta)
 * - large worlds (100, 1000 entities)
 * - immutability (frozen outputs, no input mutation)
 * - determinism (same input, multiple runs)
 * - multiple ticks (sequential updates accumulate)
 * - execution loop integration
 * - world mutation integration
 */

import { describe, it, expect } from 'vitest'
import type { World, Entity } from '@genesis/shared'
import { createPositionComponent, isPositionComponent } from '@genesis/shared'
import type { MovementSystem } from '../systems'
import { DefaultMovementSystem } from '../systems'
import { DefaultRuntimeSystemRegistry } from '../system'
import { DefaultRuntimeExecutionLoop } from '../execution'
import { DefaultWorldMutator } from '../mutation'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create an empty World. */
function createEmptyWorld(): World {
  return Object.freeze({ entities: Object.freeze([]) }) as unknown as World
}

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

/** Create a single entity without any PositionComponent. */
function createEntityWithoutPosition(id: string): Entity {
  return Object.freeze({
    id,
    type: 'test',
    x: 0,
    y: 0,
    components: Object.freeze([
      { type: 'health', properties: { current: 100, max: 100 } },
    ]),
  }) as unknown as Entity
}

/** Create a World with a single positioned entity at (x, y). */
function createSingleEntityWorld(
  id: string = 'entity-1',
  x: number = 0,
  y: number = 0,
): World {
  return Object.freeze({
    entities: Object.freeze([createEntityWithPosition(id, x, y)]),
  }) as unknown as World
}

/** Create a populated World with count entities, half with PositionComponent. */
function createPopulatedWorldWithMixedEntities(count: number): World {
  const entities: Entity[] = Array.from({ length: count }, (_, i) => {
    if (i % 2 === 0) {
      return createEntityWithPosition(`pos-entity-${i}`, i, i * 2)
    }
    return createEntityWithoutPosition(`non-pos-entity-${i}`)
  })
  return Object.freeze({ entities: Object.freeze(entities) }) as unknown as World
}

/** Create a World where all entities have PositionComponents. */
function createPopulatedWorldAllPositioned(count: number): World {
  const entities: Entity[] = Array.from({ length: count }, (_, i) =>
    createEntityWithPosition(`entity-${i}`, i, i * 2),
  )
  return Object.freeze({ entities: Object.freeze(entities) }) as unknown as World
}

// ---------------------------------------------------------------------------
// Section 1 — Construction
// ---------------------------------------------------------------------------

describe('construction', () => {
  it('creates DefaultMovementSystem', () => {
    const system = new DefaultMovementSystem(1, 0)
    expect(system).toBeDefined()
  })

  it('implements RuntimeSystem interface', () => {
    const system: MovementSystem = new DefaultMovementSystem(1, 0)
    expect(typeof system.name).toBe('string')
    expect(typeof system.update).toBe('function')
  })

  it('has correct name', () => {
    const system = new DefaultMovementSystem(1, 0)
    expect(system.name).toBe('MovementSystem')
  })

  it('stores deltaX from constructor', () => {
    const system = new DefaultMovementSystem(5, 0)
    const world = createSingleEntityWorld('e1', 0, 0)
    const result = system.update(world)
    expect(result.entities[0].x).toBe(5)
  })

  it('stores deltaY from constructor', () => {
    const system = new DefaultMovementSystem(0, 10)
    const world = createSingleEntityWorld('e1', 0, 0)
    const result = system.update(world)
    expect(result.entities[0].y).toBe(10)
  })

  it('updateWithResult returns World and MovementSystemResult', () => {
    const system = new DefaultMovementSystem(3, 4)
    const world = createSingleEntityWorld('e1', 0, 0)
    const { world: outputWorld, result } = system.updateWithResult(world)
    expect(outputWorld).toBeDefined()
    expect(result).toBeDefined()
    expect(result.movedEntities).toBe(1)
    expect(result.deltaX).toBe(3)
    expect(result.deltaY).toBe(4)
  })
})

// ---------------------------------------------------------------------------
// Section 2 — Single Entity
// ---------------------------------------------------------------------------

describe('single entity', () => {
  it('moves entity by (1, 0)', () => {
    const system = new DefaultMovementSystem(1, 0)
    const world = createSingleEntityWorld('e1', 5, 10)
    const result = system.update(world)
    expect(result.entities[0].x).toBe(6)
    expect(result.entities[0].y).toBe(10)
  })

  it('moves entity by (0, 1)', () => {
    const system = new DefaultMovementSystem(0, 1)
    const world = createSingleEntityWorld('e1', 5, 10)
    const result = system.update(world)
    expect(result.entities[0].x).toBe(5)
    expect(result.entities[0].y).toBe(11)
  })

  it('moves entity by (3, 7)', () => {
    const system = new DefaultMovementSystem(3, 7)
    const world = createSingleEntityWorld('e1', 10, 20)
    const result = system.update(world)
    expect(result.entities[0].x).toBe(13)
    expect(result.entities[0].y).toBe(27)
  })

  it('updates entity id and type are preserved', () => {
    const system = new DefaultMovementSystem(1, 1)
    const world = createSingleEntityWorld('my-entity', 0, 0)
    const result = system.update(world)
    expect(result.entities[0].id).toBe('my-entity')
    expect(result.entities[0].type).toBe('test')
  })

  it('components are preserved after movement', () => {
    const system = new DefaultMovementSystem(1, 1)
    const world = createSingleEntityWorld('e1', 0, 0)
    const result = system.update(world)
    const components = result.entities[0].components
    expect(components).toBeDefined()
    expect(components!.length).toBe(1)
    expect(isPositionComponent(components![0])).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 3 — Multiple Entities
// ---------------------------------------------------------------------------

describe('multiple entities', () => {
  it('moves all entities with PositionComponent', () => {
    const system = new DefaultMovementSystem(1, 2)
    const world = createPopulatedWorldAllPositioned(3)
    const result = system.update(world)
    expect(result.entities[0].x).toBe(1)
    expect(result.entities[0].y).toBe(2)
    expect(result.entities[1].x).toBe(2)
    expect(result.entities[1].y).toBe(4)
    expect(result.entities[2].x).toBe(3)
    expect(result.entities[2].y).toBe(6)
  })

  it('entity order is preserved', () => {
    const system = new DefaultMovementSystem(1, 0)
    const world = createPopulatedWorldAllPositioned(5)
    const result = system.update(world)
    for (let i = 0; i < 5; i++) {
      expect(result.entities[i].id).toBe(`entity-${i}`)
    }
  })

  it('all entities count remains the same', () => {
    const system = new DefaultMovementSystem(1, 0)
    const world = createPopulatedWorldAllPositioned(10)
    const result = system.update(world)
    expect(result.entities.length).toBe(10)
  })
})

// ---------------------------------------------------------------------------
// Section 4 — Entity Without Position
// ---------------------------------------------------------------------------

describe('entity without position', () => {
  it('ignores entity without PositionComponent', () => {
    const system = new DefaultMovementSystem(1, 1)
    const entity = createEntityWithoutPosition('non-pos')
    const world = Object.freeze({
      entities: Object.freeze([entity]),
    }) as unknown as World
    const result = system.update(world)
    expect(result.entities[0].x).toBe(0)
    expect(result.entities[0].y).toBe(0)
  })

  it('moves only entities with PositionComponent in mixed world', () => {
    const system = new DefaultMovementSystem(10, 20)
    const world = createPopulatedWorldWithMixedEntities(4)
    const result = system.update(world)

    // Even-indexed entities have PositionComponent — should move
    expect(result.entities[0].x).toBe(10)
    expect(result.entities[0].y).toBe(20)

    // Odd-indexed entities don't have PositionComponent — should not move
    expect(result.entities[1].x).toBe(0)
    expect(result.entities[1].y).toBe(0)
  })

  it('correctly counts moved entities in mixed world', () => {
    const system = new DefaultMovementSystem(1, 1)
    const world = createPopulatedWorldWithMixedEntities(10)
    const { result } = system.updateWithResult(world)
    // 5 even-indexed entities (0, 2, 4, 6, 8) have PositionComponent
    expect(result.movedEntities).toBe(5)
  })

  it('empty components array is treated as no PositionComponent', () => {
    const entity = Object.freeze({
      id: 'empty-comp',
      type: 'test',
      x: 5,
      y: 10,
      components: Object.freeze([]),
    }) as unknown as Entity
    const world = Object.freeze({
      entities: Object.freeze([entity]),
    }) as unknown as World
    const system = new DefaultMovementSystem(1, 1)
    const result = system.update(world)
    expect(result.entities[0].x).toBe(5)
    expect(result.entities[0].y).toBe(10)
  })

  it('undefined components is treated as no PositionComponent', () => {
    const entity = Object.freeze({
      id: 'no-comp',
      type: 'test',
      x: 5,
      y: 10,
    }) as unknown as Entity
    const world = Object.freeze({
      entities: Object.freeze([entity]),
    }) as unknown as World
    const system = new DefaultMovementSystem(1, 1)
    const result = system.update(world)
    expect(result.entities[0].x).toBe(5)
    expect(result.entities[0].y).toBe(10)
  })
})

// ---------------------------------------------------------------------------
// Section 5 — Negative Movement
// ---------------------------------------------------------------------------

describe('negative movement', () => {
  it('moves entity by (-1, 0)', () => {
    const system = new DefaultMovementSystem(-1, 0)
    const world = createSingleEntityWorld('e1', 10, 10)
    const result = system.update(world)
    expect(result.entities[0].x).toBe(9)
    expect(result.entities[0].y).toBe(10)
  })

  it('moves entity by (0, -1)', () => {
    const system = new DefaultMovementSystem(0, -1)
    const world = createSingleEntityWorld('e1', 10, 10)
    const result = system.update(world)
    expect(result.entities[0].x).toBe(10)
    expect(result.entities[0].y).toBe(9)
  })

  it('moves entity by (-5, -10)', () => {
    const system = new DefaultMovementSystem(-5, -10)
    const world = createSingleEntityWorld('e1', 20, 30)
    const result = system.update(world)
    expect(result.entities[0].x).toBe(15)
    expect(result.entities[0].y).toBe(20)
  })

  it('records negative delta in result', () => {
    const system = new DefaultMovementSystem(-3, -7)
    const world = createSingleEntityWorld('e1', 0, 0)
    const { result } = system.updateWithResult(world)
    expect(result.deltaX).toBe(-3)
    expect(result.deltaY).toBe(-7)
  })
})

// ---------------------------------------------------------------------------
// Section 6 — Fractional Movement
// ---------------------------------------------------------------------------

describe('fractional movement', () => {
  it('moves entity by (0.5, 0.5)', () => {
    const system = new DefaultMovementSystem(0.5, 0.5)
    const world = createSingleEntityWorld('e1', 1, 1)
    const result = system.update(world)
    expect(result.entities[0].x).toBe(1.5)
    expect(result.entities[0].y).toBe(1.5)
  })

  it('moves entity by (1.5, 2.25)', () => {
    const system = new DefaultMovementSystem(1.5, 2.25)
    const world = createSingleEntityWorld('e1', 0, 0)
    const result = system.update(world)
    expect(result.entities[0].x).toBe(1.5)
    expect(result.entities[0].y).toBe(2.25)
  })

  it('moves entity by (-0.1, 0.2)', () => {
    const system = new DefaultMovementSystem(-0.1, 0.2)
    const world = createSingleEntityWorld('e1', 1, 1)
    const result = system.update(world)
    expect(result.entities[0].x).toBe(0.9)
    expect(result.entities[0].y).toBe(1.2)
  })

  it('records fractional delta in result', () => {
    const system = new DefaultMovementSystem(0.5, 1.5)
    const world = createSingleEntityWorld('e1', 0, 0)
    const { result } = system.updateWithResult(world)
    expect(result.deltaX).toBe(0.5)
    expect(result.deltaY).toBe(1.5)
  })
})

// ---------------------------------------------------------------------------
// Section 7 — Large Worlds
// ---------------------------------------------------------------------------

describe('large worlds', () => {
  it('processes 100 entities efficiently', () => {
    const system = new DefaultMovementSystem(1, 1)
    const world = createPopulatedWorldWithMixedEntities(100)
    const result = system.update(world)
    expect(result.entities.length).toBe(100)
  })

  it('processes 1000 entities efficiently', () => {
    const system = new DefaultMovementSystem(1, 1)
    const world = createPopulatedWorldWithMixedEntities(1000)
    const result = system.update(world)
    expect(result.entities.length).toBe(1000)
  })

  it('moves all positioned entities in large world', () => {
    const system = new DefaultMovementSystem(1, 2)
    const world = createPopulatedWorldAllPositioned(100)
    const result = system.update(world)
    for (let i = 0; i < 100; i++) {
      expect(result.entities[i].x).toBe(i + 1)
      expect(result.entities[i].y).toBe(i * 2 + 2)
    }
  })

  it('correctly counts moved entities in large world', () => {
    const system = new DefaultMovementSystem(1, 1)
    const world = createPopulatedWorldWithMixedEntities(100)
    const { result } = system.updateWithResult(world)
    expect(result.movedEntities).toBe(50)
  })
})

// ---------------------------------------------------------------------------
// Section 8 — Immutability
// ---------------------------------------------------------------------------

describe('immutability', () => {
  it('output world is frozen', () => {
    const system = new DefaultMovementSystem(1, 0)
    const world = createSingleEntityWorld('e1', 0, 0)
    const result = system.update(world)
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('output entities array is frozen', () => {
    const system = new DefaultMovementSystem(1, 0)
    const world = createSingleEntityWorld('e1', 0, 0)
    const result = system.update(world)
    expect(Object.isFrozen(result.entities)).toBe(true)
  })

  it('output entity is frozen', () => {
    const system = new DefaultMovementSystem(1, 0)
    const world = createSingleEntityWorld('e1', 0, 0)
    const result = system.update(world)
    expect(Object.isFrozen(result.entities[0])).toBe(true)
  })

  it('input world is never mutated', () => {
    const system = new DefaultMovementSystem(10, 20)
    const world = createSingleEntityWorld('e1', 5, 10)
    const originalX = world.entities[0].x
    const originalY = world.entities[0].y
    system.update(world)
    expect(world.entities[0].x).toBe(originalX)
    expect(world.entities[0].y).toBe(originalY)
  })

  it('result object is frozen', () => {
    const system = new DefaultMovementSystem(1, 1)
    const world = createSingleEntityWorld('e1', 0, 0)
    const { result } = system.updateWithResult(world)
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('nested result fields are readonly', () => {
    const system = new DefaultMovementSystem(1, 1)
    const world = createSingleEntityWorld('e1', 0, 0)
    const { result } = system.updateWithResult(world)
    expect(() => {
      // @ts-expect-error — testing runtime behavior
      result.movedEntities = 999
    }).toThrow()
  })

  it('empty world output is frozen', () => {
    const system = new DefaultMovementSystem(1, 1)
    const world = createEmptyWorld()
    const result = system.update(world)
    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result.entities)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 9 — Determinism
// ---------------------------------------------------------------------------

describe('determinism', () => {
  it('same input produces same output', () => {
    const system = new DefaultMovementSystem(3, 5)
    const world = createSingleEntityWorld('e1', 10, 20)
    const a = system.update(world)
    const b = system.update(world)
    expect(a).toEqual(b)
  })

  it('different system instances with same deltas produce same output', () => {
    const world = createSingleEntityWorld('e1', 10, 20)
    const a = new DefaultMovementSystem(3, 5).update(world)
    const b = new DefaultMovementSystem(3, 5).update(world)
    expect(a).toEqual(b)
  })

  it('same mixed world produces same output on multiple runs', () => {
    const system = new DefaultMovementSystem(1, 1)
    const world = createPopulatedWorldWithMixedEntities(10)
    const a = system.update(world)
    const b = system.update(world)
    expect(a).toEqual(b)
  })

  it('same empty world produces same output on multiple runs', () => {
    const system = new DefaultMovementSystem(1, 1)
    const world = createEmptyWorld()
    const a = system.update(world)
    const b = system.update(world)
    expect(a).toEqual(b)
  })

  it('different deltas produce different output', () => {
    const world = createSingleEntityWorld('e1', 0, 0)
    const a = new DefaultMovementSystem(1, 0).update(world)
    const b = new DefaultMovementSystem(2, 0).update(world)
    expect(a).not.toEqual(b)
  })
})

// ---------------------------------------------------------------------------
// Section 10 — Multiple Ticks
// ---------------------------------------------------------------------------

describe('multiple ticks', () => {
  it('two ticks accumulate movement', () => {
    const system = new DefaultMovementSystem(1, 1)
    const world = createSingleEntityWorld('e1', 0, 0)
    const tick1 = system.update(world)
    const tick2 = system.update(tick1)
    expect(tick2.entities[0].x).toBe(2)
    expect(tick2.entities[0].y).toBe(2)
  })

  it('five ticks accumulate movement correctly', () => {
    const system = new DefaultMovementSystem(2, 3)
    const world = createSingleEntityWorld('e1', 0, 0)
    let current = world
    for (let i = 0; i < 5; i++) {
      current = system.update(current)
    }
    expect(current.entities[0].x).toBe(10)
    expect(current.entities[0].y).toBe(15)
  })

  it('ten ticks accumulate movement correctly', () => {
    const system = new DefaultMovementSystem(1, 1)
    const world = createSingleEntityWorld('e1', 5, 10)
    let current = world
    for (let i = 0; i < 10; i++) {
      current = system.update(current)
    }
    expect(current.entities[0].x).toBe(15)
    expect(current.entities[0].y).toBe(20)
  })

  it('moved entity index content is preserved across ticks', () => {
    const system = new DefaultMovementSystem(1, 1)
    const world = createSingleEntityWorld('e1', 0, 0)
    let current = world
    for (let i = 0; i < 3; i++) {
      current = system.update(current)
    }
    expect(current.entities[0].id).toBe('e1')
    expect(current.entities[0].type).toBe('test')
  })
})

// ---------------------------------------------------------------------------
// Section 11 — Execution Loop Integration
// ---------------------------------------------------------------------------

describe('execution loop integration', () => {
  it('execution loop moves entity via MovementSystem', () => {
    const registry = new DefaultRuntimeSystemRegistry()
    registry.register(new DefaultMovementSystem(5, 10))
    const loop = new DefaultRuntimeExecutionLoop(registry)

    const world = createSingleEntityWorld('e1', 0, 0)
    const result = loop.tick(world)

    expect(result.entities[0].x).toBe(5)
    expect(result.entities[0].y).toBe(10)
  })

  it('execution loop preserves entity without PositionComponent', () => {
    const registry = new DefaultRuntimeSystemRegistry()
    registry.register(new DefaultMovementSystem(5, 10))
    const loop = new DefaultRuntimeExecutionLoop(registry)

    const entity = createEntityWithoutPosition('non-pos')
    const world = Object.freeze({
      entities: Object.freeze([entity]),
    }) as unknown as World
    const result = loop.tick(world)

    expect(result.entities[0].x).toBe(0)
    expect(result.entities[0].y).toBe(0)
  })

  it('execution loop with MovementSystem and other systems', () => {
    const registry = new DefaultRuntimeSystemRegistry()
    registry.register(new DefaultMovementSystem(1, 1))
    const loop = new DefaultRuntimeExecutionLoop(registry)

    const world = createSingleEntityWorld('e1', 0, 0)
    const result = loop.tick(world)

    expect(result.entities[0].x).toBe(1)
    expect(result.entities[0].y).toBe(1)
  })

  it('tickWithResult works with MovementSystem', () => {
    const registry = new DefaultRuntimeSystemRegistry()
    registry.register(new DefaultMovementSystem(3, 7))
    const loop = new DefaultRuntimeExecutionLoop(registry)

    const world = createSingleEntityWorld('e1', 10, 20)
    const { world: outputWorld, executedSystems, systemCount } = loop.tickWithResult(world)

    expect(outputWorld.entities[0].x).toBe(13)
    expect(outputWorld.entities[0].y).toBe(27)
    expect(executedSystems).toContain('MovementSystem')
    expect(systemCount).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// Section 12 — World Mutation Integration
// ---------------------------------------------------------------------------

describe('world mutation integration', () => {
  it('entity added via mutation can be moved by MovementSystem', () => {
    const mutator = new DefaultWorldMutator()
    const system = new DefaultMovementSystem(3, 5)

    // Start empty, add entity
    const emptyWorld = createEmptyWorld()
    const newEntity = createEntityWithPosition('added', 0, 0)
    const worldWithEntity = mutator.addEntity(emptyWorld, newEntity)

    // Move the entity
    const result = system.update(worldWithEntity)
    expect(result.entities[0].x).toBe(3)
    expect(result.entities[0].y).toBe(5)
  })

  it('entity removed via mutation is not moved', () => {
    const mutator = new DefaultWorldMutator()
    const system = new DefaultMovementSystem(1, 1)

    const world = createSingleEntityWorld('to-remove', 0, 0)
    const worldWithoutEntity = mutator.removeEntity(world, 'to-remove')

    const result = system.update(worldWithoutEntity)
    expect(result.entities.length).toBe(0)
  })

  it('entity replaced via mutation with different position then moved', () => {
    const mutator = new DefaultWorldMutator()
    const system = new DefaultMovementSystem(10, 20)

    const world = createSingleEntityWorld('e1', 0, 0)
    const replacement = createEntityWithPosition('e1', 100, 200)
    const worldReplaced = mutator.replaceEntity(world, replacement)

    const result = system.update(worldReplaced)
    expect(result.entities[0].x).toBe(110)
    expect(result.entities[0].y).toBe(220)
  })
})

// ---------------------------------------------------------------------------
// Section 13 — Empty World
// ---------------------------------------------------------------------------

describe('empty world', () => {
  it('empty world returns frozen world with no entities', () => {
    const system = new DefaultMovementSystem(1, 1)
    const world = createEmptyWorld()
    const result = system.update(world)
    expect(result.entities).toEqual([])
  })

  it('empty world result has zero moved entities', () => {
    const system = new DefaultMovementSystem(1, 1)
    const world = createEmptyWorld()
    const { result } = system.updateWithResult(world)
    expect(result.movedEntities).toBe(0)
  })

  it('empty world is no-op across multiple ticks', () => {
    const system = new DefaultMovementSystem(1, 1)
    const world = createEmptyWorld()
    let current = world
    for (let i = 0; i < 10; i++) {
      current = system.update(current)
    }
    expect(current.entities).toEqual([])
  })

  it('empty world output is frozen', () => {
    const system = new DefaultMovementSystem(1, 1)
    const world = createEmptyWorld()
    const result = system.update(world)
    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result.entities)).toBe(true)
  })
})