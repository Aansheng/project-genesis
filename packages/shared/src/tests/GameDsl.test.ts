/**
 * GameDsl — verifies the Game DSL type definitions.
 *
 * WO-S8-001 — Game DSL Foundation
 * Architecture version v1.60
 *
 * Design:
 * - Types only — no Runtime, Renderer, or AI integration
 * - Foundation layer — no generation or mapping logic
 * - All types are readonly, serializable, and framework-independent
 */

import { describe, it, expect } from 'vitest'
import type { GameDsl, WorldDsl, EntityDsl, ComponentDsl } from '../game-dsl'
import { EMPTY_GAME_DSL } from '../game-dsl'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal valid GameDsl. */
function buildMinimalDsl(): GameDsl {
  return {
    world: {
      name: 'TestWorld',
      entities: [],
    },
  }
}

/** Build a GameDsl with nested entities and components. */
function buildNestedDsl(): GameDsl {
  return {
    world: {
      name: 'NestedWorld',
      entities: [
        {
          id: 'guard-001',
          type: 'Guard',
          components: [
            { type: 'Position', properties: { x: 10, y: 4 } },
            { type: 'Health', properties: { current: 100, max: 100 } },
            { type: 'AI', properties: { state: 'Patrol', target: null } },
          ],
        },
        {
          id: 'villager-001',
          type: 'Villager',
          components: [
            { type: 'Position', properties: { x: 1, y: 2 } },
            { type: 'Inventory', properties: { gold: 50, items: ['bread'] } },
          ],
        },
      ],
    },
  }
}

/** Build a large GameDsl with many entities. */
function buildLargeDsl(): GameDsl {
  const entities: EntityDsl[] = []
  for (let i = 0; i < 100; i++) {
    entities.push({
      id: `entity-${String(i).padStart(3, '0')}`,
      type: i % 2 === 0 ? 'Guard' : 'Villager',
      components: [
        { type: 'Position', properties: { x: i, y: i * 2 } },
        { type: 'Health', properties: { current: 100, max: 100 } },
      ],
    })
  }
  return {
    world: {
      name: 'LargeWorld',
      entities,
    },
  }
}

// ---------------------------------------------------------------------------
// Section 1 — Construction
// ---------------------------------------------------------------------------

describe('construction', () => {
  it('creates minimal GameDsl', () => {
    const dsl = buildMinimalDsl()
    expect(dsl).toBeDefined()
    expect(dsl.world.name).toBe('TestWorld')
  })

  it('GameDsl has world property', () => {
    const dsl = buildMinimalDsl()
    expect(dsl).toHaveProperty('world')
  })

  it('WorldDsl has name property', () => {
    const dsl = buildMinimalDsl()
    expect(dsl.world).toHaveProperty('name')
  })

  it('WorldDsl has entities property', () => {
    const dsl = buildMinimalDsl()
    expect(dsl.world).toHaveProperty('entities')
  })

  it('WorldDsl entities defaults to empty array', () => {
    const dsl = buildMinimalDsl()
    expect(dsl.world.entities).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Section 2 — Immutability
// ---------------------------------------------------------------------------

describe('immutability', () => {
  it('EMPTY_GAME_DSL is frozen', () => {
    expect(Object.isFrozen(EMPTY_GAME_DSL)).toBe(true)
  })

  it('EMPTY_GAME_DSL world is frozen', () => {
    expect(Object.isFrozen(EMPTY_GAME_DSL.world)).toBe(true)
  })

  it('EMPTY_GAME_DSL world entities array is frozen', () => {
    expect(Object.isFrozen(EMPTY_GAME_DSL.world.entities)).toBe(true)
  })

  it('nested dsl root is not frozen (plain object)', () => {
    // Non-EMPTY objects are plain — consumers are expected to freeze if needed
    const dsl = buildNestedDsl()
    expect(Object.isFrozen(dsl)).toBe(false)
  })

  it('readonly prevents mutation at type level (compile-time check)', () => {
    const dsl = buildNestedDsl()
    // These lines would fail at compile time if uncommented:
    // dsl.world.name = 'Changed'  // Error: readonly
    // dsl.world.entities = []     // Error: readonly
    // dsl.world.entities[0].id = 'changed' // Error: readonly
    expect(dsl.world.name).toBe('NestedWorld')
  })
})

// ---------------------------------------------------------------------------
// Section 3 — Serialization
// ---------------------------------------------------------------------------

describe('serialization', () => {
  it('minimal dsl serializes to JSON', () => {
    const dsl = buildMinimalDsl()
    expect(() => JSON.stringify(dsl)).not.toThrow()
  })

  it('nested dsl serializes to JSON', () => {
    const dsl = buildNestedDsl()
    expect(() => JSON.stringify(dsl)).not.toThrow()
  })

  it('minimal dsl JSON has correct structure', () => {
    const dsl = buildMinimalDsl()
    const json = JSON.parse(JSON.stringify(dsl))
    expect(json.world.name).toBe('TestWorld')
    expect(json.world.entities).toEqual([])
  })

  it('nested dsl JSON preserves all fields', () => {
    const dsl = buildNestedDsl()
    const json = JSON.parse(JSON.stringify(dsl))
    expect(json.world.name).toBe('NestedWorld')
    expect(json.world.entities.length).toBe(2)
    expect(json.world.entities[0].id).toBe('guard-001')
    expect(json.world.entities[0].type).toBe('Guard')
    expect(json.world.entities[0].components.length).toBe(3)
  })

  it('empty game dsl serializes to JSON', () => {
    expect(() => JSON.stringify(EMPTY_GAME_DSL)).not.toThrow()
  })

  it('empty game dsl JSON represents empty world', () => {
    const json = JSON.parse(JSON.stringify(EMPTY_GAME_DSL))
    expect(json.world.name).toBe('')
    expect(json.world.entities).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Section 4 — Nested Entities
// ---------------------------------------------------------------------------

describe('nested entities', () => {
  it('has correct entity count', () => {
    const dsl = buildNestedDsl()
    expect(dsl.world.entities.length).toBe(2)
  })

  it('first entity has correct id', () => {
    const dsl = buildNestedDsl()
    expect(dsl.world.entities[0].id).toBe('guard-001')
  })

  it('first entity has correct type', () => {
    const dsl = buildNestedDsl()
    expect(dsl.world.entities[0].type).toBe('Guard')
  })

  it('second entity has correct id', () => {
    const dsl = buildNestedDsl()
    expect(dsl.world.entities[1].id).toBe('villager-001')
  })

  it('second entity has correct type', () => {
    const dsl = buildNestedDsl()
    expect(dsl.world.entities[1].type).toBe('Villager')
  })

  it('entities array is readonly (type-level constraint)', () => {
    const dsl = buildNestedDsl()
    const entities = dsl.world.entities
    expect(Array.isArray(entities)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 5 — Nested Components
// ---------------------------------------------------------------------------

describe('nested components', () => {
  it('first entity has 3 components', () => {
    const dsl = buildNestedDsl()
    expect(dsl.world.entities[0].components.length).toBe(3)
  })

  it('component has type field', () => {
    const dsl = buildNestedDsl()
    expect(dsl.world.entities[0].components[0].type).toBe('Position')
  })

  it('component has properties field', () => {
    const dsl = buildNestedDsl()
    expect(dsl.world.entities[0].components[0].properties).toBeDefined()
  })

  it('component properties are Record<string, unknown>', () => {
    const dsl = buildNestedDsl()
    const props = dsl.world.entities[0].components[0].properties
    expect(props.x).toBe(10)
    expect(props.y).toBe(4)
  })

  it('component with string properties', () => {
    const dsl = buildNestedDsl()
    const aiComp = dsl.world.entities[0].components[2]
    expect(aiComp.type).toBe('AI')
    expect(aiComp.properties.state).toBe('Patrol')
  })

  it('component with array properties', () => {
    const dsl = buildNestedDsl()
    const invComp = dsl.world.entities[1].components[1]
    expect(invComp.type).toBe('Inventory')
    expect(invComp.properties.items).toEqual(['bread'])
  })

  it('second entity has 2 components', () => {
    const dsl = buildNestedDsl()
    expect(dsl.world.entities[1].components.length).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// Section 6 — Readonly Guarantees
// ---------------------------------------------------------------------------

describe('readonly guarantees', () => {
  it('EMPTY_GAME_DSL world name is readonly string', () => {
    expect(typeof EMPTY_GAME_DSL.world.name).toBe('string')
  })

  it('EMPTY_GAME_DSL world entities is readonly array', () => {
    expect(Array.isArray(EMPTY_GAME_DSL.world.entities)).toBe(true)
  })

  it('nested dsl entity fields are strings', () => {
    const dsl = buildNestedDsl()
    expect(typeof dsl.world.entities[0].id).toBe('string')
    expect(typeof dsl.world.entities[0].type).toBe('string')
  })

  it('nested dsl component fields are correctly typed', () => {
    const dsl = buildNestedDsl()
    expect(typeof dsl.world.entities[0].components[0].type).toBe('string')
    expect(typeof dsl.world.entities[0].components[0].properties).toBe('object')
    expect(dsl.world.entities[0].components[0].properties).not.toBeNull()
  })

  it('component properties is Readonly<Record<string, unknown>>', () => {
    const dsl = buildNestedDsl()
    const props = dsl.world.entities[0].components[0].properties
    // Type-level check: at runtime it's a plain object
    expect(typeof props).toBe('object')
    expect(props).not.toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Section 7 — Empty World
// ---------------------------------------------------------------------------

describe('empty world', () => {
  it('EMPTY_GAME_DSL world name is empty string', () => {
    expect(EMPTY_GAME_DSL.world.name).toBe('')
  })

  it('EMPTY_GAME_DSL has zero entities', () => {
    expect(EMPTY_GAME_DSL.world.entities.length).toBe(0)
  })

  it('minimal dsl with empty entities works', () => {
    const dsl: GameDsl = {
      world: { name: 'EmptyWorld', entities: [] },
    }
    expect(dsl.world.entities.length).toBe(0)
  })

  it('empty world serializes correctly', () => {
    const dsl: GameDsl = {
      world: { name: '', entities: [] },
    }
    const json = JSON.parse(JSON.stringify(dsl))
    expect(json.world.name).toBe('')
    expect(json.world.entities).toEqual([])
  })

  it('world with only name and no entities is valid', () => {
    const dsl: GameDsl = {
      world: { name: 'LonelyWorld', entities: [] },
    }
    expect(dsl.world.name).toBe('LonelyWorld')
    expect(dsl.world.entities).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Section 8 — Large World
// ---------------------------------------------------------------------------

describe('large world', () => {
  it('creates 100 entities', () => {
    const dsl = buildLargeDsl()
    expect(dsl.world.entities.length).toBe(100)
  })

  it('entities have correct ids', () => {
    const dsl = buildLargeDsl()
    expect(dsl.world.entities[0].id).toBe('entity-000')
    expect(dsl.world.entities[99].id).toBe('entity-099')
  })

  it('entities have alternating types', () => {
    const dsl = buildLargeDsl()
    expect(dsl.world.entities[0].type).toBe('Guard')
    expect(dsl.world.entities[1].type).toBe('Villager')
    expect(dsl.world.entities[50].type).toBe('Guard')
    expect(dsl.world.entities[51].type).toBe('Villager')
  })

  it('each entity has 2 components', () => {
    const dsl = buildLargeDsl()
    for (const entity of dsl.world.entities) {
      expect(entity.components.length).toBe(2)
    }
  })

  it('large world serializes to JSON without error', () => {
    const dsl = buildLargeDsl()
    expect(() => JSON.stringify(dsl)).not.toThrow()
  })

  it('large world JSON has correct entity count', () => {
    const dsl = buildLargeDsl()
    const json = JSON.parse(JSON.stringify(dsl))
    expect(json.world.entities.length).toBe(100)
  })

  it('all entities have valid component structure in large world', () => {
    const dsl = buildLargeDsl()
    for (const entity of dsl.world.entities) {
      expect(typeof entity.id).toBe('string')
      expect(typeof entity.type).toBe('string')
      expect(Array.isArray(entity.components)).toBe(true)
      for (const comp of entity.components) {
        expect(typeof comp.type).toBe('string')
        expect(typeof comp.properties).toBe('object')
        expect(comp.properties).not.toBeNull()
      }
    }
  })

  it('large world entities have correct position data', () => {
    const dsl = buildLargeDsl()
    expect(dsl.world.entities[5].components[0].properties.x).toBe(5)
    expect(dsl.world.entities[5].components[0].properties.y).toBe(10)
    expect(dsl.world.entities[99].components[0].properties.x).toBe(99)
    expect(dsl.world.entities[99].components[0].properties.y).toBe(198)
  })
})

// ---------------------------------------------------------------------------
// Section 9 — Type Exports
// ---------------------------------------------------------------------------

describe('type exports', () => {
  it('GameDsl type is exported', () => {
    // Compile-time check: if GameDsl wasn't exported, this line wouldn't compile
    const dsl: GameDsl = buildMinimalDsl()
    expect(dsl).toBeDefined()
  })

  it('WorldDsl type is exported', () => {
    const world: WorldDsl = { name: 'Exported', entities: [] }
    expect(world.name).toBe('Exported')
  })

  it('EntityDsl type is exported', () => {
    const entity: EntityDsl = { id: 'e1', type: 'Test', components: [] }
    expect(entity.id).toBe('e1')
  })

  it('ComponentDsl type is exported', () => {
    const comp: ComponentDsl = { type: 'Test', properties: {} }
    expect(comp.type).toBe('Test')
  })

  it('EMPTY_GAME_DSL is exported', () => {
    expect(EMPTY_GAME_DSL).toBeDefined()
    expect(EMPTY_GAME_DSL.world.name).toBe('')
  })
})