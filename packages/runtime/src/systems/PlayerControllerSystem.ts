/**
 * PlayerControllerSystem — a runtime system that moves player entities
 * based on keyboard input state.
 *
 * Extends the base RuntimeSystem contract with no additional methods.
 * The system reads InputProvider state each tick, identifies entities
 * with type 'player', and updates their PositionComponent x/y coordinates
 * based on which arrow keys are pressed.
 *
 * Entities without type 'player' or without a PositionComponent are
 * left unchanged.
 *
 * Design principles:
 * - Pure: no side effects, no I/O, no external calls beyond getState()
 * - Deterministic: same (world, inputState, speed) always produces same output
 * - Immutable: all outputs are deeply frozen; inputs never mutated
 * - Foundation only: no physics, no collision, no gameplay logic
 * - Framework-independent: no Vue, Pinia, or web framework imports
 */

import type { RuntimeSystem } from '../system'

export interface PlayerControllerSystem extends RuntimeSystem {
  // Extends RuntimeSystem with no additional methods.
  // Execution metadata is provided via the updateWithResult() method
  // on the DefaultPlayerControllerSystem implementation.
}