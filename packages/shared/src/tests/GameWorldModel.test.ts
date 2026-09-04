/**
 * GameWorldModel — verifies the semantic game world contracts including
 * WorldType, EntityCategory, GameWorldModel, GameWorldEntity, and
 * EMPTY_GAME_WORLD_MODEL.
 *
 * WO-S8-005 — Semantic Game World DSL Foundation
 * Architecture version v1.64
 */

import { describe, it, expect } from 'vitest'
import type { GameWorldModel, GameWorldEntity, WorldType, EntityCategory } from '../game-world'
import { EMPTY_GAME_WORLD_MODEL, resolveGameplayEntityRole } from '../game-world'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a minimal farm world model. */
function createFarmModel(): GameWorldModel {
  return {
    worldType: 'farm',
    entities: [
      { id: 'player-1', category: 'player', name: 'Farmer' },
      { id: 'npc-1', category: 'npc', name: 'Villager' },
      { id: 'field-1', category: 'terrain', name: 'Wheat Field' },
    ],
  }
}

/** Create a full RPG world model with all entity categories. */
function createRpgModel(): GameWorldModel {
  return {
    worldType: 'rpg',
    entities: [
      { id: 'hero', category: 'player', name: 'Hero' },
      { id: 'sage', category: 'npc', name: 'Sage' },
      { id: 'goblin', category: 'enemy', name: 'Goblin' },
      { id: 'mountain', category: 'terrain', name: 'Dragon Mountain' },
      { id: 'tavern', category: 'building', name: 'Tavern' },
      { id: 'sword', category: 'item', name: 'Iron Sword' },
      { id: 'main-quest', category: 'quest', name: 'Defeat the Dragon' },
    ],
  }
}

/** Create a platformer world model. */
function createPlatformerModel(): GameWorldModel {
  return {
    worldType: 'platformer',
    entities: [
      { id: 'mario', category: 'player', name: 'Mario' },
      { id: 'goomba', category: 'enemy', name: 'Goomba' },
      { id: 'ground', category: 'terrain', name: 'Ground Block' },
      { id: 'coin', category: 'item', name: 'Gold Coin' },
    ],
  }
}

/** Create a survival world model. */
function createSurvivalModel(): GameWorldModel {
  return {
    worldType: 'survival',
    entities: [
      { id: 'survivor', category: 'player', name: 'Survivor' },
      { id: 'zombie', category: 'enemy', name: 'Zombie' },
      { id: 'tree', category: 'terrain', name: 'Oak Tree' },
      { id: 'shelter', category: 'building', name: 'Wooden Shelter' },
      { id: 'wood', category: 'item', name: 'Wood Plank' },
    ],
  }
}

/** Create a sandbox world model. */
function createSandboxModel(): GameWorldModel {
  return {
    worldType: 'sandbox',
    entities: [
      { id: 'builder', category: 'player', name: 'Builder' },
      { id: 'grass', category: 'terrain', name: 'Grass Block' },
      { id: 'house', category: 'building', name: 'Sand House' },
    ],
  }
}

/** Create a large world model for scale testing. */
function createLargeModel(entityCount: number): GameWorldModel {
  const entities: GameWorldEntity[] = Array.from({ length: entityCount }, (_, i) => ({
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
  it('creates a farm world model', () => {
    const model = createFarmModel()
    expect(model).toBeDefined()
    expect(model.worldType).toBe('farm')
  })

  it('creates an RPG world model', () => {
    const model = createRpgModel()
    expect(model).toBeDefined()
    expect(model.worldType).toBe('rpg')
  })

  it('creates a platformer world model', () => {
    const model = createPlatformerModel()
    expect(model).toBeDefined()
    expect(model.worldType).toBe('platformer')
  })

  it('creates a survival world model', () => {
    const model = createSurvivalModel()
    expect(model).toBeDefined()
    expect(model.worldType).toBe('survival')
  })

  it('creates a sandbox world model', () => {
    const model = createSandboxModel()
    expect(model).toBeDefined()
    expect(model.worldType).toBe('sandbox')
  })

  it('GameWorldModel has worldType property', () => {
    const model = createFarmModel()
    expect(model).toHaveProperty('worldType')
  })

  it('GameWorldModel has entities property', () => {
    const model = createFarmModel()
    expect(model).toHaveProperty('entities')
  })

  it('GameWorldEntity has id property', () => {
    const model = createFarmModel()
    expect(model.entities[0]).toHaveProperty('id')
  })

  it('GameWorldEntity has category property', () => {
    const model = createFarmModel()
    expect(model.entities[0]).toHaveProperty('category')
  })

  it('GameWorldEntity has name property', () => {
    const model = createFarmModel()
    expect(model.entities[0]).toHaveProperty('name')
  })
})

// ---------------------------------------------------------------------------
// Section 2 — World Types
// ---------------------------------------------------------------------------

describe('world types', () => {
  it('accepts farm world type', () => {
    const model: GameWorldModel = { worldType: 'farm', entities: [] }
    expect(model.worldType).toBe('farm')
  })

  it('accepts platformer world type', () => {
    const model: GameWorldModel = { worldType: 'platformer', entities: [] }
    expect(model.worldType).toBe('platformer')
  })

  it('accepts rpg world type', () => {
    const model: GameWorldModel = { worldType: 'rpg', entities: [] }
    expect(model.worldType).toBe('rpg')
  })

  it('accepts survival world type', () => {
    const model: GameWorldModel = { worldType: 'survival', entities: [] }
    expect(model.worldType).toBe('survival')
  })

  it('accepts sandbox world type', () => {
    const model: GameWorldModel = { worldType: 'sandbox', entities: [] }
    expect(model.worldType).toBe('sandbox')
  })

  it('WorldType is a string at runtime', () => {
    const model = createFarmModel()
    expect(typeof model.worldType).toBe('string')
  })

  it('worldType values are distinct', () => {
    const types: WorldType[] = ['farm', 'platformer', 'rpg', 'survival', 'sandbox']
    const uniqueTypes = new Set(types)
    expect(uniqueTypes.size).toBe(5)
  })
})

// ---------------------------------------------------------------------------
// Section 3 — Entity Categories
// ---------------------------------------------------------------------------

describe('entity categories', () => {
  it('accepts player category', () => {
    const entity: GameWorldEntity = { id: 'p1', category: 'player', name: 'Player' }
    expect(entity.category).toBe('player')
  })

  it('accepts npc category', () => {
    const entity: GameWorldEntity = { id: 'n1', category: 'npc', name: 'NPC' }
    expect(entity.category).toBe('npc')
  })

  it('accepts enemy category', () => {
    const entity: GameWorldEntity = { id: 'e1', category: 'enemy', name: 'Enemy' }
    expect(entity.category).toBe('enemy')
  })

  it('accepts terrain category', () => {
    const entity: GameWorldEntity = { id: 't1', category: 'terrain', name: 'Terrain' }
    expect(entity.category).toBe('terrain')
  })

  it('accepts building category', () => {
    const entity: GameWorldEntity = { id: 'b1', category: 'building', name: 'Building' }
    expect(entity.category).toBe('building')
  })

  it('accepts item category', () => {
    const entity: GameWorldEntity = { id: 'i1', category: 'item', name: 'Item' }
    expect(entity.category).toBe('item')
  })

  it('accepts quest category', () => {
    const entity: GameWorldEntity = { id: 'q1', category: 'quest', name: 'Quest' }
    expect(entity.category).toBe('quest')
  })

  it('EntityCategory is a string at runtime', () => {
    const entity: GameWorldEntity = { id: 'e1', category: 'player', name: 'P' }
    expect(typeof entity.category).toBe('string')
  })

  it('all 7 categories appear in RPG model', () => {
    const model = createRpgModel()
    const categories = model.entities.map(e => e.category)
    expect(categories).toContain('player')
    expect(categories).toContain('npc')
    expect(categories).toContain('enemy')
    expect(categories).toContain('terrain')
    expect(categories).toContain('building')
    expect(categories).toContain('item')
    expect(categories).toContain('quest')
  })

  it('category values are distinct', () => {
    const categories: EntityCategory[] = ['player', 'npc', 'enemy', 'terrain', 'building', 'item', 'quest']
    const uniqueCategories = new Set(categories)
    expect(uniqueCategories.size).toBe(7)
  })
})

describe('trusted gameplay role resolution', () => {
  it('keeps RPG acceptance and completion eligibility distinct from archetype names', () => {
    expect(resolveGameplayEntityRole('rpg', { category: 'quest', name: 'Quest Giver' }))
      .toBe('quest-acceptor')
    expect(resolveGameplayEntityRole('rpg', { category: 'quest', name: 'Main Quest' }))
      .toBe('quest-objective')
    expect(resolveGameplayEntityRole('rpg', { category: 'quest', name: 'Quest' }))
      .toBe('quest-objective')
    expect(resolveGameplayEntityRole('rpg', { category: 'npc', name: 'Merchant' }))
      .toBeUndefined()
    expect(resolveGameplayEntityRole('farm', { category: 'quest', name: 'Quest' }))
      .toBeUndefined()
  })

  it('derives the role from semantic name rather than concrete entity identity', () => {
    const evolvedEntity = { id: 'evolved-quest-7', category: 'quest' as const, name: 'Quest Giver' }
    const renamedEntity = { id: 'quest-giver', category: 'quest' as const, name: 'Quest' }
    expect(resolveGameplayEntityRole('rpg', evolvedEntity))
      .toBe('quest-acceptor')
    expect(resolveGameplayEntityRole('rpg', renamedEntity))
      .toBe('quest-objective')
  })
})

// ---------------------------------------------------------------------------
// Section 4 — Empty Model
// ---------------------------------------------------------------------------

describe('empty model', () => {
  it('EMPTY_GAME_WORLD_MODEL exists', () => {
    expect(EMPTY_GAME_WORLD_MODEL).toBeDefined()
  })

  it('EMPTY_GAME_WORLD_MODEL defaults to sandbox', () => {
    expect(EMPTY_GAME_WORLD_MODEL.worldType).toBe('sandbox')
  })

  it('EMPTY_GAME_WORLD_MODEL has empty entities', () => {
    expect(EMPTY_GAME_WORLD_MODEL.entities).toEqual([])
  })

  it('EMPTY_GAME_WORLD_MODEL is frozen', () => {
    expect(Object.isFrozen(EMPTY_GAME_WORLD_MODEL)).toBe(true)
  })

  it('EMPTY_GAME_WORLD_MODEL entities array is frozen', () => {
    expect(Object.isFrozen(EMPTY_GAME_WORLD_MODEL.entities)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 5 — Serialization
// ---------------------------------------------------------------------------

describe('serialization', () => {
  it('farm model serializes to JSON', () => {
    const model = createFarmModel()
    expect(() => JSON.stringify(model)).not.toThrow()
  })

  it('farm model JSON has correct structure', () => {
    const model = createFarmModel()
    const json = JSON.stringify(model)
    expect(json).toContain('"worldType"')
    expect(json).toContain('"entities"')
    expect(json).toContain('"farm"')
  })

  it('RPG model serializes to JSON', () => {
    const model = createRpgModel()
    expect(() => JSON.stringify(model)).not.toThrow()
  })

  it('RPG model JSON contains entity categories', () => {
    const model = createRpgModel()
    const json = JSON.stringify(model)
    expect(json).toContain('"player"')
    expect(json).toContain('"npc"')
    expect(json).toContain('"enemy"')
    expect(json).toContain('"terrain"')
    expect(json).toContain('"building"')
    expect(json).toContain('"item"')
    expect(json).toContain('"quest"')
  })

  it('farm model round-trips through JSON', () => {
    const original = createFarmModel()
    const parsed = JSON.parse(JSON.stringify(original))
    expect(parsed.worldType).toBe('farm')
    expect(parsed.entities).toHaveLength(3)
    expect(parsed.entities[0].id).toBe('player-1')
    expect(parsed.entities[0].category).toBe('player')
    expect(parsed.entities[0].name).toBe('Farmer')
  })

  it('RPG model round-trips through JSON', () => {
    const original = createRpgModel()
    const parsed = JSON.parse(JSON.stringify(original))
    expect(parsed.worldType).toBe('rpg')
    expect(parsed.entities).toHaveLength(7)
    expect(parsed.entities[6].id).toBe('main-quest')
    expect(parsed.entities[6].category).toBe('quest')
  })

  it('empty model serializes to JSON', () => {
    expect(() => JSON.stringify(EMPTY_GAME_WORLD_MODEL)).not.toThrow()
  })

  it('empty model JSON represents empty world', () => {
    const parsed = JSON.parse(JSON.stringify(EMPTY_GAME_WORLD_MODEL))
    expect(parsed.worldType).toBe('sandbox')
    expect(parsed.entities).toEqual([])
  })

  it('JSON values are serializable primitives', () => {
    const model = createRpgModel()
    const parsed = JSON.parse(JSON.stringify(model))
    expect(typeof parsed.worldType).toBe('string')
    expect(typeof parsed.entities[0].id).toBe('string')
    expect(typeof parsed.entities[0].category).toBe('string')
    expect(typeof parsed.entities[0].name).toBe('string')
  })
})

// ---------------------------------------------------------------------------
// Section 6 — Immutability
// ---------------------------------------------------------------------------

describe('immutability', () => {
  it('readonly prevents worldType mutation at type level', () => {
    const model = createFarmModel()
    // TypeScript ensures compile-time safety:
    // model.worldType = 'rpg' — would be a TS error
    expect(model.worldType).toBe('farm')
  })

  it('readonly prevents entity mutation at type level', () => {
    const model = createFarmModel()
    // TypeScript ensures compile-time safety:
    // model.entities = [] — would be a TS error
    // model.entities[0].id = 'new-id' — would be a TS error
    expect(model.entities).toHaveLength(3)
  })

  it('readonly prevents category mutation at type level', () => {
    const entity: GameWorldEntity = { id: 'e1', category: 'player', name: 'P' }
    // entity.category = 'enemy' — would be a TS error
    expect(entity.category).toBe('player')
  })

  it('readonly prevents name mutation at type level', () => {
    const entity: GameWorldEntity = { id: 'e1', category: 'player', name: 'P' }
    // entity.name = 'New' — would be a TS error
    expect(entity.name).toBe('P')
  })
})

// ---------------------------------------------------------------------------
// Section 7 — Determinism
// ---------------------------------------------------------------------------

describe('determinism', () => {
  it('same input produces same model structure', () => {
    const model1 = createFarmModel()
    const model2 = createFarmModel()
    expect(JSON.stringify(model1)).toBe(JSON.stringify(model2))
  })

  it('same input across world types is deterministic', () => {
    const rpg1 = createRpgModel()
    const rpg2 = createRpgModel()
    expect(JSON.stringify(rpg1)).toBe(JSON.stringify(rpg2))
  })

  it('platformer model is deterministic', () => {
    const p1 = createPlatformerModel()
    const p2 = createPlatformerModel()
    expect(JSON.stringify(p1)).toBe(JSON.stringify(p2))
  })

  it('survival model is deterministic', () => {
    const s1 = createSurvivalModel()
    const s2 = createSurvivalModel()
    expect(JSON.stringify(s1)).toBe(JSON.stringify(s2))
  })

  it('sandbox model is deterministic', () => {
    const s1 = createSandboxModel()
    const s2 = createSandboxModel()
    expect(JSON.stringify(s1)).toBe(JSON.stringify(s2))
  })

  it('entity order is deterministic', () => {
    const model1 = createRpgModel()
    const model2 = createRpgModel()
    for (let i = 0; i < model1.entities.length; i++) {
      expect(model1.entities[i].id).toBe(model2.entities[i].id)
      expect(model1.entities[i].category).toBe(model2.entities[i].category)
    }
  })

  it('empty model is deterministic', () => {
    const json1 = JSON.stringify(EMPTY_GAME_WORLD_MODEL)
    const json2 = JSON.stringify(EMPTY_GAME_WORLD_MODEL)
    expect(json1).toBe(json2)
  })
})

// ---------------------------------------------------------------------------
// Section 8 — Entity Structure
// ---------------------------------------------------------------------------

describe('entity structure', () => {
  it('entity has exactly 3 properties (id, category, name)', () => {
    const entity: GameWorldEntity = { id: 'e1', category: 'player', name: 'Test' }
    const keys = Object.keys(entity)
    expect(keys).toEqual(['id', 'category', 'name'])
  })

  it('entity id is preserved as string', () => {
    const entity: GameWorldEntity = { id: 'hero-001', category: 'player', name: 'Hero' }
    expect(entity.id).toBe('hero-001')
  })

  it('entity category is preserved', () => {
    const entity: GameWorldEntity = { id: 'e1', category: 'enemy', name: 'Goblin' }
    expect(entity.category).toBe('enemy')
  })

  it('entity name is preserved', () => {
    const entity: GameWorldEntity = { id: 'e1', category: 'npc', name: 'Village Elder' }
    expect(entity.name).toBe('Village Elder')
  })

  it('entity name can contain special characters', () => {
    const entity: GameWorldEntity = { id: 'q1', category: 'quest', name: 'The Hero\'s Journey: Part 1' }
    expect(entity.name).toBe('The Hero\'s Journey: Part 1')
  })

  it('entity ids are unique in model', () => {
    const model = createRpgModel()
    const ids = model.entities.map(e => e.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })
})

// ---------------------------------------------------------------------------
// Section 9 — Large Models
// ---------------------------------------------------------------------------

describe('large models', () => {
  it('handles 100 entities', () => {
    const model = createLargeModel(100)
    expect(model.entities).toHaveLength(100)
    expect(model.worldType).toBe('sandbox')
  })

  it('handles 1000 entities', () => {
    const model = createLargeModel(1000)
    expect(model.entities).toHaveLength(1000)
    expect(model.entities[999].id).toBe('entity-999')
  })

  it('large model entity categories are preserved', () => {
    const model = createLargeModel(100)
    for (let i = 0; i < 100; i++) {
      if (i % 2 === 0) {
        expect(model.entities[i].category).toBe('terrain')
      } else {
        expect(model.entities[i].category).toBe('item')
      }
    }
  })

  it('large model entity names are preserved', () => {
    const model = createLargeModel(50)
    expect(model.entities[42].name).toBe('Entity 42')
  })

  it('large model serializes to JSON', () => {
    const model = createLargeModel(100)
    expect(() => JSON.stringify(model)).not.toThrow()
  })

  it('large model round-trips through JSON', () => {
    const model = createLargeModel(200)
    const parsed = JSON.parse(JSON.stringify(model))
    expect(parsed.entities).toHaveLength(200)
    expect(parsed.worldType).toBe('sandbox')
  })
})

// ---------------------------------------------------------------------------
// Section 10 — Type Exports
// ---------------------------------------------------------------------------

describe('type exports', () => {
  it('GameWorldModel type is exported', () => {
    const model: GameWorldModel = { worldType: 'rpg', entities: [] }
    expect(model).toBeDefined()
  })

  it('GameWorldEntity type is exported', () => {
    const entity: GameWorldEntity = { id: 'e1', category: 'player', name: 'Hero' }
    expect(entity).toBeDefined()
  })

  it('WorldType type is exported', () => {
    const worldType: WorldType = 'farm'
    expect(worldType).toBe('farm')
  })

  it('EntityCategory type is exported', () => {
    const category: EntityCategory = 'building'
    expect(category).toBe('building')
  })

  it('EMPTY_GAME_WORLD_MODEL is exported', () => {
    expect(EMPTY_GAME_WORLD_MODEL).toBeDefined()
    expect(EMPTY_GAME_WORLD_MODEL.worldType).toBe('sandbox')
  })

  it('all five WorldType values are assignable', () => {
    const types: WorldType[] = ['farm', 'platformer', 'rpg', 'survival', 'sandbox']
    expect(types).toHaveLength(5)
  })

  it('all seven EntityCategory values are assignable', () => {
    const categories: EntityCategory[] = ['player', 'npc', 'enemy', 'terrain', 'building', 'item', 'quest']
    expect(categories).toHaveLength(7)
  })
})
