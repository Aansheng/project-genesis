/**
 * JumpSystemResult — metadata produced by a jump system execution.
 *
 * Captures how many player entities jumped and the jump height applied.
 * This allows callers to introspect the effect of a jump system tick
 * without needing to diff the world.
 *
 * Design principles:
 * - Immutable: all fields are readonly
 * - Serializable: all values are JSON-serializable primitives
 * - Framework-independent: no Vue, Pinia, or web framework imports
 */
export interface JumpSystemResult {
  /** Number of player entities that jumped this tick. */
  readonly jumpedPlayers: number

  /** The jump height applied (pixels upward). */
  readonly jumpHeight: number
}