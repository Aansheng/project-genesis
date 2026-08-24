/**
 * DefaultRuntimeVisualizationLoop — the default implementation of
 * RuntimeVisualizationLoop.
 *
 * Orchestrates the full tick pipeline:
 *   World → executionLoop.tick() → new World → adapter.adapt() → RenderWorld → entityRenderer.render()
 *
 * State maintained:
 *   - currentWorld:  the most recently computed World, stored between ticks
 *   - running:       whether tick() should execute the full pipeline
 *
 * Behaviors:
 *   - start(): sets running = true
 *   - stop():  sets running = false
 *   - tick():  only executes the pipeline when running === true
 *   - Immutable: the stored currentWorld is always frozen
 *   - Deterministic: same initial world + same systems = same visual output
 *   - No animation: raw state snapshots only, no interpolation
 *   - No scheduling: does not manage RAF or setInterval
 */
import type { World } from '@genesis/shared'
import type { GameplayEventObserver } from '@genesis/shared'
import type { GameplayRuleExecutionObserver, RuntimeExecutionLoop } from '@genesis/runtime'
import type { RuntimeRendererAdapter } from '../adapter'
import type { PixiEntityRenderer } from '../view'
import type { PixiEnvironmentRenderer } from '../view'
import type { RuntimeVisualizationLoop } from './RuntimeVisualizationLoop'
import type { VisualizationTickResult } from './VisualizationTickResult'
import type { VisualizationWorldProvider } from './VisualizationWorldProvider'
import type {
  RuntimeGameplayProgressionStateObserver,
  RuntimeGameplaySessionStateObserver,
  RuntimeWorldSink,
} from './RuntimeVisualizationLoop'

export class DefaultRuntimeVisualizationLoop
  implements RuntimeVisualizationLoop
{
  private readonly executionLoop: RuntimeExecutionLoop
  private readonly rendererAdapter: RuntimeRendererAdapter
  private readonly entityRenderer: PixiEntityRenderer
  private readonly worldProvider: VisualizationWorldProvider | undefined
  private readonly worldSink: RuntimeWorldSink | undefined
  private readonly environmentRenderer: PixiEnvironmentRenderer | undefined
  private readonly gameplayEventObserver: GameplayEventObserver | undefined
  private readonly gameplayRuleExecutionObserver: GameplayRuleExecutionObserver | undefined
  private readonly gameplaySessionStateObserver: RuntimeGameplaySessionStateObserver | undefined
  private readonly gameplayProgressionStateObserver: RuntimeGameplayProgressionStateObserver | undefined
  private _currentWorld: World
  private _running: boolean

  /**
   * @param executionLoop   — the runtime execution loop that progresses the simulation
   * @param rendererAdapter — maps a Runtime World to a RenderWorld
   * @param entityRenderer  — renders a RenderWorld onto the canvas
   * @param initialWorld    — the starting World (stored as currentWorld)
   * @param worldProvider   — optional world provider for runtime world injection;
   *                          when provided, getWorld() is used instead of initialWorld
   *                          as the tick source
   */
  constructor(
    executionLoop: RuntimeExecutionLoop,
    rendererAdapter: RuntimeRendererAdapter,
    entityRenderer: PixiEntityRenderer,
    initialWorld: World,
    worldProvider?: VisualizationWorldProvider,
    worldSink?: RuntimeWorldSink,
    environmentRenderer?: PixiEnvironmentRenderer,
    gameplayEventObserver?: GameplayEventObserver,
    gameplayRuleExecutionObserver?: GameplayRuleExecutionObserver,
    gameplaySessionStateObserver?: RuntimeGameplaySessionStateObserver,
    gameplayProgressionStateObserver?: RuntimeGameplayProgressionStateObserver,
  ) {
    this.executionLoop = executionLoop
    this.rendererAdapter = rendererAdapter
    this.entityRenderer = entityRenderer
    this.worldProvider = worldProvider
    this.worldSink = worldSink
    this.environmentRenderer = environmentRenderer
    this.gameplayEventObserver = gameplayEventObserver
    this.gameplayRuleExecutionObserver = gameplayRuleExecutionObserver
    this.gameplaySessionStateObserver = gameplaySessionStateObserver
    this.gameplayProgressionStateObserver = gameplayProgressionStateObserver
    this._currentWorld = worldProvider?.getWorld() ?? initialWorld
    this._running = false
  }

  // ─── Lifecycle ─────────────────────────────────────────────────────

  /**
   * Start the visualization loop.
   * Subsequent tick() calls will execute the full pipeline.
   */
  start(): void {
    this._running = true
  }

  /**
   * Stop the visualization loop.
   * Subsequent tick() calls will be no-ops.
   */
  stop(): void {
    this._running = false
  }

  /**
   * Check whether the visualization loop is currently running.
   *
   * @returns True if the loop is running and tick() will execute
   */
  isRunning(): boolean {
    return this._running
  }

  // ─── Tick ───────────────────────────────────────────────────────────

  /**
   * Execute a single visualization tick.
   *
   * Pipeline:
   *   currentWorld → executionLoop.tick() → newWorld
   *     → rendererAdapter.adapt() → RenderWorld
   *       → entityRenderer.render()
   *
   * The new World is stored as currentWorld for the next tick.
   * Only executes when running === true.
   */
  tick(): void {
    if (!this._running) return

    this.executePipeline()
  }

  /**
   * Execute a single visualization tick and return execution metadata.
   *
   * When running, executes the full pipeline and returns entity counts.
   * When stopped, returns a result with zero counts without executing.
   *
   * @returns Frozen VisualizationTickResult
   */
  tickWithResult(): VisualizationTickResult {
    if (!this._running) {
      return Object.freeze({
        entityCount: this._currentWorld.entities.length,
        renderedCount: 0,
      })
    }

    const renderedCount = this.executePipeline()

    return Object.freeze({
      entityCount: this._currentWorld.entities.length,
      renderedCount,
    })
  }

  // ─── Private ────────────────────────────────────────────────────────

  /**
   * Execute the full tick pipeline and return the number of rendered entities.
   *
   * @returns The number of entities rendered on the canvas
   */
  private executePipeline(): number {
    // Refresh world from provider if available (supports runtime injection)
    if (this.worldProvider !== undefined) {
      this._currentWorld = this.worldProvider.getWorld()
    }

    // Step 1: Execute runtime systems
    const executionResult = this.gameplayEventObserver || this.gameplayRuleExecutionObserver || this.gameplaySessionStateObserver || this.gameplayProgressionStateObserver
      ? this.executionLoop.tickWithResult(this._currentWorld)
      : { world: this.executionLoop.tick(this._currentWorld), gameplayEvents: [], gameplayRuleResults: [], gameplaySessionState: undefined, gameplayProgressionState: undefined }
    const newWorld = executionResult.world

    // Step 2: Adapt to RenderWorld
    const renderWorld = this.rendererAdapter.adapt(newWorld)

    this.environmentRenderer?.render(renderWorld)

    // Step 3: Render entities on top and capture rendered entity count
    const renderView = this.entityRenderer.render(renderWorld)

    // Step 4: Store the authoritative Runtime result before observers read it.
    // Web projections may use the observer callback to inspect the current
    // Runtime world; publishing after observation would expose the prior tick.
    this._currentWorld = newWorld
    this.worldSink?.setWorld(newWorld)

    // Step 5: Publish observations after the Runtime result is authoritative.
    this.gameplayEventObserver?.observe(executionResult.gameplayEvents ?? [])
    this.gameplayRuleExecutionObserver?.observe(executionResult.gameplayRuleResults ?? [])
    if (executionResult.gameplaySessionState) {
      this.gameplaySessionStateObserver?.observe(executionResult.gameplaySessionState)
    }
    if (executionResult.gameplayProgressionState) {
      this.gameplayProgressionStateObserver?.observe(executionResult.gameplayProgressionState)
    }

    return renderView.entities.length
  }
}
