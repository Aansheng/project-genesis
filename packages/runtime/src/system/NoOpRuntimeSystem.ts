/**
 * NoOpRuntimeSystem — a RuntimeSystem that returns the world unchanged.
 *
 * Purpose:
 * - Validate the runtime system pipeline
 * - Provide a baseline system for testing
 * - Demonstrate the RuntimeSystem contract
 *
 * Behaviors:
 * - Pure: no side effects, no I/O, no external calls
 * - Deterministic: same input always produces same output (identity)
 * - Immutable: returns a frozen copy of the input World
 *
 * Design principles:
 * - Minimal: no logic beyond identity transformation
 * - Framework-independent: no Vue, Pinia, or web framework imports
 * - UI-independent: no ViewModel or UI type imports
 */
import type { World } from '@genesis/shared'
import type { RuntimeSystem } from './RuntimeSystem'

export class NoOpRuntimeSystem implements RuntimeSystem {
  readonly name = 'NoOp'

  /**
   * Apply the NoOp transformation — returns the world unchanged.
   *
   * The returned World is a shallow frozen copy of the input.
   *
   * @param world — immutable input World
   * @returns A frozen copy of the input World
   */
  update(world: World): World {
    return Object.freeze({
      entities: Object.freeze([...world.entities]),
    }) as unknown as World
  }
}