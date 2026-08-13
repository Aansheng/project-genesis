/**
 * RuntimeProjection — verifies the DefaultRuntimeProjection implementation
 * for converting GameDsl → Runtime world representation.
 *
 * WO-S8-003 — Game DSL Runtime Projection Foundation
 * Architecture version v1.62
 */

import { describe, it, expect } from 'vitest'
import { DefaultRuntimeProjection } from '../projection'
import type { RuntimeProjection } from '../projection'
import type { GameDsl, EntityDsl, ComponentDsl } from '@genesis/shared'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createProjection(): RuntimeProjection {
  return new DefaultRuntimeProjection()
}

/** Create a minimal GameDsl with a single entity and no components. */
function createMinimalDsl(): GameDsl {
  return {
    world: {
      name: 'Test World',
      entities: [
        {
          id: 'entity-1',
          type: 'guard',
          components: [],
        },
      ],
    },
  }
}

/** Create a GameDsl with multiple entities and components. */
function createFullDsl(): GameDsl {
  return {
    world: {
      name: 'Full World',
      entities: [
        {
          id: 'guard-001',
          type: 'guard',
          components: [
            { type: 'Position', properties: { x: 10, y: 5 } },
            { type: 'Health', properties: { value: 100 } },
          ],
        },
        {
          id: 'villager-001',
          type: 'villager',
          components: [
            { type: 'Position', properties: { x: 3, y: 8 } },
            { type: 'Inventory', properties: { items: ['bread', 'water'] } },
          ],
        },
        {
          id: 'tree-001',
          type: 'tree',
          components: [
            { type: 'Position', properties: { x: 7, y: 12 } },
          ],
        },
      ],
    },
  }
}

/** Create an empty GameDsl with no entities. */
function createEmptyWorldDsl(): GameDsl {
  return {
    world: {
      name: 'Empty World',
      entities: [],
    },
  }
}

/** Create a GameDsl with entities that have no components. */
function createEntityNoComponentsDsl(): GameDsl {
  return {
    world: {
      name: 'No Components',
      entities: [
        { id: 'e1', type: 'observer', components: [] },
        { id: 'e2', type: 'marker', components: [] },
      ],
    },
  }
}

/** Create a GameDsl with a single entity with many components. */
function createSingleEntityManyComponentsDsl(): GameDsl {
  const components: ComponentDsl[] = Array.from({ length: 10 }, (_, i) => ({
    type: `component-${i}`,
    properties: { index: i },
  }))

  return {
    world: {
      name: 'Many Components',
      entities: [
        { id: 'rich-entity', type: 'rich', components },
      ],
    },
  }
}

// ---------------------------------------------------------------------------
// Section 1 — Construction
// ---------------------------------------------------------------------------

describe('construction', () => {
  it('creates projection without error', () => {
    const projection = createProjection()
    expect(projection).toBeDefined()
  })

  it('projection implements RuntimeProjection interface', () => {
    const projection = createProjection()
    expect(typeof projection.project).toBe('function')
  })

  it('project method accepts GameDsl', () => {
    const projection = createProjection()
    const result = projection.project(createMinimalDsl())
    expect(result).toBeDefined()
  })

  it('project method returns RuntimeProjectionResult', () => {
    const result = createProjection().project(createMinimalDsl())
    expect(typeof result).toBe('object')
    expect(result).not.toBeNull()
    expect(result).toHaveProperty('world')
    expect(result).toHaveProperty('entityCount')
    expect(result).toHaveProperty('componentCount')
  })

  it('project method returns result with World', () => {
    const result = createProjection().project(createMinimalDsl())
    expect(result.world).toBeDefined()
    expect(Array.isArray(result.world.entities)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 2 — Empty World
// ---------------------------------------------------------------------------

describe('empty world', () => {
  it('empty entities array produces zero entities', () => {
    const result = createProjection().project(createEmptyWorldDsl())
    expect(result.world.entities.length).toBe(0)
  })

  it('empty entities array produces entityCount of 0', () => {
    const result = createProjection().project(createEmptyWorldDsl())
    expect(result.entityCount).toBe(0)
  })

  it('empty entities array produces componentCount of 0', () => {
    const result = createProjection().project(createEmptyWorldDsl())
    expect(result.componentCount).toBe(0)
  })

  it('undefined DSL produces empty result', () => {
    const result = createProjection().project(undefined as unknown as GameDsl)
    expect(result.world.entities).toEqual([])
    expect(result.entityCount).toBe(0)
    expect(result.componentCount).toBe(0)
  })

  it('null DSL produces empty result', () => {
    const result = createProjection().project(null as unknown as GameDsl)
    expect(result.world.entities).toEqual([])
    expect(result.entityCount).toBe(0)
    expect(result.componentCount).toBe(0)
  })

  it('non-object DSL produces empty result', () => {
    const result = createProjection().project('invalid' as unknown as GameDsl)
    expect(result.world.entities).toEqual([])
    expect(result.entityCount).toBe(0)
    expect(result.componentCount).toBe(0)
  })

  it('array DSL produces empty result', () => {
    const result = createProjection().project([] as unknown as GameDsl)
    expect(result.world.entities).toEqual([])
    expect(result.entityCount).toBe(0)
    expect(result.componentCount).toBe(0)
  })

  it('DSL with null world produces empty result', () => {
    const result = createProjection().project({ world: null } as unknown as GameDsl)
    expect(result.world.entities).toEqual([])
    expect(result.entityCount).toBe(0)
  })

  it('DSL with undefined world produces empty result', () => {
    const result = createProjection().project({} as GameDsl)
    expect(result.world.entities).toEqual([])
    expect(result.entityCount).toBe(0)
  })

  it('DSL with non-object world produces empty result', () => {
    const result = createProjection().project({ world: 'invalid' } as unknown as GameDsl)
    expect(result.world.entities).toEqual([])
    expect(result.entityCount).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Section 3 — Single Entity
// ---------------------------------------------------------------------------

describe('single entity', () => {
  it('projects one entity into world', () => {
    const result = createProjection().project(createMinimalDsl())
    expect(result.world.entities.length).toBe(1)
  })

  it('entity id is preserved', () => {
    const result = createProjection().project(createMinimalDsl())
    expect(result.world.entities[0].id).toBe('entity-1')
  })

  it('entity type is preserved', () => {
    const result = createProjection().project(createMinimalDsl())
    expect(result.world.entities[0].type).toBe('guard')
  })

  it('entity x defaults to 0', () => {
    const result = createProjection().project(createMinimalDsl())
    expect(result.world.entities[0].x).toBe(0)
  })

  it('entity y defaults to 0', () => {
    const result = createProjection().project(createMinimalDsl())
    expect(result.world.entities[0].y).toBe(0)
  })

  it('entityCount is 1', () => {
    const result = createProjection().project(createMinimalDsl())
    expect(result.entityCount).toBe(1)
  })

  it('componentCount is 0 for entity without components', () => {
    const result = createProjection().project(createMinimalDsl())
    expect(result.componentCount).toBe(0)
  })

  it('entity with null id produces empty string id', () => {
    const result = createProjection().project({
      world: { name: 'test', entities: [{ id: null as unknown as string, type: 'test', components: [] }] },
    })
    expect(result.world.entities[0].id).toBe('')
  })

  it('entity with null type produces empty string type', () => {
    const result = createProjection().project({
      world: { name: 'test', entities: [{ id: 'e1', type: null as unknown as string, components: [] }] },
    })
    expect(result.world.entities[0].type).toBe('')
  })

  it('non-object entity is skipped', () => {
    const result = createProjection().project({
      world: { name: 'test', entities: [null as unknown as EntityDsl] },
    })
    expect(result.entityCount).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Section 4 — Multiple Entities
// ---------------------------------------------------------------------------

describe('multiple entities', () => {
  it('projects 3 entities into world', () => {
    const result = createProjection().project(createFullDsl())
    expect(result.world.entities.length).toBe(3)
  })

  it('entityCount is 3', () => {
    const result = createProjection().project(createFullDsl())
    expect(result.entityCount).toBe(3)
  })

  it('preserves first entity id', () => {
    const result = createProjection().project(createFullDsl())
    expect(result.world.entities[0].id).toBe('guard-001')
  })

  it('preserves first entity type', () => {
    const result = createProjection().project(createFullDsl())
    expect(result.world.entities[0].type).toBe('guard')
  })

  it('preserves second entity id', () => {
    const result = createProjection().project(createFullDsl())
    expect(result.world.entities[1].id).toBe('villager-001')
  })

  it('preserves second entity type', () => {
    const result = createProjection().project(createFullDsl())
    expect(result.world.entities[1].type).toBe('villager')
  })

  it('preserves third entity id', () => {
    const result = createProjection().project(createFullDsl())
    expect(result.world.entities[2].id).toBe('tree-001')
  })

  it('preserves third entity type', () => {
    const result = createProjection().project(createFullDsl())
    expect(result.world.entities[2].type).toBe('tree')
  })

  it('all entities have default position', () => {
    const result = createProjection().project(createFullDsl())
    for (const entity of result.world.entities) {
      expect(entity.x).toBe(0)
      expect(entity.y).toBe(0)
    }
  })

  it('entity order matches DSL entity order', () => {
    const result = createProjection().project(createFullDsl())
    expect(result.world.entities[0].id).toBe('guard-001')
    expect(result.world.entities[1].id).toBe('villager-001')
    expect(result.world.entities[2].id).toBe('tree-001')
  })
})

// ---------------------------------------------------------------------------
// Section 5 — Multiple Components
// ---------------------------------------------------------------------------

describe('multiple components', () => {
  it('entity without components has 0 component count', () => {
    const result = createProjection().project(createEntityNoComponentsDsl())
    expect(result.componentCount).toBe(0)
  })

  it('single entity with 10 components has componentCount of 10', () => {
    const result = createProjection().project(createSingleEntityManyComponentsDsl())
    expect(result.componentCount).toBe(10)
  })

  it('multiple entities with mixed components sum correctly', () => {
    const result = createProjection().project(createFullDsl())
    // guard-001: 2 components, villager-001: 2 components, tree-001: 1 component = 5
    expect(result.componentCount).toBe(5)
  })

  it('entities with null components array are counted as 0', () => {
    const result = createProjection().project({
      world: { name: 'test', entities: [{ id: 'e1', type: 'test', components: null as unknown as readonly ComponentDsl[] }] },
    })
    expect(result.componentCount).toBe(0)
  })

  it('entities with undefined components are counted as 0', () => {
    const result = createProjection().project({
      world: { name: 'test', entities: [{ id: 'e1', type: 'test', components: undefined as unknown as readonly ComponentDsl[] }] },
    })
    expect(result.componentCount).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Section 6 — Entity Count
// ---------------------------------------------------------------------------

describe('entity count', () => {
  it('empty world has entityCount 0', () => {
    const result = createProjection().project(createEmptyWorldDsl())
    expect(result.entityCount).toBe(0)
  })

  it('single entity has entityCount 1', () => {
    const result = createProjection().project(createMinimalDsl())
    expect(result.entityCount).toBe(1)
  })

  it('three entities have entityCount 3', () => {
    const result = createProjection().project(createFullDsl())
    expect(result.entityCount).toBe(3)
  })

  it('entityCount matches actual entities length', () => {
    const result = createProjection().project(createFullDsl())
    expect(result.entityCount).toBe(result.world.entities.length)
  })

  it('non-object entities are excluded from count', () => {
    const result = createProjection().project({
      world: {
        name: 'test',
        entities: [
          { id: 'e1', type: 'a', components: [] },
          null as unknown as EntityDsl,
          { id: 'e2', type: 'b', components: [] },
        ],
      },
    })
    expect(result.entityCount).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// Section 7 — Component Count
// ---------------------------------------------------------------------------

describe('component count', () => {
  it('empty world has componentCount 0', () => {
    const result = createProjection().project(createEmptyWorldDsl())
    expect(result.componentCount).toBe(0)
  })

  it('entity with 0 components has componentCount 0', () => {
    const result = createProjection().project(createMinimalDsl())
    expect(result.componentCount).toBe(0)
  })

  it('entity with 10 components has componentCount 10', () => {
    const result = createProjection().project(createSingleEntityManyComponentsDsl())
    expect(result.componentCount).toBe(10)
  })

  it('3 entities with 2+2+1=5 components', () => {
    const result = createProjection().project(createFullDsl())
    expect(result.componentCount).toBe(5)
  })

  it('componentCount is sum of all entity component arrays', () => {
    // Create entities with known component counts
    const dsl: GameDsl = {
      world: {
        name: 'Count Test',
        entities: [
          { id: 'e1', type: 'a', components: [{ type: 'c1', properties: {} }, { type: 'c2', properties: {} }] },
          { id: 'e2', type: 'b', components: [{ type: 'c3', properties: {} }] },
          { id: 'e3', type: 'c', components: [] },
        ],
      },
    }
    const result = createProjection().project(dsl)
    // 2 + 1 + 0 = 3
    expect(result.componentCount).toBe(3)
  })
})

// ---------------------------------------------------------------------------
// Section 8 — Immutability
// ---------------------------------------------------------------------------

describe('immutability', () => {
  it('result is frozen', () => {
    const result = createProjection().project(createFullDsl())
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('world is frozen', () => {
    const result = createProjection().project(createFullDsl())
    expect(Object.isFrozen(result.world)).toBe(true)
  })

  it('entities array is frozen', () => {
    const result = createProjection().project(createFullDsl())
    expect(Object.isFrozen(result.world.entities)).toBe(true)
  })

  it('each entity is frozen', () => {
    const result = createProjection().project(createFullDsl())
    for (const entity of result.world.entities) {
      expect(Object.isFrozen(entity)).toBe(true)
    }
  })

  it('empty result is frozen', () => {
    const result = createProjection().project(undefined as unknown as GameDsl)
    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result.world)).toBe(true)
    expect(Object.isFrozen(result.world.entities)).toBe(true)
  })

  it('entityCount and componentCount are readonly numbers', () => {
    const result = createProjection().project(createFullDsl())
    expect(typeof result.entityCount).toBe('number')
    expect(typeof result.componentCount).toBe('number')
  })

  it('does not mutate input DSL', () => {
    const projection = createProjection()
    const dsl = createFullDsl()
    const before = JSON.stringify(dsl)
    projection.project(dsl)
    expect(JSON.stringify(dsl)).toBe(before)
  })

  it('accepts frozen input DSL without error', () => {
    const dsl = Object.freeze({
      world: Object.freeze({
        name: 'Frozen',
        entities: Object.freeze([
          Object.freeze({ id: 'e1', type: 'test', components: Object.freeze([]) }),
        ]),
      }),
    })
    expect(() => createProjection().project(dsl)).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// Section 9 — Determinism
// ---------------------------------------------------------------------------

describe('determinism', () => {
  it('same input produces same result', () => {
    const projection = createProjection()
    const dsl = createFullDsl()
    const first = projection.project(dsl)
    const second = projection.project(dsl)
    expect(JSON.stringify(first)).toBe(JSON.stringify(second))
  })

  it('different projections with same input produce same result', () => {
    const dsl = createFullDsl()
    const result1 = createProjection().project(dsl)
    const result2 = createProjection().project(dsl)
    expect(JSON.stringify(result1)).toBe(JSON.stringify(result2))
  })

  it('deterministic with empty input', () => {
    const dsl = createEmptyWorldDsl()
    const result1 = createProjection().project(dsl)
    const result2 = createProjection().project(dsl)
    expect(JSON.stringify(result1)).toBe(JSON.stringify(result2))
  })

  it('deterministic with single entity', () => {
    const dsl = createMinimalDsl()
    const result1 = createProjection().project(dsl)
    const result2 = createProjection().project(dsl)
    expect(JSON.stringify(result1)).toBe(JSON.stringify(result2))
  })

  it('entity order is deterministic', () => {
    const dsl = createFullDsl()
    const result1 = createProjection().project(dsl)
    const result2 = createProjection().project(dsl)
    for (let i = 0; i < 3; i++) {
      expect(result1.world.entities[i].id).toBe(result2.world.entities[i].id)
    }
  })
})

// ---------------------------------------------------------------------------
// Section 10 — Serialization
// ---------------------------------------------------------------------------

describe('serialization', () => {
  it('full model serializes to JSON without error', () => {
    const result = createProjection().project(createFullDsl())
    expect(() => JSON.stringify(result)).not.toThrow()
  })

  it('full model JSON contains world key', () => {
    const result = createProjection().project(createFullDsl())
    const json = JSON.stringify(result)
    expect(json).toContain('world')
  })

  it('full model JSON contains entities array', () => {
    const result = createProjection().project(createFullDsl())
    const json = JSON.stringify(result)
    expect(json).toContain('entities')
  })

  it('full model JSON contains entityCount', () => {
    const result = createProjection().project(createFullDsl())
    const json = JSON.stringify(result)
    expect(json).toContain('entityCount')
  })

  it('full model JSON contains componentCount', () => {
    const result = createProjection().project(createFullDsl())
    const json = JSON.stringify(result)
    expect(json).toContain('componentCount')
  })

  it('empty model serializes to JSON', () => {
    const result = createProjection().project(createEmptyWorldDsl())
    expect(() => JSON.stringify(result)).not.toThrow()
  })

  it('empty model JSON has empty entities', () => {
    const result = createProjection().project(createEmptyWorldDsl())
    const parsed = JSON.parse(JSON.stringify(result))
    expect(parsed.world.entities).toEqual([])
    expect(parsed.entityCount).toBe(0)
    expect(parsed.componentCount).toBe(0)
  })

  it('full model round-trips through JSON', () => {
    const original = createProjection().project(createFullDsl())
    const json = JSON.stringify(original)
    const parsed = JSON.parse(json)
    expect(parsed.world.entities.length).toBe(3)
    expect(parsed.entityCount).toBe(3)
    expect(parsed.componentCount).toBe(5)
    expect(parsed.world.entities[0].id).toBe('guard-001')
  })

  it('model values are JSON-serializable primitives', () => {
    const result = createProjection().project(createFullDsl())
    const json = JSON.parse(JSON.stringify(result))
    expect(typeof json.world.entities[0].id).toBe('string')
    expect(typeof json.world.entities[0].type).toBe('string')
    expect(typeof json.world.entities[0].x).toBe('number')
    expect(typeof json.world.entities[0].y).toBe('number')
    expect(typeof json.entityCount).toBe('number')
    expect(typeof json.componentCount).toBe('number')
  })
})

// ---------------------------------------------------------------------------
// Section 11 — Large Worlds
// ---------------------------------------------------------------------------

describe('large worlds', () => {
  it('handles 100 entities', () => {
    const entities: EntityDsl[] = Array.from({ length: 100 }, (_, i) => ({
      id: `entity-${i}`,
      type: i % 2 === 0 ? 'type-a' : 'type-b',
      components: [{ type: 'Marker', properties: { index: i } }],
    }))
    const dsl: GameDsl = { world: { name: 'Large World', entities } }
    const result = createProjection().project(dsl)
    expect(result.entityCount).toBe(100)
    expect(result.componentCount).toBe(100)
  })

  it('handles 1000 entities', () => {
    const entities: EntityDsl[] = Array.from({ length: 1000 }, (_, i) => ({
      id: `e-${i}`,
      type: 'entity',
      components: [],
    }))
    const dsl: GameDsl = { world: { name: 'Huge World', entities } }
    const result = createProjection().project(dsl)
    expect(result.entityCount).toBe(1000)
    expect(result.componentCount).toBe(0)
  })

  it('handles entities with many components each', () => {
    const components: ComponentDsl[] = Array.from({ length: 20 }, (_, i) => ({
      type: `comp-${i}`,
      properties: { value: i },
    }))
    const entities: EntityDsl[] = Array.from({ length: 50 }, (_, i) => ({
      id: `e-${i}`,
      type: 'rich',
      components,
    }))
    const dsl: GameDsl = { world: { name: 'Rich World', entities } }
    const result = createProjection().project(dsl)
    expect(result.entityCount).toBe(50)
    expect(result.componentCount).toBe(1000) // 50 * 20
  })

  it('processes large world within reasonable time', () => {
    const projection = createProjection()
    const entities: EntityDsl[] = Array.from({ length: 100 }, (_, i) => ({
      id: `entity-${i}`,
      type: 'test',
      components: Array.from({ length: 5 }, (_, j) => ({
        type: `comp-${j}`,
        properties: { value: j },
      })),
    }))
    const dsl: GameDsl = { world: { name: 'Perf World', entities } }
    const start = performance.now()
    const iterations = 100
    for (let i = 0; i < iterations; i++) {
      projection.project(dsl)
    }
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(1000)
  })

  it('large world maintains frozen output', () => {
    const entities: EntityDsl[] = Array.from({ length: 100 }, (_, i) => ({
      id: `e-${i}`,
      type: 'test',
      components: [],
    }))
    const dsl: GameDsl = { world: { name: 'Freeze Test', entities } }
    const result = createProjection().project(dsl)
    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result.world)).toBe(true)
    expect(Object.isFrozen(result.world.entities)).toBe(true)
    for (const entity of result.world.entities) {
      expect(Object.isFrozen(entity)).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------
// Section 12 — Invalid DSL
// ---------------------------------------------------------------------------

describe('invalid DSL', () => {
  it('undefined returns empty result', () => {
    const result = createProjection().project(undefined as unknown as GameDsl)
    expect(result.entityCount).toBe(0)
    expect(result.componentCount).toBe(0)
  })

  it('null returns empty result', () => {
    const result = createProjection().project(null as unknown as GameDsl)
    expect(result.entityCount).toBe(0)
    expect(result.componentCount).toBe(0)
  })

  it('non-object returns empty result', () => {
    const result = createProjection().project(42 as unknown as GameDsl)
    expect(result.entityCount).toBe(0)
  })

  it('array returns empty result', () => {
    const result = createProjection().project(['invalid'] as unknown as GameDsl)
    expect(result.entityCount).toBe(0)
  })

  it('object without world returns empty result', () => {
    const result = createProjection().project({} as GameDsl)
    expect(result.entityCount).toBe(0)
  })

  it('world with null entities array returns empty result', () => {
    const result = createProjection().project({
      world: { name: 'test', entities: null as unknown as readonly EntityDsl[] },
    })
    expect(result.entityCount).toBe(0)
  })

  it('world with undefined entities defaults to empty', () => {
    const result = createProjection().project({
      world: { name: 'test', entities: undefined as unknown as readonly EntityDsl[] },
    })
    expect(result.entityCount).toBe(0)
  })

  it('mixed valid and invalid entities only counts valid', () => {
    const result = createProjection().project({
      world: {
        name: 'mixed',
        entities: [
          { id: 'e1', type: 'a', components: [] },
          null as unknown as EntityDsl,
          undefined as unknown as EntityDsl,
          { id: 'e2', type: 'b', components: [{ type: 'c', properties: {} }] },
        ],
      },
    })
    expect(result.entityCount).toBe(2)
    expect(result.componentCount).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// Section 13 — Edge Cases
// ---------------------------------------------------------------------------

describe('edge cases', () => {
  it('entity id is converted to string', () => {
    const result = createProjection().project({
      world: { name: 'test', entities: [{ id: 123 as unknown as string, type: 'test', components: [] }] },
    })
    expect(result.world.entities[0].id).toBe('123')
  })

  it('entity type is converted to string', () => {
    const result = createProjection().project({
      world: { name: 'test', entities: [{ id: 'e1', type: 456 as unknown as string, components: [] }] },
    })
    expect(result.world.entities[0].type).toBe('456')
  })

  it('empty entities array in non-empty world', () => {
    const result = createProjection().project({
      world: { name: 'Empty', entities: [] },
    })
    expect(result.entityCount).toBe(0)
    expect(result.world.entities).toEqual([])
  })

  it('world name from DSL is not projected to Runtime World', () => {
    const result = createProjection().project(createFullDsl())
    // Runtime World does not have a name property
    expect(result.world).not.toHaveProperty('name')
  })

  it('projected entities have exactly 4 properties', () => {
    const result = createProjection().project(createFullDsl())
    for (const entity of result.world.entities) {
      const keys = Object.keys(entity)
      expect(keys).toEqual(['id', 'type', 'x', 'y'])
    }
  })

  it('component types are not interpreted', () => {
    const dsl: GameDsl = {
      world: {
        name: 'test',
        entities: [
          { id: 'e1', type: 'test', components: [{ type: 'AnyType', properties: { complex: { nested: true } } }] },
        ],
      },
    }
    const result = createProjection().project(dsl)
    // Components are counted but not stored — type is not interpreted
    expect(result.componentCount).toBe(1)
    expect(result.entityCount).toBe(1)
  })

  it('projection is stateless across calls', () => {
    const projection = createProjection()
    const first = projection.project(createMinimalDsl())
    const second = projection.project(createFullDsl())
    // First result should not be affected by second call
    expect(first.entityCount).toBe(1)
    expect(first.componentCount).toBe(0)
    // Second result should have its own data
    expect(second.entityCount).toBe(3)
    expect(second.componentCount).toBe(5)
  })
})