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
 * - Simple: no ECS scheduler or general-purpose scheduler; supported gameplay
 *   rules run only in the bounded post-system phase
 * - Minimal state: tick/event sequencing is local to one Runtime session
 * - Framework-independent: no Vue, Pinia, or web framework imports
 * - UI-independent: no ViewModel or UI type imports
 */
import type { GameWorldModel, GameplayEvent, GameplayRuleSet, World } from '@genesis/shared'
import type { RuntimeSystemRegistry } from '../system'
import type { RuntimeExecutionLoop } from './RuntimeExecutionLoop'
import type { ExecutionTickResult } from './ExecutionTickResult'
import {
  DefaultRuntimeGameplayEventCollector,
  type RuntimeGameplayEventCollector,
} from '../events'
import {
  DefaultGameplayRuleExecutor,
  type GameplayRuleExecutionBatch,
  type GameplayRuleExecutor,
} from '../gameplay'

export interface RuntimeGameplayRuleExecutionConfig {
  readonly getRuleSet: () => GameplayRuleSet | null | undefined
  readonly getWorldId?: () => string | undefined
  readonly getSessionId?: () => string | undefined
  readonly getSemanticRevision?: () => number | undefined
  readonly getSemanticWorld?: () => GameWorldModel | null | undefined
  readonly executor?: GameplayRuleExecutor
}

export class DefaultRuntimeExecutionLoop implements RuntimeExecutionLoop {
  private readonly registry: RuntimeSystemRegistry
  readonly gameplayEventCollector: RuntimeGameplayEventCollector
  private tickNumber = 0
  private lastOutputWorld: World | undefined
  private readonly gameplayRuleExecution?: RuntimeGameplayRuleExecutionConfig
  private readonly gameplayRuleExecutor: GameplayRuleExecutor

  /**
   * @param registry — the RuntimeSystemRegistry providing systems to execute
   */
  constructor(
    registry: RuntimeSystemRegistry,
    gameplayEventCollector: RuntimeGameplayEventCollector = new DefaultRuntimeGameplayEventCollector(),
    gameplayRuleExecution?: RuntimeGameplayRuleExecutionConfig,
  ) {
    this.registry = registry
    this.gameplayEventCollector = gameplayEventCollector
    this.gameplayRuleExecution = gameplayRuleExecution
    this.gameplayRuleExecutor = gameplayRuleExecution?.executor ?? new DefaultGameplayRuleExecutor()
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
      const gameplayEvents = this.gameplayEventCollector.endTick()
      const gameplayRules = this.executeGameplayRules(world, gameplayEvents)
      const outputWorld = Object.freeze({
        // Preserve the foundation loop's copy-on-empty-registry behavior
        // when no rule mutation was committed.
        world: gameplayRules.results.length > 0
          ? gameplayRules.world
          : Object.freeze({ entities: Object.freeze([...gameplayRules.world.entities]) }) as unknown as World,
        executedSystems: Object.freeze([]),
        systemCount: 0,
        gameplayEvents,
        gameplayRuleResults: gameplayRules.results,
      })
      this.lastOutputWorld = outputWorld.world
      return outputWorld
    }

    let current = world

    for (const system of systems) {
      current = system.update(current)
    }

    const gameplayEvents = this.gameplayEventCollector.endTick()
    const gameplayRules = this.executeGameplayRules(current, gameplayEvents)
    const result = Object.freeze({
      world: gameplayRules.world,
      executedSystems: Object.freeze(executedSystems),
      systemCount: systems.length,
      gameplayEvents,
      gameplayRuleResults: gameplayRules.results,
    })
    this.lastOutputWorld = gameplayRules.world
    return result
  }

  private executeGameplayRules(
    world: World,
    events: readonly GameplayEvent[],
  ): GameplayRuleExecutionBatch {
    const execution = this.gameplayRuleExecution
    if (!execution) return Object.freeze({ world, results: Object.freeze([]) })
    const ruleSet = execution.getRuleSet()
    if (!ruleSet) return Object.freeze({ world, results: Object.freeze([]) })

    const worldId = execution.getWorldId?.()
    const sessionId = execution.getSessionId?.()
    const semanticRevision = execution.getSemanticRevision?.()
    const semanticWorld = execution.getSemanticWorld?.()
    return this.gameplayRuleExecutor.execute(events, ruleSet, Object.freeze({
      world,
      ...(worldId !== undefined ? { worldId } : {}),
      ...(sessionId !== undefined ? { sessionId } : {}),
      ...(semanticRevision !== undefined ? { semanticRevision } : {}),
      ...(semanticWorld !== undefined && semanticWorld !== null ? { semanticWorld } : {}),
    }))
  }
}
