import type { PromptAssemblyTrace } from './PromptAssemblyTrace'

/**
 * PromptAssemblyTraceExporter — exports a PromptAssemblyTrace as a
 * serialized string representation.
 *
 * Enables downstream consumers (loggers, debug UIs, storage, network)
 * to obtain a portable, stable external representation of the full
 * prompt assembly trace.
 *
 * Design principles:
 * - Pure: same trace always produces same string
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - No side effects: does not modify the trace
 * - Independent: no dependencies on Planner, Runtime, Provider, or Pipeline
 */
export interface PromptAssemblyTraceExporter {
  /**
   * Export a PromptAssemblyTrace as a serialized string.
   *
   * @param trace — The trace to export
   * @returns A stable external representation of the trace
   */
  export(trace: PromptAssemblyTrace): string
}