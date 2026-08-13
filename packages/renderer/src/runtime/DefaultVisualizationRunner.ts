/**
 * DefaultVisualizationRunner — the default implementation of
 * VisualizationRunner.
 *
 * Orchestrates the continuous animation loop:
 *   scheduler.start() → requestAnimationFrame
 *     ↓
 *   visualizationLoop.tick()   (on every frame)
 *     ↓
 *   executionLoop → adapter → entityRenderer → Canvas Update
 *
 * Flow:
 *   start()
 *     ↓
 *   scheduler.start(frameCallback)
 *     ↓
 *   requestAnimationFrame → frameCallback → visualizationLoop.tick() → loop
 *     ↓
 *   stop()
 *     ↓
 *   scheduler.stop() → cancelAnimationFrame
 *
 * Edge cases:
 * - Double start: no-op (delegated to scheduler)
 * - Double stop:  no-op (delegated to scheduler)
 * - Running state: derived from scheduler.isRunning()
 */
import type { AnimationFrameScheduler } from './AnimationFrameScheduler'
import type { RuntimeVisualizationLoop } from './RuntimeVisualizationLoop'
import type { VisualizationRunner } from './VisualizationRunner'

export class DefaultVisualizationRunner implements VisualizationRunner {
  private readonly scheduler: AnimationFrameScheduler
  private readonly visualizationLoop: RuntimeVisualizationLoop

  /**
   * @param scheduler          — the animation frame scheduler that drives the loop
   * @param visualizationLoop  — the visualization loop to tick on every frame
   */
  constructor(
    scheduler: AnimationFrameScheduler,
    visualizationLoop: RuntimeVisualizationLoop
  ) {
    this.scheduler = scheduler
    this.visualizationLoop = visualizationLoop
  }

  /**
   * Start continuous visualization.
   * The visualization loop must be started separately via visualizationLoop.start().
   * On each animation frame, visualizationLoop.tick() is called.
   * Double-start is a no-op (delegated to scheduler).
   */
  start(): void {
    // Ensure the visualization loop is running so tick() executes the pipeline
    if (!this.visualizationLoop.isRunning()) {
      this.visualizationLoop.start()
    }

    this.scheduler.start(() => {
      this.visualizationLoop.tick()
    })
  }

  /**
   * Stop continuous visualization.
   * The visualization loop remains in its current running state
   * (it can still be ticked manually). Double-stop is a no-op.
   */
  stop(): void {
    this.scheduler.stop()
  }

  /**
   * Check whether the runner is currently active.
   *
   * @returns True if scheduler is running
   */
  isRunning(): boolean {
    return this.scheduler.isRunning()
  }
}