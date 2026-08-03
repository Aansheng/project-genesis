import type { PromptAssemblyStrategyResolver } from './PromptAssemblyStrategyResolver'
import type { PromptAssemblyStrategy } from './PromptAssemblyStrategy'
import { DefaultPromptAssemblyStrategy } from './DefaultPromptAssemblyStrategy'

/**
 * DefaultPromptAssemblyStrategyResolver — default implementation of
 * PromptAssemblyStrategyResolver.
 *
 * Always returns a DefaultPromptAssemblyStrategy instance regardless
 * of the strategy name provided. This preserves current behavior where
 * all strategies produce the same prompt structure.
 *
 * Properties:
 * - Pure: same strategyName always produces same strategy type
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - Immutable: never modifies strategyName or external state
 * - Zero dependencies on Planner, Runtime, Provider, Memory, AgentLoop, or Pipeline
 *
 * Foundation only — not consumed by PromptBuilder yet.
 */
export class DefaultPromptAssemblyStrategyResolver implements PromptAssemblyStrategyResolver {
  resolve(_strategyName: string): PromptAssemblyStrategy {
    return new DefaultPromptAssemblyStrategy()
  }
}
