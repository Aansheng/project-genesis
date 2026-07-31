import type { PromptStrategy } from './PromptStrategy'

/**
 * StrategyCandidate — a strategy paired with its evaluation score.
 *
 * Represents a single candidate in the strategy selection process.
 * The `score` is a numeric value (0–100) indicating how well the
 * strategy matches the current semantic context.
 *
 * Higher scores indicate better matches. The score is produced by
 * a StrategyEvaluator and can be used for ranking or dynamic selection.
 *
 * Design principles:
 * - Immutable: all fields are readonly
 * - Pure data: no methods, no behavior
 * - Independent: no dependencies on Planner, Runtime, Provider, or Pipeline
 *
 * Future: AI-based evaluators may produce fractional or probabilistic scores.
 * The 0–100 range is a convention, not enforced by the type system.
 */
export interface StrategyCandidate {
  /** The strategy being evaluated */
  readonly strategy: PromptStrategy
  /** Evaluation score (0–100 convention) */
  readonly score: number
}
