import type { PromptAssemblyObservatory } from './PromptAssemblyObservatory'

/**
 * PromptAssemblyObservatoryExporter — exports a PromptAssemblyObservatory as a
 * serialized string representation.
 *
 * Enables downstream consumers (loggers, debug UIs, storage, network)
 * to obtain a portable, stable external representation of the full
 * prompt assembly observatory.
 *
 * Design principles:
 * - Pure: same observatory always produces same string
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - No side effects: does not modify the observatory
 * - Independent: no dependencies on Planner, Runtime, Provider, or Pipeline
 */
export interface PromptAssemblyObservatoryExporter {
  /**
   * Export a PromptAssemblyObservatory as a serialized string.
   *
   * @param observatory — The observatory to export
   * @returns A stable external representation of the observatory
   */
  export(
    observatory: PromptAssemblyObservatory,
  ): string
}