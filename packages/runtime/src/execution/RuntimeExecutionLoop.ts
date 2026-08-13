/**
 * RuntimeExecutionLoop — executes registered systems in deterministic order.
 *
 * Provides the foundational runtime execution loop that iterates over
 * registered systems, passing the World through each system's update()
 * in registration order.
 *
 * Two entry points:
 * - tick():        pure World → World transformation
 * - tickWithResult(): returns ExecutionTickResult with execution metadata
 *
 * Design principles:
 * - Pure: no side effects, no I/O, no external calls
 * - Deterministic: same systems + same world = same output
 * - Immutable: all outputs are frozen
 * - No scheduling: executes all systems in registration order
 * - No ECS scheduler: no prioritized or conditional execution
 * - No async execution: synchronous only
 * - Framework-independent: no Vue, Pinia, or web framework imports
 * - UI-independent: no ViewModel or UI type imports
 */
import type { World } from '@genesis/shared'
import type { ExecutionTickResult } from './ExecutionTickResult'

export interface RuntimeExecutionLoop {
  /**
   * Execute a single tick — passes the World through all registered
   * systems in registration order and returns the final World.
   *
   * @param world — immutable input World
   * @returns Frozen output World after all systems have executed
   */
  tick(world: World): World

  /**
   * Execute a single tick and return full execution metadata.
   *
   * @param world — immutable input World
   * @returns Frozen ExecutionTickResult with output World and metadata
   */
  tickWithResult(world: World): ExecutionTickResult
}