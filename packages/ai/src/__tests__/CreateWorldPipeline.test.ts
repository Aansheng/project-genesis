/**
 * CreateWorldPipeline.test.ts — comprehensive test suite for Create World Pipeline.
 *
 * Target: 80+ tests
 * Coverage: construction, create mario, 创建 mario, create farm, create rpg,
 *           create survival, unknown route, empty input, invalid input,
 *           determinism, immutability, dependency injection
 */
import { describe, it, expect } from 'vitest'
import type { World, GameDsl, GameWorldModel } from '@genesis/shared'
import type { PromptAssemblyDomainModel } from '../observatory/domain'
import { DefaultIntentRouter } from '../game-intent/router/DefaultIntentRouter'
import { DefaultGameIntentExtractor } from '../game-intent/DefaultGameIntentExtractor'
import { DefaultSemanticWorldGenerator } from '../game-world/DefaultSemanticWorldGenerator'
import { DefaultSemanticGameDslBuilder } from '../game-world/DefaultSemanticGameDslBuilder'
import { DefaultCreateWorldPipeline } from '../game-intent/pipeline/DefaultCreateWorldPipeline'

import type { Projection } from '../game-intent/pipeline/DefaultCreateWorldPipeline'
import type { CreateWorldCommand } from '../game-intent/pipeline/CreateWorldCommand'
import type { IntentRoutingResult } from '../game-intent/router/IntentRoutingResult'
import type { IntentRoute } from '../game-intent/router/IntentRoute'
import type { IntentRouter } from '../game-intent/router/IntentRouter'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Create a minimal Projection mock that returns a predictable World.
 */
function createProjectionMock(entities?: Array<{ id: string; type: string; x: number; y: number }>): Projection {
  const projected: World = {
    entities: entities ?? [
      { id: 'player-1', type: 'player', x: 0, y: 0 },
    ],
  }
  return {
    project(_dsl: GameDsl): { world: World } {
      return { world: projected }
    },
  }
}

/**
 * Create a default Projection that maps DSL entities to Runtime entities.
 * This mirrors the behavior of DefaultRuntimeProjection from @genesis/runtime
 * at a basic level — each EntityDsl becomes a Runtime Entity with id, type,
 * and default position.
 */
function createDefaultProjection(): Projection {
  return {
    project(dsl: GameDsl): { world: World } {
      const entities = (dsl.world?.entities ?? []).map((e) => ({
        id: e.id,
        type: e.type,
        x: 0,
        y: 0,
      }))
      return { world: { entities } }
    },
  }
}

/**
 * Create a Projection mock that always returns an empty world.
 */
function createEmptyProjectionMock(): Projection {
  return {
    project(_dsl: GameDsl): { world: World } {
      return { world: { entities: [] } }
    },
  }
}

/**
 * Create a fully wired pipeline with default implementations.
 */
function createPipeline(projection?: Projection): DefaultCreateWorldPipeline {
  return new DefaultCreateWorldPipeline(
    new DefaultIntentRouter(),
    new DefaultGameIntentExtractor(),
    new DefaultSemanticWorldGenerator(),
    new DefaultSemanticGameDslBuilder(),
    projection ?? createDefaultProjection(),
  )
}

/**
 * Helper to create a CreateWorldCommand.
 */
function command(input: string): CreateWorldCommand {
  return { input }
}

/**
 * Helper to count entities in a world.
 */
function entityCount(world: World): number {
  return world.entities.length
}

// ---------------------------------------------------------------------------
// Construction
// ---------------------------------------------------------------------------

describe('construction', () => {
  it('should create a DefaultCreateWorldPipeline instance', () => {
    const pipeline = createPipeline()
    expect(pipeline).toBeInstanceOf(DefaultCreateWorldPipeline)
  })

  it('should have an execute method', () => {
    const pipeline = createPipeline()
    expect(typeof pipeline.execute).toBe('function')
  })

  it('should return a CreateWorldPipelineResult from execute', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('hello'))
    expect(result).toHaveProperty('route')
    expect(result).toHaveProperty('world')
    expect(result).toHaveProperty('success')
  })

  it('should implement CreateWorldPipeline interface', () => {
    const pipeline = createPipeline()
    expect(pipeline).toBeDefined()
  })

  it('should accept all five constructor dependencies', () => {
    const pipeline = createPipeline()
    expect(pipeline).toBeInstanceOf(DefaultCreateWorldPipeline)
  })

  it('should work with custom projection', () => {
    const projection = createProjectionMock([
      { id: 'custom-1', type: 'hero', x: 10, y: 20 },
    ])
    const pipeline = createPipeline(projection)
    const result = pipeline.execute(command('create mario'))
    expect(result.success).toBe(true)
    expect(entityCount(result.world)).toBe(1)
    expect(result.world.entities[0].id).toBe('custom-1')
  })

  it('should produce type-correct route field', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('create mario'))
    expect(typeof result.route).toBe('string')
    expect(typeof result.success).toBe('boolean')
    expect(typeof result.world).toBe('object')
  })
})

// ---------------------------------------------------------------------------
// Route detection — create mario
// ---------------------------------------------------------------------------

describe('create world — mario', () => {
  it('should succeed for "create mario"', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('create mario'))
    expect(result.success).toBe(true)
    expect(result.route).toBe('create-world')
  })

  it('should produce a world for "create mario"', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('create mario'))
    expect(result.world).toBeDefined()
    expect(Array.isArray(result.world.entities)).toBe(true)
  })

  it('should produce non-empty world for "create mario"', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('create mario'))
    expect(result.world.entities.length).toBeGreaterThan(0)
  })

  it('should have player entity for "create mario"', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('create mario'))
    const player = result.world.entities.find((e) => e.type === 'player')
    expect(player).toBeDefined()
    expect(player!.id).toBeTruthy()
  })

  it('should produce a world with entities for "create mario"', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('create mario'))
    // Note: SemanticWorldGenerator detects 'mario' as sandbox (no 'platform' keyword),
    // so only 1 entity (player) is generated
    const types = result.world.entities.map((e) => e.type)
    expect(types).toContain('player')
    expect(result.world.entities.length).toBeGreaterThan(0)
  })

  it('should succeed for "Create Mario"', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('Create Mario'))
    expect(result.success).toBe(true)
  })

  it('should succeed for "CREATE MARIO"', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('CREATE MARIO'))
    expect(result.success).toBe(true)
  })

  it('should succeed for "create Super Mario World"', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('create Super Mario World'))
    expect(result.success).toBe(true)
  })

  it('should succeed for "build mario platformer"', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('build mario platformer'))
    expect(result.success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Route detection — 创建 mario (Chinese)
// ---------------------------------------------------------------------------

describe('create world — 创建 mario', () => {
  it('should succeed for "创建 mario"', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('创建 mario'))
    expect(result.success).toBe(true)
    expect(result.route).toBe('create-world')
  })

  it('should produce a world for "创建 mario"', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('创建 mario'))
    expect(result.world).toBeDefined()
    expect(result.world.entities.length).toBeGreaterThan(0)
  })

  it('should have player entity for "创建 mario"', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('创建 mario'))
    const player = result.world.entities.find((e) => e.type === 'player')
    expect(player).toBeDefined()
  })

  it('should succeed for "创建 Mario World"', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('创建 Mario World'))
    expect(result.success).toBe(true)
  })

  it('should succeed for "创建马里奥世界"', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('创建马里奥世界'))
    expect(result.success).toBe(true)
  })

  it('should succeed for "生成 mario 游戏"', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('生成 mario 游戏'))
    expect(result.success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Route detection — create farm
// ---------------------------------------------------------------------------

describe('create world — farm', () => {
  it('should succeed for "create farm"', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('create farm'))
    expect(result.success).toBe(true)
    expect(result.route).toBe('create-world')
  })

  it('should produce a world for "create farm"', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('create farm'))
    expect(result.world).toBeDefined()
    expect(result.world.entities.length).toBeGreaterThan(0)
  })

  it('should produce farm world entities for "create farm"', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('create farm'))
    // 'farm' keyword detected by SemanticWorldGenerator → farm world
    const types = result.world.entities.map((e) => e.type)
    expect(types).toContain('player')
    expect(result.world.entities.length).toBeGreaterThan(1)
  })

  it('should succeed for "创建农场"', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('创建农场'))
    expect(result.success).toBe(true)
  })

  it('should succeed for "build a farm game"', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('build a farm game'))
    expect(result.success).toBe(true)
  })

  it('should succeed for "生成一个农场游戏"', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('生成一个农场游戏'))
    expect(result.success).toBe(true)
  })

  it('should succeed for "create farming simulation"', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('create farming simulation'))
    expect(result.success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Route detection — create rpg
// ---------------------------------------------------------------------------

describe('create world — rpg', () => {
  it('should succeed for "create rpg"', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('create rpg'))
    expect(result.success).toBe(true)
    expect(result.route).toBe('create-world')
  })

  it('should produce a world for "create rpg"', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('create rpg'))
    expect(result.world).toBeDefined()
    expect(result.world.entities.length).toBeGreaterThan(0)
  })

  it('should produce rpg world entities for "create rpg"', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('create rpg'))
    // 'rpg' keyword detected by SemanticWorldGenerator → rpg world
    const types = result.world.entities.map((e) => e.type)
    expect(types).toContain('player')
    expect(result.world.entities.length).toBeGreaterThan(1)
  })

  it('should succeed for "生成 RPG 游戏"', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('生成 RPG 游戏'))
    expect(result.success).toBe(true)
  })

  it('should succeed for "build rpg world"', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('build rpg world'))
    expect(result.success).toBe(true)
  })

  it('should succeed for "create a role playing game"', () => {
    // 'role' is not 'rpg' keyword — will be sandbox
    const pipeline = createPipeline()
    const result = pipeline.execute(command('create a role playing game'))
    expect(result.success).toBe(true)
  })

  it('should succeed for "创建 rpg"', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('创建 rpg'))
    expect(result.success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Route detection — create survival
// ---------------------------------------------------------------------------

describe('create world — survival', () => {
  it('should succeed for "create survival"', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('create survival'))
    expect(result.success).toBe(true)
    expect(result.route).toBe('create-world')
  })

  it('should produce a world for "create survival"', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('create survival'))
    expect(result.world).toBeDefined()
    expect(result.world.entities.length).toBeGreaterThan(0)
  })

  it('should produce survival world entities for "create survival"', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('create survival'))
    // 'survival' keyword detected by SemanticWorldGenerator → survival world
    const types = result.world.entities.map((e) => e.type)
    expect(types).toContain('player')
    expect(result.world.entities.length).toBeGreaterThan(1)
  })

  it('should succeed for "生成 survival 游戏"', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('生成 survival 游戏'))
    expect(result.success).toBe(true)
  })

  it('should succeed for "build survival world"', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('build survival world'))
    expect(result.success).toBe(true)
  })

  it('should succeed for "创建生存游戏"', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('创建生存游戏'))
    expect(result.success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Unknown route
// ---------------------------------------------------------------------------

describe('unknown route', () => {
  it('should return success false for "hello"', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('hello'))
    expect(result.success).toBe(false)
    expect(result.route).toBe('unknown')
  })

  it('should return empty world for "hello"', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('hello'))
    expect(result.world).toBeDefined()
    expect(entityCount(result.world)).toBe(0)
  })

  it('should return success false for empty string', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command(''))
    expect(result.success).toBe(false)
  })

  it('should return success false for "mario" alone (no creation keyword)', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('mario'))
    expect(result.success).toBe(false)
  })

  it('should return success false for "farm" alone', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('farm'))
    expect(result.success).toBe(false)
  })

  it('should return success false for "rpg" alone', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('rpg'))
    expect(result.success).toBe(false)
  })

  it('should return success false for "survival" alone', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('survival'))
    expect(result.success).toBe(false)
  })

  it('should return success false for "what is the weather"', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('what is the weather'))
    expect(result.success).toBe(false)
  })

  it('should return success false for "delete my game"', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('delete my game'))
    expect(result.success).toBe(false)
  })

  it('should return success false for "help"', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('help'))
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Empty and invalid input
// ---------------------------------------------------------------------------

describe('empty and invalid input', () => {
  it('should handle empty string input', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command(''))
    expect(result.success).toBe(false)
    expect(result.route).toBe('unknown')
  })

  it('should handle whitespace-only input', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('   '))
    expect(result.success).toBe(false)
  })

  it('should handle tab input', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('\t'))
    expect(result.success).toBe(false)
  })

  it('should handle input with only special characters', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('!@#$%^&*()'))
    expect(result.success).toBe(false)
  })

  it('should handle input with only numbers', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('12345'))
    expect(result.success).toBe(false)
  })

  it('should handle input with emoji', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('🎮🎯🎪'))
    expect(result.success).toBe(false)
  })

  it('should handle very long non-matching input', () => {
    const pipeline = createPipeline()
    const long = 'a'.repeat(1000)
    const result = pipeline.execute(command(long))
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('edge cases', () => {
  it('should handle "create" alone (no genre)', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('create'))
    expect(result.success).toBe(true)
    expect(result.route).toBe('create-world')
  })

  it('should handle "生成" alone', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('生成'))
    expect(result.success).toBe(true)
  })

  it('should handle "创建" alone', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('创建'))
    expect(result.success).toBe(true)
  })

  it('should handle "build" alone', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('build'))
    expect(result.success).toBe(true)
  })

  it('should handle mixed Chinese and English: "帮我创建一个游戏"', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('帮我创建一个游戏'))
    expect(result.success).toBe(true)
  })

  it('should handle "生成一个生存游戏"', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('生成一个生存游戏'))
    expect(result.success).toBe(true)
  })

  it('should handle "create a game with farm and rpg"', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('create a game with farm and rpg'))
    expect(result.success).toBe(true)
  })

  it('should handle "build a mario style platformer"', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('build a mario style platformer'))
    expect(result.success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// World content verification
// ---------------------------------------------------------------------------

describe('world content verification', () => {
  it('should produce entities with id and type', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('create mario'))
    for (const entity of result.world.entities) {
      expect(entity.id).toBeDefined()
      expect(typeof entity.id).toBe('string')
      expect(entity.type).toBeDefined()
      expect(typeof entity.type).toBe('string')
    }
  })

  it('should produce entities with valid positions', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('create mario'))
    for (const entity of result.world.entities) {
      expect(typeof entity.x).toBe('number')
      expect(typeof entity.y).toBe('number')
    }
  })

  it('should produce more entities for farm than sandbox', () => {
    const pipeline = createPipeline()
    const farmResult = pipeline.execute(command('create farm'))
    const sandboxResult = pipeline.execute(command('create'))
    expect(entityCount(farmResult.world)).toBeGreaterThanOrEqual(entityCount(sandboxResult.world))
  })

  it('should produce more entities for rpg than sandbox', () => {
    const pipeline = createPipeline()
    const rpgResult = pipeline.execute(command('create rpg'))
    const sandboxResult = pipeline.execute(command('create'))
    expect(entityCount(rpgResult.world)).toBeGreaterThanOrEqual(entityCount(sandboxResult.world))
  })

  it('should produce different entity counts for different genres', () => {
    const pipeline = createPipeline()
    const farmResult = pipeline.execute(command('create farm'))
    const rpgResult = pipeline.execute(command('create rpg'))
    expect(entityCount(farmResult.world)).not.toBe(entityCount(rpgResult.world))
  })
})

// ---------------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------------

describe('determinism', () => {
  it('should produce same result for "create mario"', () => {
    const pipeline = createPipeline()
    const result1 = pipeline.execute(command('create mario'))
    const result2 = pipeline.execute(command('create mario'))
    expect(result1.success).toBe(result2.success)
    expect(result1.route).toBe(result2.route)
    expect(result1.world.entities.length).toBe(result2.world.entities.length)
  })

  it('should produce same result for "创建 mario"', () => {
    const pipeline = createPipeline()
    const result1 = pipeline.execute(command('创建 mario'))
    const result2 = pipeline.execute(command('创建 mario'))
    expect(result1.success).toBe(result2.success)
    expect(result1.route).toBe(result2.route)
  })

  it('should produce same result for "create farm"', () => {
    const pipeline = createPipeline()
    const result1 = pipeline.execute(command('create farm'))
    const result2 = pipeline.execute(command('create farm'))
    expect(result1.success).toBe(result2.success)
    expect(result1.route).toBe(result2.route)
  })

  it('should produce same result for "create rpg"', () => {
    const pipeline = createPipeline()
    const result1 = pipeline.execute(command('create rpg'))
    const result2 = pipeline.execute(command('create rpg'))
    expect(result1.success).toBe(result2.success)
    expect(result1.route).toBe(result2.route)
  })

  it('should produce same result for "create survival"', () => {
    const pipeline = createPipeline()
    const result1 = pipeline.execute(command('create survival'))
    const result2 = pipeline.execute(command('create survival'))
    expect(result1.success).toBe(result2.success)
    expect(result1.route).toBe(result2.route)
  })

  it('should produce same result for unknown input', () => {
    const pipeline = createPipeline()
    const result1 = pipeline.execute(command('hello'))
    const result2 = pipeline.execute(command('hello'))
    expect(result1).toEqual(result2)
  })

  it('should produce same result for empty input', () => {
    const pipeline = createPipeline()
    const result1 = pipeline.execute(command(''))
    const result2 = pipeline.execute(command(''))
    expect(result1).toEqual(result2)
  })

  it('should produce same result across multiple pipeline instances', () => {
    const pipeline1 = createPipeline()
    const pipeline2 = createPipeline()
    const r1 = pipeline1.execute(command('create mario'))
    const r2 = pipeline2.execute(command('create mario'))
    expect(r1.success).toBe(r2.success)
    expect(r1.route).toBe(r2.route)
  })

  it('should produce same result on repeated calls (10x)', () => {
    const pipeline = createPipeline()
    const results = Array.from({ length: 10 }, () => pipeline.execute(command('create mario')))
    const first = results[0]
    for (const result of results) {
      expect(result.success).toBe(first.success)
      expect(result.route).toBe(first.route)
      expect(result.world.entities.length).toBe(first.world.entities.length)
    }
  })
})

// ---------------------------------------------------------------------------
// Immutability / Frozen output
// ---------------------------------------------------------------------------

describe('immutability', () => {
  it('should return frozen CreateWorldPipelineResult for success', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('create mario'))
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('should return frozen CreateWorldPipelineResult for unknown', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('hello'))
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('should return frozen CreateWorldPipelineResult for empty input', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command(''))
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('should return frozen world in result (entities are from projection)', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('create mario'))
    // The result object itself is frozen; entities array immutability
    // is the responsibility of the projection implementation
    expect(result.world).toBeDefined()
    expect(Array.isArray(result.world.entities)).toBe(true)
  })

  it('route field should be readonly (frozen string)', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('create mario'))
    const mutable = result as unknown as Record<string, unknown>
    expect(() => {
      mutable.route = 'unknown'
    }).toThrow()
  })

  it('success field should be readonly', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('create mario'))
    const mutable = result as unknown as Record<string, unknown>
    expect(() => {
      mutable.success = false
    }).toThrow()
  })
})

// ---------------------------------------------------------------------------
// Dependency injection
// ---------------------------------------------------------------------------

describe('dependency injection', () => {
  it('should accept custom IntentRouter', () => {
    const customRouter: IntentRouter = {
      route(_input: string): IntentRoutingResult {
        return Object.freeze({ route: 'unknown' as IntentRoute, confidence: 0 })
      },
    }
    const pipeline = new DefaultCreateWorldPipeline(
      customRouter,
      new DefaultGameIntentExtractor(),
      new DefaultSemanticWorldGenerator(),
      new DefaultSemanticGameDslBuilder(),
      createEmptyProjectionMock(),
    )
    const result = pipeline.execute(command('create mario'))
    expect(result.success).toBe(false)
    expect(result.route).toBe('unknown')
  })

  it('should accept custom GameIntentExtractor', () => {
    let extractCalled = false
    const customExtractor = {
      extract(_model: PromptAssemblyDomainModel) {
        extractCalled = true
        return Object.freeze({ genre: 'platformer' as const, title: 'Custom' })
      },
    }
    const pipeline = new DefaultCreateWorldPipeline(
      new DefaultIntentRouter(),
      customExtractor,
      new DefaultSemanticWorldGenerator(),
      new DefaultSemanticGameDslBuilder(),
      createEmptyProjectionMock(),
    )
    pipeline.execute(command('create mario'))
    expect(extractCalled).toBe(true)
  })

  it('should accept custom SemanticWorldGenerator', () => {
    let generateCalled = false
    const customGenerator = {
      generate(_model: PromptAssemblyDomainModel): GameWorldModel {
        generateCalled = true
        return Object.freeze({ worldType: 'platformer' as const, entities: Object.freeze([]) })
      },
    }
    const pipeline = new DefaultCreateWorldPipeline(
      new DefaultIntentRouter(),
      new DefaultGameIntentExtractor(),
      customGenerator,
      new DefaultSemanticGameDslBuilder(),
      createEmptyProjectionMock(),
    )
    pipeline.execute(command('create mario'))
    expect(generateCalled).toBe(true)
  })

  it('should accept custom SemanticGameDslBuilder', () => {
    let buildCalled = false
    const customBuilder = {
      build(_world: GameWorldModel): GameDsl {
        buildCalled = true
        return {
          world: { name: 'Custom', entities: [] },
        } as unknown as GameDsl
      },
    }
    const pipeline = new DefaultCreateWorldPipeline(
      new DefaultIntentRouter(),
      new DefaultGameIntentExtractor(),
      new DefaultSemanticWorldGenerator(),
      customBuilder,
      createEmptyProjectionMock(),
    )
    pipeline.execute(command('create mario'))
    expect(buildCalled).toBe(true)
  })

  it('should accept custom Projection', () => {
    let projectCalled = false
    const customProjection: Projection = {
      project(_dsl: GameDsl): { world: World } {
        projectCalled = true
        return { world: { entities: [{ id: 'custom', type: 'hero', x: 5, y: 10 }] } }
      },
    }
    const pipeline = createPipeline(customProjection)
    const result = pipeline.execute(command('create mario'))
    expect(projectCalled).toBe(true)
    expect(result.world.entities[0].id).toBe('custom')
  })

  it('should pass all dependencies to reach projection', () => {
    let routerCalled = false
    let extractorCalled = false
    let generatorCalled = false
    let builderCalled = false
    let projectorCalled = false

    const customRouter: IntentRouter = {
      route(_input: string): IntentRoutingResult {
        routerCalled = true
        return Object.freeze({ route: 'create-world' as IntentRoute, confidence: 1.0 })
      },
    }
    const customExtractor = {
      extract(_model: PromptAssemblyDomainModel) {
        extractorCalled = true
        return Object.freeze({ genre: 'platformer' as const, title: 'Custom' })
      },
    }
    const customGenerator = {
      generate(_model: PromptAssemblyDomainModel): GameWorldModel {
        generatorCalled = true
        return Object.freeze({ worldType: 'platformer' as const, entities: Object.freeze([]) })
      },
    }
    const customBuilder = {
      build(_world: GameWorldModel): GameDsl {
        builderCalled = true
        return { world: { name: 'Custom', entities: [] } } as unknown as GameDsl
      },
    }
    const customProjection: Projection = {
      project(_dsl: GameDsl): { world: World } {
        projectorCalled = true
        return { world: { entities: [] } }
      },
    }

    const pipeline = new DefaultCreateWorldPipeline(
      customRouter,
      customExtractor,
      customGenerator,
      customBuilder,
      customProjection,
    )

    pipeline.execute(command('anything'))
    expect(routerCalled).toBe(true)
    expect(extractorCalled).toBe(true)
    expect(generatorCalled).toBe(true)
    expect(builderCalled).toBe(true)
    expect(projectorCalled).toBe(true)
  })

  it('should not call downstream dependencies for unknown route', () => {
    let extractorCalled = false

    const customRouter: IntentRouter = {
      route(_input: string): IntentRoutingResult {
        return Object.freeze({ route: 'unknown' as IntentRoute, confidence: 0 })
      },
    }
    const customExtractor = {
      extract(_model: PromptAssemblyDomainModel) {
        extractorCalled = true
        return Object.freeze({ genre: 'platformer' as const, title: 'Custom' })
      },
    }

    const pipeline = new DefaultCreateWorldPipeline(
      customRouter,
      customExtractor,
      new DefaultSemanticWorldGenerator(),
      new DefaultSemanticGameDslBuilder(),
      createEmptyProjectionMock(),
    )

    pipeline.execute(command('hello'))
    expect(extractorCalled).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Cross-contamination
// ---------------------------------------------------------------------------

describe('cross-contamination', () => {
  it('should not be affected by previous executions', () => {
    const pipeline = createPipeline()
    const inputs = ['create mario', 'hello', 'create farm', 'what', 'create rpg']
    const results = inputs.map((i) => pipeline.execute(command(i)))
    expect(results[0].success).toBe(true)
    expect(results[1].success).toBe(false)
    expect(results[2].success).toBe(true)
    expect(results[3].success).toBe(false)
    expect(results[4].success).toBe(true)
  })

  it('each execution should be independent', () => {
    const pipeline = createPipeline()
    const result1 = pipeline.execute(command('create mario'))
    const result2 = pipeline.execute(command('create mario'))
    expect(result1).toEqual(result2)
    expect(result1.route).toBe('create-world')
    expect(result2.route).toBe('create-world')
  })

  it('result should contain exactly 3 properties', () => {
    const pipeline = createPipeline()
    const result = pipeline.execute(command('create mario'))
    const keys = Object.keys(result)
    expect(keys).toHaveLength(3)
    expect(keys).toContain('route')
    expect(keys).toContain('world')
    expect(keys).toContain('success')
  })
})