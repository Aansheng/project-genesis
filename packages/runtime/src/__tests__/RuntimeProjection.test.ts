/**
 * RuntimeProjection — verifies the DefaultRuntimeProjection implementation
 * for converting GameDsl → Runtime world representation.
 *
 * WO-S8-003 — Game DSL Runtime Projection Foundation
 * WO-S8-004 — Runtime Component Model Foundation
 * Architecture version v1.63
 */

import { describe, it, expect } from 'vitest'
import { DefaultRuntimeProjection } from '../projection'
import type { RuntimeProjection } from '../projection'
import type { GameDsl, EntityDsl, ComponentDsl, RuntimeComponent } from '@genesis/shared'

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

  it('projected entities have exactly 5 properties (id, type, x, y, components)', () => {
    const result = createProjection().project(createFullDsl())
    for (const entity of result.world.entities) {
      const keys = Object.keys(entity)
      expect(keys).toEqual(['id', 'type', 'x', 'y', 'components'])
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

// ---------------------------------------------------------------------------
// Section 14 — Entity Components
// ---------------------------------------------------------------------------

describe('entity components', () => {
  it('entity with empty components has empty components array', () => {
    const result = createProjection().project(createMinimalDsl())
    const entity = result.world.entities[0]
    expect(entity.components).toBeDefined()
    expect(entity.components).toEqual([])
  })

  it('entity with components has non-empty components array', () => {
    const result = createProjection().project(createFullDsl())
    const entity = result.world.entities[0]
    expect(entity.components).toBeDefined()
    expect(entity.components!.length).toBeGreaterThan(0)
  })

  it('entity without components has empty frozen array', () => {
    const result = createProjection().project(createMinimalDsl())
    expect(Object.isFrozen(result.world.entities[0].components!)).toBe(true)
  })

  it('all projected entities have components field', () => {
    const result = createProjection().project(createFullDsl())
    for (const entity of result.world.entities) {
      expect(entity).toHaveProperty('components')
      expect(Array.isArray(entity.components)).toBe(true)
    }
  })

  it('two entities each have own components array', () => {
    const dsl: GameDsl = {
      world: {
        name: 'Two Entities',
        entities: [
          { id: 'e1', type: 'a', components: [{ type: 'C1', properties: {} }] },
          { id: 'e2', type: 'b', components: [{ type: 'C2', properties: {} }] },
        ],
      },
    }
    const result = createProjection().project(dsl)
    expect(result.world.entities[0].components).toHaveLength(1)
    expect(result.world.entities[1].components).toHaveLength(1)
    expect(result.world.entities[0].components![0].type).toBe('C1')
    expect(result.world.entities[1].components![0].type).toBe('C2')
  })
})

// ---------------------------------------------------------------------------
// Section 15 — Single Component
// ---------------------------------------------------------------------------

describe('single component', () => {
  it('projects a single ComponentDsl into one RuntimeComponent', () => {
    const result = createProjection().project({
      world: {
        name: 'test',
        entities: [
          { id: 'e1', type: 'test', components: [{ type: 'Position', properties: {} }] },
        ],
      },
    })
    expect(result.world.entities[0].components).toHaveLength(1)
  })

  it('projected component has correct type', () => {
    const result = createProjection().project({
      world: {
        name: 'test',
        entities: [
          { id: 'e1', type: 'test', components: [{ type: 'Health', properties: {} }] },
        ],
      },
    })
    const comp = result.world.entities[0].components![0]
    expect(comp.type).toBe('Health')
  })

  it('projected component is a RuntimeComponent type', () => {
    const result = createProjection().project({
      world: {
        name: 'test',
        entities: [
          { id: 'e1', type: 'test', components: [{ type: 'Marker', properties: {} }] },
        ],
      },
    })
    const comp = result.world.entities[0].components![0] as RuntimeComponent
    expect(typeof comp.type).toBe('string')
    expect(typeof comp.properties).toBe('object')
  })

  it('single component contributes to componentCount', () => {
    const result = createProjection().project({
      world: {
        name: 'test',
        entities: [
          { id: 'e1', type: 'test', components: [{ type: 'C', properties: {} }] },
        ],
      },
    })
    expect(result.componentCount).toBe(1)
  })

  it('entity has exactly one RuntimeComponent in array', () => {
    const result = createProjection().project({
      world: {
        name: 'test',
        entities: [
          { id: 'e1', type: 'test', components: [{ type: 'C', properties: { v: 1 } }] },
        ],
      },
    })
    expect(result.world.entities[0].components!.length).toBe(1)
    expect(result.world.entities[0].components![0]).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Section 16 — Multiple Components
// ---------------------------------------------------------------------------

describe('multiple components', () => {
  it('entity with 2 components has 2 RuntimeComponents', () => {
    const result = createProjection().project(createFullDsl())
    // guard-001 has 2 components
    const guard = result.world.entities[0]
    expect(guard.components).toHaveLength(2)
  })

  it('entity with 1 component has 1 RuntimeComponent', () => {
    const result = createProjection().project(createFullDsl())
    // tree-001 has 1 component
    const tree = result.world.entities[2]
    expect(tree.components).toHaveLength(1)
  })

  it('different entities have different component types', () => {
    const result = createProjection().project(createFullDsl())
    const guard = result.world.entities[0]
    const villager = result.world.entities[1]
    expect(guard.components![0].type).toBe('Position')
    expect(villager.components![0].type).toBe('Position')
    expect(guard.components![1].type).toBe('Health')
    expect(villager.components![1].type).toBe('Inventory')
  })

  it('component type order matches DSL component order', () => {
    const result = createProjection().project(createFullDsl())
    const guard = result.world.entities[0]
    expect(guard.components![0].type).toBe('Position')
    expect(guard.components![1].type).toBe('Health')
  })

  it('multiple components across multiple entities sum correctly', () => {
    const result = createProjection().project(createFullDsl())
    let totalComponents = 0
    for (const entity of result.world.entities) {
      totalComponents += entity.components!.length
    }
    expect(totalComponents).toBe(5)
    expect(result.componentCount).toBe(5)
  })

  it('entity with 10 components has correct count', () => {
    const result = createProjection().project(createSingleEntityManyComponentsDsl())
    expect(result.world.entities[0].components).toHaveLength(10)
    expect(result.componentCount).toBe(10)
  })
})

// ---------------------------------------------------------------------------
// Section 17 — Component Preservation
// ---------------------------------------------------------------------------

describe('component preservation', () => {
  it('preserves Position component type', () => {
    const result = createProjection().project(createFullDsl())
    expect(result.world.entities[0].components![0].type).toBe('Position')
  })

  it('preserves Health component type', () => {
    const result = createProjection().project(createFullDsl())
    expect(result.world.entities[0].components![1].type).toBe('Health')
  })

  it('preserves Inventory component type', () => {
    const result = createProjection().project(createFullDsl())
    expect(result.world.entities[1].components![1].type).toBe('Inventory')
  })

  it('component type is not interpreted or transformed', () => {
    const result = createProjection().project({
      world: {
        name: 'test',
        entities: [
          { id: 'e1', type: 'test', components: [{ type: 'AnyArbitraryTypeName', properties: {} }] },
        ],
      },
    })
    expect(result.world.entities[0].components![0].type).toBe('AnyArbitraryTypeName')
  })

  it('component type is converted to string', () => {
    const result = createProjection().project({
      world: {
        name: 'test',
        entities: [
          { id: 'e1', type: 'test', components: [{ type: 42 as unknown as string, properties: {} }] },
        ],
      },
    })
    expect(result.world.entities[0].components![0].type).toBe('42')
  })

  it('null component type produces empty string', () => {
    const result = createProjection().project({
      world: {
        name: 'test',
        entities: [
          { id: 'e1', type: 'test', components: [{ type: null as unknown as string, properties: {} }] },
        ],
      },
    })
    expect(result.world.entities[0].components![0].type).toBe('')
  })

  it('null component DSL is skipped', () => {
    const result = createProjection().project({
      world: {
        name: 'test',
        entities: [
          {
            id: 'e1',
            type: 'test',
            components: [null as unknown as ComponentDsl],
          },
        ],
      },
    })
    // Null component is skipped, entity gets empty components
    expect(result.world.entities[0].components).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Section 18 — Property Preservation
// ---------------------------------------------------------------------------

describe('property preservation', () => {
  it('preserves Position properties (x: 10, y: 5)', () => {
    const result = createProjection().project(createFullDsl())
    const pos = result.world.entities[0].components![0]
    expect(pos.properties.x).toBe(10)
    expect(pos.properties.y).toBe(5)
  })

  it('preserves Health properties (value: 100)', () => {
    const result = createProjection().project(createFullDsl())
    const health = result.world.entities[0].components![1]
    expect(health.properties.value).toBe(100)
  })

  it('preserves Inventory items array', () => {
    const result = createProjection().project(createFullDsl())
    const inv = result.world.entities[1].components![1]
    expect(inv.properties.items).toEqual(['bread', 'water'])
  })

  it('preserves empty properties object', () => {
    const result = createProjection().project({
      world: {
        name: 'test',
        entities: [
          { id: 'e1', type: 'test', components: [{ type: 'Empty', properties: {} }] },
        ],
      },
    })
    expect(result.world.entities[0].components![0].properties).toEqual({})
  })

  it('preserves numeric property value', () => {
    const dsl: GameDsl = {
      world: {
        name: 'test',
        entities: [
          { id: 'e1', type: 'test', components: [{ type: 'Score', properties: { value: 999 } }] },
        ],
      },
    }
    const result = createProjection().project(dsl)
    expect(result.world.entities[0].components![0].properties.value).toBe(999)
  })

  it('preserves string property value', () => {
    const dsl: GameDsl = {
      world: {
        name: 'test',
        entities: [
          { id: 'e1', type: 'test', components: [{ type: 'Label', properties: { text: 'hello' } }] },
        ],
      },
    }
    const result = createProjection().project(dsl)
    expect(result.world.entities[0].components![0].properties.text).toBe('hello')
  })

  it('preserves boolean property value', () => {
    const dsl: GameDsl = {
      world: {
        name: 'test',
        entities: [
          { id: 'e1', type: 'test', components: [{ type: 'Flag', properties: { active: true } }] },
        ],
      },
    }
    const result = createProjection().project(dsl)
    expect(result.world.entities[0].components![0].properties.active).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 19 — Nested Properties
// ---------------------------------------------------------------------------

describe('nested properties', () => {
  it('preserves one level of nested properties', () => {
    const dsl: GameDsl = {
      world: {
        name: 'test',
        entities: [
          {
            id: 'e1',
            type: 'test',
            components: [
              { type: 'Transform', properties: { position: { x: 1, y: 2 } } },
            ],
          },
        ],
      },
    }
    const result = createProjection().project(dsl)
    const pos = result.world.entities[0].components![0].properties.position as Record<string, number>
    expect(pos.x).toBe(1)
    expect(pos.y).toBe(2)
  })

  it('preserves two levels of nested properties', () => {
    const dsl: GameDsl = {
      world: {
        name: 'test',
        entities: [
          {
            id: 'e1',
            type: 'test',
            components: [
              {
                type: 'Deep',
                properties: {
                  level1: {
                    level2: {
                      value: 'deep',
                    },
                  },
                },
              },
            ],
          },
        ],
      },
    }
    const result = createProjection().project(dsl)
    const l1 = result.world.entities[0].components![0].properties.level1 as Record<string, unknown>
    const l2 = l1.level2 as Record<string, string>
    expect(l2.value).toBe('deep')
  })

  it('preserves array within properties', () => {
    const dsl: GameDsl = {
      world: {
        name: 'test',
        entities: [
          {
            id: 'e1',
            type: 'test',
            components: [
              { type: 'Tags', properties: { tags: ['a', 'b', 'c'] } },
            ],
          },
        ],
      },
    }
    const result = createProjection().project(dsl)
    const tags = result.world.entities[0].components![0].properties.tags as string[]
    expect(tags).toEqual(['a', 'b', 'c'])
  })

  it('preserves mixed nested types', () => {
    const dsl: GameDsl = {
      world: {
        name: 'test',
        entities: [
          {
            id: 'e1',
            type: 'test',
            components: [
              {
                type: 'Complex',
                properties: {
                  config: {
                    speed: 10,
                    enabled: true,
                    label: 'fast',
                    coords: [1, 2, 3],
                  },
                },
              },
            ],
          },
        ],
      },
    }
    const result = createProjection().project(dsl)
    const config = result.world.entities[0].components![0].properties.config as Record<string, unknown>
    expect(config.speed).toBe(10)
    expect(config.enabled).toBe(true)
    expect(config.label).toBe('fast')
    expect(config.coords).toEqual([1, 2, 3])
  })

  it('nested properties are not interpreted', () => {
    const dsl: GameDsl = {
      world: {
        name: 'test',
        entities: [
          {
            id: 'e1',
            type: 'test',
            components: [
              { type: 'Any', properties: { arbitrary: { deeply: { nested: { data: true } } } } },
            ],
          },
        ],
      },
    }
    const result = createProjection().project(dsl)
    const arbitrary = result.world.entities[0].components![0].properties.arbitrary as Record<string, unknown>
    const deeply = arbitrary.deeply as Record<string, unknown>
    const nested = deeply.nested as Record<string, boolean>
    expect(nested.data).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 20 — Component Count
// ---------------------------------------------------------------------------

describe('component count', () => {
  it('componentCount equals total RuntimeComponents across entities', () => {
    const result = createProjection().project(createFullDsl())
    let sum = 0
    for (const entity of result.world.entities) {
      sum += entity.components!.length
    }
    expect(result.componentCount).toBe(sum)
  })

  it('componentCount matches sum of all entity component lengths', () => {
    const result = createProjection().project(createFullDsl())
    const lengths = result.world.entities.map(e => e.components!.length)
    const sum = lengths.reduce((a, b) => a + b, 0)
    expect(result.componentCount).toBe(sum)
  })

  it('componentCount is 0 when no components exist', () => {
    const result = createProjection().project(createEntityNoComponentsDsl())
    expect(result.componentCount).toBe(0)
  })

  it('componentCount is number type', () => {
    const result = createProjection().project(createFullDsl())
    expect(typeof result.componentCount).toBe('number')
  })

  it('componentCount matches projected components not DSL count', () => {
    // Even though we test the same count, componentCount is derived from
    // the projected RuntimeComponent objects, not from counting DSL components
    const result = createProjection().project(createFullDsl())
    const projectedCount = result.world.entities.reduce(
      (sum, e) => sum + e.components!.length, 0,
    )
    expect(result.componentCount).toBe(projectedCount)
  })

  it('componentCount handles entities with varying component counts', () => {
    const dsl: GameDsl = {
      world: {
        name: 'Varying',
        entities: [
          { id: 'e1', type: 'a', components: [{ type: 'C1', properties: {} }] },
          { id: 'e2', type: 'b', components: [
            { type: 'C2', properties: {} },
            { type: 'C3', properties: {} },
            { type: 'C4', properties: {} },
          ]},
          { id: 'e3', type: 'c', components: [] },
          { id: 'e4', type: 'd', components: [{ type: 'C5', properties: {} }] },
        ],
      },
    }
    const result = createProjection().project(dsl)
    // 1 + 3 + 0 + 1 = 5
    expect(result.componentCount).toBe(5)
  })
})

// ---------------------------------------------------------------------------
// Section 21 — Component Immutability
// ---------------------------------------------------------------------------

describe('component immutability', () => {
  it('projected components are frozen', () => {
    const result = createProjection().project(createFullDsl())
    for (const entity of result.world.entities) {
      for (const component of entity.components!) {
        expect(Object.isFrozen(component)).toBe(true)
      }
    }
  })

  it('projected component properties are frozen', () => {
    const result = createProjection().project(createFullDsl())
    for (const entity of result.world.entities) {
      for (const component of entity.components!) {
        expect(Object.isFrozen(component.properties)).toBe(true)
      }
    }
  })

  it('components arrays are frozen on each entity', () => {
    const result = createProjection().project(createFullDsl())
    for (const entity of result.world.entities) {
      expect(Object.isFrozen(entity.components!)).toBe(true)
    }
  })

  it('empty components array is frozen', () => {
    const result = createProjection().project(createMinimalDsl())
    expect(Object.isFrozen(result.world.entities[0].components!)).toBe(true)
  })

  it('cannot mutate component type after projection', () => {
    const result = createProjection().project(createFullDsl())
    const component = result.world.entities[0].components![0]
    expect(() => {
      (component as { type: string }).type = 'Mutated'
    }).toThrow()
  })

  it('cannot mutate component properties after projection', () => {
    const result = createProjection().project(createFullDsl())
    const component = result.world.entities[0].components![0]
    expect(() => {
      (component.properties as Record<string, unknown>).x = 999
    }).toThrow()
  })

  it('cannot add new properties to component after projection', () => {
    const result = createProjection().project(createFullDsl())
    const component = result.world.entities[0].components![0]
    expect(() => {
      (component.properties as Record<string, unknown>).newProp = 'value'
    }).toThrow()
  })

  it('cannot push to components array after projection', () => {
    const result = createProjection().project(createFullDsl())
    const components = result.world.entities[0].components!
    expect(() => {
      (components as RuntimeComponent[]).push({ type: 'New', properties: {} })
    }).toThrow()
  })

  it('cannot delete component from frozen array', () => {
    const result = createProjection().project(createFullDsl())
    const components = result.world.entities[0].components!
    expect(() => {
      (components as RuntimeComponent[]).pop()
    }).toThrow()
  })
})

// ---------------------------------------------------------------------------
// Section 22 — Component Determinism
// ---------------------------------------------------------------------------

describe('component determinism', () => {
  it('same DSL produces same RuntimeComponent types', () => {
    const projection = createProjection()
    const dsl = createFullDsl()
    const first = projection.project(dsl)
    const second = projection.project(dsl)
    for (let i = 0; i < first.world.entities.length; i++) {
      const aTypes = first.world.entities[i].components!.map(c => c.type)
      const bTypes = second.world.entities[i].components!.map(c => c.type)
      expect(aTypes).toEqual(bTypes)
    }
  })

  it('same DSL produces same RuntimeComponent properties', () => {
    const projection = createProjection()
    const dsl = createFullDsl()
    const first = projection.project(dsl)
    const second = projection.project(dsl)
    for (let i = 0; i < first.world.entities.length; i++) {
      const aProps = first.world.entities[i].components!.map(c => JSON.stringify(c.properties))
      const bProps = second.world.entities[i].components!.map(c => JSON.stringify(c.properties))
      expect(aProps).toEqual(bProps)
    }
  })

  it('deterministic component order across projections', () => {
    const projection = createProjection()
    const dsl = createFullDsl()
    const first = projection.project(dsl)
    const second = projection.project(dsl)
    for (let i = 0; i < first.world.entities.length; i++) {
      const aTypes = first.world.entities[i].components!.map(c => c.type)
      const bTypes = second.world.entities[i].components!.map(c => c.type)
      expect(aTypes).toEqual(bTypes)
    }
  })

  it('component JSON round-trip is deterministic', () => {
    const projection = createProjection()
    const dsl = createFullDsl()
    const first = JSON.stringify(projection.project(dsl))
    const second = JSON.stringify(projection.project(dsl))
    expect(first).toBe(second)
  })
})

// ---------------------------------------------------------------------------
// Section 23 — Component Serialization
// ---------------------------------------------------------------------------

describe('component serialization', () => {
  it('projected components serialize to JSON', () => {
    const result = createProjection().project(createFullDsl())
    expect(() => JSON.stringify(result)).not.toThrow()
  })

  it('projected component JSON contains component type', () => {
    const result = createProjection().project(createFullDsl())
    const json = JSON.stringify(result)
    expect(json).toContain('"Position"')
    expect(json).toContain('"Health"')
    expect(json).toContain('"Inventory"')
  })

  it('projected component properties round-trip through JSON', () => {
    const result = createProjection().project(createFullDsl())
    const parsed = JSON.parse(JSON.stringify(result))
    const guard = parsed.world.entities[0]
    expect(guard.components[0].type).toBe('Position')
    expect(guard.components[0].properties.x).toBe(10)
    expect(guard.components[0].properties.y).toBe(5)
    expect(guard.components[1].type).toBe('Health')
    expect(guard.components[1].properties.value).toBe(100)
  })

  it('componentCount survives JSON round-trip', () => {
    const result = createProjection().project(createFullDsl())
    const parsed = JSON.parse(JSON.stringify(result))
    expect(parsed.componentCount).toBe(5)
  })

  it('empty components array round-trips through JSON', () => {
    const result = createProjection().project(createMinimalDsl())
    const parsed = JSON.parse(JSON.stringify(result))
    expect(parsed.world.entities[0].components).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Section 24 — Large Worlds with Components
// ---------------------------------------------------------------------------

describe('large worlds with components', () => {
  it('handles 100 entities each with 5 components', () => {
    const entities: EntityDsl[] = Array.from({ length: 100 }, (_, i) => ({
      id: `e-${i}`,
      type: 'rich',
      components: Array.from({ length: 5 }, (_, j) => ({
        type: `comp-${j}`,
        properties: { value: j },
      })),
    }))
    const dsl: GameDsl = { world: { name: 'Big', entities } }
    const result = createProjection().project(dsl)
    expect(result.entityCount).toBe(100)
    expect(result.componentCount).toBe(500) // 100 * 5
  })

  it('handles 50 entities each with 20 components', () => {
    const components: ComponentDsl[] = Array.from({ length: 20 }, (_, i) => ({
      type: `c-${i}`,
      properties: { index: i },
    }))
    const entities: EntityDsl[] = Array.from({ length: 50 }, (_, i) => ({
      id: `e-${i}`,
      type: 'bulk',
      components,
    }))
    const dsl: GameDsl = { world: { name: 'Bulk', entities } }
    const result = createProjection().project(dsl)
    expect(result.entityCount).toBe(50)
    expect(result.componentCount).toBe(1000) // 50 * 20
  })

  it('large world with components maintains frozen output', () => {
    const entities: EntityDsl[] = Array.from({ length: 100 }, (_, i) => ({
      id: `e-${i}`,
      type: 'test',
      components: [{ type: 'Marker', properties: { index: i } }],
    }))
    const dsl: GameDsl = { world: { name: 'Frozen', entities } }
    const result = createProjection().project(dsl)
    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result.world)).toBe(true)
    expect(Object.isFrozen(result.world.entities)).toBe(true)
    for (const entity of result.world.entities) {
      expect(Object.isFrozen(entity)).toBe(true)
      expect(Object.isFrozen(entity.components!)).toBe(true)
      for (const component of entity.components!) {
        expect(Object.isFrozen(component)).toBe(true)
        expect(Object.isFrozen(component.properties)).toBe(true)
      }
    }
  })

  it('large world processes within reasonable time', () => {
    const projection = createProjection()
    const entities: EntityDsl[] = Array.from({ length: 100 }, (_, i) => ({
      id: `e-${i}`,
      type: 'test',
      components: Array.from({ length: 5 }, (_, j) => ({
        type: `c-${j}`,
        properties: { value: j },
      })),
    }))
    const dsl: GameDsl = { world: { name: 'Perf', entities } }
    const start = performance.now()
    const iterations = 100
    for (let i = 0; i < iterations; i++) {
      projection.project(dsl)
    }
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(1000)
  })

  it('large world maintains correct component types', () => {
    const entities: EntityDsl[] = Array.from({ length: 50 }, (_, i) => ({
      id: `e-${i}`,
      type: 'item',
      components: [
        { type: 'Position', properties: { x: i, y: i * 2 } },
        { type: 'Label', properties: { name: `Item ${i}` } },
      ],
    }))
    const dsl: GameDsl = { world: { name: 'Types', entities } }
    const result = createProjection().project(dsl)
    for (let i = 0; i < 50; i++) {
      const entity = result.world.entities[i]
      expect(entity.components![0].type).toBe('Position')
      expect(entity.components![0].properties.x).toBe(i)
      expect(entity.components![1].type).toBe('Label')
      expect(entity.components![1].properties.name).toBe(`Item ${i}`)
    }
  })

  it('componentCount is exact for large worlds', () => {
    const entities: EntityDsl[] = Array.from({ length: 200 }, (_, i) => ({
      id: `e-${i}`,
      type: 'test',
      components: [
        { type: 'A', properties: {} },
        { type: 'B', properties: {} },
        { type: 'C', properties: {} },
      ],
    }))
    const dsl: GameDsl = { world: { name: 'Exact', entities } }
    const result = createProjection().project(dsl)
    expect(result.componentCount).toBe(600) // 200 * 3
  })
})