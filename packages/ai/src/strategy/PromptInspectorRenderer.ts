import type { PromptInspector } from './PromptInspector'

/**
 * PromptInspectorRenderer — renders a PromptInspector into a human-readable
 * string report.
 *
 * The renderer can produce different output formats depending on context.
 * The default implementation produces a plain-text report:
 *
 * ```
 * Prompt Inspector
 *
 * Strategy:
 * create
 *
 * Sections:
 *
 * - Rendered Strategy
 * - Strategy Selection
 * - Strategy Module
 * - Prompt Plan
 * - Optimized Plan
 * - Plan Diff
 * - Rendered Plan
 * ```
 *
 * Design principles:
 * - Pure: same inspector always produces same string
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - Immutable: never modifies the input inspector
 * - Zero dependencies on Planner, Runtime, Provider, Memory, AgentLoop, or Pipeline
 */
export interface PromptInspectorRenderer {
  render(inspector: PromptInspector): string
}