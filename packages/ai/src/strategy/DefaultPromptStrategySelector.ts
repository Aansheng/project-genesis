import type { PromptStrategy } from './PromptStrategy'
import type { PromptStrategySelector } from './PromptStrategySelector'
import type { SemanticContext } from '../semantic/SemanticContext'
import { DefaultPromptStrategy } from './DefaultPromptStrategy'

/**
 * DefaultPromptStrategySelector — default implementation of
 * PromptStrategySelector.
 *
 * Implements first-match-wins selection:
 * 1. Iterates strategies in order
 * 2. Returns the first strategy whose applies() returns true
 * 3. Falls back to DefaultPromptStrategy if no strategy matches
 *
 * Pure, stateless, deterministic — no side effects, no state.
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

  select(
    strategies: readonly PromptStrategy[],
    context: SemanticContext,
  ): PromptStrategy {
    for (const strategy of strategies) {
      if (strategy.applies(context)) {
        return strategy
      }
    }
    return this.defaultStrategy
  }
}