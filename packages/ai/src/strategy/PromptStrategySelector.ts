import type { PromptStrategy } from './PromptStrategy'
import type { SemanticContext } from '../semantic/SemanticContext'

/**
 * PromptStrategySelector — selects the appropriate PromptStrategy
 * for a given SemanticContext.
 *
 * Given an ordered list of strategies and a SemanticContext, returns
 * the strategy that should be used for prompt assembly.
 *
 * Design principles:
 * - Pure function contract: same inputs always produce same result
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - No side effects: does not modify context or strategy list
 * - No dependencies on Planner, Runtime, Provider, Memory, AgentLoop, or Pipeline
 */
export interface PromptStrategySelector {
  /**
   * Selects a PromptStrategy from the provided list based on the
   * given SemanticContext.
   *
   * Pure selection — no side effects, no modifications to inputs.
   *
   * @param strategies — Ordered list of strategies to evaluate (readonly)
   * @param context — The SemanticContext to evaluate
   * @returns The selected PromptStrategy (never null, never undefined)
   */
  select(
    strategies: readonly PromptStrategy[],
    context: SemanticContext,
  ): PromptStrategy
}