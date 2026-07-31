import type { StrategyEvaluator } from './StrategyEvaluator'
import type { PromptStrategy } from './PromptStrategy'
import type { SemanticContext } from '../semantic/SemanticContext'

/**
 * DefaultStrategyEvaluator — default implementation of StrategyEvaluator.
 *
 * Uses the strategy's `applies()` method as the sole scoring criterion:
 * - `applies(context) === true`  → score 100
 * - `applies(context) === false` → score 0
 *
 * This preserves exact parity with the current DefaultPromptStrategySelector
 * behavior, where the first matching strategy wins. The 100/0 scoring
 * ensures that candidates are ranked consistently with the existing
 * applies-based selection.
 *
 * Properties:
 * - Pure: same strategy + context always produces same score
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - Immutable: never modifies strategy or context
 * - Zero dependencies on Planner, Runtime, Provider, Memory, AgentLoop, or Pipeline
 *
 * Foundation only — not consumed by PromptBuilder yet.
 */
export class DefaultStrategyEvaluator implements StrategyEvaluator {
  evaluate(strategy: PromptStrategy, context: SemanticContext): number {
    return strategy.applies(context) ? 100 : 0
  }
}
