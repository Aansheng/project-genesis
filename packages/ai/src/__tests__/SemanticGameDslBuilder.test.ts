/**
 * SemanticGameDslBuilder — verifies the DefaultSemanticGameDslBuilder
 * implementation for converting GameWorldModel → GameDsl.
 *
 * WO-S8-006 — Semantic World To Game DSL Builder Foundation
 * Architecture version v1.65
 */

import { describe, it, expect } from 'vitest'
import { DefaultSemanticGameDslBuilder } from '../game-world'
import type { SemanticGameDslBuilder } from '../game-world'
import type {
  GameWorldModel,
  GameWorldEntity,
  WorldType,
  EntityCategory,
  GameDsl,
} from '@genesis/shared'
import { EMPTY_GAME_WORLD_MODEL } from '@genesis/shared'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createBuilder(): SemanticGameDslBuilder {
  return new DefaultSemanticGameDslBuilder()
}

/** Create an entity helper. */
function entity(
  id: string,
  category: EntityCategory,
  name: string,
): GameWorldEntity {
  return { id, category, name }
}

/** Create a farm world model. */
function createFarmWorld(): GameWorldModel {
  return {
    worldType: 'farm',
    entities: [
      entity('player-1', 'player', 'Farmer'),
      entity('npc-1', 'npc', 'Villager'),
      entity('field-1', 'terrain', 'Wheat Field'),
      entity('barn-1', 'building', 'Barn'),
    ],
  }
}

/** Create an RPG world model with all category types. */
function createRpgWorld(): GameWorldModel {
  return {
    worldType: 'rpg',
    entities: [
      entity('hero', 'player', 'Hero'),
      entity('sage', 'npc', 'Sage'),
      entity('goblin', 'enemy', 'Goblin'),
      entity('mountain', 'terrain', 'Dragon Mountain'),
      entity('tavern', 'building', 'Tavern'),
      entity('sword', 'item', 'Iron Sword'),
      entity('main-quest', 'quest', 'Defeat the Dragon'),
    ],
  }
}

/** Create a platformer world model. */
function createPlatformerWorld(): GameWorldModel {
  return {
    worldType: 'platformer',
    entities: [
      entity('mario', 'player', 'Mario'),
      entity('goomba', 'enemy', 'Goomba'),
      entity('ground', 'terrain', 'Ground Block'),
      entity('coin', 'item', 'Gold Coin'),
    ],
  }
}

/** Create a survival world model. */
function createSurvivalWorld(): GameWorldModel {
  return {
    worldType: 'survival',
    entities: [
      entity('survivor', 'player', 'Survivor'),
      entity('zombie', 'enemy', 'Zombie'),
      entity('tree', 'terrain', 'Oak Tree'),
    ],
  }
}

/** Create a sandbox world model. */
function createSandboxWorld(): GameWorldModel {
  return {
    worldType: 'sandbox',
    entities: [
      entity('builder', 'player', 'Builder'),
      entity('grass', 'terrain', 'Grass Block'),
      entity('house', 'building', 'Sand House'),
    ],
  }
}

/** Create a world with many entities. */
function createLargeWorld(count: number): GameWorldModel {
  const entities: GameWorldEntity[] = Array.from({ length: count }, (_, i) => ({
    id: `entity-${i}`,
    category: i % 2 === 0 ? 'terrain' : 'item',
    name: `Entity ${i}`,
  }))
  return { worldType: 'sandbox', entities }
}

// ---------------------------------------------------------------------------
// Section 1 — Construction
// ---------------------------------------------------------------------------

describe('construction', () => {
  it('creates builder without error', () => {
    const builder = createBuilder()
    expect(builder).toBeDefined()
  })

  it('builder implements SemanticGameDslBuilder interface', () => {
    const builder = createBuilder()
    expect(typeof builder.build).toBe('function')
  })

  it('build method accepts GameWorldModel', () => {
    const builder = createBuilder()
    const result = builder.build(createFarmWorld())
    expect(result).toBeDefined()
  })

  it('build method returns GameDsl', () => {
    const result = createBuilder().build(createFarmWorld())
    expect(typeof result).toBe('object')
    expect(result).not.toBeNull()
    expect(result).toHaveProperty('world')
  })

  it('build method returns object with world property', () => {
    const result = createBuilder().build(createFarmWorld())
    expect(result.world).toBeDefined()
    expect(result.world).toHaveProperty('name')
    expect(result.world).toHaveProperty('entities')
  })
})

// ---------------------------------------------------------------------------
// Section 2 — Empty World
// ---------------------------------------------------------------------------

describe('empty world', () => {
  it('EMPTY_GAME_WORLD_MODEL produces "Sandbox World" name', () => {
    const result = createBuilder().build(EMPTY_GAME_WORLD_MODEL)
    expect(result.world.name).toBe('Sandbox World')
  })

  it('EMPTY_GAME_WORLD_MODEL produces zero entities', () => {
    const result = createBuilder().build(EMPTY_GAME_WORLD_MODEL)
    expect(result.world.entities).toHaveLength(0)
  })

  it('world with empty entities array produces zero entities', () => {
    const model: GameWorldModel = { worldType: 'farm', entities: [] }
    const result = createBuilder().build(model)
    expect(result.world.entities).toHaveLength(0)
  })

  it('world with empty entities array has correct name', () => {
    const model: GameWorldModel = { worldType: 'rpg', entities: [] }
    const result = createBuilder().build(model)
    expect(result.world.name).toBe('RPG World')
  })

  it('undefined world produces empty DSL', () => {
    const result = createBuilder().build(undefined as unknown as GameWorldModel)
    expect(result.world.name).toBe('')
    expect(result.world.entities).toHaveLength(0)
  })

  it('null world produces empty DSL', () => {
    const result = createBuilder().build(null as unknown as GameWorldModel)
    expect(result.world.name).toBe('')
    expect(result.world.entities).toHaveLength(0)
  })

  it('non-object world produces empty DSL', () => {
    const result = createBuilder().build('invalid' as unknown as GameWorldModel)
    expect(result.world.name).toBe('')
    expect(result.world.entities).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Section 3 — All World Types
// ---------------------------------------------------------------------------

describe('all world types', () => {
  it('farm world type produces "Farm World" name', () => {
    const result = createBuilder().build(createFarmWorld())
    expect(result.world.name).toBe('Farm World')
  })

  it('platformer world type produces "Platformer World" name', () => {
    const result = createBuilder().build(createPlatformerWorld())
    expect(result.world.name).toBe('Platformer World')
  })

  it('rpg world type produces "RPG World" name', () => {
    const result = createBuilder().build(createRpgWorld())
    expect(result.world.name).toBe('RPG World')
  })

  it('survival world type produces "Survival World" name', () => {
    const result = createBuilder().build(createSurvivalWorld())
    expect(result.world.name).toBe('Survival World')
  })

  it('sandbox world type produces "Sandbox World" name', () => {
    const result = createBuilder().build(createSandboxWorld())
    expect(result.world.name).toBe('Sandbox World')
  })

  it('unknown world type falls back to "Game World"', () => {
    const model: GameWorldModel = {
      worldType: 'unknown' as WorldType,
      entities: [],
    }
    const result = createBuilder().build(model)
    expect(result.world.name).toBe('Game World')
  })

  it('world name is a string', () => {
    const result = createBuilder().build(createRpgWorld())
    expect(typeof result.world.name).toBe('string')
  })
})

// ---------------------------------------------------------------------------
// Section 4 — All Entity Categories
// ---------------------------------------------------------------------------

describe('all entity categories', () => {
  it('player category maps to entity type', () => {
    const result = createBuilder().build(createRpgWorld())
    const hero = result.world.entities[0]
    expect(hero.type).toBe('player')
  })

  it('npc category maps to entity type', () => {
    const result = createBuilder().build(createRpgWorld())
    const sage = result.world.entities[1]
    expect(sage.type).toBe('npc')
  })

  it('enemy category maps to entity type', () => {
    const result = createBuilder().build(createRpgWorld())
    const goblin = result.world.entities[2]
    expect(goblin.type).toBe('enemy')
  })

  it('terrain category maps to entity type', () => {
    const result = createBuilder().build(createRpgWorld())
    const mountain = result.world.entities[3]
    expect(mountain.type).toBe('terrain')
  })

  it('building category maps to entity type', () => {
    const result = createBuilder().build(createRpgWorld())
    const tavern = result.world.entities[4]
    expect(tavern.type).toBe('building')
  })

  it('item category maps to entity type', () => {
    const result = createBuilder().build(createRpgWorld())
    const sword = result.world.entities[5]
    expect(sword.type).toBe('item')
  })

  it('quest category maps to entity type', () => {
    const result = createBuilder().build(createRpgWorld())
    const quest = result.world.entities[6]
    expect(quest.type).toBe('quest')
  })

  it('all 7 categories appear in RPG world output', () => {
    const result = createBuilder().build(createRpgWorld())
    const types = result.world.entities.map(e => e.type)
    expect(types).toContain('player')
    expect(types).toContain('npc')
    expect(types).toContain('enemy')
    expect(types).toContain('terrain')
    expect(types).toContain('building')
    expect(types).toContain('item')
    expect(types).toContain('quest')
  })
})

// ---------------------------------------------------------------------------
// Section 5 — Entity Mapping
// ---------------------------------------------------------------------------

describe('entity mapping', () => {
  it('entity id is preserved from GameWorldEntity', () => {
    const result = createBuilder().build(createFarmWorld())
    expect(result.world.entities[0].id).toBe('player-1')
    expect(result.world.entities[1].id).toBe('npc-1')
  })

  it('entity type is derived from category', () => {
    const result = createBuilder().build(createFarmWorld())
    expect(result.world.entities[0].type).toBe('player')
    expect(result.world.entities[1].type).toBe('npc')
    expect(result.world.entities[2].type).toBe('terrain')
  })

  it('entity count matches input entity count', () => {
    const result = createBuilder().build(createFarmWorld())
    expect(result.world.entities.length).toBe(4)
  })

  it('entity id preserves special characters', () => {
    const model: GameWorldModel = {
      worldType: 'rpg',
      entities: [entity('hero-001', 'player', 'Hero')],
    }
    const result = createBuilder().build(model)
    expect(result.world.entities[0].id).toBe('hero-001')
  })

  it('entity order matches input entity order', () => {
    const result = createBuilder().build(createRpgWorld())
    expect(result.world.entities[0].id).toBe('hero')
    expect(result.world.entities[1].id).toBe('sage')
    expect(result.world.entities[2].id).toBe('goblin')
    expect(result.world.entities[3].id).toBe('mountain')
    expect(result.world.entities[4].id).toBe('tavern')
    expect(result.world.entities[5].id).toBe('sword')
    expect(result.world.entities[6].id).toBe('main-quest')
  })

  it('entity id is converted to string', () => {
    const model: GameWorldModel = {
      worldType: 'sandbox',
      entities: [{ id: 42 as unknown as string, category: 'item', name: 'Item' }],
    }
    const result = createBuilder().build(model)
    expect(result.world.entities[0].id).toBe('42')
  })

  it('null entity id produces empty string', () => {
    const model: GameWorldModel = {
      worldType: 'sandbox',
      entities: [{ id: null as unknown as string, category: 'item', name: 'Item' }],
    }
    const result = createBuilder().build(model)
    expect(result.world.entities[0].id).toBe('')
  })

  it('null entity is skipped', () => {
    const model: GameWorldModel = {
      worldType: 'sandbox',
      entities: [
        entity('e1', 'player', 'P1'),
        null as unknown as GameWorldEntity,
        entity('e2', 'item', 'P2'),
      ],
    }
    const result = createBuilder().build(model)
    expect(result.world.entities).toHaveLength(2)
    expect(result.world.entities[0].id).toBe('e1')
    expect(result.world.entities[1].id).toBe('e2')
  })
})

// ---------------------------------------------------------------------------
// Section 6 — Component Mapping
// ---------------------------------------------------------------------------

describe('component mapping', () => {
  it('each entity has semantic and position components', () => {
    const result = createBuilder().build(createRpgWorld())
    for (const entity of result.world.entities) {
      expect(entity.components).toHaveLength(2)
    }
  })

  it('component type is "semantic"', () => {
    const result = createBuilder().build(createRpgWorld())
    for (const entity of result.world.entities) {
      expect(entity.components[0].type).toBe('semantic')
    }
  })

  it('position component defaults inside the visible canvas', () => {
    const result = createBuilder().build(createRpgWorld())
    for (const entity of result.world.entities) {
      expect(entity.components[1]).toEqual({
        type: 'position',
        properties: { x: 100, y: 100 },
      })
    }
  })

  it('component properties contain category', () => {
    const result = createBuilder().build(createRpgWorld())
    expect(result.world.entities[0].components[0].properties.category).toBe('player')
    expect(result.world.entities[1].components[0].properties.category).toBe('npc')
    expect(result.world.entities[2].components[0].properties.category).toBe('enemy')
  })

  it('component properties contain name', () => {
    const result = createBuilder().build(createRpgWorld())
    expect(result.world.entities[0].components[0].properties.name).toBe('Hero')
    expect(result.world.entities[1].components[0].properties.name).toBe('Sage')
    expect(result.world.entities[2].components[0].properties.name).toBe('Goblin')
  })

  it('semantic component preserves both category and name', () => {
    const result = createBuilder().build(createRpgWorld())
    const hero = result.world.entities[0]
    const comp = hero.components[0]
    expect(comp.properties.category).toBe(hero.type)
    expect(comp.properties.name).not.toBe(hero.type) // name is different from category
  })

  it('farm entities have correct semantic components', () => {
    const result = createBuilder().build(createFarmWorld())
    expect(result.world.entities[0].components[0].properties.name).toBe('Farmer')
    expect(result.world.entities[1].components[0].properties.name).toBe('Villager')
    expect(result.world.entities[2].components[0].properties.name).toBe('Wheat Field')
    expect(result.world.entities[3].components[0].properties.name).toBe('Barn')
  })

  it('component properties contain category as enum value', () => {
    const result = createBuilder().build(createRpgWorld())
    expect(result.world.entities[5].components[0].properties.category).toBe('item')
    expect(result.world.entities[6].components[0].properties.category).toBe('quest')
  })

  it('component properties contain name as human-readable string', () => {
    const result = createBuilder().build(createRpgWorld())
    expect(result.world.entities[5].components[0].properties.name).toBe('Iron Sword')
    expect(result.world.entities[6].components[0].properties.name).toBe('Defeat the Dragon')
  })
})

// ---------------------------------------------------------------------------
// Section 7 — Immutability
// ---------------------------------------------------------------------------

describe('immutability', () => {
  it('result GameDsl is frozen', () => {
    const result = createBuilder().build(createRpgWorld())
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('world is frozen', () => {
    const result = createBuilder().build(createRpgWorld())
    expect(Object.isFrozen(result.world)).toBe(true)
  })

  it('entities array is frozen', () => {
    const result = createBuilder().build(createRpgWorld())
    expect(Object.isFrozen(result.world.entities)).toBe(true)
  })

  it('each entity is frozen', () => {
    const result = createBuilder().build(createRpgWorld())
    for (const entity of result.world.entities) {
      expect(Object.isFrozen(entity)).toBe(true)
    }
  })

  it('each entity components array is frozen', () => {
    const result = createBuilder().build(createRpgWorld())
    for (const entity of result.world.entities) {
      expect(Object.isFrozen(entity.components)).toBe(true)
    }
  })

  it('each component is frozen', () => {
    const result = createBuilder().build(createRpgWorld())
    for (const entity of result.world.entities) {
      for (const component of entity.components) {
        expect(Object.isFrozen(component)).toBe(true)
      }
    }
  })

  it('each component properties is frozen', () => {
    const result = createBuilder().build(createRpgWorld())
    for (const entity of result.world.entities) {
      for (const component of entity.components) {
        expect(Object.isFrozen(component.properties)).toBe(true)
      }
    }
  })

  it('empty result is frozen', () => {
    const result = createBuilder().build(undefined as unknown as GameWorldModel)
    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result.world)).toBe(true)
    expect(Object.isFrozen(result.world.entities)).toBe(true)
  })

  it('does not mutate input world model', () => {
    const builder = createBuilder()
    const model = createRpgWorld()
    const before = JSON.stringify(model)
    builder.build(model)
    expect(JSON.stringify(model)).toBe(before)
  })

  it('accepts frozen input without error', () => {
    const model = Object.freeze({
      worldType: 'rpg' as const,
      entities: Object.freeze([
        Object.freeze({ id: 'hero', category: 'player' as const, name: 'Hero' }),
      ]),
    })
    expect(() => createBuilder().build(model)).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// Section 8 — Determinism
// ---------------------------------------------------------------------------

describe('determinism', () => {
  it('same input produces same result', () => {
    const builder = createBuilder()
    const model = createRpgWorld()
    const first = builder.build(model)
    const second = builder.build(model)
    expect(JSON.stringify(first)).toBe(JSON.stringify(second))
  })

  it('different builders with same input produce same result', () => {
    const model = createRpgWorld()
    const result1 = createBuilder().build(model)
    const result2 = createBuilder().build(model)
    expect(JSON.stringify(result1)).toBe(JSON.stringify(result2))
  })

  it('deterministic with farm world', () => {
    const model = createFarmWorld()
    const r1 = createBuilder().build(model)
    const r2 = createBuilder().build(model)
    expect(JSON.stringify(r1)).toBe(JSON.stringify(r2))
  })

  it('deterministic with platformer world', () => {
    const model = createPlatformerWorld()
    const r1 = createBuilder().build(model)
    const r2 = createBuilder().build(model)
    expect(JSON.stringify(r1)).toBe(JSON.stringify(r2))
  })

  it('entity order is deterministic', () => {
    const model = createRpgWorld()
    const result1 = createBuilder().build(model)
    const result2 = createBuilder().build(model)
    for (let i = 0; i < 7; i++) {
      expect(result1.world.entities[i].id).toBe(result2.world.entities[i].id)
    }
  })

  it('component properties are deterministic', () => {
    const model = createRpgWorld()
    const result1 = createBuilder().build(model)
    const result2 = createBuilder().build(model)
    for (let i = 0; i < 7; i++) {
      expect(
        JSON.stringify(result1.world.entities[i].components[0].properties),
      ).toBe(JSON.stringify(result2.world.entities[i].components[0].properties))
    }
  })

  it('empty world is deterministic', () => {
    const result1 = createBuilder().build(EMPTY_GAME_WORLD_MODEL)
    const result2 = createBuilder().build(EMPTY_GAME_WORLD_MODEL)
    expect(JSON.stringify(result1)).toBe(JSON.stringify(result2))
  })
})

// ---------------------------------------------------------------------------
// Section 9 — Serialization
// ---------------------------------------------------------------------------

describe('serialization', () => {
  it('full model serializes to JSON without error', () => {
    const result = createBuilder().build(createRpgWorld())
    expect(() => JSON.stringify(result)).not.toThrow()
  })

  it('full model JSON contains world key', () => {
    const result = createBuilder().build(createRpgWorld())
    const json = JSON.stringify(result)
    expect(json).toContain('world')
  })

  it('full model JSON contains entities array', () => {
    const result = createBuilder().build(createRpgWorld())
    const json = JSON.stringify(result)
    expect(json).toContain('entities')
  })

  it('full model JSON contains world name', () => {
    const result = createBuilder().build(createRpgWorld())
    const json = JSON.stringify(result)
    expect(json).toContain('RPG World')
  })

  it('entity types appear in JSON', () => {
    const result = createBuilder().build(createRpgWorld())
    const json = JSON.stringify(result)
    expect(json).toContain('"player"')
    expect(json).toContain('"enemy"')
    expect(json).toContain('"item"')
  })

  it('semantic component appears in JSON', () => {
    const result = createBuilder().build(createRpgWorld())
    const json = JSON.stringify(result)
    expect(json).toContain('"semantic"')
    expect(json).toContain('"category"')
    expect(json).toContain('"name"')
  })

  it('empty model serializes to JSON', () => {
    const result = createBuilder().build(EMPTY_GAME_WORLD_MODEL)
    expect(() => JSON.stringify(result)).not.toThrow()
  })

  it('full model round-trips through JSON', () => {
    const original = createBuilder().build(createRpgWorld())
    const json = JSON.stringify(original)
    const parsed = JSON.parse(json)
    expect(parsed.world.name).toBe('RPG World')
    expect(parsed.world.entities).toHaveLength(7)
    expect(parsed.world.entities[0].id).toBe('hero')
    expect(parsed.world.entities[0].type).toBe('player')
    expect(parsed.world.entities[0].components[0].type).toBe('semantic')
    expect(parsed.world.entities[0].components[0].properties.category).toBe('player')
    expect(parsed.world.entities[0].components[0].properties.name).toBe('Hero')
  })

  it('model values are JSON-serializable primitives', () => {
    const result = createBuilder().build(createRpgWorld())
    const json = JSON.parse(JSON.stringify(result))
    expect(typeof json.world.name).toBe('string')
    expect(typeof json.world.entities[0].id).toBe('string')
    expect(typeof json.world.entities[0].type).toBe('string')
  })
})

// ---------------------------------------------------------------------------
// Section 10 — Large Worlds
// ---------------------------------------------------------------------------

describe('large worlds', () => {
  it('handles 100 entities', () => {
    const model = createLargeWorld(100)
    const result = createBuilder().build(model)
    expect(result.world.entities).toHaveLength(100)
  })

  it('handles 1000 entities', () => {
    const model = createLargeWorld(1000)
    const result = createBuilder().build(model)
    expect(result.world.entities).toHaveLength(1000)
  })

  it('large world entity ids are preserved', () => {
    const result = createBuilder().build(createLargeWorld(100))
    expect(result.world.entities[50].id).toBe('entity-50')
    expect(result.world.entities[99].id).toBe('entity-99')
  })

  it('large world entity types are correct', () => {
    const result = createBuilder().build(createLargeWorld(100))
    for (let i = 0; i < 100; i++) {
      expect(result.world.entities[i].type).toBe(i % 2 === 0 ? 'terrain' : 'item')
    }
  })

  it('large world semantic components are preserved', () => {
    const result = createBuilder().build(createLargeWorld(100))
    for (let i = 0; i < 100; i++) {
      const comp = result.world.entities[i].components[0]
      expect(comp.properties.category).toBe(i % 2 === 0 ? 'terrain' : 'item')
      expect(comp.properties.name).toBe(`Entity ${i}`)
    }
  })

  it('large world serializes to JSON', () => {
    const result = createBuilder().build(createLargeWorld(100))
    expect(() => JSON.stringify(result)).not.toThrow()
  })

  it('large world maintains frozen output', () => {
    const result = createBuilder().build(createLargeWorld(100))
    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result.world)).toBe(true)
    expect(Object.isFrozen(result.world.entities)).toBe(true)
    for (const entity of result.world.entities) {
      expect(Object.isFrozen(entity)).toBe(true)
      expect(Object.isFrozen(entity.components)).toBe(true)
      expect(Object.isFrozen(entity.components[0])).toBe(true)
      expect(Object.isFrozen(entity.components[0].properties)).toBe(true)
    }
  })

  it('large world world name is correct', () => {
    const result = createBuilder().build(createLargeWorld(50))
    expect(result.world.name).toBe('Sandbox World')
  })
})

// ---------------------------------------------------------------------------
// Section 11 — Edge Cases
// ---------------------------------------------------------------------------

describe('edge cases', () => {
  it('entity category is converted to string', () => {
    const model: GameWorldModel = {
      worldType: 'sandbox',
      entities: [entity('e1', 'player' as EntityCategory, 'Test')],
    }
    const result = createBuilder().build(model)
    expect(typeof result.world.entities[0].type).toBe('string')
  })

  it('entity with empty name is handled', () => {
    const model: GameWorldModel = {
      worldType: 'sandbox',
      entities: [entity('e1', 'item', '')],
    }
    const result = createBuilder().build(model)
    expect(result.world.entities[0].components[0].properties.name).toBe('')
  })

  it('builder is stateless across calls', () => {
    const builder = createBuilder()
    const farm = builder.build(createFarmWorld())
    const rpg = builder.build(createRpgWorld())
    // First result should not be affected by second call
    expect(farm.world.name).toBe('Farm World')
    expect(farm.world.entities).toHaveLength(4)
    // Second result should have its own data
    expect(rpg.world.name).toBe('RPG World')
    expect(rpg.world.entities).toHaveLength(7)
  })

  it('multiple entities with same category all get correct type', () => {
    const model: GameWorldModel = {
      worldType: 'rpg',
      entities: [
        entity('player-1', 'player', 'Hero'),
        entity('player-2', 'player', 'Sidekick'),
        entity('npc-1', 'npc', 'Merchant'),
        entity('npc-2', 'npc', 'Blacksmith'),
      ],
    }
    const result = createBuilder().build(model)
    expect(result.world.entities[0].type).toBe('player')
    expect(result.world.entities[1].type).toBe('player')
    expect(result.world.entities[2].type).toBe('npc')
    expect(result.world.entities[3].type).toBe('npc')
  })

  it('semantic component type is always "semantic"', () => {
    const result = createBuilder().build(createRpgWorld())
    for (const entity of result.world.entities) {
      expect(entity.components[0].type).toBe('semantic')
    }
  })

  it('all entities have semantic and position components', () => {
    const result = createBuilder().build(createRpgWorld())
    for (const entity of result.world.entities) {
      expect(entity.components).toHaveLength(2)
    }
  })
})
