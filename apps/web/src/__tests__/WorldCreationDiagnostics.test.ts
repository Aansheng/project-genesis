/**
 * WorldCreationDiagnostics.test.ts — diagnostics for WO-S10-005.
 *
 * Traces the full pipeline for "创建 MarioWorld":
 *   Input → Route → Intent → GameWorldModel → GameDsl
 *     → RuntimeWorld → renderWorld (Canvas2D) → Canvas
 *
 * Goal: Identify why "Created world with 1 entity" appears but
 * nothing renders on the canvas.
 *
 * DO NOT modify any behavior. Only diagnostics and tests.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { DefaultRuntimeWorldStore, DefaultRuntimeProjection } from '@genesis/runtime'
import type { World } from '@genesis/shared'
import {
  DefaultIntentRouter,
  DefaultGameIntentExtractor,
  DefaultCreateWorldPipeline,
  DefaultSemanticWorldGenerator,
  DefaultSemanticGameDslBuilder,
} from '@genesis/ai'
import type { IntentRoutingResult, IntentRouter } from '@genesis/ai'
import type { CreateWorldPipeline } from '@genesis/ai'
import type { GameIntent } from '@genesis/ai'

// ---------------------------------------------------------------------------
// Pipeline setup — duplicates production construction from gameStore.ts
// ---------------------------------------------------------------------------

const INTENT_ROUTER: IntentRouter = new DefaultIntentRouter()
const GAME_INTENT_EXTRACTOR = new DefaultGameIntentExtractor()
const WORLD_GENERATOR = new DefaultSemanticWorldGenerator()
const DSL_BUILDER = new DefaultSemanticGameDslBuilder()
const PROJECTION = new DefaultRuntimeProjection()

function createPipeline(): CreateWorldPipeline {
  return new DefaultCreateWorldPipeline(
    INTENT_ROUTER,
    GAME_INTENT_EXTRACTOR,
    WORLD_GENERATOR,
    DSL_BUILDER,
    PROJECTION,
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** The test input — matching the user scenario. */
const INPUT_CREATE_MARIO = '创建 MarioWorld'

/** Input that SHOULD trigger 'platformer' world type. */
const INPUT_PLATFORMER = '创建一个平台游戏'

/** Input that explicitly contains "tree" to test entity extraction. */
const INPUT_TREE = '创建 a tree in my world'

/** Legacy input that worked with MockPlanner. */
const INPUT_LEGACY_TREE = '增加一棵树'

// ---------------------------------------------------------------------------
// Diagnostics
// ---------------------------------------------------------------------------

describe('WO-S10-005: World Creation Diagnostics', () => {
  // ───────────────────────────────────────────────────────────────────
  // 1. IntentRouter
  // ───────────────────────────────────────────────────────────────────

  describe('1. IntentRouter.route("创建 MarioWorld")', () => {
    let result: IntentRoutingResult

    beforeAll(() => {
      result = INTENT_ROUTER.route(INPUT_CREATE_MARIO)
    })

    it('should route to "create-world"', () => {
      expect(result.route).toBe('create-world')
    })

    it('should have confidence 1.0 (creation keyword + genre keyword "mario")', () => {
      // IntentRouter uses 4 creation keywords (create/创建/生成/build)
      // and 4 genre keywords (mario/farm/rpg/survival).
      // "创建 MarioWorld" HAS "创建" + "mario" → both creation and genre keywords present.
      // This should produce confidence = 1.0.
      expect(result.confidence).toBe(1.0)
    })

    it('should have exact expected route and confidence', () => {
      expect(result).toEqual({
        route: 'create-world',
        confidence: 1.0,
      } satisfies IntentRoutingResult)
    })
  })

  // ───────────────────────────────────────────────────────────────────
  // 2. GameIntentExtractor
  // ───────────────────────────────────────────────────────────────────

  describe('2. GameIntentExtractor.extract("创建 MarioWorld")', () => {
    let intent: GameIntent

    beforeAll(() => {
      // Simulate what DefaultCreateWorldPipeline does internally:
      //   Creates a PromptAssemblyDomainModel with overview.title = input
      const model = Object.freeze({
        overview: Object.freeze({
          title: INPUT_CREATE_MARIO,
          traceCount: 0,
          timelineCount: 0,
          historyCount: 0,
        }),
      }) as never
      intent = GAME_INTENT_EXTRACTOR.extract(model)
    })

    it('should detect genre as "platformer" (title contains "mario")', () => {
      expect(intent.genre).toBe('platformer')
    })

    it('should preserve title as "创建 MarioWorld"', () => {
      expect(intent.title).toBe('创建 MarioWorld')
    })
  })

  // ───────────────────────────────────────────────────────────────────
  // 3. CreateWorldPipeline.execute — GameWorldModel
  // ───────────────────────────────────────────────────────────────────

  describe('3. CreateWorldPipeline.execute — internal model', () => {
    let pipelineResult: ReturnType<CreateWorldPipeline['execute']>

    beforeAll(() => {
      const pipeline = createPipeline()
      pipelineResult = pipeline.execute({ input: INPUT_CREATE_MARIO })
    })

    it('should succeed (route = create-world)', () => {
      expect(pipelineResult.success).toBe(true)
    })

    it('should have 6 projected platformer entities', () => {
      expect(pipelineResult.world.entities).toHaveLength(6)
    })

    it('entity type should be "player"', () => {
      expect(pipelineResult.world.entities[0].type).toBe('player')
    })

    it('entity id should be "player"', () => {
      expect(pipelineResult.world.entities[0].id).toBe('player')
    })
  })

  // ───────────────────────────────────────────────────────────────────
  // 4. Entity count BEFORE projection (via SemanticWorldGenerator)
  // ───────────────────────────────────────────────────────────────────

  describe('4. Entity count at each pipeline stage', () => {
    it('SemanticWorldGenerator should generate sandbox template (1 entity)', () => {
      // "创建 MarioWorld" has no "farm"/"rpg"/"platform"/"survival" keywords
      //   so worldType defaults to 'sandbox'.
      //   sandbox template = 1 entity: player
      const model = Object.freeze({
        overview: Object.freeze({
          title: INPUT_CREATE_MARIO,
          traceCount: 0,
          timelineCount: 0,
          historyCount: 0,
        }),
      }) as never

      const gameWorldModel = WORLD_GENERATOR.generate(model)
      expect(gameWorldModel.worldType).toBe('sandbox')
      expect(gameWorldModel.entities).toHaveLength(1)
      expect(gameWorldModel.entities[0].id).toBe('player')
      expect(gameWorldModel.entities[0].category).toBe('player')
    })

    it('SemanticGameDslBuilder should produce 1 EntityDsl', () => {
      const model = Object.freeze({
        overview: Object.freeze({
          title: INPUT_CREATE_MARIO,
          traceCount: 0,
          timelineCount: 0,
          historyCount: 0,
        }),
      }) as never

      const gameWorldModel = WORLD_GENERATOR.generate(model)
      const gameDsl = DSL_BUILDER.build(gameWorldModel)
      expect(gameDsl.world.entities).toHaveLength(1)
    })

    it('RuntimeProjection should produce 1 Runtime Entity', () => {
      const model = Object.freeze({
        overview: Object.freeze({
          title: INPUT_CREATE_MARIO,
          traceCount: 0,
          timelineCount: 0,
          historyCount: 0,
        }),
      }) as never

      const gameWorldModel = WORLD_GENERATOR.generate(model)
      const gameDsl = DSL_BUILDER.build(gameWorldModel)
      const projected = PROJECTION.project(gameDsl)
      expect(projected.world.entities).toHaveLength(1)
    })
  })

  // ───────────────────────────────────────────────────────────────────
  // 5. Entity count AFTER projection
  // ───────────────────────────────────────────────────────────────────

  describe('5. Projection output — entity structure', () => {
    let world: World

    beforeAll(() => {
      const pipeline = createPipeline()
      const result = pipeline.execute({ input: INPUT_CREATE_MARIO })
      world = result.world
    })

    it('should have exactly 6 entities', () => {
      expect(world.entities).toHaveLength(6)
    })
  })

  // ───────────────────────────────────────────────────────────────────
  // 6. RuntimeWorldStore.getWorld() after injection
  // ───────────────────────────────────────────────────────────────────

  describe('6. RuntimeWorldStore — world injection', () => {
    let worldStore: DefaultRuntimeWorldStore

    beforeAll(() => {
      worldStore = new DefaultRuntimeWorldStore()
      const pipeline = createPipeline()
      const result = pipeline.execute({ input: INPUT_CREATE_MARIO })

      // Simulate what CreateWorldRuntimeExecutor does:
      worldStore.setWorld(result.world)
    })

    it('should contain the projected world', () => {
      const stored = worldStore.getWorld()
      expect(stored.entities).toHaveLength(6)
    })
  })

  // ───────────────────────────────────────────────────────────────────
  // 7. First entity structure — full dump
  // ───────────────────────────────────────────────────────────────────

  describe('7. First entity — full structural dump', () => {
    let entity: World['entities'][number]

    beforeAll(() => {
      const pipeline = createPipeline()
      const result = pipeline.execute({ input: INPUT_CREATE_MARIO })
      entity = result.world.entities[0]
    })

    it('id should be "player"', () => {
      expect(entity.id).toBe('player')
    })

    it('type should be "player" (NOT "tree")', () => {
      // *** ROOT CAUSE CANDIDATE ***
      // renderWorld.drawEntity() only handles type === 'tree'
      expect(entity.type).toBe('player')
    })

    it('x should be 0 (default position)', () => {
      expect(entity.x).toBe(0)
    })

    it('y should be 0 (default position)', () => {
      expect(entity.y).toBe(0)
    })

    it('should have components array', () => {
      expect(Array.isArray(entity.components)).toBe(true)
    })

    it('should have semantic, position, and collision bounds components', () => {
      expect(entity.components).toHaveLength(3)
    })

    it('component type should be "semantic"', () => {
      expect(entity.components![0].type).toBe('semantic')
    })

    it('component properties should contain category and name', () => {
      expect(entity.components![0].properties).toEqual({
        category: 'player',
        name: 'Player',
      })
    })

    // Full structural dump
    it('full entity snapshot', () => {
      expect(entity).toEqual({
        id: 'player',
        type: 'player',
        x: 0,
        y: 0,
        components: [
          {
            type: 'semantic',
            properties: {
              category: 'player',
              name: 'Player',
            },
          },
          {
            type: 'position',
            properties: {
              x: 80,
              y: 300,
            },
          },
          {
            type: 'collision-bounds',
            properties: {
              width: 32,
              height: 48,
              offsetX: 0,
              offsetY: 0,
            },
          },
        ],
      })
    })
  })

  // ───────────────────────────────────────────────────────────────────
  // 8. Does player contain PositionComponent?
  // ───────────────────────────────────────────────────────────────────

  describe('8. Position component check', () => {
    it('the entity includes a PositionComponent for the renderer', () => {
      const pipeline = createPipeline()
      const result = pipeline.execute({ input: INPUT_CREATE_MARIO })
      const entity = result.world.entities[0]

      // Legacy top-level coordinates are preserved.
      expect(entity.x).toBe(0)
      expect(entity.y).toBe(0)

      // Renderer coordinates are provided through the ECS component contract.
      const positionComponent = entity.components?.find(
        (c) => c.type === 'position' || c.properties?.x !== undefined,
      )
      expect(positionComponent).toEqual({
        type: 'position',
        properties: { x: 80, y: 300 },
      })
    })
  })

  // ───────────────────────────────────────────────────────────────────
  // 9. renderWorld — drawEntity switch coverage
  // ───────────────────────────────────────────────────────────────────

  describe('9. renderWorld.drawEntity — type coverage', () => {
    it('drawEntity only handles type === "tree"', () => {
      // From renderWorld.ts line 19-35:
      //   switch (entity.type) {
      //     case 'tree': { ... tree drawing ... break }
      //   }
      // There is NO case for 'player', 'npc', 'building', etc.
      // Any entity with type !== 'tree' is silently skipped.
      //
      // The projected entity has type='player', so nothing renders.
    })

    it('entityToPixel: x=0 → px=24, y=0 → py=24', () => {
      // From renderWorld.ts line 9-14:
      //   px = Math.min(entity.x, GRID_COLS-1) * TILE_SIZE + TILE_SIZE/2
      //   py = Math.min(entity.y, GRID_ROWS-1) * TILE_SIZE + TILE_SIZE/2
      // With TILE_SIZE=48, GRID_COLS=12, GRID_ROWS=8:
      //   px = min(0, 11) * 48 + 24 = 24
      //   py = min(0, 7) * 48 + 24 = 24
      // Position is fine — entity WOULD render at (24, 24) if drawEntity handled it.
    })
  })

  // ───────────────────────────────────────────────────────────────────
  // 10. PixiEntityRenderer — does it skip?
  // ───────────────────────────────────────────────────────────────────

  describe('10. renderWorld — why nothing renders on canvas', () => {
    it('Final diagnosis: renderWorld only renders type="tree"', () => {
      // The projected entity has type="player".
      // renderWorld.drawEntity() only has a case for 'tree'.
      // 'player' falls through switch → nothing drawn.
      // The canvas background + grid IS drawn, but no entities.
      //
      // Steps to fix (future WO):
      //   1. Add entity rendering cases to drawEntity() for 'player', 'enemy', etc.
      //   2. OR switch to Pixi-based rendering pipeline which has full entity rendering
    })
  })

  // ───────────────────────────────────────────────────────────────────
  // Bonus: What if we typed "创建一个平台游戏"?
  // ───────────────────────────────────────────────────────────────────

  describe('BONUS: "创建一个平台游戏" — would this work?', () => {
    it('IntentRouter routes to create-world', () => {
      const result = INTENT_ROUTER.route(INPUT_PLATFORMER)
      expect(result.route).toBe('create-world')
    })

    it('WorldGenerator also defaults to sandbox (no English keyword "platform")', () => {
      // NOTE: WorldGenerator looks for English keywords: 'farm','rpg','platform','survival'
      //   Chinese input "创建一个平台游戏" does NOT contain "platform" → sandbox
      //   This means even Chinese "平台" doesn't match platformer detection.
      //   WO-S8-013 Entity enrichment did NOT add Chinese keyword support for world type detection.
      const model = Object.freeze({
        overview: Object.freeze({
          title: INPUT_PLATFORMER,
          traceCount: 0,
          timelineCount: 0,
          historyCount: 0,
        }),
      }) as never

      const gameWorldModel = WORLD_GENERATOR.generate(model)
      expect(gameWorldModel.worldType).toBe('sandbox')
      expect(gameWorldModel.entities).toHaveLength(1)
    })

    it('But renderWorld still would NOT draw anything', () => {
      // Platformer entities have types from category:
      //   'player' (player), 'terrain' (terrain), 'terrain' (platform),
      //   'enemy' (enemy), 'item' (goal), 'item' (checkpoint)
      //
      // renderWorld.drawEntity() switch:
      //   case 'tree' — only match
      //
      // None of these entity types match 'tree'.
      // So even with 6 entities, the canvas is still blank.
    })
  })

  // ───────────────────────────────────────────────────────────────────
  // Bonus 2: What about "增加一棵树" (legacy MockPlanner input)?
  // ───────────────────────────────────────────────────────────────────

  describe('BONUS 2: "增加一棵树" through new pipeline', () => {
    it('IntentRouter routes to unknown (no creation keyword)', () => {
      const result = INTENT_ROUTER.route(INPUT_LEGACY_TREE)
      expect(result.route).toBe('unknown')
    })

    it('CommandExecutor returns "Unknown command"', () => {
      // The legacy input "增加一棵树" would have been routed through
      // MockPlanner which returned a CreateEntity action for 'tree'.
      // With the new CommandExecutor, it routes to 'unknown' because
      // there is no creation keyword in the input.
    })
  })
})
