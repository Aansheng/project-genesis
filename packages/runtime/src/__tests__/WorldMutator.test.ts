/**
 * WorldMutator — verifies the WorldMutator interface, DefaultWorldMutator
 * implementation, and WorldMutationResult type.
 *
 * WO-S8-010 — Runtime World Mutation Foundation
 * Architecture version v1.69
 *
 * Coverage:
 * - construction (interface conformance, method existence)
 * - addEntity (empty world, populated world, multiple entities, entity data)
 * - removeEntity (first, last, middle, all, missing, empty world)
 * - replaceEntity (existing by id, new entity appends, preserve others)
 * - missing entity (removeEntity no-op, replaceEntity appends)
 * - duplicate ids (addEntity allows, removeEntity removes first match)
 * - immutability (frozen output, no input mutation, entity freeze)
 * - determinism (same input, multiple calls)
 * - large worlds (100, 1000 entities, add/remove/replace)
 * - deep freeze (output world, output entities, nested properties)
 * - serialization (JSON round-trip)
 */

import { describe, it, expect } from 'vitest'
import type { World, Entity } from '@genesis/shared'
import type { WorldMutator } from '../mutation'
import { DefaultWorldMutator } from '../mutation'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create an empty World. */
function createEmptyWorld(): World {
  return Object.freeze({ entities: Object.freeze([]) }) as unknown as World
}

/** Create a populated World with count entities. */
function createPopulatedWorld(count: number): World {
  const entities: Entity[] = Array.from({ length: count }, (_, i) =>
    Object.freeze({
      id: `entity-${i}`,
      type: 'test',
      x: i,
      y: i * 2,
    }),
  )
  return Object.freeze({ entities: Object.freeze(entities) }) as unknown as World
}

/** Create a single entity. */
function createEntity(
  id: string,
  type = 'default',
  x = 0,
  y = 0,
): Entity {
  return { id, type, x, y }
}

// ---------------------------------------------------------------------------
// Section 1 — Construction
// ---------------------------------------------------------------------------

describe('construction', () => {
  it('creates a DefaultWorldMutator', () => {
    const mutator = new DefaultWorldMutator()
    expect(mutator).toBeDefined()
  })

  it('implements WorldMutator interface', () => {
    const mutator: WorldMutator = new DefaultWorldMutator()
    expect(typeof mutator.addEntity).toBe('function')
    expect(typeof mutator.removeEntity).toBe('function')
    expect(typeof mutator.replaceEntity).toBe('function')
  })

  it('has no internal state', () => {
    const mutator1 = new DefaultWorldMutator()
    const mutator2 = new DefaultWorldMutator()
    const world = createEmptyWorld()
    const entity = createEntity('test-1')
    const result1 = mutator1.addEntity(world, entity)
    const result2 = mutator2.addEntity(world, entity)
    expect(result1).toEqual(result2)
  })
})

// ---------------------------------------------------------------------------
// Section 2 — addEntity
// ---------------------------------------------------------------------------

describe('addEntity', () => {
  it('adds entity to empty world', () => {
    const mutator: WorldMutator = new DefaultWorldMutator()
    const world = createEmptyWorld()
    const entity = createEntity('hero-1', 'hero', 10, 20)
    const result = mutator.addEntity(world, entity)
    expect(result.entities).toHaveLength(1)
    expect(result.entities[0].id).toBe('hero-1')
    expect(result.entities[0].type).toBe('hero')
    expect(result.entities[0].x).toBe(10)
    expect(result.entities[0].y).toBe(20)
  })

  it('adds entity to populated world', () => {
    const mutator: WorldMutator = new DefaultWorldMutator()
    const world = createPopulatedWorld(3)
    const entity = createEntity('new-entity')
    const result = mutator.addEntity(world, entity)
    expect(result.entities).toHaveLength(4)
  })

  it('adds entity at end of list', () => {
    const mutator: WorldMutator = new DefaultWorldMutator()
    const world = createPopulatedWorld(3)
    const entity = createEntity('last')
    const result = mutator.addEntity(world, entity)
    expect(result.entities[3].id).toBe('last')
  })

  it('adds multiple entities sequentially', () => {
    const mutator: WorldMutator = new DefaultWorldMutator()
    const world = createEmptyWorld()
    const result1 = mutator.addEntity(world, createEntity('a'))
    const result2 = mutator.addEntity(result1, createEntity('b'))
    const result3 = mutator.addEntity(result2, createEntity('c'))
    expect(result1.entities).toHaveLength(1)
    expect(result2.entities).toHaveLength(2)
    expect(result3.entities).toHaveLength(3)
    expect(result3.entities[0].id).toBe('a')
    expect(result3.entities[1].id).toBe('b')
    expect(result3.entities[2].id).toBe('c')
  })

  it('preserves existing entity data when adding', () => {
    const mutator: WorldMutator = new DefaultWorldMutator()
    const world = createPopulatedWorld(2)
    const entity = createEntity('extra')
    const result = mutator.addEntity(world, entity)
    expect(result.entities[0].id).toBe('entity-0')
    expect(result.entities[1].id).toBe('entity-1')
    expect(result.entities[2].id).toBe('extra')
  })

  it('adds entity with components preserved', () => {
    const mutator: WorldMutator = new DefaultWorldMutator()
    const world = createEmptyWorld()
    const entity: Entity = {
      id: 'with-components',
      type: 'complex',
      x: 5,
      y: 10,
      components: [
        Object.freeze({ type: 'Position', properties: { x: 5, y: 10 } }),
      ],
    }
    const result = mutator.addEntity(world, entity)
    expect(result.entities[0].components).toHaveLength(1)
    expect(result.entities[0].components![0].type).toBe('Position')
  })
})

// ---------------------------------------------------------------------------
// Section 3 — removeEntity
// ---------------------------------------------------------------------------

describe('removeEntity', () => {
  it('removes entity by id from populated world', () => {
    const mutator: WorldMutator = new DefaultWorldMutator()
    const world = createPopulatedWorld(3)
    const result = mutator.removeEntity(world, 'entity-1')
    expect(result.entities).toHaveLength(2)
  })

  it('removes the correct entity', () => {
    const mutator: WorldMutator = new DefaultWorldMutator()
    const world = createPopulatedWorld(3)
    const result = mutator.removeEntity(world, 'entity-1')
    expect(result.entities.find((e) => e.id === 'entity-1')).toBeUndefined()
  })

  it('removes first entity', () => {
    const mutator: WorldMutator = new DefaultWorldMutator()
    const world = createPopulatedWorld(3)
    const result = mutator.removeEntity(world, 'entity-0')
    expect(result.entities).toHaveLength(2)
    expect(result.entities[0].id).toBe('entity-1')
  })

  it('removes last entity', () => {
    const mutator: WorldMutator = new DefaultWorldMutator()
    const world = createPopulatedWorld(3)
    const result = mutator.removeEntity(world, 'entity-2')
    expect(result.entities).toHaveLength(2)
    expect(result.entities[1].id).toBe('entity-1')
  })

  it('removes all entities one by one', () => {
    const mutator: WorldMutator = new DefaultWorldMutator()
    let world = createPopulatedWorld(3)
    world = mutator.removeEntity(world, 'entity-0')
    world = mutator.removeEntity(world, 'entity-1')
    world = mutator.removeEntity(world, 'entity-2')
    expect(world.entities).toHaveLength(0)
  })

  it('returns world unchanged when entity id not found', () => {
    const mutator: WorldMutator = new DefaultWorldMutator()
    const world = createPopulatedWorld(3)
    const result = mutator.removeEntity(world, 'non-existent')
    expect(result.entities).toHaveLength(3)
  })

  it('removes from empty world returns empty world', () => {
    const mutator: WorldMutator = new DefaultWorldMutator()
    const world = createEmptyWorld()
    const result = mutator.removeEntity(world, 'anything')
    expect(result.entities).toHaveLength(0)
  })

  it('preserves order of remaining entities', () => {
    const mutator: WorldMutator = new DefaultWorldMutator()
    const world = createPopulatedWorld(5)
    const result = mutator.removeEntity(world, 'entity-2')
    expect(result.entities[0].id).toBe('entity-0')
    expect(result.entities[1].id).toBe('entity-1')
    expect(result.entities[2].id).toBe('entity-3')
    expect(result.entities[3].id).toBe('entity-4')
  })
})

// ---------------------------------------------------------------------------
// Section 4 — replaceEntity
// ---------------------------------------------------------------------------

describe('replaceEntity', () => {
  it('replaces entity with matching id', () => {
    const mutator: WorldMutator = new DefaultWorldMutator()
    const world = createPopulatedWorld(3)
    const replacement = createEntity('entity-1', 'replaced', 99, 99)
    const result = mutator.replaceEntity(world, replacement)
    expect(result.entities).toHaveLength(3)
    expect(result.entities[1].id).toBe('entity-1')
    expect(result.entities[1].type).toBe('replaced')
    expect(result.entities[1].x).toBe(99)
    expect(result.entities[1].y).toBe(99)
  })

  it('appends entity when id does not exist', () => {
    const mutator: WorldMutator = new DefaultWorldMutator()
    const world = createPopulatedWorld(3)
    const entity = createEntity('new-entity', 'new', 50, 50)
    const result = mutator.replaceEntity(world, entity)
    expect(result.entities).toHaveLength(4)
    expect(result.entities[3].id).toBe('new-entity')
  })

  it('preserves other entities when replacing', () => {
    const mutator: WorldMutator = new DefaultWorldMutator()
    const world = createPopulatedWorld(3)
    const replacement = createEntity('entity-1', 'updated')
    const result = mutator.replaceEntity(world, replacement)
    expect(result.entities[0].id).toBe('entity-0')
    expect(result.entities[2].id).toBe('entity-2')
  })

  it('replaces first entity', () => {
    const mutator: WorldMutator = new DefaultWorldMutator()
    const world = createPopulatedWorld(3)
    const replacement = createEntity('entity-0', 'first-updated')
    const result = mutator.replaceEntity(world, replacement)
    expect(result.entities[0].type).toBe('first-updated')
  })

  it('replaces last entity', () => {
    const mutator: WorldMutator = new DefaultWorldMutator()
    const world = createPopulatedWorld(3)
    const replacement = createEntity('entity-2', 'last-updated')
    const result = mutator.replaceEntity(world, replacement)
    expect(result.entities[2].type).toBe('last-updated')
  })

  it('replaces entity in single-entity world', () => {
    const mutator: WorldMutator = new DefaultWorldMutator()
    const world = createPopulatedWorld(1)
    const replacement = createEntity('entity-0', 'solo-updated')
    const result = mutator.replaceEntity(world, replacement)
    expect(result.entities).toHaveLength(1)
    expect(result.entities[0].type).toBe('solo-updated')
  })

  it('replaces entity with components', () => {
    const mutator: WorldMutator = new DefaultWorldMutator()
    const world = createPopulatedWorld(3)
    const replacement: Entity = {
      id: 'entity-1',
      type: 'with-components',
      x: 0,
      y: 0,
      components: [
        Object.freeze({ type: 'Health', properties: { value: 100 } }),
      ],
    }
    const result = mutator.replaceEntity(world, replacement)
    expect(result.entities[1].components).toHaveLength(1)
    expect(result.entities[1].components![0].type).toBe('Health')
  })
})

// ---------------------------------------------------------------------------
// Section 5 — Missing Entity
// ---------------------------------------------------------------------------

describe('missing entity', () => {
  it('removeEntity with non-existent id returns world unchanged', () => {
    const mutator: WorldMutator = new DefaultWorldMutator()
    const world = createPopulatedWorld(3)
    const result = mutator.removeEntity(world, 'ghost')
    expect(result.entities).toHaveLength(3)
  })

  it('removeEntity with non-existent id preserves all ids', () => {
    const mutator: WorldMutator = new DefaultWorldMutator()
    const world = createPopulatedWorld(3)
    const result = mutator.removeEntity(world, 'ghost')
    const ids = result.entities.map((e) => e.id)
    expect(ids).toEqual(['entity-0', 'entity-1', 'entity-2'])
  })

  it('replaceEntity with new id appends entity', () => {
    const mutator: WorldMutator = new DefaultWorldMutator()
    const world = createPopulatedWorld(3)
    const entity = createEntity('brand-new')
    const result = mutator.replaceEntity(world, entity)
    expect(result.entities).toHaveLength(4)
    expect(result.entities[3].id).toBe('brand-new')
  })

  it('replaceEntity appends to empty world', () => {
    const mutator: WorldMutator = new DefaultWorldMutator()
    const world = createEmptyWorld()
    const entity = createEntity('first')
    const result = mutator.replaceEntity(world, entity)
    expect(result.entities).toHaveLength(1)
    expect(result.entities[0].id).toBe('first')
  })
})

// ---------------------------------------------------------------------------
// Section 6 — Duplicate IDs
// ---------------------------------------------------------------------------

describe('duplicate ids', () => {
  it('addEntity allows duplicate ids', () => {
    const mutator: WorldMutator = new DefaultWorldMutator()
    const world = createEmptyWorld()
    const entity1 = createEntity('dupe', 'first')
    const entity2 = createEntity('dupe', 'second')
    const afterFirst = mutator.addEntity(world, entity1)
    const afterSecond = mutator.addEntity(afterFirst, entity2)
    expect(afterSecond.entities).toHaveLength(2)
    expect(afterSecond.entities[0].type).toBe('first')
    expect(afterSecond.entities[1].type).toBe('second')
  })

  it('removeEntity removes all entities with matching id', () => {
    const mutator: WorldMutator = new DefaultWorldMutator()
    const world = createEmptyWorld()
    const afterAdd = mutator.addEntity(world, createEntity('dupe'))
    const withDupe = mutator.addEntity(afterAdd, createEntity('dupe'))
    const result = mutator.removeEntity(withDupe, 'dupe')
    expect(result.entities).toHaveLength(0)
  })

  it('replaceEntity replaces first occurrence of id', () => {
    const mutator: WorldMutator = new DefaultWorldMutator()
    let world = createEmptyWorld()
    world = mutator.addEntity(world, createEntity('dupe', 'original'))
    world = mutator.addEntity(world, createEntity('dupe', 'also-original'))
    const replacement = createEntity('dupe', 'replaced')
    const result = mutator.replaceEntity(world, replacement)
    // First match is replaced, second remains
    expect(result.entities).toHaveLength(2)
    expect(result.entities[0].type).toBe('replaced')
    expect(result.entities[1].type).toBe('also-original')
  })
})

// ---------------------------------------------------------------------------
// Section 7 — Immutability
// ---------------------------------------------------------------------------

describe('immutability', () => {
  it('addEntity returns frozen world', () => {
    const mutator: WorldMutator = new DefaultWorldMutator()
    const world = createEmptyWorld()
    const entity = createEntity('test')
    const result = mutator.addEntity(world, entity)
    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result.entities)).toBe(true)
  })

  it('removeEntity returns frozen world', () => {
    const mutator: WorldMutator = new DefaultWorldMutator()
    const world = createPopulatedWorld(3)
    const result = mutator.removeEntity(world, 'entity-0')
    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result.entities)).toBe(true)
  })

  it('replaceEntity returns frozen world', () => {
    const mutator: WorldMutator = new DefaultWorldMutator()
    const world = createPopulatedWorld(3)
    const result = mutator.replaceEntity(world, createEntity('entity-0'))
    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result.entities)).toBe(true)
  })

  it('addEntity does not mutate input world', () => {
    const mutator: WorldMutator = new DefaultWorldMutator()
    const world = createPopulatedWorld(3)
    const originalLength = world.entities.length
    mutator.addEntity(world, createEntity('new'))
    expect(world.entities.length).toBe(originalLength)
  })

  it('removeEntity does not mutate input world', () => {
    const mutator: WorldMutator = new DefaultWorldMutator()
    const world = createPopulatedWorld(3)
    const originalIds = world.entities.map((e) => e.id)
    mutator.removeEntity(world, 'entity-1')
    expect(world.entities.map((e) => e.id)).toEqual(originalIds)
  })

  it('replaceEntity does not mutate input world', () => {
    const mutator: WorldMutator = new DefaultWorldMutator()
    const world = createPopulatedWorld(3)
    const originalType = world.entities[1].type
    mutator.replaceEntity(world, createEntity('entity-1', 'new-type'))
    expect(world.entities[1].type).toBe(originalType)
  })

  it('addEntity freezes the added entity', () => {
    const mutator: WorldMutator = new DefaultWorldMutator()
    const world = createEmptyWorld()
    const entity = createEntity('test')
    const result = mutator.addEntity(world, entity)
    expect(Object.isFrozen(result.entities[0])).toBe(true)
  })

  it('replaceEntity freezes the replacement entity', () => {
    const mutator: WorldMutator = new DefaultWorldMutator()
    const world = createPopulatedWorld(3)
    const result = mutator.replaceEntity(world, createEntity('entity-1'))
    expect(Object.isFrozen(result.entities[1])).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 8 — Determinism
// ---------------------------------------------------------------------------

describe('determinism', () => {
  it('addEntity produces same output for same input', () => {
    const mutator: WorldMutator = new DefaultWorldMutator()
    const world = createEmptyWorld()
    const entity = createEntity('hero', 'warrior', 10, 20)
    const result1 = mutator.addEntity(world, entity)
    const result2 = mutator.addEntity(world, entity)
    expect(result1).toEqual(result2)
  })

  it('removeEntity produces same output for same input', () => {
    const mutator: WorldMutator = new DefaultWorldMutator()
    const world = createPopulatedWorld(3)
    const result1 = mutator.removeEntity(world, 'entity-1')
    const result2 = mutator.removeEntity(world, 'entity-1')
    expect(result1).toEqual(result2)
  })

  it('replaceEntity produces same output for same input', () => {
    const mutator: WorldMutator = new DefaultWorldMutator()
    const world = createPopulatedWorld(3)
    const replacement = createEntity('entity-1', 'updated')
    const result1 = mutator.replaceEntity(world, replacement)
    const result2 = mutator.replaceEntity(world, replacement)
    expect(result1).toEqual(result2)
  })

  it('deterministic across mutator instances', () => {
    const entity = createEntity('hero', 'warrior', 10, 20)
    const run = (): World => {
      const m: WorldMutator = new DefaultWorldMutator()
      return m.addEntity(createEmptyWorld(), entity)
    }
    expect(run()).toEqual(run())
  })

  it('removeEntity non-existent is deterministic', () => {
    const mutator: WorldMutator = new DefaultWorldMutator()
    const world = createPopulatedWorld(3)
    const result1 = mutator.removeEntity(world, 'ghost')
    const result2 = mutator.removeEntity(world, 'ghost')
    expect(result1).toEqual(result2)
  })
})

// ---------------------------------------------------------------------------
// Section 9 — Large Worlds
// ---------------------------------------------------------------------------

describe('large worlds', () => {
  it('adds entity to world with 100 entities', () => {
    const mutator: WorldMutator = new DefaultWorldMutator()
    const world = createPopulatedWorld(100)
    const entity = createEntity('extra')
    const result = mutator.addEntity(world, entity)
    expect(result.entities).toHaveLength(101)
  })

  it('adds entity to world with 1000 entities', () => {
    const mutator: WorldMutator = new DefaultWorldMutator()
    const world = createPopulatedWorld(1000)
    const entity = createEntity('extra')
    const result = mutator.addEntity(world, entity)
    expect(result.entities).toHaveLength(1001)
  })

  it('removes entity from world with 100 entities', () => {
    const mutator: WorldMutator = new DefaultWorldMutator()
    const world = createPopulatedWorld(100)
    const result = mutator.removeEntity(world, 'entity-50')
    expect(result.entities).toHaveLength(99)
  })

  it('removes entity from world with 1000 entities', () => {
    const mutator: WorldMutator = new DefaultWorldMutator()
    const world = createPopulatedWorld(1000)
    const result = mutator.removeEntity(world, 'entity-500')
    expect(result.entities).toHaveLength(999)
  })

  it('replaces entity in world with 1000 entities', () => {
    const mutator: WorldMutator = new DefaultWorldMutator()
    const world = createPopulatedWorld(1000)
    const replacement = createEntity('entity-500', 'replaced', 99, 99)
    const result = mutator.replaceEntity(world, replacement)
    expect(result.entities).toHaveLength(1000)
    expect(result.entities[500].type).toBe('replaced')
  })
})

// ---------------------------------------------------------------------------
// Section 10 — Deep Freeze
// ---------------------------------------------------------------------------

describe('deep freeze', () => {
  it('output world entities are frozen', () => {
    const mutator: WorldMutator = new DefaultWorldMutator()
    const world = createEmptyWorld()
    const result = mutator.addEntity(world, createEntity('test'))
    expect(Object.isFrozen(result.entities[0])).toBe(true)
  })

  it('frozen entity cannot be mutated', () => {
    const mutator: WorldMutator = new DefaultWorldMutator()
    const world = createEmptyWorld()
    const result = mutator.addEntity(world, createEntity('test'))
    expect(() => {
      const entity: Record<string, unknown> = result.entities[0] as unknown as Record<string, unknown>
      entity.x = 999
    }).toThrow()
  })

  it('frozen entities array cannot be mutated', () => {
    const mutator: WorldMutator = new DefaultWorldMutator()
    const world = createEmptyWorld()
    const result = mutator.addEntity(world, createEntity('test'))
    expect(() => {
      const arr: unknown[] = result.entities as unknown as unknown[]
      arr.push({})
    }).toThrow()
  })

  it('removeEntity on empty result is frozen', () => {
    const mutator: WorldMutator = new DefaultWorldMutator()
    const world = createEmptyWorld()
    const result = mutator.removeEntity(world, 'nothing')
    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result.entities)).toBe(true)
  })

  it('replaceEntity appending to empty world is frozen', () => {
    const mutator: WorldMutator = new DefaultWorldMutator()
    const world = createEmptyWorld()
    const result = mutator.replaceEntity(world, createEntity('first'))
    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result.entities)).toBe(true)
    expect(Object.isFrozen(result.entities[0])).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 11 — Serialization
// ---------------------------------------------------------------------------

describe('serialization', () => {
  it('addEntity result serializes to JSON', () => {
    const mutator: WorldMutator = new DefaultWorldMutator()
    const world = createEmptyWorld()
    const result = mutator.addEntity(world, createEntity('hero', 'warrior', 5, 10))
    const json = JSON.stringify(result)
    const parsed = JSON.parse(json) as World
    expect(parsed.entities).toHaveLength(1)
    expect(parsed.entities[0].id).toBe('hero')
    expect(parsed.entities[0].type).toBe('warrior')
    expect(parsed.entities[0].x).toBe(5)
    expect(parsed.entities[0].y).toBe(10)
  })

  it('removeEntity result serializes to JSON', () => {
    const mutator: WorldMutator = new DefaultWorldMutator()
    const world = createPopulatedWorld(3)
    const result = mutator.removeEntity(world, 'entity-1')
    const json = JSON.stringify(result)
    const parsed = JSON.parse(json) as World
    expect(parsed.entities).toHaveLength(2)
    expect(parsed.entities[0].id).toBe('entity-0')
    expect(parsed.entities[1].id).toBe('entity-2')
  })

  it('replaceEntity result serializes to JSON', () => {
    const mutator: WorldMutator = new DefaultWorldMutator()
    const world = createPopulatedWorld(3)
    const result = mutator.replaceEntity(world, createEntity('entity-1', 'new-type'))
    const json = JSON.stringify(result)
    const parsed = JSON.parse(json) as World
    expect(parsed.entities[1].type).toBe('new-type')
  })

  it('world with components serializes correctly', () => {
    const mutator: WorldMutator = new DefaultWorldMutator()
    const world = createEmptyWorld()
    const entity: Entity = {
      id: 'complex',
      type: 'npc',
      x: 0,
      y: 0,
      components: [
        Object.freeze({ type: 'Health', properties: { value: 100, max: 100 } }),
      ],
    }
    const result = mutator.addEntity(world, entity)
    const json = JSON.stringify(result)
    const parsed = JSON.parse(json) as World
    expect(parsed.entities[0].components).toHaveLength(1)
    expect(parsed.entities[0].components![0].type).toBe('Health')
    expect(parsed.entities[0].components![0].properties.value).toBe(100)
  })

  it('empty world serializes', () => {
    const mutator: WorldMutator = new DefaultWorldMutator()
    const world = createEmptyWorld()
    const result = mutator.removeEntity(world, 'nothing')
    const json = JSON.stringify(result)
    const parsed = JSON.parse(json) as World
    expect(parsed.entities).toHaveLength(0)
  })
})