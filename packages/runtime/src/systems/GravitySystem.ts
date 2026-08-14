/**
 * GravitySystem — a runtime system that applies a constant downward force
 * to all entities with a PositionComponent.
 *
 * Extends the base RuntimeSystem contract with no additional methods.
 * The system identifies entities carrying a PositionComponent via the
 * isPositionComponent type guard and increments their y coordinate by
 * the configured gravity value each tick.
 *
 * Entities without a PositionComponent are left unchanged.
 *
 * Design principles:
 * - Pure: no side effects, no I/O, no external calls
 * - Deterministic: same input always produces same output
 * - Immutable: all outputs are deeply frozen; inputs never mutated
 * - Foundation only: no collision, no jumping, no physics engine
 * - Framework-independent: no Vue, Pinia, or web framework imports
 */

import type { RuntimeSystem } from '../system'

export interface GravitySystem extends RuntimeSystem {
  // Extends RuntimeSystem with no additional methods.
  // Gravity-specific metadata is provided via the updateWithResult()
  // method on the DefaultGravitySystem implementation.
}