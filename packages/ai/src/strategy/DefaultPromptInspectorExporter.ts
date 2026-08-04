import type { PromptInspector } from './PromptInspector'
import type { PromptInspectorExporter } from './PromptInspectorExporter'

/**
 * DefaultPromptInspectorExporter — default implementation of
 * PromptInspectorExporter.
 *
 * Exports a PromptInspector as a pretty-printed JSON string:
 *
 * ```json
 * {
 *   "strategy": "create",
 *   "sections": [
 *     {
 *       "title": "Rendered Strategy",
 *       "content": "Prompt Strategy:\n\n- create"
 *     }
 *   ]
 * }
 * ```
 *
 * Properties:
 * - Pure: same inspector always produces same JSON string
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - Immutable: never modifies the input inspector
 * - Zero dependencies on Planner, Runtime, Provider, Memory, AgentLoop, or Pipeline
 */
export class DefaultPromptInspectorExporter implements PromptInspectorExporter {
  export(inspector: PromptInspector): string {
    return JSON.stringify(inspector, null, 2)
  }
}