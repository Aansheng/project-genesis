import type { SemanticContext } from './SemanticContext'

/**
 * SemanticContextRenderer — interface for converting SemanticContext into a
 * formatted string representation.
 *
 * The SemanticContextRenderer produces a human-readable string that combines
 * intent and entity information from the unified SemanticContext. This is the
 * Semantic equivalent of IntentRenderer and EntityRenderer.
 *
 * The rendered string is stored in metadata.promptAssembly.semanticRendered.
 * It is NOT injected into PromptContext or included in the final prompt.
 *
 * Design principles:
 * - Pure function: same input always produces same output
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - No dependencies on Planner, Runtime, Provider, Memory, ToolCalling, or AgentLoop
 * - No I/O, no LLM, no side effects
 *
 * @see DefaultSemanticContextRenderer — default implementation
 */
export interface SemanticContextRenderer {
  /**
   * Convert SemanticContext to a formatted string.
   *
   * @param context — the SemanticContext to render
   * @returns Formatted string representation. Empty string for empty context.
   */
  render(context: SemanticContext): string
}