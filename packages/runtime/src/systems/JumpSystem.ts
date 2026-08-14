/**
 * JumpSystem — a runtime system that applies an upward impulse to player
 * entities when the Space key is pressed.
 *
 * Extends the base RuntimeSystem contract with no additional methods.
 * The system reads InputProvider state each tick, identifies entities
 * with type 'player' and a PositionComponent, and decrements their y
 * coordinate by jumpHeight when Space is pressed.
 *
 * Entities without type 'player' or without a PositionComponent are
 * left unchanged.
 *
 * Design principles:
 * - Pure: no side effects, no I/O, no external calls beyond getState()
 * - Deterministic: same (world, inputState, jumpHeight) always produces same output
 * - Immutable: all outputs are deeply frozen; inputs never mutated
 * - Foundation only: no physics engine, no velocity, no acceleration
 * - Framework-independent: no Vue, Pinia, or web framework imports
 */
import type { RuntimeSystem } from '../system'

export interface JumpSystem extends RuntimeSystem {
  // Extends RuntimeSystem with no additional methods.
  // Execution metadata is provided via the updateWithResult() method
  // on the DefaultJumpSystem implementation.
}