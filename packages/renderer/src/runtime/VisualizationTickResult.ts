/**
 * VisualizationTickResult — the result of a single visualization tick.
 *
 * Captures the entity counts after a tick completes, providing
 * observability into how many entities were present in the world
 * vs. how many were actually rendered on the canvas.
 *
 * Design principles:
 * - Immutable: all fields are readonly
 * - Serializable: all values are JSON-serializable primitives
 * - Informative: provides metadata for debugging and observability
 * - Framework-independent: no Vue, Pinia, or web framework imports
 */
export interface VisualizationTickResult {
  /**
   * The total number of entities in the runtime World after the tick.
   */
  readonly entityCount: number

  /**
   * The number of entities that were rendered on the canvas.
   * Entities without a PositionComponent are not rendered.
   */
  readonly renderedCount: number
}