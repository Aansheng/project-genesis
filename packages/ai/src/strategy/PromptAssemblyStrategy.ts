/**
 * PromptAssemblyStrategy — allows different strategies to influence
 * how prompt sections are assembled into the final prompt.
 *
 * Current architecture supports PromptStrategy, StrategyEvaluator,
 * StrategyModule, and StrategyModuleRenderer, but all strategies
 * produce the same prompt structure. This interface introduces an
 * abstraction layer that allows different strategies to influence
 * prompt assembly in future work orders.
 *
 * The `apply()` method receives the ordered list of prompt sections
 * and returns a (potentially reordered, filtered, or augmented) list
 * of sections. The default implementation is a no-op (identity).
 *
 * Design principles:
 * - Pure interface: no methods beyond the contract
 * - Stateless: no internal state between calls
 * - Deterministic: same sections always produce same result
 * - No side effects: does not modify input sections or external state
 * - No dependencies on Planner, Runtime, Provider, Memory, AgentLoop, or Pipeline
 *
 * @property strategyName — Unique human-readable strategy name
 */
export interface PromptAssemblyStrategy {
  /** Unique human-readable strategy name */
  readonly strategyName: string

  /**
   * Apply this assembly strategy to the given prompt sections.
   *
   * Receives an ordered list of prompt section strings and returns
   * a (potentially reordered, filtered, or augmented) list of
   * section strings. The default implementation returns the input
   * unchanged (identity function).
   *
   * Pure — no side effects, no modifications to input array.
   * Same sections always produce same result.
   *
   * @param sections — The ordered prompt section strings
   * @returns The assembled prompt section strings
   */
  apply(
    sections: readonly string[]
  ): readonly string[]
}
