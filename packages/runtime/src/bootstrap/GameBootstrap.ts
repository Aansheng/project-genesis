/**
 * GameBootstrap — a unified entry point for starting and stopping a playable game.
 *
 * WO-S9-010 — Playable Game Bootstrap Foundation
 * Architecture version v1.84
 *
 * Wires together:
 *   World → ExecutionLoop (PlayerControllerSystem + MovementSystem)
 *     → RuntimeVisualizationLoop → VisualizationRunner → PixiRenderer → Canvas
 *
 * Design principles:
 * - Single API: start(container) starts everything
 * - Clean teardown: stop() destroys all resources
 * - State querying: isRunning() reports current state
 * - Foundation only: no physics, no collision, no camera
 * - Framework-independent: no Vue, Pinia, or web framework imports
 */
export interface GameBootstrap {
  /**
   * Start the game.
   *
   * Initializes the renderer, registers systems, and starts the
   * visualization runner. The provided container element will contain
   * the game canvas.
   *
   * @param container — DOM element to host the game canvas
   */
  start(container: HTMLElement): Promise<void>

  /**
   * Stop the game and release all resources.
   *
   * Stops the runner, destroys the renderer, and cleans up
   * all internal state. Safe to call multiple times.
   */
  stop(): Promise<void>

  /**
   * Check whether the game is currently running.
   *
   * @returns True if the game has been started and not yet stopped
   */
  isRunning(): boolean
}