/**
 * WorldTemplateCatalog.test.ts — comprehensive test suite for the
 * WorldTemplateCatalog interfaces and DefaultWorldTemplateCatalog.
 *
 * WO-S8-013 — Semantic World Generator Enrichment Foundation
 * Architecture version v1.76 → v1.77
 *
 * Coverage:
 *   - All templates exist
 *   - Entity counts per template
 *   - Entity IDs per template
 *   - Entity categories per template
 *   - Entity names per template
 *   - Immutability
 *   - Determinism
 *   - Frozen outputs
 *   - Catalog interface contract
 *   - Every WorldType has a template
 */

import { describe, it, expect } from 'vitest'
import { DefaultWorldTemplateCatalog } from '../game-world/catalog'
import type { WorldTemplateCatalog } from '../game-world/catalog'
import type { WorldType } from '@genesis/shared'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createCatalog(): WorldTemplateCatalog {
  return new DefaultWorldTemplateCatalog()
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('WorldTemplateCatalog — All Templates', () => {
  it('catalog provides template for farm world type', () => {
    const catalog = createCatalog()
    const template = catalog.getTemplate('farm')
    expect(template).toBeDefined()
    expect(template.worldType).toBe('farm')
  })

  it('catalog provides template for rpg world type', () => {
    const catalog = createCatalog()
    const template = catalog.getTemplate('rpg')
    expect(template.worldType).toBe('rpg')
  })

  it('catalog provides template for platformer world type', () => {
    const catalog = createCatalog()
    const template = catalog.getTemplate('platformer')
    expect(template.worldType).toBe('platformer')
  })

  it('catalog provides template for survival world type', () => {
    const catalog = createCatalog()
    const template = catalog.getTemplate('survival')
    expect(template.worldType).toBe('survival')
  })

  it('catalog provides template for sandbox world type', () => {
    const catalog = createCatalog()
    const template = catalog.getTemplate('sandbox')
    expect(template.worldType).toBe('sandbox')
  })

  it('every WorldType returns a defined template', () => {
    const catalog = createCatalog()
    const types: WorldType[] = ['farm', 'rpg', 'platformer', 'survival', 'sandbox']
    for (const worldType of types) {
      const template = catalog.getTemplate(worldType)
      expect(template).toBeDefined()
      expect(template.entities).toBeDefined()
    }
  })
})

describe('WorldTemplateCatalog — Entity Counts', () => {
  it('farm template has 8 entities', () => {
    const template = createCatalog().getTemplate('farm')
    expect(template.entities).toHaveLength(8)
  })

  it('rpg template has 9 entities', () => {
    const template = createCatalog().getTemplate('rpg')
    expect(template.entities).toHaveLength(9)
  })

  it('platformer template has 7 entities including a collectible', () => {
    const template = createCatalog().getTemplate('platformer')
    expect(template.entities).toHaveLength(7)
  })

  it('survival template has 6 entities', () => {
    const template = createCatalog().getTemplate('survival')
    expect(template.entities).toHaveLength(6)
  })

  it('sandbox template has 1 entity', () => {
    const template = createCatalog().getTemplate('sandbox')
    expect(template.entities).toHaveLength(1)
  })
})

describe('WorldTemplateCatalog — Farm Template', () => {
  it('has correct entity ids in order', () => {
    const template = createCatalog().getTemplate('farm')
    const ids = template.entities.map((e) => e.id)
    expect(ids).toEqual([
      'player',
      'merchant',
      'farmer',
      'barn',
      'wheat-field',
      'corn-field',
      'storage',
      'harvest-quest',
    ])
  })

  it('has correct entity categories', () => {
    const template = createCatalog().getTemplate('farm')
    const categories = template.entities.map((e) => e.category)
    expect(categories).toEqual([
      'player',
      'npc',
      'npc',
      'building',
      'terrain',
      'terrain',
      'building',
      'quest',
    ])
  })

  it('has correct entity names', () => {
    const template = createCatalog().getTemplate('farm')
    const names = template.entities.map((e) => e.name)
    expect(names).toEqual([
      'Player',
      'Merchant',
      'Farmer',
      'Barn',
      'Wheat Field',
      'Corn Field',
      'Storage',
      'Harvest Quest',
    ])
  })

  it('contains farmer entity', () => {
    const template = createCatalog().getTemplate('farm')
    const farmer = template.entities.find((e) => e.id === 'farmer')
    expect(farmer).toBeDefined()
    expect(farmer!.category).toBe('npc')
    expect(farmer!.name).toBe('Farmer')
  })

  it('contains barn and storage buildings', () => {
    const template = createCatalog().getTemplate('farm')
    const buildings = template.entities.filter((e) => e.category === 'building')
    expect(buildings).toHaveLength(2)
    expect(buildings[0].id).toBe('barn')
    expect(buildings[1].id).toBe('storage')
  })

  it('contains wheat-field and corn-field terrain', () => {
    const template = createCatalog().getTemplate('farm')
    const terrain = template.entities.filter((e) => e.category === 'terrain')
    expect(terrain).toHaveLength(2)
    expect(terrain[0].id).toBe('wheat-field')
    expect(terrain[1].id).toBe('corn-field')
  })
})

describe('WorldTemplateCatalog — RPG Template', () => {
  it('has correct entity ids in order', () => {
    const template = createCatalog().getTemplate('rpg')
    const ids = template.entities.map((e) => e.id)
    expect(ids).toEqual([
      'player',
      'villager',
      'merchant',
      'quest-giver',
      'enemy',
      'boss',
      'town',
      'forest',
      'main-quest',
    ])
  })

  it('has correct entity categories', () => {
    const template = createCatalog().getTemplate('rpg')
    const categories = template.entities.map((e) => e.category)
    expect(categories).toEqual([
      'player',
      'npc',
      'npc',
      'quest',
      'enemy',
      'enemy',
      'building',
      'terrain',
      'quest',
    ])
  })

  it('has correct entity names', () => {
    const template = createCatalog().getTemplate('rpg')
    const names = template.entities.map((e) => e.name)
    expect(names).toEqual([
      'Player',
      'Villager',
      'Merchant',
      'Quest Giver',
      'Enemy',
      'Boss',
      'Town',
      'Forest',
      'Main Quest',
    ])
  })

  it('contains boss enemy', () => {
    const template = createCatalog().getTemplate('rpg')
    const boss = template.entities.find((e) => e.id === 'boss')
    expect(boss).toBeDefined()
    expect(boss!.category).toBe('enemy')
    expect(boss!.name).toBe('Boss')
  })

  it('has two quest entities', () => {
    const template = createCatalog().getTemplate('rpg')
    const quests = template.entities.filter((e) => e.category === 'quest')
    expect(quests).toHaveLength(2)
    expect(quests[0].id).toBe('quest-giver')
    expect(quests[1].id).toBe('main-quest')
  })
})

describe('WorldTemplateCatalog — Platformer Template', () => {
  it('has correct entity ids in order', () => {
    const template = createCatalog().getTemplate('platformer')
    const ids = template.entities.map((e) => e.id)
    expect(ids).toEqual([
      'player',
      'terrain',
      'platform',
      'enemy',
      'collectible',
      'goal',
      'checkpoint',
    ])
  })

  it('has correct entity categories', () => {
    const template = createCatalog().getTemplate('platformer')
    const categories = template.entities.map((e) => e.category)
    expect(categories).toEqual([
      'player',
      'terrain',
      'terrain',
      'enemy',
      'item',
      'item',
      'item',
    ])
  })

  it('has correct entity names', () => {
    const template = createCatalog().getTemplate('platformer')
    const names = template.entities.map((e) => e.name)
    expect(names).toEqual([
      'Player',
      'Terrain',
      'Platform',
      'Enemy',
      'Coin',
      'Goal',
      'Checkpoint',
    ])
  })

  it('contains platform, collectible, and goal entities', () => {
    const template = createCatalog().getTemplate('platformer')
    expect(template.entities.find((e) => e.id === 'platform')).toBeDefined()
    expect(template.entities.find((e) => e.id === 'collectible')).toMatchObject({
      category: 'item',
      name: 'Coin',
    })
    expect(template.entities.find((e) => e.id === 'goal')).toBeDefined()
    expect(template.entities.find((e) => e.id === 'checkpoint')).toBeDefined()
  })
})

describe('WorldTemplateCatalog — Survival Template', () => {
  it('has correct entity ids in order', () => {
    const template = createCatalog().getTemplate('survival')
    const ids = template.entities.map((e) => e.id)
    expect(ids).toEqual([
      'player',
      'resource',
      'tree',
      'stone',
      'enemy',
      'campfire',
    ])
  })

  it('has correct entity categories', () => {
    const template = createCatalog().getTemplate('survival')
    const categories = template.entities.map((e) => e.category)
    expect(categories).toEqual([
      'player',
      'item',
      'terrain',
      'terrain',
      'enemy',
      'item',
    ])
  })

  it('has correct entity names', () => {
    const template = createCatalog().getTemplate('survival')
    const names = template.entities.map((e) => e.name)
    expect(names).toEqual([
      'Player',
      'Resource',
      'Tree',
      'Stone',
      'Enemy',
      'Campfire',
    ])
  })

  it('contains tree, stone, and campfire', () => {
    const template = createCatalog().getTemplate('survival')
    expect(template.entities.find((e) => e.id === 'tree')).toBeDefined()
    expect(template.entities.find((e) => e.id === 'stone')).toBeDefined()
    expect(template.entities.find((e) => e.id === 'campfire')).toBeDefined()
  })
})

describe('WorldTemplateCatalog — Sandbox Template', () => {
  it('has correct entity id', () => {
    const template = createCatalog().getTemplate('sandbox')
    expect(template.entities[0].id).toBe('player')
  })

  it('has correct entity category', () => {
    const template = createCatalog().getTemplate('sandbox')
    expect(template.entities[0].category).toBe('player')
  })

  it('has correct entity name', () => {
    const template = createCatalog().getTemplate('sandbox')
    expect(template.entities[0].name).toBe('Player')
  })
})

describe('WorldTemplateCatalog — Immutability', () => {
  it('template is frozen', () => {
    const template = createCatalog().getTemplate('farm')
    expect(Object.isFrozen(template)).toBe(true)
  })

  it('entities array is frozen', () => {
    const template = createCatalog().getTemplate('farm')
    expect(Object.isFrozen(template.entities)).toBe(true)
  })

  it('each entity is frozen', () => {
    const template = createCatalog().getTemplate('farm')
    for (const entity of template.entities) {
      expect(Object.isFrozen(entity)).toBe(true)
    }
  })

  it('all templates produce frozen entities', () => {
    const catalog = createCatalog()
    const types: WorldType[] = ['farm', 'rpg', 'platformer', 'survival', 'sandbox']
    for (const worldType of types) {
      const template = catalog.getTemplate(worldType)
      expect(Object.isFrozen(template)).toBe(true)
      expect(Object.isFrozen(template.entities)).toBe(true)
      for (const entity of template.entities) {
        expect(Object.isFrozen(entity)).toBe(true)
      }
    }
  })
})

describe('WorldTemplateCatalog — Determinism', () => {
  it('same world type returns same template', () => {
    const catalog = createCatalog()
    const t1 = catalog.getTemplate('farm')
    const t2 = catalog.getTemplate('farm')
    expect(JSON.stringify(t1)).toBe(JSON.stringify(t2))
  })

  it('different catalogs return same template for same world type', () => {
    const t1 = createCatalog().getTemplate('rpg')
    const t2 = createCatalog().getTemplate('rpg')
    expect(JSON.stringify(t1)).toBe(JSON.stringify(t2))
  })

  it('deterministic for all world types', () => {
    const types: WorldType[] = ['farm', 'rpg', 'platformer', 'survival', 'sandbox']
    for (const worldType of types) {
      const t1 = createCatalog().getTemplate(worldType)
      const t2 = createCatalog().getTemplate(worldType)
      expect(JSON.stringify(t1)).toBe(JSON.stringify(t2))
    }
  })

  it('entity order is deterministic', () => {
    const types: WorldType[] = ['farm', 'rpg', 'platformer', 'survival', 'sandbox']
    for (const worldType of types) {
      const t1 = createCatalog().getTemplate(worldType)
      const t2 = createCatalog().getTemplate(worldType)
      for (let i = 0; i < t1.entities.length; i++) {
        expect(t1.entities[i].id).toBe(t2.entities[i].id)
      }
    }
  })
})

describe('WorldTemplateCatalog — Frozen Outputs', () => {
  it('template worldType is readonly', () => {
    const template = createCatalog().getTemplate('farm')
    expect(() => {
      (template as { worldType: string }).worldType = 'sandbox'
    }).toThrow()
  })

  it('template entities are readonly', () => {
    const template = createCatalog().getTemplate('farm')
    expect(() => {
      (template.entities as unknown[]).push({} as never)
    }).toThrow()
  })

  it('entity properties are readonly', () => {
    const template = createCatalog().getTemplate('farm')
    const entity = template.entities[0]
    expect(() => {
      (entity as { id: string }).id = 'changed'
    }).toThrow()
  })

  it('entity category is readonly', () => {
    const template = createCatalog().getTemplate('farm')
    const entity = template.entities[0]
    expect(() => {
      (entity as { category: string }).category = 'enemy'
    }).toThrow()
  })
})

describe('WorldTemplateCatalog — Entity Categories Valid', () => {
  it('all entities have valid categories', () => {
    const catalog = createCatalog()
    const valid: string[] = ['player', 'npc', 'enemy', 'terrain', 'building', 'item', 'quest']
    const types: WorldType[] = ['farm', 'rpg', 'platformer', 'survival', 'sandbox']
    for (const worldType of types) {
      const template = catalog.getTemplate(worldType)
      for (const entity of template.entities) {
        expect(valid).toContain(entity.category)
      }
    }
  })

  it('all entities have non-empty names', () => {
    const catalog = createCatalog()
    const types: WorldType[] = ['farm', 'rpg', 'platformer', 'survival', 'sandbox']
    for (const worldType of types) {
      const template = catalog.getTemplate(worldType)
      for (const entity of template.entities) {
        expect(entity.name.length).toBeGreaterThan(0)
      }
    }
  })

  it('all entities have non-empty ids', () => {
    const catalog = createCatalog()
    const types: WorldType[] = ['farm', 'rpg', 'platformer', 'survival', 'sandbox']
    for (const worldType of types) {
      const template = catalog.getTemplate(worldType)
      for (const entity of template.entities) {
        expect(entity.id.length).toBeGreaterThan(0)
      }
    }
  })
})
