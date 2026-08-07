import type { PromptAssemblyObservatory } from './PromptAssemblyObservatory'
import type { PromptAssemblyObservatorySnapshot } from './PromptAssemblyObservatorySnapshot'

/**
 * PromptAssemblyObservatorySnapshotBuilder — builds a condensed
 * PromptAssemblyObservatorySnapshot from a full PromptAssemblyObservatory
 * and optional metadata.
 *
 * Enables downstream consumers to obtain a lightweight summary of the
 * observatory without traversing the full artifact structure.
 *
 * Design principles:
 * - Pure: same observatory + metadata always produces same snapshot
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - No side effects: does not modify the observatory or metadata
 * - Independent: no dependencies on Planner, Runtime, Provider, or Pipeline
 */
export interface PromptAssemblyObservatorySnapshotBuilder {
  /**
   * Build a PromptAssemblyObservatorySnapshot from an observatory and optional metadata.
   *
   * @param observatory — The observatory to summarize
   * @param metadata — Optional metadata containing rendered/exported values
   * @returns A condensed snapshot of the observatory
   */
  build(
    observatory: PromptAssemblyObservatory,
    metadata?: Record<string, unknown>,
  ): PromptAssemblyObservatorySnapshot
}