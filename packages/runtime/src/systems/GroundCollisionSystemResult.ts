/**
 * GroundCollisionSystemResult — metadata produced by a ground collision tick.
 *
 * Captures how many entities were grounded (clamped to groundY) and the
 * groundY value applied. This allows callers to introspect the effect of
 * a ground collision system tick without needing to diff the world.
 *
 * Design principles:
 * - Immutable: all fields are readonly
 * - Serializable: all values are JSON-serializable primitives
 * - Framework-independent: no Vue, Pinia, or web framework imports
 */
export interface GroundCollisionSystemResult {
  /** Number of entities clamped to ground level this tick. */
  readonly groundedEntities: number

  /** The ground Y threshold applied. */
  readonly groundY: number
}