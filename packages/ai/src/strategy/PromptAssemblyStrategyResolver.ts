import type { PromptAssemblyStrategy } from './PromptAssemblyStrategy'

/**
 * PromptAssemblyStrategyResolver — resolves a strategy name to a
 * PromptAssemblyStrategy instance.
 *
 * This decouples the consumer from specific PromptAssemblyStrategy
 * implementations, enabling future strategies to be resolved by name
 * without the consumer knowing about concrete classes.
 *
 * Design principles:
 * - Pure interface: no methods beyond the contract
 * - Stateless: no internal state between calls
 * - Deterministic: same strategyName always produces same result
 * - No side effects: does not modify strategyName or external state
 * - No dependencies on Planner, Runtime, Provider, Memory, AgentLoop, or Pipeline
 */
export interface PromptAssemblyStrategyResolver {
  /**
   * Resolve a PromptAssemblyStrategy by its strategy name.
   *
   * Pure — no side effects, no modifications to strategyName.
   * Same strategyName always returns same strategy instance.
   *
   * @param strategyName — The name of the strategy to resolve
   * @returns The resolved PromptAssemblyStrategy
   */
  resolve(
    strategyName: string
  ): PromptAssemblyStrategy
}
