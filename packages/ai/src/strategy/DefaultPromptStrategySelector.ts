import type { PromptStrategy } from './PromptStrategy'
import type { PromptStrategySelector } from './PromptStrategySelector'
import type { SemanticContext } from '../semantic/SemanticContext'
import type { StrategyEvaluator } from './StrategyEvaluator'
import type { StrategyCandidate } from './StrategyCandidate'
import { DefaultPromptStrategy } from './DefaultPromptStrategy'
import { DefaultStrategyEvaluator } from './DefaultStrategyEvaluator'

/**
 * DefaultPromptStrategySelector — default implementation of
 * PromptStrategySelector.
 *
 * Implements highest-score-wins selection:
 * 1. Evaluates ALL strategies using a StrategyEvaluator
 * 2. Collects StrategyCandidate entries with scores
 * 3. Selects the candidate with the highest score
 * 4. Ties are broken by array order (first occurrence wins)
 * 5. Falls back to DefaultPromptStrategy if no candidate scores > 0
 *
 * With the default evaluator (DefaultStrategyEvaluator), this produces
 * identical results to the previous first-match-wins implementation:
 * - applies() = true  → score 100
 * - applies() = false → score 0
 * - First strategy with score > 0 wins (same as first-applies-true)
 *
 * The scoring architecture enables future AI-based evaluators that produce
 * nuanced scores (e.g., 0–100 with fractional confidence) without changing
 * the selector logic.
 *
 * Properties:
 * - Pure function: same inputs always produce same output
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - Immutable: never modifies input arrays or strategies
 * - Complete: always returns a strategy (never null, never undefined)
 * - Zero dependencies on Planner, Runtime, Provider, Memory, or any other component
 */
export class DefaultPromptStrategySelector implements PromptStrategySelector {
  private readonly defaultStrategy = new DefaultPromptStrategy()
  private readonly evaluator: StrategyEvaluator

  constructor(evaluator: StrategyEvaluator = new DefaultStrategyEvaluator()) {
    this.evaluator = evaluator
  }

  select(
    strategies: readonly PromptStrategy[],
    context: SemanticContext,
  ): PromptStrategy {
    if (strategies.length === 0) {
      return this.defaultStrategy
    }

    const candidates: StrategyCandidate[] = []
    for (const strategy of strategies) {
      const score = this.evaluator.evaluate(strategy, context)
      candidates.push({ strategy, score })
    }

    // Find candidate with highest score; ties broken by array order (first wins)
    let bestCandidate: StrategyCandidate | undefined
    for (const candidate of candidates) {
      if (bestCandidate === undefined || candidate.score > bestCandidate.score) {
        bestCandidate = candidate
      }
    }

    // If best score is 0 (no strategy applies), fall back to default
    if (bestCandidate === undefined || bestCandidate.score === 0) {
      return this.defaultStrategy
    }

    return bestCandidate.strategy
  }
}
