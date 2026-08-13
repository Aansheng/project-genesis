/**
 * AnimationFrameScheduler — schedules repeated callbacks via
 * requestAnimationFrame.
 *
 * Provides a controllable loop that invokes a callback on every animation
 * frame while running. The callback receives no timestamp argument —
 * consumers who need frame timing should measure it themselves.
 *
 * Lifecycle:
 * - start(callback):  begins scheduling the callback on every frame
 * - stop():           cancels the pending frame and stops scheduling
 * - isRunning():      returns whether the loop is currently active
 *
 * Design principles:
 * - Foundation only: no delta-time tracking, no frame-skip, no interpolation
 * - Stateless: does not store or accumulate frame data
 * - Safe: double-start is a no-op, double-stop is a no-op
 * - Framework-independent: no Vue, Pinia, or web framework imports
 */
export interface AnimationFrameScheduler {
  /**
   * Start scheduling callbacks via requestAnimationFrame.
   * The callback will be invoked on every animation frame until stop() is called.
   * Calling start() while already running is a no-op.
   *
   * @param callback — the function to invoke on each animation frame
   */
  start(callback: () => void): void

  /**
   * Stop scheduling callbacks.
   * Cancels any pending animation frame and prevents further callbacks.
   * Calling stop() while not running is a no-op.
   */
  stop(): void

  /**
   * Check whether the scheduler is currently running.
   *
   * @returns True if callbacks are being scheduled on each animation frame
   */
  isRunning(): boolean
}