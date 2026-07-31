import type { SemanticContext } from '../semantic/SemanticContext'
import type { PromptStrategy } from './PromptStrategy'

/**
 * StrategyEvaluator — scores a strategy against a semantic context.
 *
 * Produces a numeric score (0–100) indicating how well a given strategy
 * matches the current semantic context. This is the foundation for
 * future AI-based dynamic strategy routing.
 *
 * The current default implementation (DefaultStrategyEvaluator) is
 * deterministic and rule-based, preserving existing selection behavior:
 * - applies() = true  → score 100
 * - applies() = false → score 0
 *
 * Future: AI-based evaluators may use embeddings, LLM calls, or
 * learned models to produce more nuanced scores.
 *
 * Design principles:
 * - Pure: same inputs always produce same score
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - No side effects: does not modify strategy or context
 * - Independent: no dependencies on Planner, Runtime, Provider, or Pipeline
 */
export interface StrategyEvaluator {
  /**
   * Evaluate how well a strategy matches the given semantic context.
   *
   * @param strategy — The strategy to evaluate
   * @param context — The semantic context to evaluate against
   * @returns A numeric score (0–100 convention)
   */
  evaluate(strategy: PromptStrategy, context: SemanticContext): number
}
