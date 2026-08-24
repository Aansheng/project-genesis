/**
 * RuntimeVisualizationLoop — synchronises Runtime World updates
 * with visual rendering on the canvas.
 *
 * This is the top-level loop that connects the Runtime execution loop
 * to the Renderer layer. Each tick progresses the simulation by one
 * step and renders the result.
 *
 * Two entry points:
 * - tick():       execute the full pipeline: runtime → adapt → render
 * - tickWithResult():  same as tick(), returns VisualizationTickResult
 *
 * Lifecycle:
 * - start():  enables tick execution
 * - stop():   disables tick execution
 * - isRunning():  returns whether the loop is currently enabled
 *
 * Design principles:
 * - Foundation only: no animation interpolation, no camera, no sprites
 * - Stateful: maintains currentWorld and running state between ticks
 * - Deterministic: same initial world + same systems = same visual output
 * - Framework-independent: no Vue, Pinia, or web framework imports
 * - No scheduling: does not manage its own interval/RAF loop
 */
import type { VisualizationTickResult } from './VisualizationTickResult'
import type { World } from '@genesis/shared'
import type { GameplayRuleExecutionObserver, RuntimeGameplaySessionState } from '@genesis/runtime'

export interface RuntimeWorldSink {
  setWorld(world: World): void
}

export type { GameplayRuleExecutionObserver }

export interface RuntimeGameplaySessionStateObserver {
  observe(state: RuntimeGameplaySessionState): void
}

export interface RuntimeVisualizationLoop {
  /**
   * Start the visualization loop.
   * Subsequent tick() calls will execute the full pipeline.
   */
  start(): void

  /**
   * Stop the visualization loop.
   * Subsequent tick() calls will be no-ops.
   */
  stop(): void

  /**
   * Check whether the visualization loop is currently running.
   *
   * @returns True if the loop is running and tick() will execute
   */
  isRunning(): boolean

  /**
   * Execute a single visualization tick.
   *
   * Pipeline:
   *   World → executionLoop.tick() → new World → adapter.adapt() → RenderWorld → entityRenderer.render()
   *
   * Only executes when running === true.
   * If stopped, this is a no-op.
   */
  tick(): void

  /**
   * Execute a single visualization tick and return execution metadata.
   *
   * Only executes the pipeline when running === true.
   * When stopped, returns a result with zero counts.
   *
   * @returns Frozen VisualizationTickResult with entity counts
   */
  tickWithResult(): VisualizationTickResult
}
