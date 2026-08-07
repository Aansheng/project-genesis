import type { PromptAssemblyObservatory } from './PromptAssemblyObservatory'
import type { PromptAssemblyObservatoryExporter } from './PromptAssemblyObservatoryExporter'

/**
 * DefaultPromptAssemblyObservatoryExporter — default implementation of
 * PromptAssemblyObservatoryExporter.
 *
 * Exports a PromptAssemblyObservatory as a pretty-printed JSON string with
 * 2-space indentation, preserving the full observatory structure exactly.
 *
 * Properties:
 * - Pure: same observatory always produces same JSON string
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - Immutable: never modifies the input observatory
 * - Zero dependencies on Planner, Runtime, Provider, Memory, AgentLoop, or Pipeline
 * - Output is identical to JSON.stringify(observatory, null, 2)
 *
 * Foundation only — not consumed by PromptBuilder yet.
 */
export class DefaultPromptAssemblyObservatoryExporter implements PromptAssemblyObservatoryExporter {
  export(
    observatory: PromptAssemblyObservatory,
  ): string {
    return JSON.stringify(
      observatory,
      null,
      2,
    )
  }
}