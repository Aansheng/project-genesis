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
import {
  createHealthComponent,
  createVelocityComponent,
  isHealthComponent,
  isVelocityComponent,
} from '@genesis/shared'
import type { Entity, GameWorldModel, GameplayEvent, GameplayRuleSet, World } from '@genesis/shared'
import type { RuntimeSystemRegistry } from '../system'
import type { RuntimeExecutionLoop } from './RuntimeExecutionLoop'
import type { ExecutionTickResult } from './ExecutionTickResult'
import {
  DefaultRuntimeGameplayEventCollector,
  type RuntimeGameplayEventCollector,
} from '../events'
import {
  DefaultGameplayRuleExecutor,
  DefaultRuntimeGameplayProgressionStateStore,
  DefaultRuntimeGameplaySessionStateStore,
  respawnRuntimeGameplaySession,
  type GameplayRuleExecutionBatch,
  type GameplayRuleExecutor,
} from '../gameplay'
import type {
  RuntimeGameplayProgressionState,
  RuntimeGameplaySessionState,
} from '../gameplay'

export interface RuntimeGameplayRespawnResult {
  readonly respawned: boolean
  readonly world: World
  readonly gameplaySessionState?: RuntimeGameplaySessionState
  readonly gameplayProgressionState?: RuntimeGameplayProgressionState
}

export interface RuntimeGameplayRuleExecutionConfig {
  readonly getRuleSet: () => GameplayRuleSet | null | undefined
  readonly getWorldId?: () => string | undefined
  readonly getSessionId?: () => string | undefined
  readonly getSemanticRevision?: () => number | undefined
  readonly getSemanticWorld?: () => GameWorldModel | null | undefined
  readonly executor?: GameplayRuleExecutor
  readonly sessionStateStore?: DefaultRuntimeGameplaySessionStateStore
  readonly progressionStateStore?: DefaultRuntimeGameplayProgressionStateStore
}

export class DefaultRuntimeExecutionLoop implements RuntimeExecutionLoop {
  private readonly registry: RuntimeSystemRegistry
  readonly gameplayEventCollector: RuntimeGameplayEventCollector
  private tickNumber = 0
  private lastOutputWorld: World | undefined
  private readonly gameplayRuleExecution?: RuntimeGameplayRuleExecutionConfig
  private readonly gameplayRuleExecutor: GameplayRuleExecutor
  private readonly gameplaySessionStateStore?: DefaultRuntimeGameplaySessionStateStore
  private readonly gameplayProgressionStateStore?: DefaultRuntimeGameplayProgressionStateStore

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
    this.gameplaySessionStateStore = gameplayRuleExecution?.executor
      ? gameplayRuleExecution.sessionStateStore
      : gameplayRuleExecution
        ? gameplayRuleExecution.sessionStateStore ?? new DefaultRuntimeGameplaySessionStateStore()
        : undefined
    this.gameplayProgressionStateStore = gameplayRuleExecution?.executor
      ? gameplayRuleExecution.progressionStateStore
      : gameplayRuleExecution
        ? gameplayRuleExecution.progressionStateStore ?? new DefaultRuntimeGameplayProgressionStateStore()
        : undefined
    this.gameplayRuleExecutor = gameplayRuleExecution?.executor
      ?? new DefaultGameplayRuleExecutor(
        undefined,
        undefined,
        undefined,
        this.gameplaySessionStateStore,
        this.gameplayProgressionStateStore,
      )
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
   * Resume a failed gameplay session in the current World. This is an
   * explicit Runtime control, not a Web-owned mutation: only the player's
   * current Health and existing velocity are restored, while collected
   * entities, progression, semantic revision, and World Evolution remain.
   */
  respawnGameplay(world: World): RuntimeGameplayRespawnResult {
    const execution = this.gameplayRuleExecution
    if (!execution || !this.gameplaySessionStateStore) {
      return Object.freeze({ respawned: false, world })
    }

    const binding = this.gameplayBinding()
    const sessionState = this.gameplaySessionStateStore.bind(binding)
    const progressionState = this.gameplayProgressionStateStore?.bind(binding)
    const worldAfter = respawnPlayer(world)
    if (worldAfter === undefined) {
      return Object.freeze({
        respawned: false,
        world,
        gameplaySessionState: sessionState,
        ...(progressionState ? { gameplayProgressionState: progressionState } : {}),
      })
    }

    const respawn = respawnRuntimeGameplaySession(sessionState)
    if (respawn.outcome !== 'respawned') {
      return Object.freeze({
        respawned: false,
        world,
        gameplaySessionState: respawn.state,
        ...(progressionState ? { gameplayProgressionState: progressionState } : {}),
      })
    }

    this.gameplaySessionStateStore.commit(respawn.state)
    for (const system of this.registry.getSystems()) system.reset?.()
    this.lastOutputWorld = worldAfter
    return Object.freeze({
      respawned: true,
      world: worldAfter,
      gameplaySessionState: respawn.state,
      ...(progressionState ? { gameplayProgressionState: progressionState } : {}),
    })
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

    const boundGameplayState = this.bindGameplayState()
    if (boundGameplayState?.sessionState.status === 'failed') {
      if (this.lastOutputWorld !== undefined && world !== this.lastOutputWorld) {
        for (const system of systems) system.reset?.()
      }
      this.tickNumber += 1
      this.gameplayEventCollector.beginTick(this.tickNumber)
      const gameplayEvents = this.gameplayEventCollector.endTick()
      const result = Object.freeze({
        world,
        executedSystems: Object.freeze([]),
        systemCount: 0,
        gameplayEvents,
        gameplayRuleResults: Object.freeze([]),
        gameplaySessionState: boundGameplayState.sessionState,
        ...(boundGameplayState.progressionState
          ? { gameplayProgressionState: boundGameplayState.progressionState }
          : {}),
      })
      this.lastOutputWorld = world
      return result
    }

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
      this.recordGameplayMutationFacts(gameplayRules)
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
        ...(gameplayRules.sessionState ? { gameplaySessionState: gameplayRules.sessionState } : {}),
        ...(gameplayRules.progressionState ? { gameplayProgressionState: gameplayRules.progressionState } : {}),
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
    this.recordGameplayMutationFacts(gameplayRules)
    const result = Object.freeze({
      world: gameplayRules.world,
      executedSystems: Object.freeze(executedSystems),
      systemCount: systems.length,
      gameplayEvents,
      gameplayRuleResults: gameplayRules.results,
      ...(gameplayRules.sessionState ? { gameplaySessionState: gameplayRules.sessionState } : {}),
      ...(gameplayRules.progressionState ? { gameplayProgressionState: gameplayRules.progressionState } : {}),
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
    const worldId = execution.getWorldId?.()
    const sessionId = execution.getSessionId?.()
    const binding = this.gameplayBinding()
    const ruleSet = execution.getRuleSet()
    if (!ruleSet) {
      const sessionState = this.gameplaySessionStateStore?.bind(binding)
      const progressionState = this.gameplayProgressionStateStore?.bind(binding)
      return Object.freeze({
        world,
        results: Object.freeze([]),
        ...(sessionState ? { sessionState } : {}),
        ...(progressionState ? { progressionState } : {}),
      })
    }

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

  private recordGameplayMutationFacts(batch: GameplayRuleExecutionBatch): void {
    if (!this.gameplayEventCollector.markGameplayEntityRemoval) return
    for (const result of batch.results) {
      for (const action of result.actionResults) {
        if (action.mutation?.type !== 'ENTITY_REMOVED') continue
        this.gameplayEventCollector.markGameplayEntityRemoval(
          action.mutation.targetEntityId,
          action.mutation.health,
        )
      }
    }
  }

  private gameplayBinding(): { readonly worldId?: string; readonly sessionId?: string } {
    const execution = this.gameplayRuleExecution
    const worldId = execution?.getWorldId?.()
    const sessionId = execution?.getSessionId?.()
    return Object.freeze({
      ...(worldId !== undefined ? { worldId } : {}),
      ...(sessionId !== undefined ? { sessionId } : {}),
    })
  }

  private bindGameplayState(): {
    readonly sessionState: RuntimeGameplaySessionState
    readonly progressionState?: RuntimeGameplayProgressionState
  } | undefined {
    if (!this.gameplayRuleExecution || !this.gameplaySessionStateStore) return undefined
    const binding = this.gameplayBinding()
    return {
      sessionState: this.gameplaySessionStateStore.bind(binding),
      ...(this.gameplayProgressionStateStore
        ? { progressionState: this.gameplayProgressionStateStore.bind(binding) }
        : {}),
    }
  }
}

function respawnPlayer(world: World): World | undefined {
  let restored = false
  const entities = world.entities.map((entity) => {
    if (entity.type !== 'player') return entity
    const components = entity.components ? [...entity.components] : []
    const healthIndex = components.findIndex(isHealthComponent)
    if (healthIndex === -1) return entity

    const health = components[healthIndex]
    if (!health || !isHealthComponent(health)) return entity
    components[healthIndex] = createHealthComponent(health.properties.max, health.properties.max)
    const velocityIndex = components.findIndex(isVelocityComponent)
    if (velocityIndex !== -1) components[velocityIndex] = createVelocityComponent()
    restored = true
    return Object.freeze({
      ...entity,
      components: Object.freeze(components),
    }) as unknown as Entity
  })
  if (!restored) return undefined
  return Object.freeze({ entities: Object.freeze(entities) }) as unknown as World
}
