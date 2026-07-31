import type { PromptStrategy } from './PromptStrategy'
import type { StrategyCandidate } from './StrategyCandidate'

/**
 * StrategySelectionResult — the outcome of a strategy selection process.
 *
 * Contains the selected strategy and the full list of evaluated candidates
 * with their scores. This enables downstream consumers to inspect the
 * selection reasoning and potentially override or refine the choice.
 *
 * Design principles:
 * - Immutable: all fields are readonly
 * - Pure data: no methods, no behavior
 * - Transparent: exposes all candidates, not just the winner
 * - Independent: no dependencies on Planner, Runtime, Provider, or Pipeline
 *
 * Future: AI-based selection may add confidence, reasoning, or alternative
 * strategies to this result.
 */
export interface StrategySelectionResult {
  /** The strategy that was selected */
  readonly selected: PromptStrategy
  /** All evaluated candidates with their scores */
  readonly candidates: readonly StrategyCandidate[]
}
