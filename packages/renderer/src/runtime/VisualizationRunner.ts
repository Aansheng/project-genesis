/**
 * VisualizationRunner — drives continuous visualization by connecting
 * an AnimationFrameScheduler to a RuntimeVisualizationLoop.
 *
 * On every animation frame, the runner calls visualizationLoop.tick(),
 * which executes the full pipeline:
 *   scheduler → requestAnimationFrame
 *     ↓
 *   visualizationLoop.tick()
 *     ↓
 *   executionLoop.tick() → adapter.adapt() → entityRenderer.render()
 *     ↓
 *   Canvas Update
 *
 * Lifecycle:
 * - start():  begins running visualization ticks on every animation frame
 * - stop():   stops the animation loop
 * - isRunning():  returns whether the runner is currently active
 *
 * Design principles:
 * - Pure orchestration: no game logic, no input, no collision, no physics
 * - Delegates scheduling to the scheduler abstraction
 * - Delegates tick execution to the visualization loop
 * - Safe: double-start is a no-op, double-stop is a no-op
 * - Framework-independent: no Vue, Pinia, or web framework imports
 */

export interface VisualizationRunner {
  /**
   * Start continuous visualization.
   * Calls visualizationLoop.tick() on every animation frame.
   * Calling start() while already running is a no-op.
   */
  start(): void

  /**
   * Stop continuous visualization.
   * The visualization loop will no longer receive ticks on animation frames.
   * Calling stop() while not running is a no-op.
   */
  stop(): void

  /**
   * Check whether the runner is currently active.
   *
   * @returns True if visualization ticks are being scheduled
   */
  isRunning(): boolean
}