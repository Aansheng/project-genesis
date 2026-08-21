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
 * - World transformation is pure; optional event sinks receive observations
 * - No I/O or external calls
 * - Deterministic: same systems + same world order = same output
 * - Immutable: all outputs are deeply frozen
 * - Empty registry: tick returns world unchanged; tickWithResult returns
 *   empty executedSystems with systemCount 0
 * - Tick metadata is local to this loop; system observation state resets when
 *   the input World reference changes
 *
 * Design principles:
 * - Simple: no ECS scheduler, no prioritized execution, no conditional logic
 * - Minimal state: tick/event sequencing is local to one Runtime session
 * - Framework-independent: no Vue, Pinia, or web framework imports
 * - UI-independent: no ViewModel or UI type imports
 */
import type { World } from '@genesis/shared'
import type { RuntimeSystemRegistry } from '../system'
import type { RuntimeExecutionLoop } from './RuntimeExecutionLoop'
import type { ExecutionTickResult } from './ExecutionTickResult'
import {
  DefaultRuntimeGameplayEventCollector,
  type RuntimeGameplayEventCollector,
} from '../events'

export class DefaultRuntimeExecutionLoop implements RuntimeExecutionLoop {
  private readonly registry: RuntimeSystemRegistry
  readonly gameplayEventCollector: RuntimeGameplayEventCollector
  private tickNumber = 0
  private lastOutputWorld: World | undefined

  /**
   * @param registry — the RuntimeSystemRegistry providing systems to execute
   */
  constructor(
    registry: RuntimeSystemRegistry,
    gameplayEventCollector: RuntimeGameplayEventCollector = new DefaultRuntimeGameplayEventCollector(),
  ) {
    this.registry = registry
    this.gameplayEventCollector = gameplayEventCollector
  }

  /**
   * Execute a single tick — passes the World through all registered
   * systems in registration order.
   *
   * @param world — immutable input World
   * @returns Frozen output World after all systems have executed
   */
  tick(world: World): World {
    return this.tickWithResult(world).world
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

    if (this.lastOutputWorld !== undefined && world !== this.lastOutputWorld) {
      for (const system of systems) system.reset?.()
    }

    for (const system of systems) {
      system.setGameplayEventSink?.(this.gameplayEventCollector)
    }

    this.tickNumber += 1
    this.gameplayEventCollector.beginTick(this.tickNumber)

    if (systems.length === 0) {
      const outputWorld = Object.freeze({
        world: Object.freeze({
          entities: Object.freeze([...world.entities]),
        }) as unknown as World,
        executedSystems: Object.freeze([]),
        systemCount: 0,
        gameplayEvents: this.gameplayEventCollector.endTick(),
      })
      this.lastOutputWorld = outputWorld.world
      return outputWorld
    }

    let current = world

    for (const system of systems) {
      current = system.update(current)
    }

    const result = Object.freeze({
      world: current,
      executedSystems: Object.freeze(executedSystems),
      systemCount: systems.length,
      gameplayEvents: this.gameplayEventCollector.endTick(),
    })
    this.lastOutputWorld = current
    return result
  }
}
