/**
 * ExecutionTickResult — the result of a single execution loop tick.
 *
 * Captures the output World along with metadata about which systems
 * were executed during the tick.
 *
 * Design principles:
 * - Immutable: all fields are readonly
 * - Serializable: all types are JSON-serializable primitives
 * - Informative: provides execution metadata for debugging and observability
 * - Framework-independent: no Vue, Pinia, or web framework imports
 * - UI-independent: no ViewModel or UI type imports
 */
import type { World } from '@genesis/shared'
import type { GameplayEvent } from '@genesis/shared'
import type { GameplayRuleExecutionResult, RuntimeGameplaySessionState } from '../gameplay'

export interface ExecutionTickResult {
  /**
   * The output World after all systems have been executed.
   */
  readonly world: World

  /**
   * The names of systems that were executed during this tick,
   * in execution order.
   */
  readonly executedSystems: readonly string[]

  /**
   * The total number of systems executed during this tick.
   */
  readonly systemCount: number

  /** Ephemeral, immutable gameplay facts emitted during this tick. */
  readonly gameplayEvents?: readonly GameplayEvent[]

  /** Rule results produced after the Runtime systems finalized their facts. */
  readonly gameplayRuleResults?: readonly GameplayRuleExecutionResult[]

  /** Committed Runtime truth for the current world/session gameplay state. */
  readonly gameplaySessionState?: RuntimeGameplaySessionState
}
