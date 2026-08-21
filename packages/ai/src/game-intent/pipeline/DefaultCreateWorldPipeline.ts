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
import type { GameplayGenerationContext } from '@genesis/shared'
import type { GameplaySpecification } from '@genesis/shared'
import { DEFAULT_GAMEPLAY_CAPABILITY_CATALOG, DefaultGameplayGenerationContextBuilder } from '@genesis/shared'
import type { PromptAssemblyDomainModel } from '../../observatory/domain'
import type { IntentRouter } from '../router/IntentRouter'
import type { GameIntentExtractor } from '../GameIntentExtractor'
import type { SemanticWorldGenerator } from '../../game-world/SemanticWorldGenerator'
import type { SemanticGameDslBuilder } from '../../game-world/SemanticGameDslBuilder'
import type { CreateWorldCommand } from './CreateWorldCommand'
import type { CreateWorldPipelineResult } from './CreateWorldPipelineResult'
import type { CreateWorldPipeline } from './CreateWorldPipeline'
import type { GameWorldGenerationProvider } from '../../game-world/generation'
import { DeterministicGameWorldGenerationProvider } from '../../game-world/generation'
import type { GameplayGenerationProvider, GameplayGenerationResult, GameplayGenerationRequest } from '../../gameplay'
import { DeterministicGameplayGenerationProvider, DefaultGameplayRuleBuilder, DefaultGameplaySpecificationBuilder } from '../../gameplay'

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

function createSuccessfulResult(
  world: World,
  semanticWorld: GameWorldModel,
  generationDiagnostics?: CreateWorldPipelineResult['generationDiagnostics'],
  gameplayResult?: GameplayGenerationResult,
): CreateWorldPipelineResult {
  const result = {
    route: ROUTE_CREATE_WORLD,
    world,
    success: true,
    ...(generationDiagnostics ? { generationDiagnostics } : {}),
  }

  // Keep the old enumerable result shape stable while exposing the semantic
  // snapshot to the web command boundary that owns the current session.
  Object.defineProperty(result, 'semanticWorld', {
    configurable: false,
    enumerable: false,
    value: semanticWorld,
    writable: false,
  })
  if (gameplayResult) {
    Object.defineProperty(result, 'gameplaySpecification', {
      configurable: false,
      enumerable: false,
      value: gameplayResult.specification,
      writable: false,
    })
    Object.defineProperty(result, 'gameplayDiagnostics', {
      configurable: false,
      enumerable: false,
      value: gameplayResult.diagnostics,
      writable: false,
    })
    if (gameplayResult.ruleSet) {
      Object.defineProperty(result, 'gameplayRuleSet', {
        configurable: false,
        enumerable: false,
        value: gameplayResult.ruleSet,
        writable: false,
      })
    }
  }
  return Object.freeze(result) as CreateWorldPipelineResult
}

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
  private readonly generationProvider: GameWorldGenerationProvider
  private readonly gameplayProvider: GameplayGenerationProvider

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
    generationProvider: GameWorldGenerationProvider = new DeterministicGameWorldGenerationProvider(),
    gameplayProvider: GameplayGenerationProvider = new DeterministicGameplayGenerationProvider(new DefaultGameplaySpecificationBuilder()),
  ) {
    this.intentRouter = intentRouter
    this.gameIntentExtractor = gameIntentExtractor
    this.worldGenerator = worldGenerator
    this.gameDslBuilder = gameDslBuilder
    this.projection = projection
    this.generationProvider = generationProvider
    this.gameplayProvider = gameplayProvider
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
    return createSuccessfulResult(
      projectionResult.world,
      gameWorldModel,
      undefined,
      deterministicGameplayResult(gameWorldModel),
    )
  }

  /** Async provider path reserved for LLM-backed generation; sync callers remain unchanged. */
  async executeAsync(command: CreateWorldCommand): Promise<CreateWorldPipelineResult> {
    if (command === undefined || command === null || typeof command.input !== 'string') {
      return UNKNOWN_RESULT
    }

    const routingResult = this.intentRouter.route(command.input)
    if (routingResult.route !== ROUTE_CREATE_WORLD) {
      return Object.freeze({ route: routingResult.route, world: EMPTY_WORLD, success: false })
    }

    const model = this.createDomainModel(command.input)
    const intent = this.gameIntentExtractor.extract(model)
    const generationRequest = {
      input: command.input,
      intent,
    }
    const generated = this.generationProvider.generateWithDiagnostics
      ? await this.generationProvider.generateWithDiagnostics(generationRequest)
      : { world: await this.generationProvider.generate(generationRequest), diagnostics: undefined }
    const semanticWorld = generated.world
    const gameDsl = this.gameDslBuilder.build(semanticWorld)
    const projectionResult = this.projection.project(gameDsl)

    const gameplayRequest = createGameplayRequest(command.input, semanticWorld)
    let gameplayResult: GameplayGenerationResult
    try {
      if (this.gameplayProvider.generateWithDiagnostics) {
        gameplayResult = await this.gameplayProvider.generateWithDiagnostics(gameplayRequest)
      } else {
        const specification = await this.gameplayProvider.generate(gameplayRequest)
        gameplayResult = {
          specification,
          diagnostics: {
            source: 'ai',
            validationStatus: 'valid',
            validationErrors: Object.freeze([]),
            specification,
          },
        }
      }
    } catch (error) {
      gameplayResult = deterministicGameplayResult(semanticWorld, error)
    }
    gameplayResult = ensureGameplayRuleSet(gameplayResult, semanticWorld)

    const diagnostics = generated.diagnostics
      ? Object.freeze({
          ...generated.diagnostics,
          trace: generated.diagnostics.trace
            ? Object.freeze({
                ...generated.diagnostics.trace,
                stages: Object.freeze(generated.diagnostics.trace.stages.map(stage =>
                  stage.name === 'RUNTIME_INJECTION' ? { ...stage, status: 'success' as const } : stage,
                )),
              })
            : undefined,
        })
      : undefined
    return createSuccessfulResult(projectionResult.world, semanticWorld, diagnostics, gameplayResult)
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

function createGameplayRequest(input: string, semanticWorld: GameWorldModel): GameplayGenerationRequest {
  const context: GameplayGenerationContext = new DefaultGameplayGenerationContextBuilder().build({
    metadata: { gameplayRevision: 0 },
    semanticWorld,
    capabilities: DEFAULT_GAMEPLAY_CAPABILITY_CATALOG,
    instruction: input,
  })
  return Object.freeze({ kind: 'gameplay-generation', input, context })
}

function deterministicGameplayResult(semanticWorld: GameWorldModel, error?: unknown): GameplayGenerationResult {
  const specification: GameplaySpecification = new DefaultGameplaySpecificationBuilder().build({
    semanticWorld,
    gameplayRevision: 1,
    metadata: Object.freeze({
      source: 'deterministic',
      ...(error ? { warnings: Object.freeze([error instanceof Error ? error.message : 'Gameplay generation failed']) } : {}),
    }),
  })
  const ruleSet = new DefaultGameplayRuleBuilder().build({
    semanticWorld,
    gameplaySpecification: specification,
    metadata: Object.freeze({
      source: 'deterministic' as const,
      ...(error ? { warnings: Object.freeze([error instanceof Error ? error.message : 'Gameplay generation failed']) } : {}),
    }),
  })
  return Object.freeze({
    specification,
    ruleSet,
    diagnostics: Object.freeze({
      source: 'deterministic',
      validationStatus: error ? 'invalid' as const : 'valid' as const,
      validationErrors: Object.freeze(error ? [error instanceof Error ? error.message : 'Gameplay generation failed'] : []),
      specification,
      ...(error ? { fallbackReason: error instanceof Error ? error.message : 'Gameplay generation failed' } : {}),
    }),
  })
}

function ensureGameplayRuleSet(
  result: GameplayGenerationResult,
  semanticWorld: GameWorldModel,
): GameplayGenerationResult {
  if (result.ruleSet) return result
  const ruleSet = new DefaultGameplayRuleBuilder().build({
    semanticWorld,
    gameplaySpecification: result.specification,
    metadata: Object.freeze({
      source: result.diagnostics.source,
      ...(result.diagnostics.validationWarnings ? { warnings: result.diagnostics.validationWarnings } : {}),
      ...(result.specification.metadata.architectureVersion ? { architectureVersion: result.specification.metadata.architectureVersion } : {}),
    }),
  })
  return Object.freeze({ ...result, ruleSet })
}
