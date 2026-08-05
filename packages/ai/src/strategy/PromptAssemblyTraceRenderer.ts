import type { PromptAssemblyTrace } from './PromptAssemblyTrace'

/**
 * PromptAssemblyTraceRenderer — renders a PromptAssemblyTrace as
 * human-readable text.
 *
 * Converts the structured trace domain model into a formatted string
 * suitable for logging, debugging, observability, and diagnostics.
 *
 * Design principles:
 * - Pure: same trace always produces same string
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - No side effects: does not modify the trace
 * - Independent: no dependencies on Planner, Runtime, Provider, or Pipeline
 */
export interface PromptAssemblyTraceRenderer {
  /**
   * Render a PromptAssemblyTrace as a human-readable string.
   *
   * @param trace — The trace to render
   * @returns A formatted string representation of the trace
   */
  render(trace: PromptAssemblyTrace): string
}