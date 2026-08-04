import type { PromptAssemblyTrace } from './PromptAssemblyTrace'

/**
 * PromptAssemblyTraceBuilder — builds a PromptAssemblyTrace from raw metadata.
 *
 * Reads known promptAssembly metadata fields (strategy, strategySelection,
 * plan, optimizedPlan, planDiff, snapshot, inspector, inspectorRendered,
 * inspectorExported) and produces a structured trace.
 *
 * Unknown metadata fields are silently ignored — the builder only processes
 * fields it explicitly recognizes. This ensures forward compatibility when
 * new metadata fields are added.
 *
 * Design principles:
 * - Pure: same metadata always produces same trace
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - No side effects: does not modify the metadata
 * - Independent: no dependencies on Planner, Runtime, Provider, or Pipeline
 */
export interface PromptAssemblyTraceBuilder {
  /**
   * Build a PromptAssemblyTrace from raw promptAssembly metadata.
   *
   * @param metadata — The full promptAssembly metadata object
   * @returns A PromptAssemblyTrace with only the recognized fields
   */
  build(metadata: Record<string, unknown>): PromptAssemblyTrace
}