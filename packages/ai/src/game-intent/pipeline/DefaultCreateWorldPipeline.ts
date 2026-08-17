/**
 * DefaultCreateWorldPipeline — default implementation of CreateWorldPipeline.
 *
 * Orchestrates the full creation flow:
 *   input
 *     ↓
 *   IntentRouter.route()
 *     ↓
 *   if route !== create-world → return success:false
 *     ↓
 *   Create PromptAssemblyDomainModel from input
 *     ↓
 *   GameIntentExtractor.extract(model)
 *     ↓
 *   SemanticWorldGenerator.generate(model, gameIntent)
 *     ↓
 *   SemanticGameDslBuilder.build(gameWorldModel)
 *     ↓
 *   RuntimeProjection.project(gameDsl)
 *     ↓
 *   World
 *
 * Pure. Stateless. Deterministic. Immutable. Frozen output.
 *
 * Constructor dependencies (all injected):
 *   IntentRouter         — routes the raw input
 *   GameIntentExtractor  — extracts semantic game intent
 *   SemanticWorldGenerator — generates semantic world model
 *   SemanticGameDslBuilder — builds Game DSL from semantic model
 *   Projection           — projects Game DSL onto Runtime World
 */
import type { World } from '@genesis/shared'
import type { GameDsl } from '@genesis/shared'
import type { GameWorldModel } from '@genesis/shared'
import type { PromptAssemblyDomainModel } from '../../observatory/domain'
import type { IntentRouter } from '../router/IntentRouter'
import type { GameIntentExtractor } from '../GameIntentExtractor'
import type { SemanticWorldGenerator } from '../../game-world/SemanticWorldGenerator'
import type { SemanticGameDslBuilder } from '../../game-world/SemanticGameDslBuilder'
import type { CreateWorldCommand } from './CreateWorldCommand'
import type { CreateWorldPipelineResult } from './CreateWorldPipelineResult'
import type { CreateWorldPipeline } from './CreateWorldPipeline'

// ---------------------------------------------------------------------------
// Local projection interface
// ---------------------------------------------------------------------------

/**
 * Projection — a function that projects a GameDsl onto a Runtime World.
 *
 * This local interface avoids importing from @genesis/runtime.
 * The actual RuntimeProjection from @genesis/runtime is type-compatible
 * via duck typing (same method signature).
 */
export interface Projection {
  /**
   * Project a GameDsl onto the Runtime world representation.
   *
   * @param dsl — declarative Game DSL
   * @returns An object with a projected world
   */
  project(dsl: GameDsl): { world: World }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** The expected route for world creation. */
const ROUTE_CREATE_WORLD = 'create-world'

/** Empty world used when pipeline does not succeed. */
const EMPTY_WORLD: World = { entities: [] }

/** Empty pipeline result when route is not create-world. */
const UNKNOWN_RESULT: CreateWorldPipelineResult = Object.freeze({
  route: 'unknown',
  world: EMPTY_WORLD,
  success: false,
})

// ---------------------------------------------------------------------------
// DefaultCreateWorldPipeline
// ---------------------------------------------------------------------------

/**
 * DefaultCreateWorldPipeline — orchestrates the create world pipeline.
 *
 * All dependencies are injected via constructor. The pipeline is pure,
 * stateless, deterministic, and produces frozen outputs.
 */
export class DefaultCreateWorldPipeline implements CreateWorldPipeline {
  private readonly intentRouter: IntentRouter
  private readonly gameIntentExtractor: GameIntentExtractor
  private readonly worldGenerator: SemanticWorldGenerator
  private readonly gameDslBuilder: SemanticGameDslBuilder
  private readonly projection: Projection

  /**
   * Construct a DefaultCreateWorldPipeline with injected dependencies.
   *
   * @param intentRouter — routes the raw input string
   * @param gameIntentExtractor — extracts semantic game intent
   * @param worldGenerator — generates semantic world model
   * @param gameDslBuilder — builds Game DSL from semantic model
   * @param projection — projects Game DSL onto Runtime World
   */
  constructor(
    intentRouter: IntentRouter,
    gameIntentExtractor: GameIntentExtractor,
    worldGenerator: SemanticWorldGenerator,
    gameDslBuilder: SemanticGameDslBuilder,
    projection: Projection,
  ) {
    this.intentRouter = intentRouter
    this.gameIntentExtractor = gameIntentExtractor
    this.worldGenerator = worldGenerator
    this.gameDslBuilder = gameDslBuilder
    this.projection = projection
  }

  /**
   * Execute the Create World Pipeline.
   *
   * Routes the input → detects create-world → extracts intent →
   * generates world → builds DSL → projects to Runtime world.
   *
   * @param command — the CreateWorldCommand with user input
   * @returns Frozen CreateWorldPipelineResult
   */
  execute(command: CreateWorldCommand): CreateWorldPipelineResult {
    // Validate command
    if (command === undefined || command === null) {
      return UNKNOWN_RESULT
    }

    const input = command.input

    if (typeof input !== 'string') {
      return UNKNOWN_RESULT
    }

    // Step 1: Route the input
    const routingResult = this.intentRouter.route(input)

    if (routingResult.route !== ROUTE_CREATE_WORLD) {
      return Object.freeze({
        route: routingResult.route,
        world: EMPTY_WORLD,
        success: false,
      })
    }

    // Step 2: Create PromptAssemblyDomainModel from input
    const model = this.createDomainModel(input)

    // Step 3: Extract GameIntent
    const gameIntent = this.gameIntentExtractor.extract(model)

    // Step 4: Generate Semantic World Model
    const gameWorldModel: GameWorldModel = this.worldGenerator.generate(model, gameIntent)

    // Step 5: Build Game DSL
    const gameDsl: GameDsl = this.gameDslBuilder.build(gameWorldModel)

    // Step 6: Project to Runtime World
    const projectionResult = this.projection.project(gameDsl)

    // Step 7: Return result
    return Object.freeze({
      route: ROUTE_CREATE_WORLD,
      world: projectionResult.world,
      success: true,
    })
  }

  // -------------------------------------------------------------------------
  // Private
  // -------------------------------------------------------------------------

  /**
   * Create a PromptAssemblyDomainModel from a raw input string.
   *
   * Sets the overview title to the input string for intent extraction.
   * The extracted GameIntent, not the raw title, is passed to world generation
   * as the authoritative genre signal.
   */
  private createDomainModel(input: string): PromptAssemblyDomainModel {
    return Object.freeze({
      overview: Object.freeze({
        title: input,
        traceCount: 0,
        timelineCount: 0,
        historyCount: 0,
      }),
    }) as unknown as PromptAssemblyDomainModel
  }
}
