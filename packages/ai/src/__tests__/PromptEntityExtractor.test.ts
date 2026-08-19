/**
 * PromptEntityExtractor — verifies the DefaultPromptEntityExtractor
 * implementation for extracting entities from PromptAssemblyDomainModel.
 *
 * WO-S8-014 — Prompt Entity Extraction Foundation
 * Architecture version v1.77 → v1.78
 *
 * Coverage:
 *   - single keyword
 *   - multiple keywords
 *   - duplicates
 *   - case insensitive
 *   - empty prompt
 *   - unknown words
 *   - large prompt
 *   - immutability
 *   - determinism
 */

import { describe, it, expect } from 'vitest'
import { DefaultPromptEntityExtractor } from '../game-world'
import type { PromptEntityExtractor } from '../game-world'
import type { PromptAssemblyDomainModel, OverviewDomain } from '../observatory/domain'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createExtractor(): PromptEntityExtractor {
  return new DefaultPromptEntityExtractor()
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

// ---------------------------------------------------------------------------
// Section 1 — Single Keyword
// ---------------------------------------------------------------------------

describe('single keyword', () => {
  it('extracts Chinese farm and RPG actors with canonical names', () => {
    const result = createExtractor().extract(createModelWithTitleRecord('3头牛 史莱姆 商人 村民'))
    expect(result).toEqual([
      { category: 'npc', name: 'Merchant' },
      { category: 'npc', name: 'Villager' },
      { category: 'npc', name: 'Cow' },
      { category: 'enemy', name: 'Slime' },
    ])
  })

  it('extracts merchant from title', () => {
    const result = createExtractor().extract(createModelWithTitleRecord('merchant'))
    expect(result).toHaveLength(1)
    expect(result[0].category).toBe('npc')
    expect(result[0].name).toBe('Merchant')
  })

  it('extracts farmer from title', () => {
    const result = createExtractor().extract(createModelWithTitleRecord('farmer'))
    expect(result).toHaveLength(1)
    expect(result[0].category).toBe('npc')
    expect(result[0].name).toBe('Farmer')
  })

  it('extracts barn from title', () => {
    const result = createExtractor().extract(createModelWithTitleRecord('barn'))
    expect(result).toHaveLength(1)
    expect(result[0].category).toBe('building')
    expect(result[0].name).toBe('Barn')
  })

  it('extracts storage from title', () => {
    const result = createExtractor().extract(createModelWithTitleRecord('storage'))
    expect(result).toHaveLength(1)
    expect(result[0].category).toBe('building')
    expect(result[0].name).toBe('Storage')
  })

  it('extracts quest from title', () => {
    const result = createExtractor().extract(createModelWithTitleRecord('quest'))
    expect(result).toHaveLength(1)
    expect(result[0].category).toBe('quest')
    expect(result[0].name).toBe('Quest')
  })

  it('extracts boss from title', () => {
    const result = createExtractor().extract(createModelWithTitleRecord('boss'))
    expect(result).toHaveLength(1)
    expect(result[0].category).toBe('enemy')
    expect(result[0].name).toBe('Boss')
  })

  it('extracts enemy from title', () => {
    const result = createExtractor().extract(createModelWithTitleRecord('enemy'))
    expect(result).toHaveLength(1)
    expect(result[0].category).toBe('enemy')
    expect(result[0].name).toBe('Enemy')
  })

  it('extracts villager from title', () => {
    const result = createExtractor().extract(createModelWithTitleRecord('villager'))
    expect(result).toHaveLength(1)
    expect(result[0].category).toBe('npc')
    expect(result[0].name).toBe('Villager')
  })

  it('extracts forest from title', () => {
    const result = createExtractor().extract(createModelWithTitleRecord('forest'))
    expect(result).toHaveLength(1)
    expect(result[0].category).toBe('terrain')
    expect(result[0].name).toBe('Forest')
  })

  it('extracts town from title', () => {
    const result = createExtractor().extract(createModelWithTitleRecord('town'))
    expect(result).toHaveLength(1)
    expect(result[0].category).toBe('building')
    expect(result[0].name).toBe('Town')
  })

  it('extracts platform from title', () => {
    const result = createExtractor().extract(createModelWithTitleRecord('platform'))
    expect(result).toHaveLength(1)
    expect(result[0].category).toBe('terrain')
    expect(result[0].name).toBe('Platform')
  })

  it('extracts checkpoint from title', () => {
    const result = createExtractor().extract(createModelWithTitleRecord('checkpoint'))
    expect(result).toHaveLength(1)
    expect(result[0].category).toBe('terrain')
    expect(result[0].name).toBe('Checkpoint')
  })

  it('extracts tree from title', () => {
    const result = createExtractor().extract(createModelWithTitleRecord('tree'))
    expect(result).toHaveLength(1)
    expect(result[0].category).toBe('terrain')
    expect(result[0].name).toBe('Tree')
  })

  it('extracts stone from title', () => {
    const result = createExtractor().extract(createModelWithTitleRecord('stone'))
    expect(result).toHaveLength(1)
    expect(result[0].category).toBe('terrain')
    expect(result[0].name).toBe('Stone')
  })

  it('extracts campfire from title', () => {
    const result = createExtractor().extract(createModelWithTitleRecord('campfire'))
    expect(result).toHaveLength(1)
    expect(result[0].category).toBe('item')
    expect(result[0].name).toBe('Campfire')
  })
})

// ---------------------------------------------------------------------------
// Section 2 — Multiple Keywords
// ---------------------------------------------------------------------------

describe('multiple keywords', () => {
  it('extracts merchant and barn from combined title', () => {
    const result = createExtractor().extract(createModelWithTitleRecord('Farm with merchant and barn'))
    expect(result).toHaveLength(2)
    expect(result[0].category).toBe('npc')
    expect(result[0].name).toBe('Merchant')
    expect(result[1].category).toBe('building')
    expect(result[1].name).toBe('Barn')
  })

  it('extracts boss, enemy, and forest from combined title', () => {
    const result = createExtractor().extract(createModelWithTitleRecord('Boss enemy forest battle'))
    expect(result).toHaveLength(3)
    expect(result[0].category).toBe('enemy')
    expect(result[0].name).toBe('Boss')
    expect(result[1].category).toBe('enemy')
    expect(result[1].name).toBe('Enemy')
    expect(result[2].category).toBe('terrain')
    expect(result[2].name).toBe('Forest')
  })

  it('extracts all npc keywords when present', () => {
    const result = createExtractor().extract(createModelWithTitleRecord('merchant farmer villager'))
    expect(result).toHaveLength(3)
    expect(result[0].name).toBe('Merchant')
    expect(result[1].name).toBe('Farmer')
    expect(result[2].name).toBe('Villager')
  })

  it('extracts multiple terrain keywords', () => {
    const result = createExtractor().extract(createModelWithTitleRecord('forest tree stone platform checkpoint'))
    expect(result).toHaveLength(5)
    for (const entity of result) {
      expect(entity.category).toBe('terrain')
    }
  })

  it('extracts across all categories', () => {
    const result = createExtractor().extract(createModelWithTitleRecord('merchant barn quest boss tree campfire'))
    expect(result).toHaveLength(6)
    expect(result[0].category).toBe('npc')
    expect(result[1].category).toBe('building')
    expect(result[2].category).toBe('quest')
    expect(result[3].category).toBe('enemy')
    expect(result[4].category).toBe('terrain')
    expect(result[5].category).toBe('item')
  })
})

// ---------------------------------------------------------------------------
// Section 3 — Duplicates
// ---------------------------------------------------------------------------

describe('duplicates', () => {
  it('deduplicates same keyword repeated in title', () => {
    const result = createExtractor().extract(createModelWithTitleRecord('merchant merchant merchant'))
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Merchant')
  })

  it('deduplicates with different casing', () => {
    const result = createExtractor().extract(createModelWithTitleRecord('Merchant MERCHANT merchant'))
    expect(result).toHaveLength(1)
  })

  it('deduplicates multiple different keywords repeated', () => {
    const result = createExtractor().extract(createModelWithTitleRecord('barn barn barn storage storage'))
    expect(result).toHaveLength(2)
    expect(result[0].name).toBe('Barn')
    expect(result[1].name).toBe('Storage')
  })
})

// ---------------------------------------------------------------------------
// Section 4 — Case Insensitive
// ---------------------------------------------------------------------------

describe('case insensitive', () => {
  it('matches uppercase keyword', () => {
    const result = createExtractor().extract(createModelWithTitleRecord('MERCHANT'))
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Merchant')
  })

  it('matches mixed case keyword', () => {
    const result = createExtractor().extract(createModelWithTitleRecord('MeRcHaNt'))
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Merchant')
  })

  it('matches lowercase keyword in sentence', () => {
    const result = createExtractor().extract(createModelWithTitleRecord('The merchant arrives at the barn'))
    expect(result).toHaveLength(2)
    expect(result[0].name).toBe('Merchant')
    expect(result[1].name).toBe('Barn')
  })

  it('matches uppercase in sentence', () => {
    const result = createExtractor().extract(createModelWithTitleRecord('The MERCHANT arrives at the BARN'))
    expect(result).toHaveLength(2)
    expect(result[0].name).toBe('Merchant')
    expect(result[1].name).toBe('Barn')
  })
})

// ---------------------------------------------------------------------------
// Section 5 — Empty Prompt
// ---------------------------------------------------------------------------

describe('empty prompt', () => {
  it('model without overview returns empty array', () => {
    const result = createExtractor().extract(createEmptyModel())
    expect(result).toHaveLength(0)
  })

  it('model with empty string title returns empty array', () => {
    const result = createExtractor().extract(createModelWithTitleRecord(''))
    expect(result).toHaveLength(0)
  })

  it('model with null title returns empty array', () => {
    const model: PromptAssemblyDomainModel = {
      overview: {
        traceCount: 0,
        timelineCount: 0,
        historyCount: 0,
        title: null,
      } as unknown as OverviewDomain,
    }
    const result = createExtractor().extract(model)
    expect(result).toHaveLength(0)
  })

  it('model with number title returns empty array', () => {
    const model: PromptAssemblyDomainModel = {
      overview: {
        traceCount: 0,
        timelineCount: 0,
        historyCount: 0,
        title: 42,
      } as unknown as OverviewDomain,
    }
    const result = createExtractor().extract(model)
    expect(result).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Section 6 — Unknown Words
// ---------------------------------------------------------------------------

describe('unknown words', () => {
  it('title with no known keywords returns empty', () => {
    const result = createExtractor().extract(createModelWithTitleRecord('Completely unknown title'))
    expect(result).toHaveLength(0)
  })

  it('title with only world type keywords returns empty or extraction-only', () => {
    // "platform" is both a world type keyword AND an extraction keyword
    const result = createExtractor().extract(createModelWithTitleRecord('Farm survival rpg platform'))
    // platform → terrain is extracted
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Platform')
  })

  it('title with random text returns empty', () => {
    const result = createExtractor().extract(createModelWithTitleRecord('xyz abc def ghi'))
    expect(result).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Section 7 — Large Prompt
// ---------------------------------------------------------------------------

describe('large prompt', () => {
  it('handles very long title with many keywords', () => {
    const title = 'merchant '.repeat(100) + 'barn '.repeat(100) + 'forest '.repeat(100)
    const result = createExtractor().extract(createModelWithTitleRecord(title.trim()))
    expect(result).toHaveLength(3)
    expect(result[0].name).toBe('Merchant')
    expect(result[1].name).toBe('Barn')
    expect(result[2].name).toBe('Forest')
  })

  it('handles long title with no keywords', () => {
    const title = 'unknown '.repeat(1000)
    const result = createExtractor().extract(createModelWithTitleRecord(title.trim()))
    expect(result).toHaveLength(0)
  })

  it('extracts all keywords from exhaustive title', () => {
    const title = 'merchant farmer barn storage quest boss enemy villager forest town platform checkpoint tree stone campfire'
    const result = createExtractor().extract(createModelWithTitleRecord(title))
    expect(result).toHaveLength(15)
  })
})

// ---------------------------------------------------------------------------
// Section 8 — Immutability
// ---------------------------------------------------------------------------

describe('immutability', () => {
  it('result array is frozen', () => {
    const result = createExtractor().extract(createModelWithTitleRecord('merchant barn'))
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('each extracted entity is frozen', () => {
    const result = createExtractor().extract(createModelWithTitleRecord('merchant barn'))
    for (const entity of result) {
      expect(Object.isFrozen(entity)).toBe(true)
    }
  })

  it('empty result is frozen', () => {
    const result = createExtractor().extract(createEmptyModel())
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('does not mutate input model', () => {
    const extractor = createExtractor()
    const model = createModelWithTitleRecord('merchant barn')
    const before = JSON.stringify(model)
    extractor.extract(model)
    expect(JSON.stringify(model)).toBe(before)
  })

  it('accepts frozen input without error', () => {
    const model = Object.freeze({
      overview: Object.freeze({
        traceCount: 0,
        timelineCount: 0,
        historyCount: 0,
        title: 'merchant',
      }),
    })
    expect(() => createExtractor().extract(model)).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// Section 9 — Determinism
// ---------------------------------------------------------------------------

describe('determinism', () => {
  it('same input produces same result', () => {
    const extractor = createExtractor()
    const model = createModelWithTitleRecord('merchant barn forest')
    const first = extractor.extract(model)
    const second = extractor.extract(model)
    expect(JSON.stringify(first)).toBe(JSON.stringify(second))
  })

  it('different extractors with same input produce same result', () => {
    const model = createModelWithTitleRecord('boss enemy town')
    const result1 = createExtractor().extract(model)
    const result2 = createExtractor().extract(model)
    expect(JSON.stringify(result1)).toBe(JSON.stringify(result2))
  })

  it('extraction order is deterministic by catalog', () => {
    const result = createExtractor().extract(createModelWithTitleRecord('town barn merchant'))
    expect(result).toHaveLength(3)
    // Catalog order: merchant (npc) → barn (building) → town (building)
    expect(result[0].name).toBe('Merchant')
    expect(result[1].name).toBe('Barn')
    expect(result[2].name).toBe('Town')
  })

  it('extraction order ignores input keyword order', () => {
    // Forward: merchant barn → barn merchant
    const forward = createExtractor().extract(createModelWithTitleRecord('merchant barn'))
    const reverse = createExtractor().extract(createModelWithTitleRecord('barn merchant'))
    expect(JSON.stringify(forward)).toBe(JSON.stringify(reverse))
  })

  it('empty model extraction is deterministic', () => {
    const r1 = createExtractor().extract(createEmptyModel())
    const r2 = createExtractor().extract(createEmptyModel())
    expect(JSON.stringify(r1)).toBe(JSON.stringify(r2))
  })
})

// ---------------------------------------------------------------------------
// Section 10 — Invalid Inputs
// ---------------------------------------------------------------------------

describe('invalid inputs', () => {
  it('undefined model returns empty array', () => {
    const result = createExtractor().extract(undefined as unknown as PromptAssemblyDomainModel)
    expect(result).toHaveLength(0)
  })

  it('null model returns empty array', () => {
    const result = createExtractor().extract(null as unknown as PromptAssemblyDomainModel)
    expect(result).toHaveLength(0)
  })

  it('non-object model returns empty array', () => {
    const result = createExtractor().extract('invalid' as unknown as PromptAssemblyDomainModel)
    expect(result).toHaveLength(0)
  })

  it('array model returns empty array', () => {
    const result = createExtractor().extract([] as unknown as PromptAssemblyDomainModel)
    expect(result).toHaveLength(0)
  })
})
