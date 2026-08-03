import type { PromptAssemblyStrategy } from './PromptAssemblyStrategy'

/**
 * CreatePromptAssemblyStrategy — create-specific implementation of
 * PromptAssemblyStrategy.
 *
 * Currently behaves as an identity transformation: returns the input
 * sections unchanged. This preserves the current behavior where all
 * strategies produce the same prompt structure.
 *
 * Future work orders will introduce actual prompt assembly
 * optimization for create-oriented requests (e.g., reordering
 * sections to prioritize system instructions, or filtering
 * irrelevant context).
 *
 * Properties:
 * - Pure: same sections always produce same result
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - Immutable: never modifies input sections
 * - Zero dependencies on Planner, Runtime, Provider, Memory, AgentLoop, or Pipeline
 *
 * Foundation only — no prompt behavior changes.
 */
export class CreatePromptAssemblyStrategy implements PromptAssemblyStrategy {
  readonly strategyName = 'create'

  apply(sections: readonly string[]): readonly string[] {
    return sections
  }
}