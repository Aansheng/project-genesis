import type { PromptAssemblyHistory } from './PromptAssemblyHistory'
import type { PromptAssemblyHistoryExporter } from './PromptAssemblyHistoryExporter'

/**
 * DefaultPromptAssemblyHistoryExporter — default implementation of
 * PromptAssemblyHistoryExporter.
 *
 * Exports a PromptAssemblyHistory as a pretty-printed JSON string with
 * 2-space indentation, preserving the full history structure exactly.
 *
 * Properties:
 * - Pure: same history always produces same JSON string
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - Immutable: never modifies the input history
 * - Zero dependencies on Planner, Runtime, Provider, Memory, AgentLoop, or Pipeline
 * - Output is identical to JSON.stringify(history, null, 2)
 *
 * Foundation only — not consumed by PromptBuilder yet.
 */
export class DefaultPromptAssemblyHistoryExporter implements PromptAssemblyHistoryExporter {
  export(
    history: PromptAssemblyHistory,
  ): string {
    return JSON.stringify(
      history,
      null,
      2,
    )
  }
}