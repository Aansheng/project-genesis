/**
 * PromptEntityCountExtractor — verifies the DefaultPromptEntityCountExtractor
 * implementation for extracting entity counts from PromptAssemblyDomainModel.
 *
 * WO-S8-015 — Prompt Entity Count Extraction Foundation
 * Architecture version v1.78 → v1.79
 *
 * Coverage:
 *   - numeric counts
 *   - word counts
 *   - mixed case
 *   - multiple entities
 *   - duplicates
 *   - empty prompt
 *   - invalid numbers
 *   - large prompt
 *   - determinism
 *   - immutability
 */

import { describe, it, expect } from 'vitest'
import { DefaultPromptEntityCountExtractor } from '../game-world'
import type { PromptEntityCountExtractor } from '../game-world'
import type { PromptAssemblyDomainModel, OverviewDomain } from '../observatory/domain'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createExtractor(): PromptEntityCountExtractor {
  return new DefaultPromptEntityCountExtractor()
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
// Section 1 — Numeric Counts
// ---------------------------------------------------------------------------

describe('numeric counts', () => {
  it('extracts "2 farmers" as count 2', () => {
    const result = createExtractor().extractCounts(createModelWithTitleRecord('2 farmers'))
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('farmer')
    expect(result[0].count).toBe(2)
  })

  it('extracts "3 merchants" as count 3', () => {
    const result = createExtractor().extractCounts(createModelWithTitleRecord('3 merchants'))
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('merchant')
    expect(result[0].count).toBe(3)
  })

  it('extracts "5 enemies" as count 5', () => {
    const result = createExtractor().extractCounts(createModelWithTitleRecord('5 enemies'))
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('enemy')
    expect(result[0].count).toBe(5)
  })

  it('extracts "10 trees" as count 10', () => {
    const result = createExtractor().extractCounts(createModelWithTitleRecord('10 trees'))
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('tree')
    expect(result[0].count).toBe(10)
  })

  it('extracts "1 boss" as count 1', () => {
    const result = createExtractor().extractCounts(createModelWithTitleRecord('1 boss'))
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('boss')
    expect(result[0].count).toBe(1)
  })

  it('extracts all numeric digits 1-9', () => {
    for (let digit = 1; digit <= 9; digit++) {
      const result = createExtractor().extractCounts(
        createModelWithTitleRecord(`${digit} merchants`),
      )
      expect(result).toHaveLength(1)
      expect(result[0].count).toBe(digit)
    }
  })
})

// ---------------------------------------------------------------------------
// Section 2 — Word Counts
// ---------------------------------------------------------------------------

describe('word counts', () => {
  it('extracts "one farmer" as count 1', () => {
    const result = createExtractor().extractCounts(createModelWithTitleRecord('one farmer'))
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('farmer')
    expect(result[0].count).toBe(1)
  })

  it('extracts "two farmers" as count 2', () => {
    const result = createExtractor().extractCounts(createModelWithTitleRecord('two farmers'))
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('farmer')
    expect(result[0].count).toBe(2)
  })

  it('extracts "three merchants" as count 3', () => {
    const result = createExtractor().extractCounts(createModelWithTitleRecord('three merchants'))
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('merchant')
    expect(result[0].count).toBe(3)
  })

  it('extracts "four bosses" as count 4', () => {
    const result = createExtractor().extractCounts(createModelWithTitleRecord('four bosses'))
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('boss')
    expect(result[0].count).toBe(4)
  })

  it('extracts "five stones" as count 5', () => {
    const result = createExtractor().extractCounts(createModelWithTitleRecord('five stones'))
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('stone')
    expect(result[0].count).toBe(5)
  })

  it('extracts "ten campfires" as count 10', () => {
    const result = createExtractor().extractCounts(createModelWithTitleRecord('ten campfires'))
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('campfire')
    expect(result[0].count).toBe(10)
  })

  it('extracts all word numbers one-ten', () => {
    const wordNumbers: Record<string, number> = {
      one: 1, two: 2, three: 3, four: 4, five: 5,
      six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
    }
    for (const [word, expected] of Object.entries(wordNumbers)) {
      const result = createExtractor().extractCounts(
        createModelWithTitleRecord(`${word} merchants`),
      )
      expect(result).toHaveLength(1)
      expect(result[0].count).toBe(expected)
    }
  })
})

// ---------------------------------------------------------------------------
// Section 3 — Mixed Case
// ---------------------------------------------------------------------------

describe('mixed case', () => {
  it('handles uppercase title', () => {
    const result = createExtractor().extractCounts(
      createModelWithTitleRecord('TWO FARMERS'),
    )
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('farmer')
    expect(result[0].count).toBe(2)
  })

  it('handles mixed case title', () => {
    const result = createExtractor().extractCounts(
      createModelWithTitleRecord('ThReE MeRcHaNtS'),
    )
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('merchant')
    expect(result[0].count).toBe(3)
  })

  it('handles numeric with mixed case keyword', () => {
    const result = createExtractor().extractCounts(
      createModelWithTitleRecord('5 BoSsEs'),
    )
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('boss')
    expect(result[0].count).toBe(5)
  })
})

// ---------------------------------------------------------------------------
// Section 4 — Multiple Entities
// ---------------------------------------------------------------------------

describe('multiple entities', () => {
  it('extracts two entity counts from combined title', () => {
    const result = createExtractor().extractCounts(
      createModelWithTitleRecord('2 farmers and 3 merchants'),
    )
    expect(result).toHaveLength(2)
    // Catalog order: merchant before farmer
    expect(result[0].name).toBe('merchant')
    expect(result[0].count).toBe(3)
    expect(result[1].name).toBe('farmer')
    expect(result[1].count).toBe(2)
  })

  it('extracts three entity counts', () => {
    const result = createExtractor().extractCounts(
      createModelWithTitleRecord('1 boss 4 enemies 2 trees'),
    )
    expect(result).toHaveLength(3)
    // Catalog order: boss, enemy, tree
    expect(result[0].name).toBe('boss')
    expect(result[0].count).toBe(1)
    expect(result[1].name).toBe('enemy')
    expect(result[1].count).toBe(4)
    expect(result[2].name).toBe('tree')
    expect(result[2].count).toBe(2)
  })

  it('extracts mixed numeric and word counts', () => {
    const result = createExtractor().extractCounts(
      createModelWithTitleRecord('two farmers and 3 merchants'),
    )
    expect(result).toHaveLength(2)
    // Catalog order: merchant before farmer
    expect(result[0].name).toBe('merchant')
    expect(result[0].count).toBe(3)
    expect(result[1].name).toBe('farmer')
    expect(result[1].count).toBe(2)
  })

  it('extracts counts from sentence', () => {
    const result = createExtractor().extractCounts(
      createModelWithTitleRecord('A town with three merchants and one boss'),
    )
    expect(result).toHaveLength(2)
    expect(result[0].name).toBe('merchant')
    expect(result[0].count).toBe(3)
    expect(result[1].name).toBe('boss')
    expect(result[1].count).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// Section 5 — Duplicates
// ---------------------------------------------------------------------------

describe('duplicates', () => {
  it('deduplicates keyword with multiple numeric counts', () => {
    const result = createExtractor().extractCounts(
      createModelWithTitleRecord('2 farmers 3 farmers 5 farmers'),
    )
    // First match wins
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('farmer')
    expect(result[0].count).toBe(2)
  })

  it('deduplicates keyword with mixed word and numeric counts', () => {
    const result = createExtractor().extractCounts(
      createModelWithTitleRecord('two merchants 5 merchants'),
    )
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('merchant')
    expect(result[0].count).toBe(2)
  })

  it('deduplicates across multiple count entries', () => {
    const result = createExtractor().extractCounts(
      createModelWithTitleRecord('1 merchant 2 merchants 3 merchants'),
    )
    expect(result).toHaveLength(1)
    expect(result[0].count).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// Section 6 — Empty Prompt
// ---------------------------------------------------------------------------

describe('empty prompt', () => {
  it('model without overview returns empty array', () => {
    const result = createExtractor().extractCounts(createEmptyModel())
    expect(result).toHaveLength(0)
  })

  it('model with empty string title returns empty array', () => {
    const result = createExtractor().extractCounts(createModelWithTitleRecord(''))
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
    const result = createExtractor().extractCounts(model)
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
    const result = createExtractor().extractCounts(model)
    expect(result).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Section 7 — Invalid Numbers
// ---------------------------------------------------------------------------

describe('invalid numbers', () => {
  it('ignores standalone numbers without keyword', () => {
    const result = createExtractor().extractCounts(
      createModelWithTitleRecord('2 is a number'),
    )
    expect(result).toHaveLength(0)
  })

  it('ignores numbers followed by non-keyword', () => {
    const result = createExtractor().extractCounts(
      createModelWithTitleRecord('2 apples and 3 oranges'),
    )
    expect(result).toHaveLength(0)
  })

  it('ignores keyword without preceding number', () => {
    const result = createExtractor().extractCounts(
      createModelWithTitleRecord('farmers and merchants'),
    )
    expect(result).toHaveLength(0)
  })

  it('ignores number at end of title', () => {
    const result = createExtractor().extractCounts(
      createModelWithTitleRecord('I have 2'),
    )
    expect(result).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Section 8 — Large Prompt
// ---------------------------------------------------------------------------

describe('large prompt', () => {
  it('handles very long title with many counts', () => {
    const title = '2 farmers '.repeat(100) + '3 merchants '.repeat(100)
    const result = createExtractor().extractCounts(
      createModelWithTitleRecord(title.trim()),
    )
    // First match wins for each keyword; output follows catalog order
    expect(result).toHaveLength(2)
    // Catalog order: merchant before farmer
    expect(result[0].name).toBe('merchant')
    expect(result[0].count).toBe(3)
    expect(result[1].name).toBe('farmer')
    expect(result[1].count).toBe(2)
  })

  it('handles long title with no counts', () => {
    const title = 'unknown '.repeat(1000)
    const result = createExtractor().extractCounts(
      createModelWithTitleRecord(title.trim()),
    )
    expect(result).toHaveLength(0)
  })

  it('handles large digits beyond 10', () => {
    const result = createExtractor().extractCounts(
      createModelWithTitleRecord('100 trees'),
    )
    // 100 is a valid multi-digit number
    expect(result).toHaveLength(1)
    expect(result[0].count).toBe(100)
  })
})

// ---------------------------------------------------------------------------
// Section 9 — Immutability
// ---------------------------------------------------------------------------

describe('immutability', () => {
  it('result array is frozen', () => {
    const result = createExtractor().extractCounts(
      createModelWithTitleRecord('2 farmers'),
    )
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('each count entry is frozen', () => {
    const result = createExtractor().extractCounts(
      createModelWithTitleRecord('2 farmers 3 merchants'),
    )
    for (const entry of result) {
      expect(Object.isFrozen(entry)).toBe(true)
    }
  })

  it('empty result is frozen', () => {
    const result = createExtractor().extractCounts(createEmptyModel())
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('does not mutate input model', () => {
    const extractor = createExtractor()
    const model = createModelWithTitleRecord('2 farmers')
    const before = JSON.stringify(model)
    extractor.extractCounts(model)
    expect(JSON.stringify(model)).toBe(before)
  })

  it('accepts frozen input without error', () => {
    const model = Object.freeze({
      overview: Object.freeze({
        traceCount: 0,
        timelineCount: 0,
        historyCount: 0,
        title: '2 farmers',
      }),
    })
    expect(() => createExtractor().extractCounts(model)).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// Section 10 — Determinism
// ---------------------------------------------------------------------------

describe('determinism', () => {
  it('same input produces same result', () => {
    const extractor = createExtractor()
    const model = createModelWithTitleRecord('2 farmers 3 merchants 5 trees')
    const first = extractor.extractCounts(model)
    const second = extractor.extractCounts(model)
    expect(JSON.stringify(first)).toBe(JSON.stringify(second))
  })

  it('different extractors with same input produce same result', () => {
    const model = createModelWithTitleRecord('4 enemies 1 boss')
    const result1 = createExtractor().extractCounts(model)
    const result2 = createExtractor().extractCounts(model)
    expect(JSON.stringify(result1)).toBe(JSON.stringify(result2))
  })

  it('order follows catalog regardless of input order', () => {
    // Catalog order: merchant (npc), farmer (npc), villager (npc),
    // barn (building), storage (building), town (building),
    // quest, boss, enemy, forest, platform, checkpoint, tree, stone, campfire
    const result = createExtractor().extractCounts(
      createModelWithTitleRecord('3 farmers 2 merchants'),
    )
    expect(result).toHaveLength(2)
    // merchant comes before farmer in catalog
    expect(result[0].name).toBe('merchant')
    expect(result[1].name).toBe('farmer')
  })

  it('empty model extraction is deterministic', () => {
    const r1 = createExtractor().extractCounts(createEmptyModel())
    const r2 = createExtractor().extractCounts(createEmptyModel())
    expect(JSON.stringify(r1)).toBe(JSON.stringify(r2))
  })

  it('order is consistent across repeated calls', () => {
    const model = createModelWithTitleRecord('5 trees 2 campfires 3 stones')
    // Catalog: tree, stone, campfire
    const result = createExtractor().extractCounts(model)
    expect(result[0].name).toBe('tree')
    expect(result[0].count).toBe(5)
    expect(result[1].name).toBe('stone')
    expect(result[1].count).toBe(3)
    expect(result[2].name).toBe('campfire')
    expect(result[2].count).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// Section 11 — Invalid Inputs
// ---------------------------------------------------------------------------

describe('invalid inputs', () => {
  it('undefined model returns empty array', () => {
    const result = createExtractor().extractCounts(
      undefined as unknown as PromptAssemblyDomainModel,
    )
    expect(result).toHaveLength(0)
  })

  it('null model returns empty array', () => {
    const result = createExtractor().extractCounts(
      null as unknown as PromptAssemblyDomainModel,
    )
    expect(result).toHaveLength(0)
  })

  it('non-object model returns empty array', () => {
    const result = createExtractor().extractCounts(
      'invalid' as unknown as PromptAssemblyDomainModel,
    )
    expect(result).toHaveLength(0)
  })

  it('array model returns empty array', () => {
    const result = createExtractor().extractCounts(
      [] as unknown as PromptAssemblyDomainModel,
    )
    expect(result).toHaveLength(0)
  })
})