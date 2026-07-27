import type { EntityResult } from './EntityResult'

/**
 * EntityRenderer — interface for converting EntityResult to a formatted string.
 *
 * The EntityRenderer is a pure rendering layer that converts entity analysis
 * results into a human-readable string format. It mirrors the architecture
 * established for IntentRenderer.
 *
 * Design principles:
 * - Pure function: same input always produces same output
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - No dependencies on Planner, Runtime, Provider, Memory, ToolCalling, or AgentLoop
 * - No I/O, no LLM, no side effects
 *
 * @see DefaultEntityRenderer — default implementation
 */
export interface EntityRenderer {
  /**
   * Convert EntityResult to a formatted string.
   *
   * @param entity — The entity analysis result to render
   * @returns Formatted string representation
   */
  render(entity: EntityResult): string
}