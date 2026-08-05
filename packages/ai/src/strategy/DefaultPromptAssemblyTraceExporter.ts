import type { PromptAssemblyTrace } from './PromptAssemblyTrace'
import type { PromptAssemblyTraceExporter } from './PromptAssemblyTraceExporter'

/**
 * DefaultPromptAssemblyTraceExporter — default implementation of
 * PromptAssemblyTraceExporter.
 *
 * Exports a PromptAssemblyTrace as a pretty-printed JSON string with
 * 2-space indentation, preserving the full trace structure exactly.
 *
 * Output format:
 * ```json
 * {
 *   "strategy": {
 *     "name": "create"
 *   },
 *   "strategySelection": {
 *     "selected": "create",
 *     "candidates": []
 *   },
 *   ...
 * }
 * ```
 *
 * Properties:
 * - Pure: same trace always produces same JSON string
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - Immutable: never modifies the input trace
 * - Zero dependencies on Planner, Runtime, Provider, Memory, AgentLoop, or Pipeline
 * - Output is identical to JSON.stringify(trace, null, 2)
 *
 * Foundation only — not consumed by PromptBuilder yet.
 */
export class DefaultPromptAssemblyTraceExporter implements PromptAssemblyTraceExporter {
  export(trace: PromptAssemblyTrace): string {
    return JSON.stringify(trace, null, 2)
  }
}