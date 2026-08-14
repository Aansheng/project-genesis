/**
 * GravitySystemResult — metadata produced by a gravity system execution.
 *
 * Captures how many entities were affected by gravity and the gravity
 * value applied. This allows callers to introspect the effect of a
 * gravity system tick without needing to diff the world.
 *
 * Design principles:
 * - Immutable: all fields are readonly
 * - Serializable: all values are JSON-serializable primitives
 * - Framework-independent: no Vue, Pinia, or web framework imports
 */
export interface GravitySystemResult {
  /** Number of entities affected by gravity this tick. */
  readonly affectedEntities: number

  /** The gravity value applied (y += gravity). */
  readonly gravity: number
}