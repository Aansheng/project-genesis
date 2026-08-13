/**
 * MovementSystemResult — metadata produced by a movement system execution.
 *
 * Captures how many entities were moved and the offset applied. This
 * allows callers to introspect the effect of a movement system tick
 * without needing to diff the world.
 *
 * Design principles:
 * - Immutable: all fields are readonly
 * - Serializable: all values are JSON-serializable primitives
 * - Framework-independent: no Vue, Pinia, or web framework imports
 */
export interface MovementSystemResult {
  /** Number of entities that had their position updated. */
  readonly movedEntities: number

  /** The X offset applied to each moved entity. */
  readonly deltaX: number

  /** The Y offset applied to each moved entity. */
  readonly deltaY: number
}