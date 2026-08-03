import type { StrategyEvaluator } from './StrategyEvaluator'
import type { PromptStrategy } from './PromptStrategy'
import type { SemanticContext } from '../semantic/SemanticContext'
import type { IntentType } from '../intent/IntentType'

/**
 * WeightedStrategyEvaluator — continuous scoring strategy evaluator.
 *
 * Unlike the binary DefaultStrategyEvaluator (100/0), this evaluator
 * produces weighted scores that reflect how relevant each strategy is
 * for a given intent, even for non-primary strategies.
 *
 * Scoring matrix (V1 — architecture validation):
 *
 * | Intent  | Create | Query | Modify | Delete |
 * |---------|--------|-------|--------|--------|
 * | Create  | 100    | 20    | 10     | 0      |
 * | Query   | 20     | 100   | 10     | 0      |
 * | Modify  | 10     | 10    | 100    | 20     |
 * | Delete  | 0      | 0     | 20     | 100    |
 * | Unknown | 0      | 0     | 0      | 0      |
 *
 * Design principles:
 * - Pure: same inputs always produce same score
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - No side effects: does not modify strategy or context
 * - Independent: no dependencies on Planner, Runtime, Provider, or Pipeline
 *
 * Future: AI-based evaluators may replace this with learned scores.
 */
export class WeightedStrategyEvaluator implements StrategyEvaluator {
  evaluate(strategy: PromptStrategy, context: SemanticContext): number {
    const intent = this.resolveIntent(context)
    return this.lookupScore(intent, strategy.name)
  }

  private resolveIntent(context: SemanticContext): IntentType | undefined {
    return context.intent?.intents[0]?.type
  }

  private lookupScore(intent: IntentType | undefined, strategyName: string): number {
    if (intent === undefined) return 0
    const weights = SCORE_TABLE[intent]
    if (weights === undefined) return 0
    return weights[strategyName] ?? 0
  }
}

/**
 * Score table — maps IntentType → { strategyName → score }.
 *
 * Readonly for safety — the evaluation function reads from this table
 * without modification.
 */
const SCORE_TABLE: Readonly<Record<string, Readonly<Record<string, number>>>> = {
  Create:  { create: 100, query: 20, modify: 10, delete: 0 },
  Query:   { create: 20,  query: 100, modify: 10, delete: 0 },
  Modify:  { create: 10,  query: 10, modify: 100, delete: 20 },
  Delete:  { create: 0,   query: 0,  modify: 20,  delete: 100 },
  Move:    { create: 10,  query: 10, modify: 100, delete: 20 },
}
