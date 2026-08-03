import type { PromptAssemblyStrategy } from './PromptAssemblyStrategy'

/**
 * DefaultPromptAssemblyStrategy — default implementation of PromptAssemblyStrategy.
 *
 * Returns the input sections unchanged (identity function).
 * This preserves the current behavior where all strategies produce
 * the same prompt structure.
 *
 * Properties:
 * - Pure: same sections always produce same result
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - Immutable: never modifies input sections
 * - Zero dependencies on Planner, Runtime, Provider, Memory, AgentLoop, or Pipeline
 *
 * Foundation only — not consumed by PromptBuilder yet.
 */
export class DefaultPromptAssemblyStrategy implements PromptAssemblyStrategy {
  readonly strategyName = 'default'

  apply(sections: readonly string[]): readonly string[] {
    return sections
  }
}
