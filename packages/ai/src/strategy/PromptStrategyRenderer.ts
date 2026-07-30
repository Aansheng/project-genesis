import type { PromptStrategy } from './PromptStrategy'

/**
 * PromptStrategyRenderer — renders a PromptStrategy into a human-readable string.
 *
 * Converts the selected strategy into a formatted string representation
 * that can be stored in metadata for observability and debugging.
 *
 * Design principles:
 * - Pure function: same strategy always produces same string
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - No side effects: does not modify strategy or external state
 * - No dependencies on Planner, Runtime, Provider, Memory, AgentLoop, or Pipeline
 */
export interface PromptStrategyRenderer {
  /**
   * Renders a PromptStrategy into a human-readable string.
   *
   * Pure rendering — no side effects, no modifications to strategy.
   * Same strategy always returns same string.
   *
   * @param strategy — The PromptStrategy to render
   * @returns Formatted string representation of the strategy
   */
  render(strategy: PromptStrategy): string
}