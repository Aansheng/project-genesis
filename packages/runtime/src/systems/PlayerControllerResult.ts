/**
 * PlayerControllerResult — metadata produced by a player controller system execution.
 *
 * Captures how many player entities were moved, the effective speed,
 * and the net delta applied. This allows callers to introspect the effect
 * of a player controller tick without needing to diff the world.
 *
 * Design principles:
 * - Immutable: all fields are readonly
 * - Serializable: all values are JSON-serializable primitives
 * - Framework-independent: no Vue, Pinia, or web framework imports
 */
export interface PlayerControllerResult {
  /** Number of player entities that had their position updated. */
  readonly movedPlayers: number

  /** The net X displacement applied this tick (negative = left, positive = right). */
  readonly deltaX: number

  /** The net Y displacement applied this tick (negative = up, positive = down). */
  readonly deltaY: number
}