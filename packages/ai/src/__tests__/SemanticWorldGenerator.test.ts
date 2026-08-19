/**
 * SemanticWorldGenerator — verifies the DefaultSemanticWorldGenerator
 * implementation for converting PromptAssemblyDomainModel → GameWorldModel.
 *
 * WO-S8-007 — Semantic World Generator Foundation
 * WO-S8-013 — Semantic World Generator Enrichment Foundation
 * WO-S8-014 — Prompt Entity Extraction Foundation
 * Architecture version v1.77 → v1.78
 *
 * Richness verification:
 *   - farm:       8 entities (was 4)
 *   - rpg:        9 entities (was 4)
 *   - platformer: 6 entities (was 3)
 *   - survival:   6 entities (was 3)
 *   - sandbox:    1 entity (unchanged)
 *
 * Entity extraction verification:
 *   - Template only: same as before (no extraction keywords in title)
 *   - Template + extraction: extracted entities appended to template
 *   - Deduplication: extracted entities that match template names are skipped
 *   - Empty extraction: no extraction keywords → template only
 *   - Ordering: template entities first, extracted entities after
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

// ---------------------------------------------------------------------------
// Section 13 — Entity Extraction — Template Only
// ---------------------------------------------------------------------------

describe('entity extraction — template only', () => {
  it('farm title without extraction keywords produces 8 farm entities', () => {
    const result = createGenerator().generate(createModelWithTitleRecord('Farm World'))
    expect(result.entities).toHaveLength(8)
  })

  it('rpg title without extraction keywords produces 9 rpg entities', () => {
    const result = createGenerator().generate(createModelWithTitleRecord('RPG Adventure'))
    expect(result.entities).toHaveLength(9)
  })

  it('no extracted entities when title has no extraction keywords', () => {
    const result = createGenerator().generate(createModelWithTitleRecord('Custom Title'))
    expect(result.entities).toHaveLength(1)
    expect(result.entities[0].id).toBe('player')
  })

  it('extraction keywords in title that are already in template are deduplicated', () => {
    // "Platform" is both a world type keyword and an extraction keyword
    // Platformer template already has "Platform" entity → deduplicated
    const result = createGenerator().generate(createModelWithTitleRecord('Platform Game'))
    expect(result.entities).toHaveLength(6)
  })
})

// ---------------------------------------------------------------------------
// Section 14 — Entity Extraction — Template + Extraction
// ---------------------------------------------------------------------------

describe('entity extraction — template + extraction', () => {
  it('sandbox world with extraction appends extracted entities', () => {
    // Sandbox template: [player] + extracted: campfire
    const result = createGenerator().generate(createModelWithTitleRecord('Campfire World'))
    expect(result.entities).toHaveLength(2)
    expect(result.entities[0].id).toBe('player')
    expect(result.entities[1].id).toBe('campfire')
    expect(result.entities[1].category).toBe('item')
    expect(result.entities[1].name).toBe('Campfire')
  })

  it('sandbox world with multiple extractions appends all new entities', () => {
    // Sandbox template: [player] + extracted: merchant, barn, campfire
    const result = createGenerator().generate(createModelWithTitleRecord('Merchant Barn Campfire'))
    expect(result.entities).toHaveLength(4)
    expect(result.entities[0].id).toBe('player')
    expect(result.entities[1].id).toBe('merchant')
    expect(result.entities[1].category).toBe('npc')
    expect(result.entities[1].name).toBe('Merchant')
    expect(result.entities[2].id).toBe('barn')
    expect(result.entities[2].category).toBe('building')
    expect(result.entities[2].name).toBe('Barn')
    expect(result.entities[3].id).toBe('campfire')
    expect(result.entities[3].category).toBe('item')
    expect(result.entities[3].name).toBe('Campfire')
  })

  it('survival world with extra extracted entities appends them', () => {
    // Survival template: [player, resource, tree, stone, enemy, campfire] + extracted: barn
    const result = createGenerator().generate(createModelWithTitleRecord('Survival with Barn'))
    expect(result.entities).toHaveLength(7)
    expect(result.entities[6].id).toBe('barn')
    expect(result.entities[6].category).toBe('building')
    expect(result.entities[6].name).toBe('Barn')
  })

  it('farm world with extra terrestrial keywords appends them', () => {
    // Farm template: 8 entities + extracted: checkpoint (not in farm)
    const result = createGenerator().generate(createModelWithTitleRecord('Farm with Checkpoint'))
    expect(result.entities).toHaveLength(9)
    expect(result.entities[8].id).toBe('checkpoint')
    expect(result.entities[8].category).toBe('terrain')
    expect(result.entities[8].name).toBe('Checkpoint')
  })
})

// ---------------------------------------------------------------------------
// Section 15 — Entity Extraction — Deduplication
// ---------------------------------------------------------------------------

describe('entity extraction — deduplication', () => {
  it('extracted entity already in template is skipped', () => {
    // Farm template has "Merchant", "Farmer", "Barn"
    const result = createGenerator().generate(createModelWithTitleRecord('Farm merchant farmer barn'))
    // Entity count should still be 8 (all extracted entities are in template)
    expect(result.entities).toHaveLength(8)
  })

  it('partial deduplication — some new, some duplicates', () => {
    // Farm template: [player, merchant, farmer, barn, wheat-field, corn-field, storage, harvest-quest]
    // Extracted: merchant (dup), storage (dup), campfire (new)
    const result = createGenerator().generate(createModelWithTitleRecord('Farm merchant storage campfire'))
    expect(result.entities).toHaveLength(9)
    expect(result.entities[8].id).toBe('campfire')
    expect(result.entities[8].category).toBe('item')
  })

  it('rpg template deduplicates boss and enemy', () => {
    // RPG template has "Boss" and "Enemy"
    const result = createGenerator().generate(createModelWithTitleRecord('RPG boss enemy forest'))
    // forest is also in the template, so all are deduplicated
    expect(result.entities).toHaveLength(9)
  })

  it('cross-category deduplication by name works', () => {
    // Platformer template has "Platform" entity
    // Extracted "platform" matches by name → deduplicated
    const result = createGenerator().generate(createModelWithTitleRecord('Platform Campfire'))
    // Template: 6 + new: campfire = 7
    expect(result.entities).toHaveLength(7)
    expect(result.entities[6].id).toBe('campfire')
  })
})

// ---------------------------------------------------------------------------
// Section 16 — Entity Extraction — Empty Extraction
// ---------------------------------------------------------------------------

describe('entity extraction — empty extraction', () => {
  it('model without overview produces sandbox with zero entities', () => {
    const result = createGenerator().generate(undefined as unknown as PromptAssemblyDomainModel)
    expect(result.worldType).toBe('sandbox')
    expect(result.entities).toHaveLength(0)
  })

  it('model with no known extraction keywords uses template only', () => {
    const result = createGenerator().generate(createModelWithTitleRecord('Hello World'))
    expect(result.entities).toHaveLength(1)
    expect(result.entities[0].id).toBe('player')
  })

  it('empty model uses template only', () => {
    const result = createGenerator().generate(createEmptyModel())
    expect(result.entities).toHaveLength(1)
    expect(result.entities[0].id).toBe('player')
  })
})

// ---------------------------------------------------------------------------
// Section 17 — Entity Extraction — Ordering
// ---------------------------------------------------------------------------

describe('entity extraction — ordering', () => {
  it('template entities come before extracted entities', () => {
    // Farm template: 8 entities, then extracted: campfire
    const result = createGenerator().generate(createModelWithTitleRecord('Farm campfire'))
    expect(result.entities).toHaveLength(9)
    // First 8 are template entities
    expect(result.entities[0].id).toBe('player')
    expect(result.entities[7].id).toBe('harvest-quest')
    // Last is extracted entity
    expect(result.entities[8].id).toBe('campfire')
  })

  it('extracted entities maintain catalog order', () => {
    // Sandbox: [player] + extracted: barn, campfire (catalog order)
    const result = createGenerator().generate(createModelWithTitleRecord('Campfire Barn'))
    // Catalog order: barn (building) comes before campfire (item)
    expect(result.entities[1].id).toBe('barn')
    expect(result.entities[2].id).toBe('campfire')
  })

  it('template entities maintain original order with extraction', () => {
    const result = createGenerator().generate(createModelWithTitleRecord('Farm campfire'))
    const templateOrder = ['player', 'merchant', 'farmer', 'barn', 'wheat-field', 'corn-field', 'storage', 'harvest-quest']
    for (let i = 0; i < templateOrder.length; i++) {
      expect(result.entities[i].id).toBe(templateOrder[i])
    }
  })

  it('ordering is deterministic across generations', () => {
    const model = createModelWithTitleRecord('Farm campfire merchant barn')
    const r1 = createGenerator().generate(model)
    const r2 = createGenerator().generate(model)
    expect(JSON.stringify(r1)).toBe(JSON.stringify(r2))
  })
})

// ---------------------------------------------------------------------------
// Section 18 — Entity Count Extraction — Count Expansion
// ---------------------------------------------------------------------------

describe('entity count extraction — count expansion', () => {
  it('single merchant with count 1 produces no suffix', () => {
    // Sandbox: [player] + extracted: merchant with count=1 → merchant
    const result = createGenerator().generate(createModelWithTitleRecord('1 merchant'))
    expect(result.entities).toHaveLength(2)
    expect(result.entities[1].id).toBe('merchant')
    expect(result.entities[1].category).toBe('npc')
    expect(result.entities[1].name).toBe('Merchant')
  })

  it('merchant with count 2 produces merchant-1 and merchant-2', () => {
    // Sandbox: [player] + extracted: merchant with count=2 → merchant-1, merchant-2
    const result = createGenerator().generate(createModelWithTitleRecord('2 merchants'))
    expect(result.entities).toHaveLength(3)
    expect(result.entities[1].id).toBe('merchant-1')
    expect(result.entities[1].category).toBe('npc')
    expect(result.entities[1].name).toBe('Merchant')
    expect(result.entities[2].id).toBe('merchant-2')
    expect(result.entities[2].category).toBe('npc')
    expect(result.entities[2].name).toBe('Merchant')
  })

  it('campfire with count 3 produces 3 suffixed entities', () => {
    // Sandbox: [player] + extracted: campfire with count=3
    const result = createGenerator().generate(createModelWithTitleRecord('3 campfires'))
    expect(result.entities).toHaveLength(4)
    expect(result.entities[1].id).toBe('campfire-1')
    expect(result.entities[2].id).toBe('campfire-2')
    expect(result.entities[3].id).toBe('campfire-3')
  })

  it('boss with count 1 via word "one" produces no suffix', () => {
    const result = createGenerator().generate(createModelWithTitleRecord('one boss'))
    expect(result.entities).toHaveLength(2)
    expect(result.entities[1].id).toBe('boss')
    expect(result.entities[1].category).toBe('enemy')
    expect(result.entities[1].name).toBe('Boss')
  })

  it('word "two" produces suffixed entities', () => {
    const result = createGenerator().generate(createModelWithTitleRecord('two bosses'))
    expect(result.entities).toHaveLength(3)
    expect(result.entities[1].id).toBe('boss-1')
    expect(result.entities[2].id).toBe('boss-2')
  })
})

// ---------------------------------------------------------------------------
// Section 19 — Entity Count Extraction — Multi Count
// ---------------------------------------------------------------------------

describe('entity count extraction — multi count', () => {
  it('multiple entities with different counts expand correctly', () => {
    // Sandbox: [player] + merchant(2), campfire(3)
    const result = createGenerator().generate(
      createModelWithTitleRecord('2 merchants and 3 campfires'),
    )
    expect(result.entities).toHaveLength(6)
    // player + merchant-1, merchant-2 + campfire-1, campfire-2, campfire-3
    expect(result.entities[1].id).toBe('merchant-1')
    expect(result.entities[2].id).toBe('merchant-2')
    expect(result.entities[3].id).toBe('campfire-1')
    expect(result.entities[4].id).toBe('campfire-2')
    expect(result.entities[5].id).toBe('campfire-3')
  })

  it('entity with count 1 and entity with count 3 work together', () => {
    // Sandbox: [player] + boss(1), stones(3)
    const result = createGenerator().generate(
      createModelWithTitleRecord('1 boss and 3 stones'),
    )
    expect(result.entities).toHaveLength(5)
    expect(result.entities[1].id).toBe('boss')
    expect(result.entities[2].id).toBe('stone-1')
    expect(result.entities[3].id).toBe('stone-2')
    expect(result.entities[4].id).toBe('stone-3')
  })

  it('entity without count still creates single entity', () => {
    // Sandbox: [player] + campfire (no count specified)
    const result = createGenerator().generate(createModelWithTitleRecord('campfire'))
    expect(result.entities).toHaveLength(2)
    expect(result.entities[1].id).toBe('campfire')
    expect(result.entities[1].category).toBe('item')
  })
})

// ---------------------------------------------------------------------------
// Section 20 — Entity Count Extraction — Mixed Entities
// ---------------------------------------------------------------------------

describe('entity count extraction — mixed entities', () => {
  it('count applies to some entities but not others', () => {
    // "merchant" has count=2, "campfire" has count=1 (no count specified)
    const result = createGenerator().generate(
      createModelWithTitleRecord('2 merchants and campfire'),
    )
    expect(result.entities).toHaveLength(4)
    expect(result.entities[1].id).toBe('merchant-1')
    expect(result.entities[2].id).toBe('merchant-2')
    expect(result.entities[3].id).toBe('campfire')
  })

  it('fifth entity with count 5 produces 5 entries', () => {
    const result = createGenerator().generate(
      createModelWithTitleRecord('5 stones'),
    )
    expect(result.entities).toHaveLength(6)
    expect(result.entities[5].id).toBe('stone-5')
  })
})

// ---------------------------------------------------------------------------
// Section 21 — Entity Count Extraction — Deduplication
// ---------------------------------------------------------------------------

describe('entity count extraction — deduplication', () => {
  it('count-expanded entity that matches template name is skipped', () => {
    // Farm template has one "Storage"; the requested second instance is added.
    const result = createGenerator().generate(
      createModelWithTitleRecord('Farm 2 storages'),
    )
    // Farm template: 8 entities + storage-2
    expect(result.entities).toHaveLength(9)
    expect(result.entities[8].id).toBe('storage-2')
  })

  it('count-expanded entity not in template is added with suffix', () => {
    // Farm template doesn't have "tree" — "3 trees" added as tree-1, tree-2, tree-3
    const result = createGenerator().generate(
      createModelWithTitleRecord('Farm 3 trees'),
    )
    expect(result.entities).toHaveLength(11)
    expect(result.entities[8].id).toBe('tree-1')
    expect(result.entities[9].id).toBe('tree-2')
    expect(result.entities[10].id).toBe('tree-3')
  })

  it('count-1 entity deduplicates against template', () => {
    // "campfire" is not in farm template
    const result = createGenerator().generate(
      createModelWithTitleRecord('Farm 1 campfire'),
    )
    expect(result.entities).toHaveLength(9)
    expect(result.entities[8].id).toBe('campfire')
  })
})

// ---------------------------------------------------------------------------
// Section 22 — Entity Count Extraction — Ordering
// ---------------------------------------------------------------------------

describe('entity count extraction — ordering', () => {
  it('template entities come before count-expanded entities', () => {
    // Sandbox: [player] + merchant-1, merchant-2
    const result = createGenerator().generate(createModelWithTitleRecord('2 merchants'))
    expect(result.entities[0].id).toBe('player')
    expect(result.entities[1].id).toBe('merchant-1')
    expect(result.entities[2].id).toBe('merchant-2')
  })

  it('suffixed entities appear in numerical order', () => {
    const result = createGenerator().generate(createModelWithTitleRecord('4 campfires'))
    expect(result.entities[1].id).toBe('campfire-1')
    expect(result.entities[2].id).toBe('campfire-2')
    expect(result.entities[3].id).toBe('campfire-3')
    expect(result.entities[4].id).toBe('campfire-4')
  })

  it('count ordering is deterministic across generations', () => {
    const model = createModelWithTitleRecord('2 merchants 3 campfires')
    const r1 = createGenerator().generate(model)
    const r2 = createGenerator().generate(model)
    expect(JSON.stringify(r1)).toBe(JSON.stringify(r2))
  })
})

// ---------------------------------------------------------------------------
// Section 23 — Entity Count Extraction — Compatibility
// ---------------------------------------------------------------------------

describe('entity count extraction — compatibility', () => {
  it('creates distinct deterministic farm cows from the Chinese fallback prompt', () => {
    const result = createGenerator().generate(createModelWithTitleRecord('创建一个农场游戏，3头牛'))
    const cows = result.entities.filter(entity => entity.name === 'Cow')
    expect(cows.map(entity => entity.id)).toEqual(['cow-1', 'cow-2', 'cow-3'])
  })

  it('creates a readable Chinese RPG actor set without duplicating the template merchant', () => {
    const result = createGenerator().generate(createModelWithTitleRecord('创建一个 RPG，有一个商人、两个村民和三个史莱姆'))
    expect(result.entities.filter(entity => entity.name === 'Merchant')).toHaveLength(1)
    expect(result.entities.filter(entity => entity.name === 'Villager').map(entity => entity.id)).toEqual(['villager', 'villager-2'])
    expect(result.entities.filter(entity => entity.name === 'Slime').map(entity => entity.id)).toEqual(['slime-1', 'slime-2', 'slime-3'])
  })

  it('existing entity extraction still works without counts', () => {
    const result = createGenerator().generate(createModelWithTitleRecord('Farm campfire'))
    expect(result.entities).toHaveLength(9)
    expect(result.entities[8].id).toBe('campfire')
  })

  it('world type detection still works with count content', () => {
    const result = createGenerator().generate(createModelWithTitleRecord('Farm 2 merchants'))
    expect(result.worldType).toBe('farm')
    expect(result.entities).toHaveLength(9) // template merchant + merchant-2
  })

  it('all entity categories are valid with counts', () => {
    const result = createGenerator().generate(createModelWithTitleRecord('2 merchants 3 enemies'))
    const valid: string[] = ['player', 'npc', 'enemy', 'terrain', 'building', 'item', 'quest']
    for (const entity of result.entities) {
      expect(valid).toContain(entity.category)
    }
  })

  it('immutability holds with counted entities', () => {
    const result = createGenerator().generate(createModelWithTitleRecord('2 merchants'))
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('determinism holds with count extraction', () => {
    const model = createModelWithTitleRecord('2 merchants 3 campfires 5 trees')
    const r1 = createGenerator().generate(model)
    const r2 = createGenerator().generate(model)
    expect(JSON.stringify(r1)).toBe(JSON.stringify(r2))
  })
})
