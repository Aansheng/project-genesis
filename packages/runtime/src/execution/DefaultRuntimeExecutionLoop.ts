/**
 * DefaultRuntimeExecutionLoop — default implementation of RuntimeExecutionLoop.
 *
 * Iterates over all registered systems in registration order, passing the
 * output of each system as input to the next. The final World is returned
 * along with execution metadata.
 *
 * Pipeline:
 *   world → system[0].update() → system[1].update() → ... → final World
 *
 * Behaviors:
 * - Pure: no side effects, no I/O, no external calls
 * - Deterministic: same systems + same world order = same output
 * - Immutable: all outputs are deeply frozen
 * - Empty registry: tick returns world unchanged; tickWithResult returns
 *   empty executedSystems with systemCount 0
 * - No state mutation: the execution loop itself is stateless
 *
 * Design principles:
 * - Simple: no ECS scheduler, no prioritized execution, no conditional logic
 * - Stateless: no internal state between ticks
 * - Framework-independent: no Vue, Pinia, or web framework imports
 * - UI-independent: no ViewModel or UI type imports
 */
import type { World } from '@genesis/shared'
import type { RuntimeSystemRegistry } from '../system'
import type { RuntimeExecutionLoop } from './RuntimeExecutionLoop'
import type { ExecutionTickResult } from './ExecutionTickResult'

export class DefaultRuntimeExecutionLoop implements RuntimeExecutionLoop {
  private readonly registry: RuntimeSystemRegistry

  /**
   * @param registry — the RuntimeSystemRegistry providing systems to execute
   */
  constructor(registry: RuntimeSystemRegistry) {
    this.registry = registry
  }

  /**
   * Execute a single tick — passes the World through all registered
   * systems in registration order.
   *
   * @param world — immutable input World
   * @returns Frozen output World after all systems have executed
   */
  tick(world: World): World {
    const systems = this.registry.getSystems()

    if (systems.length === 0) {
      return Object.freeze({
        entities: Object.freeze([...world.entities]),
      }) as unknown as World
    }

    let current = world

    for (const system of systems) {
      current = system.update(current)
    }

    return current
  }

  /**
   * Execute a single tick and return full execution metadata.
   *
   * @param world — immutable input World
   * @returns Frozen ExecutionTickResult with output World and metadata
   */
  tickWithResult(world: World): ExecutionTickResult {
    const systems = this.registry.getSystems()
    const executedSystems = systems.map((s) => s.name)

    if (systems.length === 0) {
      return Object.freeze({
        world: Object.freeze({
          entities: Object.freeze([...world.entities]),
        }) as unknown as World,
        executedSystems: Object.freeze([]),
        systemCount: 0,
      })
    }

    let current = world

    for (const system of systems) {
      current = system.update(current)
    }

    return Object.freeze({
      world: current,
      executedSystems: Object.freeze(executedSystems),
      systemCount: systems.length,
    })
  }
}