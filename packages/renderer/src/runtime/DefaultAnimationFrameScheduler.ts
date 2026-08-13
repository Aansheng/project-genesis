/**
 * DefaultAnimationFrameScheduler — the default implementation of
 * AnimationFrameScheduler, backed by requestAnimationFrame and
 * cancelAnimationFrame.
 *
 * Scheduling behavior:
 * - start(callback):  issues the first requestAnimationFrame immediately;
 *                     each frame re-requests the next frame before invoking
 *                     the callback, ensuring continuous scheduling
 * - stop():           cancels the pending animation frame via
 *                     cancelAnimationFrame and resets internal state
 * - isRunning():      returns whether the scheduler has an active loop
 *
 * Edge cases:
 * - Double start (start() while running):  no-op, callback unchanged
 * - Double stop (stop() while not running): no-op, safe to call
 * - No-op callback (null/undefined):       throws on start
 * - Browser context required:              relies on global requestAnimationFrame
 *
 * Design principles:
 * - Stateless between frames: no accumulated state, no delta-time tracking
 * - Minimal allocation: one closure captured per frame cycle
 * - Safe teardown: stop() guarantees no further callbacks fire
 */
import type { AnimationFrameScheduler } from './AnimationFrameScheduler'

export class DefaultAnimationFrameScheduler implements AnimationFrameScheduler {
  private _frameId: number | null = null
  private _callback: (() => void) | null = null
  private _running = false

  /**
   * Start scheduling callbacks via requestAnimationFrame.
   *
   * @param callback — the function to invoke on each animation frame.
   *                   Must be a non-null function reference.
   * @throws if callback is not a function
   */
  start(callback: () => void): void {
    if (typeof callback !== 'function') {
      throw new Error('callback must be a function')
    }

    if (this._running) {
      return
    }

    this._callback = callback
    this._running = true
    this.scheduleNext()
  }

  /**
   * Stop scheduling callbacks.
   * Cancels any pending animation frame. Safe to call when not running.
   */
  stop(): void {
    if (!this._running) {
      return
    }

    if (this._frameId !== null) {
      cancelAnimationFrame(this._frameId)
      this._frameId = null
    }

    this._callback = null
    this._running = false
  }

  /**
   * Check whether the scheduler is currently running.
   *
   * @returns True if callbacks are being scheduled on each animation frame
   */
  isRunning(): boolean {
    return this._running
  }

  // ─── Private ────────────────────────────────────────────────────────

  /**
   * Schedule the next animation frame.
   * The callback is invoked on each frame, and this method re-schedules
   * itself for the subsequent frame, creating a continuous loop.
   */
  private scheduleNext(): void {
    if (!this._running || this._callback === null) {
      return
    }

    this._frameId = requestAnimationFrame(() => {
      if (!this._running || this._callback === null) {
        return
      }

      // Invoke the user callback
      this._callback()

      // Schedule the next frame
      this.scheduleNext()
    })
  }
}