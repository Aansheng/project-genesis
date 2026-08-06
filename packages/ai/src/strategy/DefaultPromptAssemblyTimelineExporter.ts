import type { PromptAssemblyTimeline } from './PromptAssemblyTimeline'
import type { PromptAssemblyTimelineExporter } from './PromptAssemblyTimelineExporter'

/**
 * DefaultPromptAssemblyTimelineExporter — default implementation of
 * PromptAssemblyTimelineExporter.
 *
 * Exports a PromptAssemblyTimeline as a pretty-printed JSON string with
 * 2-space indentation, preserving the full timeline structure exactly.
 *
 * Output format:
 * ```json
 * {
 *   "entries": [
 *     {
 *       "index": 0,
 *       "trace": {
 *         "strategy": {
 *           "name": "create"
 *         }
 *       }
 *     }
 *   ]
 * }
 * ```
 *
 * Properties:
 * - Pure: same timeline always produces same JSON string
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - Immutable: never modifies the input timeline
 * - Zero dependencies on Planner, Runtime, Provider, Memory, AgentLoop, or Pipeline
 * - Output is identical to JSON.stringify(timeline, null, 2)
 *
 * Foundation only — not consumed by PromptBuilder yet.
 */
export class DefaultPromptAssemblyTimelineExporter
  implements PromptAssemblyTimelineExporter {

  export(
    timeline: PromptAssemblyTimeline
  ): string {
    return JSON.stringify(
      timeline,
      null,
      2,
    )
  }
}