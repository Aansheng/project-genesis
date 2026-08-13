/**
 * RuntimeSystem — a pure, deterministic transformation over a World.
 *
 * Represents a single system in the Runtime. Each system:
 * - Receives an immutable World as input
 * - Produces a new World as output (no mutation)
 * - Has a unique name for identification and debugging
 *
 * This is the FOUNDATION contract for runtime behavior.
 * No ECS framework, no scheduler, no update loop, no gameplay logic.
 *
 * Design principles:
 * - Pure: no side effects, no I/O, no external calls
 * - Deterministic: same input always produces same output
 * - Immutable: all outputs are deeply frozen
 * - Single responsibility: one transformation per system
 * - Framework-independent: no Vue, Pinia, or web framework imports
 * - UI-independent: no ViewModel or UI type imports
 */
import type { World } from '@genesis/shared'

export interface RuntimeSystem {
  /**
   * Human-readable system name for identification and debugging.
   */
  readonly name: string

  /**
   * Apply this system's transformation to the given World.
   *
   * @param world — immutable input World
   * @returns Frozen output World with this system's transformation applied
   */
  update(world: World): World
}