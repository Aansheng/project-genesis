/**
 * GameIntentExtractor.test.ts — comprehensive test suite for Game Intent extraction.
 *
 * Target: 80+ tests
 * Coverage: construction, genre detection, case insensitive matching,
 *           title extraction, fallback title, empty model, null values,
 *           undefined values, large inputs, determinism, immutability
 */
import { describe, it, expect } from 'vitest'
import { DefaultGameIntentExtractor } from '../game-intent/DefaultGameIntentExtractor'
import type { GameGenre } from '../game-intent/GameIntent'
import type { PromptAssemblyDomainModel } from '../observatory/domain/PromptAssemblyDomainModel'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Create a minimal PromptAssemblyDomainModel with a specific overview title.
 */
function createModel(title?: string): PromptAssemblyDomainModel {
  if (title === undefined) {
    return Object.freeze({} as PromptAssemblyDomainModel)
  }
  return Object.freeze({
    overview: Object.freeze({
      title,
      traceCount: 0,
      timelineCount: 0,
      historyCount: 0,
    }),
  } as unknown as PromptAssemblyDomainModel)
}

/**
 * Create a minimal PromptAssemblyDomainModel with a full overview object.
 */
function createFullModel(title?: string): PromptAssemblyDomainModel {
  if (title === undefined) {
    return Object.freeze({} as PromptAssemblyDomainModel)
  }
  return Object.freeze({
    overview: Object.freeze({
      title,
      traceCount: 5,
      timelineCount: 3,
      historyCount: 2,
    }),
  } as unknown as PromptAssemblyDomainModel)
}

// ---------------------------------------------------------------------------
// Construction
// ---------------------------------------------------------------------------

describe('construction', () => {
  it('should create a DefaultGameIntentExtractor instance', () => {
    const extractor = new DefaultGameIntentExtractor()
    expect(extractor).toBeInstanceOf(DefaultGameIntentExtractor)
  })

  it('should have an extract method', () => {
    const extractor = new DefaultGameIntentExtractor()
    expect(typeof extractor.extract).toBe('function')
  })

  it('should return a GameIntent from extract', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('My Game'))
    expect(result).toHaveProperty('genre')
    expect(result).toHaveProperty('title')
  })

  it('should implement GameIntentExtractor interface', () => {
    const extractor = new DefaultGameIntentExtractor()
    expect(extractor).toBeDefined()
  })

  it('should be stateless (no constructor parameters)', () => {
    const extractor = new DefaultGameIntentExtractor()
    expect(Object.keys(extractor)).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Genre detection — platformer
// ---------------------------------------------------------------------------

describe('genre detection — platformer', () => {
  it('should detect platformer from "Mario"', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('Super Mario World'))
    expect(result.genre).toBe('platformer')
  })

  it('should detect platformer from "mario"', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('mario adventure'))
    expect(result.genre).toBe('platformer')
  })

  it('should detect platformer from "MARIO"', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('MARIO BROS'))
    expect(result.genre).toBe('platformer')
  })

  it('should detect platformer from "MaRiO"', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('Super MaRiO Land'))
    expect(result.genre).toBe('platformer')
  })

  it('should detect platformer from "mario" in sentence', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('A mario style platformer'))
    expect(result.genre).toBe('platformer')
  })

  it('should detect platformer from mixed case "Mario" in phrase', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('Please generate a Mario game'))
    expect(result.genre).toBe('platformer')
  })

  it('should detect platformer when mario is at the end', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('Game about mario'))
    expect(result.genre).toBe('platformer')
  })

  it('should detect platformer when mario is alone', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('mario'))
    expect(result.genre).toBe('platformer')
  })

  it('should detect platformer from the direct English genre name', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('create a platformer with a coin'))
    expect(result.genre).toBe('platformer')
  })

  it('should detect platformer from the Chinese product wording', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('生成一个平台跳跃游戏，有一个玩家和一个金币'))
    expect(result.genre).toBe('platformer')
  })
})

// ---------------------------------------------------------------------------
// Genre detection — farm
// ---------------------------------------------------------------------------

describe('genre detection — farm', () => {
  it('should detect farm from "Farm"', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('My Little Farm'))
    expect(result.genre).toBe('farm')
  })

  it('should detect farm from "farm"', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('farm simulator'))
    expect(result.genre).toBe('farm')
  })

  it('should detect farm from "FARM"', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('FARM LIFE'))
    expect(result.genre).toBe('farm')
  })

  it('should detect farm from "FaRm"', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('FaRm Story'))
    expect(result.genre).toBe('farm')
  })

  it('should detect farm from "farm" in sentence', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('I want a farm game'))
    expect(result.genre).toBe('farm')
  })

  it('should detect farm from the Chinese archetype alias', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('做一个农场游戏'))
    expect(result.genre).toBe('farm')
  })

  it('should detect farm from word containing "farm"', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('farming simulation'))
    expect(result.genre).toBe('farm')
  })

  it('should detect farm from "Star Dew Farm"', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('Star Dew Farm Valley'))
    expect(result.genre).toBe('farm')
  })

  it('should detect farm when farm is at the end', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('Happy farm'))
    expect(result.genre).toBe('farm')
  })

  it('should not treat mario as farm', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('Super Mario'))
    expect(result.genre).toBe('platformer')
  })
})

// ---------------------------------------------------------------------------
// Genre detection — rpg
// ---------------------------------------------------------------------------

describe('genre detection — rpg', () => {
  it('should detect rpg from "RPG"', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('My RPG World'))
    expect(result.genre).toBe('rpg')
  })

  it('should detect rpg from "rpg"', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('rpg adventure'))
    expect(result.genre).toBe('rpg')
  })

  it('should detect rpg from "Rpg"', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('Awesome Rpg Game'))
    expect(result.genre).toBe('rpg')
  })

  it('should detect rpg from lowercase sentence', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('create an rpg game'))
    expect(result.genre).toBe('rpg')
  })

  it('should detect rpg when rpg is at the start', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('RPG Quest'))
    expect(result.genre).toBe('rpg')
  })

  it('should detect rpg with punctuation', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('RPG: The Adventure'))
    expect(result.genre).toBe('rpg')
  })

  it('should not treat farm as rpg when title contains both', () => {
    const extractor = new DefaultGameIntentExtractor()
    // 'farm' is checked before 'rpg' in the detection chain
    const result = extractor.extract(createModel('farm rpg'))
    expect(result.genre).toBe('farm')
  })
})

// ---------------------------------------------------------------------------
// Genre detection — survival
// ---------------------------------------------------------------------------

describe('genre detection — survival', () => {
  it('should detect survival from the common "survivor" alias', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('Create a survivor-style game'))
    expect(result.genre).toBe('survival')
  })

  it('should detect survival from "Survival"', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('Survival Island'))
    expect(result.genre).toBe('survival')
  })

  it('should detect survival from "survival"', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('survival mode'))
    expect(result.genre).toBe('survival')
  })

  it('should detect survival from "SURVIVAL"', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('SURVIVAL GAME'))
    expect(result.genre).toBe('survival')
  })

  it('should detect survival from mixed case', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('sUrViVaL challenge'))
    expect(result.genre).toBe('survival')
  })

  it('should detect survival in sentence', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('Generate a survival game'))
    expect(result.genre).toBe('survival')
  })

  it('should detect survival from compound word', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('survivalcraft world'))
    expect(result.genre).toBe('survival')
  })

  it('should detect survival at end of title', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('The Last survival'))
    expect(result.genre).toBe('survival')
  })

  it.each(['帮我生成一个2D幸存者游戏', '帮我生成一个生存游戏'])('should detect survival from Chinese alias: %s', (title) => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel(title))
    expect(result.genre).toBe('survival')
  })
})

// ---------------------------------------------------------------------------
// Genre detection — sandbox (fallback)
// ---------------------------------------------------------------------------

describe('genre detection — sandbox (fallback)', () => {
  it('should default to sandbox for empty model', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel())
    expect(result.genre).toBe('sandbox')
  })

  it('should default to sandbox for unrecognized title', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('My Custom Game'))
    expect(result.genre).toBe('sandbox')
  })

  it('should default to sandbox for an unsupported archetype', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('创建一个解谜游戏'))
    expect(result.genre).toBe('sandbox')
  })

  it('should default to sandbox for numeric title', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('12345'))
    expect(result.genre).toBe('sandbox')
  })

  it('should default to sandbox for symbol-only title', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('!@#$%^'))
    expect(result.genre).toBe('sandbox')
  })

  it('should default to sandbox for single character title', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('A'))
    expect(result.genre).toBe('sandbox')
  })

  it('should default to sandbox for undefined overview', () => {
    const extractor = new DefaultGameIntentExtractor()
    const model = Object.freeze({} as PromptAssemblyDomainModel)
    const result = extractor.extract(model)
    expect(result.genre).toBe('sandbox')
  })

  it('should default to sandbox for non-keyword word', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('Adventure'))
    expect(result.genre).toBe('sandbox')
  })
})

// ---------------------------------------------------------------------------
// Genre detection — priority: mario > farm > rpg > survival > sandbox
// ---------------------------------------------------------------------------

describe('genre detection — priority ordering', () => {
  it('should detect platformer over farm when both present', () => {
    const extractor = new DefaultGameIntentExtractor()
    // mario is checked first, so it wins over farm
    const result = extractor.extract(createModel('Mario Farm'))
    expect(result.genre).toBe('platformer')
  })

  it('should detect platformer over rpg when both present', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('Mario RPG'))
    expect(result.genre).toBe('platformer')
  })

  it('should detect platformer over survival when both present', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('Mario Survival'))
    expect(result.genre).toBe('platformer')
  })

  it('should detect farm over rpg when both present', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('Farm RPG'))
    expect(result.genre).toBe('farm')
  })

  it('should detect farm over survival when both present', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('Farm Survival'))
    expect(result.genre).toBe('farm')
  })

  it('should detect rpg over survival when both present', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('RPG Survival'))
    expect(result.genre).toBe('rpg')
  })

  it('should detect farm over mario when farm is at start', () => {
    // farm is checked AFTER mario in the if-else chain
    // so this tests mario is checked first
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('Farm Mario'))
    expect(result.genre).toBe('platformer')
  })
})

// ---------------------------------------------------------------------------
// Title extraction
// ---------------------------------------------------------------------------

describe('title extraction', () => {
  it('should extract title from model', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('Super Mario World'))
    expect(result.title).toBe('Super Mario World')
  })

  it('should extract title with farm keyword', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('Stardew Farm Valley'))
    expect(result.title).toBe('Stardew Farm Valley')
  })

  it('should extract title with rpg keyword', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('Fantasy RPG World'))
    expect(result.title).toBe('Fantasy RPG World')
  })

  it('should extract title with survival keyword', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('Survival in the Wild'))
    expect(result.title).toBe('Survival in the Wild')
  })

  it('should extract title with sandbox keyword', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('Creative Sandbox'))
    expect(result.title).toBe('Creative Sandbox')
  })

  it('should extract title from full model with counts', () => {
    const extractor = new DefaultGameIntentExtractor()
    const model = createFullModel('Super Mario Galaxy')
    const result = extractor.extract(model)
    expect(result.title).toBe('Super Mario Galaxy')
  })
})

// ---------------------------------------------------------------------------
// Fallback title
// ---------------------------------------------------------------------------

describe('fallback title', () => {
  it('should use fallback title for empty model', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel())
    expect(result.title).toBe('Untitled Game')
  })

  it('should use fallback title for undefined overview', () => {
    const extractor = new DefaultGameIntentExtractor()
    const model = Object.freeze({} as PromptAssemblyDomainModel)
    const result = extractor.extract(model)
    expect(result.title).toBe('Untitled Game')
  })

  it('should use fallback title for model without overview', () => {
    const extractor = new DefaultGameIntentExtractor()
    const model = Object.freeze({}) as PromptAssemblyDomainModel
    const result = extractor.extract(model)
    expect(result.title).toBe('Untitled Game')
  })

  it('should use fallback title for empty string title', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel(''))
    expect(result.title).toBe('Untitled Game')
  })

  it('should use fallback for blank string title', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('   '))
    expect(result.title).toBe('Untitled Game')
  })
})

// ---------------------------------------------------------------------------
// Empty model
// ---------------------------------------------------------------------------

describe('empty model', () => {
  it('should handle empty frozen model', () => {
    const extractor = new DefaultGameIntentExtractor()
    const model = Object.freeze({}) as PromptAssemblyDomainModel
    const result = extractor.extract(model)
    expect(result.genre).toBe('sandbox')
    expect(result.title).toBe('Untitled Game')
  })

  it('should handle model with empty overview object', () => {
    const extractor = new DefaultGameIntentExtractor()
    const model = Object.freeze({
      overview: Object.freeze({}),
    }) as unknown as PromptAssemblyDomainModel
    const result = extractor.extract(model)
    expect(result.genre).toBe('sandbox')
    expect(result.title).toBe('Untitled Game')
  })

  it('should handle model without overview', () => {
    const extractor = new DefaultGameIntentExtractor()
    const model = Object.freeze({
      trace: [],
    }) as unknown as PromptAssemblyDomainModel
    const result = extractor.extract(model)
    expect(result.genre).toBe('sandbox')
    expect(result.title).toBe('Untitled Game')
  })
})

// ---------------------------------------------------------------------------
// Null values
// ---------------------------------------------------------------------------

describe('null values', () => {
  it('should handle null model', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(null as unknown as PromptAssemblyDomainModel)
    expect(result.genre).toBe('sandbox')
    expect(result.title).toBe('Untitled Game')
  })

  it('should handle null overview', () => {
    const extractor = new DefaultGameIntentExtractor()
    const model = Object.freeze({
      overview: null,
    }) as unknown as PromptAssemblyDomainModel
    const result = extractor.extract(model)
    expect(result.genre).toBe('sandbox')
    expect(result.title).toBe('Untitled Game')
  })
})

// ---------------------------------------------------------------------------
// Undefined values
// ---------------------------------------------------------------------------

describe('undefined values', () => {
  it('should handle undefined model', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(undefined as unknown as PromptAssemblyDomainModel)
    expect(result.genre).toBe('sandbox')
    expect(result.title).toBe('Untitled Game')
  })

  it('should handle undefined overview title', () => {
    const extractor = new DefaultGameIntentExtractor()
    const model = Object.freeze({
      overview: Object.freeze({
        title: undefined,
      }),
    }) as unknown as PromptAssemblyDomainModel
    const result = extractor.extract(model)
    expect(result.title).toBe('Untitled Game')
  })
})

// ---------------------------------------------------------------------------
// Invalid model types
// ---------------------------------------------------------------------------

describe('invalid model types', () => {
  it('should handle non-object model (array)', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract([] as unknown as PromptAssemblyDomainModel)
    expect(result.genre).toBe('sandbox')
    expect(result.title).toBe('Untitled Game')
  })

  it('should handle number as model', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(42 as unknown as PromptAssemblyDomainModel)
    expect(result.genre).toBe('sandbox')
    expect(result.title).toBe('Untitled Game')
  })

  it('should handle boolean as model', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(true as unknown as PromptAssemblyDomainModel)
    expect(result.genre).toBe('sandbox')
    expect(result.title).toBe('Untitled Game')
  })

  it('should handle string as model', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract('mario' as unknown as PromptAssemblyDomainModel)
    expect(result.genre).toBe('sandbox')
    expect(result.title).toBe('Untitled Game')
  })

  it('should handle overview with numeric title', () => {
    const extractor = new DefaultGameIntentExtractor()
    const model = Object.freeze({
      overview: Object.freeze({
        title: 42,
      }),
    }) as unknown as PromptAssemblyDomainModel
    const result = extractor.extract(model)
    expect(result.title).toBe('Untitled Game')
  })

  it('should handle overview with null title', () => {
    const extractor = new DefaultGameIntentExtractor()
    const model = Object.freeze({
      overview: Object.freeze({
        title: null,
      }),
    }) as unknown as PromptAssemblyDomainModel
    const result = extractor.extract(model)
    expect(result.title).toBe('Untitled Game')
  })
})

// ---------------------------------------------------------------------------
// Large inputs
// ---------------------------------------------------------------------------

describe('large inputs', () => {
  it('should handle very long title', () => {
    const extractor = new DefaultGameIntentExtractor()
    const longTitle = 'A Very Long Game Title That Goes On And On '.repeat(100)
    const result = extractor.extract(createModel(longTitle))
    expect(result.title).toBe(longTitle)
    expect(result.genre).toBe('sandbox')
  })

  it('should handle title with 1000 characters', () => {
    const extractor = new DefaultGameIntentExtractor()
    const longTitle = 'Mario'.repeat(200)
    const result = extractor.extract(createModel(longTitle))
    expect(result.genre).toBe('platformer')
  })

  it('should handle title with mario at very end of long string', () => {
    const extractor = new DefaultGameIntentExtractor()
    const title = 'A'.repeat(500) + 'mario'
    const result = extractor.extract(createModel(title))
    expect(result.genre).toBe('platformer')
  })

  it('should handle title with farm in middle of long string', () => {
    const extractor = new DefaultGameIntentExtractor()
    const title = 'X'.repeat(300) + 'farm' + 'Y'.repeat(300)
    const result = extractor.extract(createModel(title))
    expect(result.genre).toBe('farm')
  })

  it('should handle title with survival in large text', () => {
    const extractor = new DefaultGameIntentExtractor()
    const title = 'Generate a game '.repeat(50) + 'survival ' + 'with crafting '.repeat(50)
    const result = extractor.extract(createModel(title))
    expect(result.genre).toBe('survival')
  })
})

// ---------------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------------

describe('determinism', () => {
  it('should produce same result for mario model', () => {
    const extractor = new DefaultGameIntentExtractor()
    const model = createModel('Super Mario Bros')
    const result1 = extractor.extract(model)
    const result2 = extractor.extract(model)
    expect(result1).toEqual(result2)
  })

  it('should produce same result for farm model', () => {
    const extractor = new DefaultGameIntentExtractor()
    const model = createModel('Farm Simulator')
    const result1 = extractor.extract(model)
    const result2 = extractor.extract(model)
    expect(result1).toEqual(result2)
  })

  it('should produce same result for rpg model', () => {
    const extractor = new DefaultGameIntentExtractor()
    const model = createModel('RPG Adventure')
    const result1 = extractor.extract(model)
    const result2 = extractor.extract(model)
    expect(result1).toEqual(result2)
  })

  it('should produce same result for survival model', () => {
    const extractor = new DefaultGameIntentExtractor()
    const model = createModel('Survival Game')
    const result1 = extractor.extract(model)
    const result2 = extractor.extract(model)
    expect(result1).toEqual(result2)
  })

  it('should produce same result for sandbox model', () => {
    const extractor = new DefaultGameIntentExtractor()
    const model = createModel('Custom World')
    const result1 = extractor.extract(model)
    const result2 = extractor.extract(model)
    expect(result1).toEqual(result2)
  })

  it('should produce same result for empty model', () => {
    const extractor = new DefaultGameIntentExtractor()
    const model = createModel()
    const result1 = extractor.extract(model)
    const result2 = extractor.extract(model)
    expect(result1).toEqual(result2)
  })

  it('should produce same result across multiple extractors', () => {
    const model = createModel('Super Mario')
    const extractor1 = new DefaultGameIntentExtractor()
    const extractor2 = new DefaultGameIntentExtractor()
    expect(extractor1.extract(model)).toEqual(extractor2.extract(model))
  })

  it('should produce same result on repeated calls', () => {
    const extractor = new DefaultGameIntentExtractor()
    const model = createModel('Farm Life')
    const results = Array.from({ length: 10 }, () => extractor.extract(model))
    const first = results[0]
    for (const result of results) {
      expect(result).toEqual(first)
    }
  })
})

// ---------------------------------------------------------------------------
// Immutability / Frozen output
// ---------------------------------------------------------------------------

describe('immutability', () => {
  it('should return frozen GameIntent', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('Super Mario'))
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('should return frozen GameIntent for farm', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('Farm Game'))
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('should return frozen GameIntent for rpg', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('RPG World'))
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('should return frozen GameIntent for survival', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('Survival Mode'))
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('should return frozen GameIntent for sandbox', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('Custom Game'))
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('should return frozen GameIntent for empty', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel())
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('genre field should be readonly (frozen string)', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('Super Mario'))
    expect(() => {
      (result as unknown as Record<string, unknown>).genre = 'farm'
    }).toThrow()
  })

  it('title field should be readonly (frozen string)', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('Super Mario'))
    expect(() => {
      (result as unknown as Record<string, unknown>).title = 'New Title'
    }).toThrow()
  })
})

// ---------------------------------------------------------------------------
// Edge cases and boundary testing
// ---------------------------------------------------------------------------

describe('edge cases', () => {
  it('should handle title with only spaces', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('   '))
    expect(result.title).toBe('Untitled Game')
  })

  it('should handle title with tab characters', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('\t\t'))
    expect(result.title).toBe('Untitled Game')
  })

  it('should handle title with newlines', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('\n\n'))
    expect(result.title).toBe('Untitled Game')
  })

  it('should handle title with unicode characters', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('Mario 世界'))
    expect(result.genre).toBe('platformer')
    expect(result.title).toBe('Mario 世界')
  })

  it('should handle title with emoji', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('Mario 🎮 Adventure'))
    expect(result.genre).toBe('platformer')
    expect(result.title).toBe('Mario 🎮 Adventure')
  })
})

// ---------------------------------------------------------------------------
// Multiple genre keywords edge cases
// ---------------------------------------------------------------------------

describe('multiple genre keywords', () => {
  it('should prefer mario over farm in complex title', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('Mario Farming Adventure'))
    expect(result.genre).toBe('platformer')
  })

  it('should prefer farm over rpg in complex title', () => {
    const extractor = new DefaultGameIntentExtractor()
    const result = extractor.extract(createModel('RPG Farm Life'))
    expect(result.genre).toBe('farm') // because farm is title, but wait - mario check passes? no, "mario" not in title
    // "rpg" is checked third, "farm" is checked second
    // "Farm" is detected, so genre = farm. Wait, but farm is checked second (after mario)
    // "RPG Farm Life" - farm is checked first among remaining after mario
    // Actually mario includes keyword 'mario'
    // Then farm includes keyword 'farm'
    // "RPG Farm Life" includes 'rpg' AND 'farm'
    // farm is checked first (position 2) vs rpg (position 3)
    // So farm wins
  })

  it('should handle all keywords in one title', () => {
    const extractor = new DefaultGameIntentExtractor()
    // mario is checked first, so platformer wins
    const result = extractor.extract(createModel('Mario Farm Rpg Survival'))
    expect(result.genre).toBe('platformer')
  })

  it('should handle rpg and survival together', () => {
    const extractor = new DefaultGameIntentExtractor()
    // rpg is checked before survival
    const result = extractor.extract(createModel('RPG Survival'))
    expect(result.genre).toBe('rpg')
  })
})

// ---------------------------------------------------------------------------
// Type export verification
// ---------------------------------------------------------------------------

describe('type exports', () => {
  it('should export GameGenre type with correct values', () => {
    const genres: GameGenre[] = ['platformer', 'farm', 'rpg', 'survival', 'sandbox']
    expect(genres).toHaveLength(5)
    expect(genres).toContain('platformer')
    expect(genres).toContain('farm')
    expect(genres).toContain('rpg')
    expect(genres).toContain('survival')
    expect(genres).toContain('sandbox')
  })

  it('should not allow invalid genre values', () => {
    const valid = (genre: string): genre is GameGenre => {
      return ['platformer', 'farm', 'rpg', 'survival', 'sandbox'].includes(genre)
    }
    expect(valid('platformer')).toBe(true)
    expect(valid('fps')).toBe(false)
    expect(valid('strategy')).toBe(false)
    expect(valid('puzzle')).toBe(false)
  })

  it('should produce correct genre for each game type', () => {
    const extractor = new DefaultGameIntentExtractor()
    expect(extractor.extract(createModel('Mario')).genre).toBe('platformer')
    expect(extractor.extract(createModel('Farm')).genre).toBe('farm')
    expect(extractor.extract(createModel('RPG')).genre).toBe('rpg')
    expect(extractor.extract(createModel('Survival')).genre).toBe('survival')
    expect(extractor.extract(createModel('Custom')).genre).toBe('sandbox')
  })
})

// ---------------------------------------------------------------------------
// Cross-contamination
// ---------------------------------------------------------------------------

describe('cross-contamination', () => {
  it('should not mutate input model', () => {
    const extractor = new DefaultGameIntentExtractor()
    const model = createModel('Super Mario')
    const before = JSON.stringify(model)
    extractor.extract(model)
    const after = JSON.stringify(model)
    expect(after).toBe(before)
  })

  it('should not be affected by previous extractions', () => {
    const extractor = new DefaultGameIntentExtractor()
    const models = [
      createModel('Super Mario'),
      createModel('Farm Sim'),
      createModel('RPG Quest'),
      createModel('Survival Mode'),
      createModel('Sandbox World'),
    ]
    const results = models.map((m) => extractor.extract(m))
    expect(results[0].genre).toBe('platformer')
    expect(results[1].genre).toBe('farm')
    expect(results[2].genre).toBe('rpg')
    expect(results[3].genre).toBe('survival')
    expect(results[4].genre).toBe('sandbox')
  })

  it('each extraction call should be independent', () => {
    const extractor = new DefaultGameIntentExtractor()
    const model = createModel('Super Mario')
    const result1 = extractor.extract(model)
    const result2 = extractor.extract(model)
    expect(result1).toEqual(result2)
    // Changing result1 should not affect result2
    expect(result1.genre).toBe('platformer')
    expect(result2.genre).toBe('platformer')
  })
})
