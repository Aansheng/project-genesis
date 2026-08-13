/**
 * MovementSystem — a runtime system that applies a delta offset to all
 * entities with a PositionComponent.
 *
 * Extends the base RuntimeSystem contract with no additional methods.
 * The system identifies entities carrying a PositionComponent via the
 * isPositionComponent type guard and updates their x/y coordinates by
 * the configured delta values.
 *
 * Entities without a PositionComponent are left unchanged.
 *
 * Design principles:
 * - Pure: no side effects, no I/O, no external calls
 * - Deterministic: same input always produces same output
 * - Immutable: all outputs are deeply frozen; inputs never mutated
 * - Foundation only: no physics, no collision, no input, no AI
 * - Framework-independent: no Vue, Pinia, or web framework imports
 */

import type { RuntimeSystem } from '../system'

export interface MovementSystem extends RuntimeSystem {
  // Extends RuntimeSystem with no additional methods.
  // Movement-specific metadata is provided via the updateWithResult()
  // method on the DefaultMovementSystem implementation.
}