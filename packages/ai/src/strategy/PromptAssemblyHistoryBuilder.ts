import type { PromptAssemblyTrace } from './PromptAssemblyTrace'
import type { PromptAssemblyHistory } from './PromptAssemblyHistory'

/**
 * PromptAssemblyHistoryBuilder — builds a PromptAssemblyHistory from an
 * ordered list of PromptAssemblyTrace objects.
 *
 * Enables downstream consumers to construct a sequential history of prompt
 * assembly builds from an array of trace objects.
 *
 * Design principles:
 * - Pure: same traces always produces same history
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - No side effects: does not modify the input traces
 * - Independent: no dependencies on Planner, Runtime, Provider, or Pipeline
 */
export interface PromptAssemblyHistoryBuilder {
  /**
   * Build a PromptAssemblyHistory from an ordered list of traces.
   *
   * @param traces — Ordered list of traces (index 0 = first build)
   * @returns A PromptAssemblyHistory with indexed entries
   */
  build(
    traces: readonly PromptAssemblyTrace[],
  ): PromptAssemblyHistory
}