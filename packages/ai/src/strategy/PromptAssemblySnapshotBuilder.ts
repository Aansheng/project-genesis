import type { PromptAssemblySnapshot } from './PromptAssemblySnapshot'

/**
 * PromptAssemblySnapshotBuilder — builds a PromptAssemblySnapshot from raw metadata.
 *
 * Reads known promptAssembly metadata fields (strategy, strategySelection,
 * strategyRendered, strategyModule, strategyModuleRendered, plan, optimizedPlan,
 * planDiff, planRendered) and produces a structured snapshot.
 *
 * Unknown metadata fields are silently ignored — the builder only processes
 * fields it explicitly recognizes. This ensures forward compatibility when
 * new metadata fields are added.
 *
 * Design principles:
 * - Pure: same metadata always produces same snapshot
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - No side effects: does not modify the metadata
 * - Independent: no dependencies on Planner, Runtime, Provider, or Pipeline
 */
export interface PromptAssemblySnapshotBuilder {
  /**
   * Build a PromptAssemblySnapshot from raw promptAssembly metadata.
   *
   * @param metadata — The full promptAssembly metadata object
   * @returns A PromptAssemblySnapshot with only the recognized fields
   */
  build(metadata: Record<string, unknown>): PromptAssemblySnapshot
}