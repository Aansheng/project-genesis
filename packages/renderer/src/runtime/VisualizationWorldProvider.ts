/**
 * VisualizationWorldProvider — provides the active Runtime World for visualization.
 *
 * The visualization loop reads the current world from this provider
 * on each tick, instead of storing its own copy. This allows the AI
 * generation pipeline to inject new worlds without restarting the loop.
 *
 * Design principles:
 * - Minimal: single get method
 * - Deterministic: same call within same tick returns same World
 * - Immutable output: getWorld() returns a frozen World
 * - Framework-independent: no Vue, Pinia, or web framework imports
 */
import type { World } from '@genesis/shared'

export interface VisualizationWorldProvider {
  /**
   * Get the current world for visualization.
   *
   * Always returns a valid World (never undefined or null).
   * The returned World is frozen.
   *
   * @returns Frozen World
   */
  getWorld(): World
}