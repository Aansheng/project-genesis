import type { PromptAssemblyHistory } from './PromptAssemblyHistory'

/**
 * PromptAssemblyHistoryRenderer — renders a PromptAssemblyHistory as
 * human-readable text.
 *
 * Converts the sequential history of prompt assembly builds into a
 * formatted string suitable for logging, debugging, and observability.
 *
 * Design principles:
 * - Pure: same history always produces same string
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - No side effects: does not modify the history
 * - Independent: no dependencies on Planner, Runtime, Provider, or Pipeline
 */
export interface PromptAssemblyHistoryRenderer {
  /**
   * Render a PromptAssemblyHistory as a human-readable string.
   *
   * @param history — The history to render
   * @returns A formatted string representation of the history
   */
  render(history: PromptAssemblyHistory): string
}