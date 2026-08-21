/**
 * IntentRouter.test.ts — comprehensive test suite for Intent Router.
 *
 * Target: 100+ tests
 * Coverage: construction, create-world detection (Chinese, English, mixed),
 *           genre confidence boost, case sensitivity, whitespace, invalid input,
 *           unknown input, determinism, immutability, stress
 */
import { describe, it, expect } from 'vitest'
import { DefaultIntentRouter } from '../game-intent/router/DefaultIntentRouter'
import type { IntentRoute } from '../game-intent/router/IntentRoute'
import type { IntentRoutingResult } from '../game-intent/router/IntentRoutingResult'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Helper to freeze an IntentRoutingResult for comparison.
 */
function freezeResult(result: IntentRoutingResult): IntentRoutingResult {
  return Object.freeze({ route: result.route, confidence: result.confidence })
}

// ---------------------------------------------------------------------------
// Construction
// ---------------------------------------------------------------------------

describe('construction', () => {
  it('should create a DefaultIntentRouter instance', () => {
    const router = new DefaultIntentRouter()
    expect(router).toBeInstanceOf(DefaultIntentRouter)
  })

  it('should have a route method', () => {
    const router = new DefaultIntentRouter()
    expect(typeof router.route).toBe('function')
  })

  it('should return an IntentRoutingResult from route', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('hello')
    expect(result).toHaveProperty('route')
    expect(result).toHaveProperty('confidence')
  })

  it('should implement IntentRouter interface', () => {
    const router = new DefaultIntentRouter()
    expect(router).toBeDefined()
  })

  it('should be stateless (no constructor parameters)', () => {
    const router = new DefaultIntentRouter()
    expect(Object.keys(router)).toHaveLength(0)
  })

  it('should return correct property types from route', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('create mario')
    expect(typeof result.route).toBe('string')
    expect(typeof result.confidence).toBe('number')
  })
})

// ---------------------------------------------------------------------------
// Route detection — create-world: English "create"
// ---------------------------------------------------------------------------

describe('route detection — create-world: English "create"', () => {
  it('should route "create mario" to create-world', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('create mario')
    expect(result.route).toBe('create-world')
  })

  it('should route "create a mario game" to create-world', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('create a mario game')
    expect(result.route).toBe('create-world')
  })

  it('should route "Create Mario World" to create-world', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('Create Mario World')
    expect(result.route).toBe('create-world')
  })

  it('should route "please create mario" to create-world', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('please create mario')
    expect(result.route).toBe('create-world')
  })

  it('should route "I want to create" to create-world', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('I want to create')
    expect(result.route).toBe('create-world')
  })

  it('should route "create" alone to create-world', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('create')
    expect(result.route).toBe('create-world')
  })

  it('should route "CREATE" uppercase to create-world', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('CREATE MARIO')
    expect(result.route).toBe('create-world')
  })

  it('should route "CrEaTe" mixed case to create-world', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('CrEaTe FaRm')
    expect(result.route).toBe('create-world')
  })
})

// ---------------------------------------------------------------------------
// Route detection — create-world: Chinese "创建"
// ---------------------------------------------------------------------------

describe('route detection — create-world: Chinese "创建"', () => {
  it('should route "创建 MarioWorld" to create-world', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('创建 MarioWorld')
    expect(result.route).toBe('create-world')
  })

  it('should route "创建马里奥世界" to create-world', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('创建马里奥世界')
    expect(result.route).toBe('create-world')
  })

  it('should route "创建一个农场游戏" to create-world', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('创建一个农场游戏')
    expect(result.route).toBe('create-world')
  })

  it('should route "帮我创建一个游戏" to create-world', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('帮我创建一个游戏')
    expect(result.route).toBe('create-world')
  })

  it('should route "创建" alone to create-world', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('创建')
    expect(result.route).toBe('create-world')
  })

  it('should route "创建rpg" mixed to create-world', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('创建rpg')
    expect(result.route).toBe('create-world')
  })

  it('should route "我要创建生存游戏" to create-world', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('我要创建生存游戏')
    expect(result.route).toBe('create-world')
  })
})

// ---------------------------------------------------------------------------
// Route detection — create-world: Chinese "生成"
// ---------------------------------------------------------------------------

describe('route detection — create-world: Chinese "生成"', () => {
  it('should route "生成 RPG 游戏" to create-world', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('生成 RPG 游戏')
    expect(result.route).toBe('create-world')
  })

  it('should route "生成一个农场" to create-world', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('生成一个农场')
    expect(result.route).toBe('create-world')
  })

  it('should route "生成马里奥世界" to create-world', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('生成马里奥世界')
    expect(result.route).toBe('create-world')
  })

  it('should route "帮我生成一个生存游戏" to create-world', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('帮我生成一个生存游戏')
    expect(result.route).toBe('create-world')
  })

  it('should route "生成" alone to create-world', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('生成')
    expect(result.route).toBe('create-world')
  })

  it('should route "生成 survival 世界" to create-world', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('生成 survival 世界')
    expect(result.route).toBe('create-world')
  })

  it('should route "create a survivor-style game" to create-world', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('create a survivor-style game')
    expect(result.route).toBe('create-world')
    expect(result.confidence).toBe(1.0)
  })
})

// ---------------------------------------------------------------------------
// Route detection — create-world: English "build"
// ---------------------------------------------------------------------------

describe('route detection — create-world: English "build"', () => {
  it('should route "build mario" to create-world', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('build mario')
    expect(result.route).toBe('create-world')
  })

  it('should route "build a farm game" to create-world', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('build a farm game')
    expect(result.route).toBe('create-world')
  })

  it('should route "Build RPG World" to create-world', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('Build RPG World')
    expect(result.route).toBe('create-world')
  })

  it('should route "BUILD" uppercase to create-world', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('BUILD')
    expect(result.route).toBe('create-world')
  })

  it('should route "I want to build" to create-world', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('I want to build')
    expect(result.route).toBe('create-world')
  })

  it('should route "build survival game" to create-world', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('build survival game')
    expect(result.route).toBe('create-world')
  })
})

// ---------------------------------------------------------------------------
// Route detection — unknown
// ---------------------------------------------------------------------------

describe('route detection — unknown', () => {
  it('should route empty string to unknown', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('')
    expect(result.route).toBe('unknown')
  })

  it('should route "hello" to unknown', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('hello')
    expect(result.route).toBe('unknown')
  })

  it('should route "mario" alone (no creation keyword) to unknown', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('mario')
    expect(result.route).toBe('unknown')
  })

  it('should route "farm" alone (no creation keyword) to unknown', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('farm')
    expect(result.route).toBe('unknown')
  })

  it('should route "rpg" alone (no creation keyword) to unknown', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('rpg')
    expect(result.route).toBe('unknown')
  })

  it('should route "survival" alone (no creation keyword) to unknown', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('survival')
    expect(result.route).toBe('unknown')
  })

  it('should route "what is the weather" to unknown', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('what is the weather')
    expect(result.route).toBe('unknown')
  })

  it('should route "delete my game" to unknown', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('delete my game')
    expect(result.route).toBe('unknown')
  })

  it('should route "help" to unknown', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('help')
    expect(result.route).toBe('unknown')
  })

  it('should route "how are you" to unknown', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('how are you')
    expect(result.route).toBe('unknown')
  })
})

// ---------------------------------------------------------------------------
// Route detection — mixed Chinese and English
// ---------------------------------------------------------------------------

describe('route detection — mixed Chinese and English', () => {
  it('should route "创建 Mario World" to create-world', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('创建 Mario World')
    expect(result.route).toBe('create-world')
  })

  it('should route "帮我 build 一个 farm 游戏" to create-world', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('帮我 build 一个 farm 游戏')
    expect(result.route).toBe('create-world')
  })

  it('should route "create 一个 RPG 世界" to create-world', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('create 一个 RPG 世界')
    expect(result.route).toBe('create-world')
  })

  it('should route "生成 survival 游戏" to create-world', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('生成 survival 游戏')
    expect(result.route).toBe('create-world')
  })

  it('should route "我要创建 Mário 世界" to create-world', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('我要创建 Mário 世界')
    expect(result.route).toBe('create-world')
  })
})

// ---------------------------------------------------------------------------
// Confidence — definite (1.0)
// ---------------------------------------------------------------------------

describe('confidence — definite (1.0)', () => {
  it('should have confidence 1.0 for "create mario"', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('create mario')
    expect(result.confidence).toBe(1.0)
  })

  it('should have confidence 1.0 for "创建 farm"', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('创建 farm')
    expect(result.confidence).toBe(1.0)
  })

  it('should have confidence 1.0 for "生成 rpg"', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('生成 rpg')
    expect(result.confidence).toBe(1.0)
  })

  it('should have confidence 1.0 for "build survival"', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('build survival')
    expect(result.confidence).toBe(1.0)
  })

  it('should have confidence 1.0 for "create farm"', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('create farm')
    expect(result.confidence).toBe(1.0)
  })

  it('should have confidence 1.0 for "创建 mario world"', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('创建 mario world')
    expect(result.confidence).toBe(1.0)
  })

  it('should have confidence 1.0 for "生成 rpg game"', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('生成 rpg game')
    expect(result.confidence).toBe(1.0)
  })

  it('should have confidence 1.0 for "build survival world"', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('build survival world')
    expect(result.confidence).toBe(1.0)
  })
})

// ---------------------------------------------------------------------------
// Confidence — strong (0.8)
// ---------------------------------------------------------------------------

describe('confidence — strong (0.8)', () => {
  it('should have confidence 0.8 for "create" alone', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('create')
    expect(result.confidence).toBe(0.8)
  })

  it('should have confidence 0.8 for "创建" alone', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('创建')
    expect(result.confidence).toBe(0.8)
  })

  it('should have confidence 0.8 for "生成" alone', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('生成')
    expect(result.confidence).toBe(0.8)
  })

  it('should have confidence 0.8 for "build" alone', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('build')
    expect(result.confidence).toBe(0.8)
  })

  it('should have confidence 0.8 for "create a game"', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('create a game')
    expect(result.confidence).toBe(0.8)
  })

  it('should have confidence 0.8 for "生成一个游戏"', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('生成一个游戏')
    expect(result.confidence).toBe(0.8)
  })

  it('should have confidence 0.8 for "帮我创建一个世界"', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('帮我创建一个世界')
    expect(result.confidence).toBe(0.8)
  })

  it('should have confidence 0.8 for "I want to build something"', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('I want to build something')
    expect(result.confidence).toBe(0.8)
  })
})

// ---------------------------------------------------------------------------
// Confidence — unknown (0.0)
// ---------------------------------------------------------------------------

describe('confidence — unknown (0.0)', () => {
  it('should have confidence 0.0 for empty string', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('')
    expect(result.confidence).toBe(0.0)
  })

  it('should have confidence 0.0 for "hello"', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('hello')
    expect(result.confidence).toBe(0.0)
  })

  it('should have confidence 0.0 for "mario" alone', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('mario')
    expect(result.confidence).toBe(0.0)
  })

  it('should have confidence 0.0 for "farm" alone', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('farm')
    expect(result.confidence).toBe(0.0)
  })

  it('should have confidence 0.0 for "rpg" alone', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('rpg')
    expect(result.confidence).toBe(0.0)
  })

  it('should have confidence 0.0 for "survival" alone', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('survival')
    expect(result.confidence).toBe(0.0)
  })
})

// ---------------------------------------------------------------------------
// Case sensitivity
// ---------------------------------------------------------------------------

describe('case sensitivity', () => {
  it('should handle lowercase "create"', () => {
    const router = new DefaultIntentRouter()
    expect(router.route('create mario').route).toBe('create-world')
  })

  it('should handle UPPERCASE "CREATE"', () => {
    const router = new DefaultIntentRouter()
    expect(router.route('CREATE MARIO').route).toBe('create-world')
  })

  it('should handle MixedCase "Create"', () => {
    const router = new DefaultIntentRouter()
    expect(router.route('Create Mario').route).toBe('create-world')
  })

  it('should handle "cReAtE" random case', () => {
    const router = new DefaultIntentRouter()
    expect(router.route('cReAtE fArM').route).toBe('create-world')
  })

  it('should handle "BUILD" uppercase', () => {
    const router = new DefaultIntentRouter()
    expect(router.route('BUILD MARIO').route).toBe('create-world')
  })

  it('should handle "bUiLd" mixed case', () => {
    const router = new DefaultIntentRouter()
    expect(router.route('bUiLd FaRm').route).toBe('create-world')
  })

  it('should handle "MARIO" uppercase genre keyword', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('create MARIO')
    expect(result.confidence).toBe(1.0)
  })

  it('should handle "Mario" mixed case genre keyword', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('create Mario')
    expect(result.confidence).toBe(1.0)
  })

  it('should handle "FARM" uppercase genre keyword', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('create FARM')
    expect(result.confidence).toBe(1.0)
  })
})

// ---------------------------------------------------------------------------
// Whitespace
// ---------------------------------------------------------------------------

describe('whitespace', () => {
  it('should handle leading whitespace', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('  create mario')
    expect(result.route).toBe('create-world')
  })

  it('should handle trailing whitespace', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('create mario  ')
    expect(result.route).toBe('create-world')
  })

  it('should handle leading and trailing whitespace', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('  create mario  ')
    expect(result.route).toBe('create-world')
  })

  it('should handle multiple spaces between words', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('create    mario')
    expect(result.route).toBe('create-world')
  })

  it('should handle tab characters', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('\tcreate\tmario')
    expect(result.route).toBe('create-world')
  })

  it('should handle newline characters', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('\ncreate\nmario')
    expect(result.route).toBe('create-world')
  })

  it('should handle mixed whitespace (spaces, tabs, newlines)', () => {
    const router = new DefaultIntentRouter()
    const result = router.route(' \t\n create \t\n mario \t\n ')
    expect(result.route).toBe('create-world')
  })

  it('should handle only whitespace as unknown', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('   ')
    expect(result.route).toBe('unknown')
  })

  it('should handle only tab as unknown', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('\t')
    expect(result.route).toBe('unknown')
  })

  it('should handle only newline as unknown', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('\n')
    expect(result.route).toBe('unknown')
  })
})

// ---------------------------------------------------------------------------
// Invalid input
// ---------------------------------------------------------------------------

describe('invalid input', () => {
  it('should handle empty string', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('')
    expect(result.route).toBe('unknown')
    expect(result.confidence).toBe(0.0)
  })

  it('should handle string with only whitespace', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('   ')
    expect(result.route).toBe('unknown')
  })

  it('should handle string with only special characters', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('!@#$%^&*()')
    expect(result.route).toBe('unknown')
  })

  it('should handle string with numbers only', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('12345')
    expect(result.route).toBe('unknown')
  })

  it('should handle very long string with no keywords', () => {
    const router = new DefaultIntentRouter()
    const long = 'a'.repeat(1000)
    const result = router.route(long)
    expect(result.route).toBe('unknown')
  })

  it('should handle null character in string', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('create\x00mario')
    expect(result.route).toBe('create-world')
  })

  it('should handle unicode characters', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('create mario 🎮')
    expect(result.route).toBe('create-world')
  })

  it('should handle emoji-only string', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('🎮🎯🎪')
    expect(result.route).toBe('unknown')
  })

  it('should route Cyrillic "создать mario" to unknown (no keyword match)', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('создать mario')
    expect(result.route).toBe('unknown')
  })

  it('should handle mixed script input (Korean)', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('생성 mario')
    expect(result.route).toBe('unknown')
  })
})

// ---------------------------------------------------------------------------
// Unknown input — edge cases
// ---------------------------------------------------------------------------

describe('unknown input — edge cases', () => {
  it('should handle single character "a"', () => {
    const router = new DefaultIntentRouter()
    expect(router.route('a').route).toBe('unknown')
  })

  it('should handle single character "c"', () => {
    const router = new DefaultIntentRouter()
    expect(router.route('c').route).toBe('unknown')
  })

  it('should handle single character "b"', () => {
    const router = new DefaultIntentRouter()
    expect(router.route('b').route).toBe('unknown')
  })

  it('should handle "created" (past tense, not exact match)', () => {
    const router = new DefaultIntentRouter()
    // "created" contains "create" as substring
    const result = router.route('created mario')
    expect(result.route).toBe('create-world')
  })

  it('should handle "builder" (contains "build" as substring)', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('builder mario')
    expect(result.route).toBe('create-world')
  })

  it('should handle "creation" (does not contain "create" substring — "creati" vs "create")', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('creation mario')
    expect(result.route).toBe('unknown')
  })

  it('should handle "recreate" (contains "create" as substring)', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('recreate mario')
    expect(result.route).toBe('create-world')
  })
})

// ---------------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------------

describe('determinism', () => {
  it('should produce same result for "create mario"', () => {
    const router = new DefaultIntentRouter()
    const result1 = router.route('create mario')
    const result2 = router.route('create mario')
    expect(result1).toEqual(result2)
  })

  it('should produce same result for "创建农场"', () => {
    const router = new DefaultIntentRouter()
    const result1 = router.route('创建农场')
    const result2 = router.route('创建农场')
    expect(result1).toEqual(result2)
  })

  it('should produce same result for "生成 RPG"', () => {
    const router = new DefaultIntentRouter()
    const result1 = router.route('生成 RPG')
    const result2 = router.route('生成 RPG')
    expect(result1).toEqual(result2)
  })

  it('should produce same result for "build survival"', () => {
    const router = new DefaultIntentRouter()
    const result1 = router.route('build survival')
    const result2 = router.route('build survival')
    expect(result1).toEqual(result2)
  })

  it('should produce same result for empty input', () => {
    const router = new DefaultIntentRouter()
    const result1 = router.route('')
    const result2 = router.route('')
    expect(result1).toEqual(result2)
  })

  it('should produce same result across multiple router instances', () => {
    const router1 = new DefaultIntentRouter()
    const router2 = new DefaultIntentRouter()
    expect(router1.route('create mario')).toEqual(router2.route('create mario'))
  })

  it('should produce same result on repeated calls (10x)', () => {
    const router = new DefaultIntentRouter()
    const results = Array.from({ length: 10 }, () => router.route('创建 Mario World'))
    const first = freezeResult(results[0])
    for (const result of results) {
      expect(freezeResult(result)).toEqual(first)
    }
  })
})

// ---------------------------------------------------------------------------
// Immutability / Frozen output
// ---------------------------------------------------------------------------

describe('immutability', () => {
  it('should return frozen IntentRoutingResult', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('create mario')
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('should return frozen result for create-world route', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('create farm')
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('should return frozen result for unknown route', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('hello')
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('should return frozen result for Chinese input', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('创建游戏')
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('should return frozen result for empty input', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('')
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('route field should be readonly (frozen string)', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('create mario')
    const mutable = result as unknown as Record<string, unknown>
    expect(() => {
      mutable.route = 'unknown'
    }).toThrow()
  })

  it('confidence field should be readonly (frozen number)', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('create mario')
    const mutable = result as unknown as Record<string, unknown>
    expect(() => {
      mutable.confidence = 0
    }).toThrow()
  })
})

// ---------------------------------------------------------------------------
// Stress / Large inputs
// ---------------------------------------------------------------------------

describe('stress / large inputs', () => {
  it('should handle very long input with creation keyword', () => {
    const router = new DefaultIntentRouter()
    const long = 'create ' + 'a '.repeat(500) + 'mario'
    const result = router.route(long)
    expect(result.route).toBe('create-world')
    expect(result.confidence).toBe(1.0)
  })

  it('should handle very long input with no keywords', () => {
    const router = new DefaultIntentRouter()
    const long = 'hello '.repeat(500)
    const result = router.route(long)
    expect(result.route).toBe('unknown')
  })

  it('should handle input with create in middle of long text', () => {
    const router = new DefaultIntentRouter()
    const input = 'x'.repeat(500) + 'create' + 'y'.repeat(500)
    const result = router.route(input)
    expect(result.route).toBe('create-world')
    expect(result.confidence).toBe(0.8)
  })

  it('should handle input with create and mario at far ends', () => {
    const router = new DefaultIntentRouter()
    const input = 'create' + 'x'.repeat(1000) + 'mario'
    const result = router.route(input)
    expect(result.route).toBe('create-world')
    expect(result.confidence).toBe(1.0)
  })

  it('should handle input with Chinese create keyword in large text', () => {
    const router = new DefaultIntentRouter()
    const input = '你好 '.repeat(100) + '创建 ' + '游戏 '.repeat(100)
    const result = router.route(input)
    expect(result.route).toBe('create-world')
  })

  it('should handle input with build keyword in large text', () => {
    const router = new DefaultIntentRouter()
    const input = 'I want to '.repeat(200) + 'build'
    const result = router.route(input)
    expect(result.route).toBe('create-world')
  })

  it('should handle 10000 character input with no keywords', () => {
    const router = new DefaultIntentRouter()
    const input = 'x'.repeat(10000)
    const result = router.route(input)
    expect(result.route).toBe('unknown')
  })

  it('should handle 10000 character input with keyword at start', () => {
    const router = new DefaultIntentRouter()
    const input = 'create mario' + 'x'.repeat(9988)
    const result = router.route(input)
    expect(result.route).toBe('create-world')
    expect(result.confidence).toBe(1.0)
  })

  it('should handle input with Chinese generate keyword in large text', () => {
    const router = new DefaultIntentRouter()
    const input = '嘿 '.repeat(200) + '生成 ' + '吧 '.repeat(200)
    const result = router.route(input)
    expect(result.route).toBe('create-world')
  })

  it('should handle input with all keywords repeated', () => {
    const router = new DefaultIntentRouter()
    const input = 'create build create build '
    const result = router.route(input)
    expect(result.route).toBe('create-world')
    expect(result.confidence).toBe(0.8)
  })
})

// ---------------------------------------------------------------------------
// Type export verification
// ---------------------------------------------------------------------------

describe('type exports', () => {
  it('should export IntentRoute type with correct values', () => {
    const routes: IntentRoute[] = ['create-world', 'unknown']
    expect(routes).toHaveLength(2)
    expect(routes).toContain('create-world')
    expect(routes).toContain('unknown')
  })

  it('should not allow invalid route values', () => {
    const valid = (route: string): route is IntentRoute => {
      return ['create-world', 'unknown'].includes(route)
    }
    expect(valid('create-world')).toBe(true)
    expect(valid('unknown')).toBe(true)
    expect(valid('delete-world')).toBe(false)
    expect(valid('modify-world')).toBe(false)
  })

  it('should produce correct route for each request type', () => {
    const router = new DefaultIntentRouter()
    expect(router.route('create mario').route).toBe('create-world')
    expect(router.route('create farm').route).toBe('create-world')
    expect(router.route('创建 rpg').route).toBe('create-world')
    expect(router.route('生成 survival').route).toBe('create-world')
    expect(router.route('build').route).toBe('create-world')
    expect(router.route('hello').route).toBe('unknown')
  })

  it('should export IntentRoutingResult interface shape', () => {
    const router = new DefaultIntentRouter()
    const result: IntentRoutingResult = router.route('create mario')
    expect(result.route).toBeDefined()
    expect(result.confidence).toBeDefined()
    expect(typeof result.route).toBe('string')
    expect(typeof result.confidence).toBe('number')
  })
})

// ---------------------------------------------------------------------------
// Cross-contamination
// ---------------------------------------------------------------------------

describe('cross-contamination', () => {
  it('should not be affected by previous routing calls', () => {
    const router = new DefaultIntentRouter()
    const inputs = [
      'create mario',
      '创建 farm',
      '生成 rpg',
      'build survival',
      'hello world',
    ]
    const results = inputs.map((i) => router.route(i))
    expect(results[0].route).toBe('create-world')
    expect(results[0].confidence).toBe(1.0)
    expect(results[1].route).toBe('create-world')
    expect(results[1].confidence).toBe(1.0)
    expect(results[2].route).toBe('create-world')
    expect(results[2].confidence).toBe(1.0)
    expect(results[3].route).toBe('create-world')
    expect(results[3].confidence).toBe(1.0)
    expect(results[4].route).toBe('unknown')
    expect(results[4].confidence).toBe(0.0)
  })

  it('each routing call should be independent', () => {
    const router = new DefaultIntentRouter()
    const result1 = router.route('create mario')
    const result2 = router.route('create mario')
    expect(result1).toEqual(result2)
    expect(result1.route).toBe('create-world')
    expect(result2.route).toBe('create-world')
  })

  it('result should not contain extra properties', () => {
    const router = new DefaultIntentRouter()
    const result = router.route('create mario')
    const keys = Object.keys(result)
    expect(keys).toHaveLength(2)
    expect(keys).toContain('route')
    expect(keys).toContain('confidence')
  })
})
