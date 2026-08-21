/**
 * GroundCollisionSystem — a runtime system that clamps entities at ground level.
 *
 * When an entity with a PositionComponent falls below ground level
 * (y >= groundY), its y coordinate is clamped back to groundY.
 * This provides the first gameplay constraint — entities can no longer
 * fall through the world.
 *
 * Extends the base RuntimeSystem contract with no additional methods.
 * The system identifies entities carrying a PositionComponent via the
 * isPositionComponent type guard and clamps their y coordinate to
 * the configured groundY value each tick.
 *
 * Entities without a PositionComponent or above ground are left unchanged.
 *
 * Design principles:
 * - Pure: no side effects, no I/O, no external calls
 * - Deterministic: same input always produces same output
 * - Bounded observation state: landing transitions are tracked only for the
 *   current Runtime world/session
 * - Immutable: all outputs are deeply frozen; inputs never mutated
 * - Foundation only: no physics engine, no velocity, no rigid bodies
 * - Framework-independent: no Vue, Pinia, or web framework imports
 */
import type { RuntimeSystem } from '../system'

export interface GroundCollisionSystem extends RuntimeSystem {
  // Extends RuntimeSystem with no additional methods.
  // Ground-collision-specific metadata is provided via the
  // updateWithResult() method on the DefaultGroundCollisionSystem
  // implementation.
}
