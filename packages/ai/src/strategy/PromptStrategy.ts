import type { SemanticContext } from '../semantic/SemanticContext'

/**
 * PromptStrategy — determines how prompts should be assembled
 * for different semantic contexts.
 *
 * Each strategy encapsulates a named strategy for prompt assembly,
 * with a predicate (`applies()`) that determines when this strategy
 * should be active.
 *
 * Design principles:
 * - Pure interface: no methods beyond the contract
 * - Stateless: no internal state between calls
 * - Deterministic: same context always produces same result
 * - No side effects: does not modify context or external state
 * - No dependencies on Planner, Runtime, Provider, Memory, AgentLoop, or Pipeline
 *
 * @property name — Unique human-readable strategy name
 */
export interface PromptStrategy {
  /** Unique human-readable strategy name */
  readonly name: string

  /**
   * Determines whether this strategy applies to the given semantic context.
   *
   * Pure predicate — no side effects, no modifications to context.
   * Same context always returns same boolean.
   *
   * @param context — The SemanticContext to evaluate
   * @returns true if this strategy should be used for the given context
   */
  applies(context: SemanticContext): boolean
}