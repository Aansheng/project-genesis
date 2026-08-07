import type { PromptAssemblyObservatory } from './PromptAssemblyObservatory'

/**
 * PromptAssemblyObservatoryRenderer — renders a PromptAssemblyObservatory as
 * human-readable text.
 *
 * Converts the unified observatory structure into a formatted string suitable
 * for logging, debugging, and diagnostics. The output lists which observability
 * artifacts are present in the observatory.
 *
 * Design principles:
 * - Pure: same observatory always produces same string
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - No side effects: does not modify the observatory
 * - Independent: no dependencies on Planner, Runtime, Provider, or Pipeline
 */
export interface PromptAssemblyObservatoryRenderer {
  /**
   * Render a PromptAssemblyObservatory as a human-readable string.
   *
   * @param observatory — The observatory to render
   * @returns A formatted string representation of the observatory
   */
  render(observatory: PromptAssemblyObservatory): string
}