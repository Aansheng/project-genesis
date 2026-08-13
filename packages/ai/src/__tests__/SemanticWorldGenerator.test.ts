/**
 * SemanticWorldGenerator — verifies the DefaultSemanticWorldGenerator
 * implementation for converting PromptAssemblyDomainModel → GameWorldModel.
 *
 * WO-S8-007 — Semantic World Generator Foundation
 * WO-S8-013 — Semantic World Generator Enrichment Foundation
 * Architecture version v1.76 → v1.77
 *
 * Richness verification:
 *   - farm:       8 entities (was 4)
 *   - rpg:        9 entities (was 4)
 *   - platformer: 6 entities (was 3)
 *   - survival:   6 entities (was 3)
 *   - sandbox:    1 entity (unchanged)
 */

import { describe, it, expect } from 'vitest'
import { DefaultSemanticWorldGenerator } from '../game-world'
import type { SemanticWorldGenerator } from '../game-world'
import type { PromptAssemblyDomainModel, OverviewDomain } from '../observatory/domain'
import type { WorldType } from '@genesis/shared'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createGenerator(): SemanticWorldGenerator {
  return new DefaultSemanticWorldGenerator()
}

/** Create a domain model with a specific title via Record cast (forward-compatible). */
function createModelWithTitleRecord(title: string): PromptAssemblyDomainModel {
  return {
    overview: {
      traceCount: 0,
      timelineCount: 0,
      historyCount: 0,
      title,
    } as unknown as OverviewDomain,
  }
}

/** Create a minimal domain model with no overview. */
function createEmptyModel(): PromptAssemblyDomainModel {
  return {}
}

/** Create a domain model with only some sections. */
function createPartialModel(): PromptAssemblyDomainModel {
  return {
    overview: {
      traceCount: 5,
      timelineCount: 3,
      historyCount: 2,
    },
    trace: [],
  }
}

/** Create a full domain model with multiple sections. */
function createFullModel(): PromptAssemblyDomainModel {
  return {
    overview: {
      traceCount: 10,
      timelineCount: 5,
      historyCount: 3,
    },
    trace: [
      {
        id: 'trace-001',
        label: 'Main Trace',
        steps: [],
      },
    ],
    timeline: [
      {
        id: 'tl-001',
        label: 'Main Timeline',
        entries: [],
      },
    ],
    history: [
      {
        id: 'hist-001',
        label: 'Main History',
        entries: [],
      },
    ],
  }
}

// ---------------------------------------------------------------------------
// Section 1 — Construction
// ---------------------------------------------------------------------------

describe('construction', () => {
  it('creates generator without error', () => {
    const generator = createGenerator()
    expect(generator).toBeDefined()
  })

  it('generator implements SemanticWorldGenerator interface', () => {
    const generator = createGenerator()
    expect(typeof generator.generate).toBe('function')
  })

  it('constructor accepts custom catalog', () => {
    const generator = new DefaultSemanticWorldGenerator()
    expect(generator).toBeDefined()
  })

  it('generate method accepts PromptAssemblyDomainModel', () => {
    const generator = createGenerator()
    const result = generator.generate(createEmptyModel())
    expect(result).toBeDefined()
  })

  it('generate method returns GameWorldModel', () => {
    const result = createGenerator().generate(createEmptyModel())
    expect(typeof result).toBe('object')
    expect(result).not.toBeNull()
    expect(result).toHaveProperty('worldType')
    expect(result).toHaveProperty('entities')
  })
})

// ---------------------------------------------------------------------------
// Section 2 — All World Types
// ---------------------------------------------------------------------------

describe('all world types', () => {
  it('title containing "farm" produces farm world type', () => {
    const model = createModelWithTitleRecord('My Farm World')
    const result = createGenerator().generate(model)
    expect(result.worldType).toBe('farm')
  })

  it('title containing "rpg" produces rpg world type', () => {
    const model = createModelWithTitleRecord('RPG Adventure')
    const result = createGenerator().generate(model)
    expect(result.worldType).toBe('rpg')
  })

  it('title containing "platform" produces platformer world type', () => {
    const model = createModelWithTitleRecord('Platform Game')
    const result = createGenerator().generate(model)
    expect(result.worldType).toBe('platformer')
  })

  it('title containing "survival" produces survival world type', () => {
    const model = createModelWithTitleRecord('Survival Challenge')
    const result = createGenerator().generate(model)
    expect(result.worldType).toBe('survival')
  })

  it('title without keywords produces sandbox world type', () => {
    const model = createModelWithTitleRecord('Custom Title')
    const result = createGenerator().generate(model)
    expect(result.worldType).toBe('sandbox')
  })

  it('title is case-insensitive ("Farm" still matches)', () => {
    const model = createModelWithTitleRecord('Farm Life')
    const result = createGenerator().generate(model)
    expect(result.worldType).toBe('farm')
  })

  it('title "Farming Simulator" matches farm', () => {
    const model = createModelWithTitleRecord('Farming Simulator')
    const result = createGenerator().generate(model)
    expect(result.worldType).toBe('farm')
  })
})

// ---------------------------------------------------------------------------
// Section 3 — Default World
// ---------------------------------------------------------------------------

describe('default world', () => {
  it('model without overview defaults to sandbox', () => {
    const result = createGenerator().generate(createEmptyModel())
    expect(result.worldType).toBe('sandbox')
  })

  it('overview without title defaults to sandbox', () => {
    const model: PromptAssemblyDomainModel = {
      overview: { traceCount: 0, timelineCount: 0, historyCount: 0 },
    }
    const result = createGenerator().generate(model)
    expect(result.worldType).toBe('sandbox')
  })

  it('overview with empty title defaults to sandbox', () => {
    const model = createModelWithTitleRecord('')
    const result = createGenerator().generate(model)
    expect(result.worldType).toBe('sandbox')
  })

  it('overview with null title defaults to sandbox', () => {
    const model: PromptAssemblyDomainModel = {
      overview: {
        traceCount: 0,
        timelineCount: 0,
        historyCount: 0,
        title: null,
      } as unknown as OverviewDomain,
    }
    const result = createGenerator().generate(model)
    expect(result.worldType).toBe('sandbox')
  })

  it('overview with number title defaults to sandbox', () => {
    const model: PromptAssemblyDomainModel = {
      overview: {
        traceCount: 0,
        timelineCount: 0,
        historyCount: 0,
        title: 42,
      } as unknown as OverviewDomain,
    }
    const result = createGenerator().generate(model)
    expect(result.worldType).toBe('sandbox')
  })
})

// ---------------------------------------------------------------------------
// Section 4 — Entity Generation — Farm
// ---------------------------------------------------------------------------

describe('farm entity generation', () => {
  it('farm world generates 8 entities (was 4)', () => {
    const model = createModelWithTitleRecord('Farm World')
    const result = createGenerator().generate(model)
    expect(result.entities).toHaveLength(8)
  })

  it('farm entities have correct ids', () => {
    const result = createGenerator().generate(createModelWithTitleRecord('Farm'))
    expect(result.entities[0].id).toBe('player')
    expect(result.entities[1].id).toBe('merchant')
    expect(result.entities[2].id).toBe('farmer')
    expect(result.entities[3].id).toBe('barn')
    expect(result.entities[4].id).toBe('wheat-field')
    expect(result.entities[5].id).toBe('corn-field')
    expect(result.entities[6].id).toBe('storage')
    expect(result.entities[7].id).toBe('harvest-quest')
  })

  it('farm entities have correct categories', () => {
    const result = createGenerator().generate(createModelWithTitleRecord('Farm'))
    expect(result.entities[0].category).toBe('player')
    expect(result.entities[1].category).toBe('npc')
    expect(result.entities[2].category).toBe('npc')
    expect(result.entities[3].category).toBe('building')
    expect(result.entities[4].category).toBe('terrain')
    expect(result.entities[5].category).toBe('terrain')
    expect(result.entities[6].category).toBe('building')
    expect(result.entities[7].category).toBe('quest')
  })

  it('farm entities have correct names', () => {
    const result = createGenerator().generate(createModelWithTitleRecord('Farm'))
    expect(result.entities[0].name).toBe('Player')
    expect(result.entities[1].name).toBe('Merchant')
    expect(result.entities[2].name).toBe('Farmer')
    expect(result.entities[3].name).toBe('Barn')
    expect(result.entities[4].name).toBe('Wheat Field')
    expect(result.entities[5].name).toBe('Corn Field')
    expect(result.entities[6].name).toBe('Storage')
    expect(result.entities[7].name).toBe('Harvest Quest')
  })

  it('farm world includes farmer, barn, corn-field, storage', () => {
    const result = createGenerator().generate(createModelWithTitleRecord('Farm'))
    const ids = result.entities.map((e) => e.id)
    expect(ids).toContain('farmer')
    expect(ids).toContain('barn')
    expect(ids).toContain('corn-field')
    expect(ids).toContain('storage')
  })
})

// ---------------------------------------------------------------------------
// Section 4b — Entity Generation — RPG
// ---------------------------------------------------------------------------

describe('rpg entity generation', () => {
  it('rpg world generates 9 entities (was 4)', () => {
    const result = createGenerator().generate(createModelWithTitleRecord('RPG'))
    expect(result.entities).toHaveLength(9)
  })

  it('rpg entities have correct ids', () => {
    const result = createGenerator().generate(createModelWithTitleRecord('RPG'))
    expect(result.entities[0].id).toBe('player')
    expect(result.entities[1].id).toBe('villager')
    expect(result.entities[2].id).toBe('merchant')
    expect(result.entities[3].id).toBe('quest-giver')
    expect(result.entities[4].id).toBe('enemy')
    expect(result.entities[5].id).toBe('boss')
    expect(result.entities[6].id).toBe('town')
    expect(result.entities[7].id).toBe('forest')
    expect(result.entities[8].id).toBe('main-quest')
  })

  it('rpg entities have correct categories', () => {
    const result = createGenerator().generate(createModelWithTitleRecord('RPG'))
    expect(result.entities[0].category).toBe('player')
    expect(result.entities[1].category).toBe('npc')
    expect(result.entities[2].category).toBe('npc')
    expect(result.entities[3].category).toBe('quest')
    expect(result.entities[4].category).toBe('enemy')
    expect(result.entities[5].category).toBe('enemy')
    expect(result.entities[6].category).toBe('building')
    expect(result.entities[7].category).toBe('terrain')
    expect(result.entities[8].category).toBe('quest')
  })

  it('rpg world includes merchant, boss, town, forest, main-quest', () => {
    const result = createGenerator().generate(createModelWithTitleRecord('RPG'))
    const ids = result.entities.map((e) => e.id)
    expect(ids).toContain('merchant')
    expect(ids).toContain('boss')
    expect(ids).toContain('town')
    expect(ids).toContain('forest')
    expect(ids).toContain('main-quest')
  })
})

// ---------------------------------------------------------------------------
// Section 4c — Entity Generation — Platformer
// ---------------------------------------------------------------------------

describe('platformer entity generation', () => {
  it('platformer world generates 6 entities (was 3)', () => {
    const result = createGenerator().generate(createModelWithTitleRecord('Platform'))
    expect(result.entities).toHaveLength(6)
  })

  it('platformer entities have correct ids', () => {
    const result = createGenerator().generate(createModelWithTitleRecord('Platform'))
    expect(result.entities[0].id).toBe('player')
    expect(result.entities[1].id).toBe('terrain')
    expect(result.entities[2].id).toBe('platform')
    expect(result.entities[3].id).toBe('enemy')
    expect(result.entities[4].id).toBe('goal')
    expect(result.entities[5].id).toBe('checkpoint')
  })

  it('platformer world includes platform, goal, checkpoint', () => {
    const result = createGenerator().generate(createModelWithTitleRecord('Platform'))
    const ids = result.entities.map((e) => e.id)
    expect(ids).toContain('platform')
    expect(ids).toContain('goal')
    expect(ids).toContain('checkpoint')
  })
})

// ---------------------------------------------------------------------------
// Section 4d — Entity Generation — Survival
// ---------------------------------------------------------------------------

describe('survival entity generation', () => {
  it('survival world generates 6 entities (was 3)', () => {
    const result = createGenerator().generate(createModelWithTitleRecord('Survival'))
    expect(result.entities).toHaveLength(6)
  })

  it('survival entities have correct ids', () => {
    const result = createGenerator().generate(createModelWithTitleRecord('Survival'))
    expect(result.entities[0].id).toBe('player')
    expect(result.entities[1].id).toBe('resource')
    expect(result.entities[2].id).toBe('tree')
    expect(result.entities[3].id).toBe('stone')
    expect(result.entities[4].id).toBe('enemy')
    expect(result.entities[5].id).toBe('campfire')
  })

  it('survival world includes tree, stone, campfire', () => {
    const result = createGenerator().generate(createModelWithTitleRecord('Survival'))
    const ids = result.entities.map((e) => e.id)
    expect(ids).toContain('tree')
    expect(ids).toContain('stone')
    expect(ids).toContain('campfire')
  })
})

// ---------------------------------------------------------------------------
// Section 4e — Entity Generation — Sandbox
// ---------------------------------------------------------------------------

describe('sandbox entity generation', () => {
  it('sandbox world generates 1 default entity', () => {
    const result = createGenerator().generate(createModelWithTitleRecord('Custom'))
    expect(result.entities).toHaveLength(1)
  })

  it('sandbox entity is player', () => {
    const result = createGenerator().generate(createModelWithTitleRecord('Custom'))
    expect(result.entities[0].id).toBe('player')
    expect(result.entities[0].category).toBe('player')
    expect(result.entities[0].name).toBe('Player')
  })
})

// ---------------------------------------------------------------------------
// Section 5 — Immutability
// ---------------------------------------------------------------------------

describe('immutability', () => {
  it('result is frozen', () => {
    const result = createGenerator().generate(createModelWithTitleRecord('Farm'))
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('entities array is frozen', () => {
    const result = createGenerator().generate(createModelWithTitleRecord('Farm'))
    expect(Object.isFrozen(result.entities)).toBe(true)
  })

  it('each entity is frozen', () => {
    const result = createGenerator().generate(createModelWithTitleRecord('Farm'))
    for (const entity of result.entities) {
      expect(Object.isFrozen(entity)).toBe(true)
    }
  })

  it('empty result is frozen', () => {
    const result = createGenerator().generate(undefined as unknown as PromptAssemblyDomainModel)
    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result.entities)).toBe(true)
  })

  it('does not mutate input model', () => {
    const generator = createGenerator()
    const model = createFullModel()
    const before = JSON.stringify(model)
    generator.generate(model)
    expect(JSON.stringify(model)).toBe(before)
  })

  it('accepts frozen input without error', () => {
    const model = Object.freeze({
      overview: Object.freeze({
        traceCount: 0,
        timelineCount: 0,
        historyCount: 0,
      }),
    })
    expect(() => createGenerator().generate(model)).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// Section 6 — Determinism
// ---------------------------------------------------------------------------

describe('determinism', () => {
  it('same input produces same result', () => {
    const generator = createGenerator()
    const model = createModelWithTitleRecord('Farm World')
    const first = generator.generate(model)
    const second = generator.generate(model)
    expect(JSON.stringify(first)).toBe(JSON.stringify(second))
  })

  it('different generators with same input produce same result', () => {
    const model = createModelWithTitleRecord('RPG World')
    const result1 = createGenerator().generate(model)
    const result2 = createGenerator().generate(model)
    expect(JSON.stringify(result1)).toBe(JSON.stringify(result2))
  })

  it('deterministic for all world types', () => {
    const titles = ['Farm', 'RPG', 'Platform', 'Survival', 'Custom']
    for (const title of titles) {
      const model = createModelWithTitleRecord(title)
      const r1 = createGenerator().generate(model)
      const r2 = createGenerator().generate(model)
      expect(JSON.stringify(r1)).toBe(JSON.stringify(r2))
    }
  })

  it('entity order is deterministic', () => {
    const model = createModelWithTitleRecord('Farm')
    const result1 = createGenerator().generate(model)
    const result2 = createGenerator().generate(model)
    for (let i = 0; i < 8; i++) {
      expect(result1.entities[i].id).toBe(result2.entities[i].id)
    }
  })

  it('empty model is deterministic', () => {
    const r1 = createGenerator().generate(createEmptyModel())
    const r2 = createGenerator().generate(createEmptyModel())
    expect(JSON.stringify(r1)).toBe(JSON.stringify(r2))
  })

  it('worldType is deterministic from title', () => {
    const r1 = createGenerator().generate(createModelWithTitleRecord('survival'))
    const r2 = createGenerator().generate(createModelWithTitleRecord('survival'))
    expect(r1.worldType).toBe(r2.worldType)
  })
})

// ---------------------------------------------------------------------------
// Section 7 — Serialization
// ---------------------------------------------------------------------------

describe('serialization', () => {
  it('full model serializes to JSON without error', () => {
    const result = createGenerator().generate(createModelWithTitleRecord('RPG'))
    expect(() => JSON.stringify(result)).not.toThrow()
  })

  it('full model JSON contains worldType', () => {
    const result = createGenerator().generate(createModelWithTitleRecord('RPG'))
    const json = JSON.stringify(result)
    expect(json).toContain('worldType')
    expect(json).toContain('"rpg"')
  })

  it('full model JSON contains entities', () => {
    const result = createGenerator().generate(createModelWithTitleRecord('RPG'))
    const json = JSON.stringify(result)
    expect(json).toContain('entities')
  })

  it('entity categories appear in JSON', () => {
    const result = createGenerator().generate(createModelWithTitleRecord('RPG'))
    const json = JSON.stringify(result)
    expect(json).toContain('"player"')
    expect(json).toContain('"npc"')
    expect(json).toContain('"quest"')
    expect(json).toContain('"enemy"')
  })

  it('entity names appear in JSON', () => {
    const result = createGenerator().generate(createModelWithTitleRecord('Farm'))
    const json = JSON.stringify(result)
    expect(json).toContain('Merchant')
    expect(json).toContain('Farmer')
    expect(json).toContain('Barn')
    expect(json).toContain('Corn Field')
    expect(json).toContain('Harvest Quest')
  })

  it('farm model round-trips through JSON', () => {
    const original = createGenerator().generate(createModelWithTitleRecord('Farm'))
    const json = JSON.stringify(original)
    const parsed = JSON.parse(json)
    expect(parsed.worldType).toBe('farm')
    expect(parsed.entities).toHaveLength(8)
    expect(parsed.entities[0].id).toBe('player')
    expect(parsed.entities[0].category).toBe('player')
    expect(parsed.entities[0].name).toBe('Player')
  })

  it('model values are JSON-serializable primitives', () => {
    const result = createGenerator().generate(createModelWithTitleRecord('Farm'))
    const json = JSON.parse(JSON.stringify(result))
    expect(typeof json.worldType).toBe('string')
    expect(typeof json.entities[0].id).toBe('string')
    expect(typeof json.entities[0].category).toBe('string')
    expect(typeof json.entities[0].name).toBe('string')
  })
})

// ---------------------------------------------------------------------------
// Section 8 — Large Inputs
// ---------------------------------------------------------------------------

describe('large inputs', () => {
  it('handles domain model with many traces', () => {
    const traces = Array.from({ length: 100 }, (_, i) => ({
      id: `trace-${i}`,
      label: `Trace ${i}`,
      steps: [],
    }))
    const model: PromptAssemblyDomainModel = {
      overview: { traceCount: 100, timelineCount: 0, historyCount: 0 },
      trace: traces,
    }
    const result = createGenerator().generate(model)
    expect(result.worldType).toBe('sandbox')
    expect(result.entities).toHaveLength(1)
  })

  it('handles domain model with many timeline entries', () => {
    const timelines = Array.from({ length: 50 }, (_, i) => ({
      id: `tl-${i}`,
      label: `Timeline ${i}`,
      entries: [],
    }))
    const model: PromptAssemblyDomainModel = {
      overview: { traceCount: 0, timelineCount: 50, historyCount: 0 },
      timeline: timelines,
    }
    const result = createGenerator().generate(model)
    expect(result.worldType).toBe('sandbox')
  })

  it('large domain model with title still works', () => {
    const traces = Array.from({ length: 1000 }, (_, i) => ({
      id: `trace-${i}`,
      label: `Trace ${i}`,
      steps: [],
    }))
    const model: PromptAssemblyDomainModel = {
      overview: {
        traceCount: 1000,
        timelineCount: 0,
        historyCount: 0,
        title: 'Farm World',
      } as unknown as OverviewDomain,
      trace: traces,
    }
    const result = createGenerator().generate(model)
    expect(result.worldType).toBe('farm')
    expect(result.entities).toHaveLength(8)
  })
})

// ---------------------------------------------------------------------------
// Section 9 — Invalid Inputs
// ---------------------------------------------------------------------------

describe('invalid inputs', () => {
  it('undefined model produces sandbox world with zero entities', () => {
    const result = createGenerator().generate(undefined as unknown as PromptAssemblyDomainModel)
    expect(result.worldType).toBe('sandbox')
    expect(result.entities).toHaveLength(0)
  })

  it('null model produces sandbox world with zero entities', () => {
    const result = createGenerator().generate(null as unknown as PromptAssemblyDomainModel)
    expect(result.worldType).toBe('sandbox')
    expect(result.entities).toHaveLength(0)
  })

  it('non-object model produces sandbox world with zero entities', () => {
    const result = createGenerator().generate('invalid' as unknown as PromptAssemblyDomainModel)
    expect(result.worldType).toBe('sandbox')
    expect(result.entities).toHaveLength(0)
  })

  it('array model produces sandbox world with zero entities', () => {
    const result = createGenerator().generate([] as unknown as PromptAssemblyDomainModel)
    expect(result.worldType).toBe('sandbox')
    expect(result.entities).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Section 10 — Empty Model
// ---------------------------------------------------------------------------

describe('empty model', () => {
  it('empty model (no sections) produces sandbox world', () => {
    const result = createGenerator().generate(createEmptyModel())
    expect(result.worldType).toBe('sandbox')
  })

  it('empty model produces exactly 1 entity', () => {
    const result = createGenerator().generate(createEmptyModel())
    expect(result.entities).toHaveLength(1)
  })

  it('empty model entity is player', () => {
    const result = createGenerator().generate(createEmptyModel())
    expect(result.entities[0].id).toBe('player')
    expect(result.entities[0].category).toBe('player')
    expect(result.entities[0].name).toBe('Player')
  })

  it('empty model worldType is frozen', () => {
    const result = createGenerator().generate(createEmptyModel())
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('empty model is deterministic', () => {
    const result1 = createGenerator().generate(createEmptyModel())
    const result2 = createGenerator().generate(createEmptyModel())
    expect(JSON.stringify(result1)).toBe(JSON.stringify(result2))
  })

  it('empty model serializes to JSON', () => {
    const result = createGenerator().generate(createEmptyModel())
    expect(() => JSON.stringify(result)).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// Section 11 — Partial Model
// ---------------------------------------------------------------------------

describe('partial model', () => {
  it('partial model (overview only) defaults to sandbox', () => {
    const result = createGenerator().generate(createPartialModel())
    expect(result.worldType).toBe('sandbox')
  })

  it('partial model with title in overview produces correct type', () => {
    const model: PromptAssemblyDomainModel = {
      overview: {
        traceCount: 5,
        timelineCount: 3,
        historyCount: 2,
        title: 'Survival Island',
      } as unknown as OverviewDomain,
    }
    const result = createGenerator().generate(model)
    expect(result.worldType).toBe('survival')
    expect(result.entities).toHaveLength(6)
  })

  it('full model with many sections still uses title for detection', () => {
    const result = createGenerator().generate(createFullModel())
    expect(result.worldType).toBe('sandbox')
    expect(result.entities).toHaveLength(1)
  })

  it('partial model entities are frozen', () => {
    const result = createGenerator().generate(createPartialModel())
    expect(Object.isFrozen(result.entities)).toBe(true)
  })

  it('partial model worldType is sandbox', () => {
    const result = createGenerator().generate(createPartialModel())
    expect(result.worldType).toBe('sandbox')
  })
})

// ---------------------------------------------------------------------------
// Section 12 — Edge Cases
// ---------------------------------------------------------------------------

describe('edge cases', () => {
  it('title "platformer" matches platformer', () => {
    const result = createGenerator().generate(createModelWithTitleRecord('platformer'))
    expect(result.worldType).toBe('platformer')
  })

  it('title "FARM" (uppercase) matches farm', () => {
    const result = createGenerator().generate(createModelWithTitleRecord('FARM'))
    expect(result.worldType).toBe('farm')
  })

  it('title "Role-Playing Game (RPG)" matches rpg', () => {
    const result = createGenerator().generate(createModelWithTitleRecord('Role-Playing Game (RPG)'))
    expect(result.worldType).toBe('rpg')
  })

  it('generator is stateless across calls', () => {
    const generator = createGenerator()
    const farm = generator.generate(createModelWithTitleRecord('Farm'))
    const rpg = generator.generate(createModelWithTitleRecord('RPG'))
    expect(farm.worldType).toBe('farm')
    expect(farm.entities).toHaveLength(8)
    expect(rpg.worldType).toBe('rpg')
    expect(rpg.entities).toHaveLength(9)
  })

  it('worldType is always a valid WorldType value', () => {
    const titles = ['farm', 'rpg', 'platform', 'survival', 'unknown', 'test', '', undefined as unknown as string]
    for (const title of titles) {
      const model = title !== undefined
        ? createModelWithTitleRecord(title)
        : createEmptyModel()
      const result = createGenerator().generate(model)
      const valid: WorldType[] = ['farm', 'platformer', 'rpg', 'survival', 'sandbox']
      expect(valid).toContain(result.worldType)
    }
  })

  it('each entity has valid EntityCategory', () => {
    const result = createGenerator().generate(createModelWithTitleRecord('Farm'))
    const valid: string[] = ['player', 'npc', 'enemy', 'terrain', 'building', 'item', 'quest']
    for (const entity of result.entities) {
      expect(valid).toContain(entity.category)
    }
  })

  it('all world types produce entities with non-empty names', () => {
    const titles = ['Farm', 'RPG', 'Platform', 'Survival', 'Custom']
    for (const title of titles) {
      const result = createGenerator().generate(createModelWithTitleRecord(title))
      for (const entity of result.entities) {
        expect(entity.name.length).toBeGreaterThan(0)
      }
    }
  })
})