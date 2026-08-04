import type { PromptInspector } from './PromptInspector'

/**
 * PromptInspectorExporter — exports a PromptInspector into an external
 * stable representation (e.g., JSON string) for consumption by tools
 * such as Prompt Debug Panel, Prompt Timeline, Prompt Diff Viewer,
 * and Strategy Inspector.
 *
 * Design principles:
 * - Pure: same inspector always produces same output
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - Immutable: never modifies the input inspector
 * - Zero dependencies on Planner, Runtime, Provider, Memory, AgentLoop, or Pipeline
 */
export interface PromptInspectorExporter {
  export(inspector: PromptInspector): string
}