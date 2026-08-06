import type { PromptAssemblyHistory } from './PromptAssemblyHistory'

/**
 * PromptAssemblyHistoryExporter — exports a PromptAssemblyHistory as a
 * serialized string representation.
 *
 * Enables downstream consumers (loggers, debug UIs, storage, network)
 * to obtain a portable, stable external representation of the full
 * prompt assembly history.
 *
 * Design principles:
 * - Pure: same history always produces same string
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - No side effects: does not modify the history
 * - Independent: no dependencies on Planner, Runtime, Provider, or Pipeline
 */
export interface PromptAssemblyHistoryExporter {
  /**
   * Export a PromptAssemblyHistory as a serialized string.
   *
   * @param history — The history to export
   * @returns A stable external representation of the history
   */
  export(
    history: PromptAssemblyHistory,
  ): string
}