import type { PromptAssemblyHistory } from './PromptAssemblyHistory'
import type { PromptAssemblyHistorySnapshot } from './PromptAssemblyHistorySnapshot'

/**
 * PromptAssemblyHistorySnapshotBuilder — builds a condensed
 * PromptAssemblyHistorySnapshot from a full PromptAssemblyHistory
 * and optional metadata.
 *
 * Enables downstream consumers to obtain a lightweight summary of the
 * history without traversing the full entry structure.
 *
 * Design principles:
 * - Pure: same history + metadata always produces same snapshot
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - No side effects: does not modify the history or metadata
 * - Independent: no dependencies on Planner, Runtime, Provider, or Pipeline
 */
export interface PromptAssemblyHistorySnapshotBuilder {
  /**
   * Build a PromptAssemblyHistorySnapshot from a history and optional metadata.
   *
   * @param history — The history to summarize
   * @param metadata — Optional metadata containing rendered/exported values
   * @returns A condensed snapshot of the history
   */
  build(
    history: PromptAssemblyHistory,
    metadata?: Record<string, unknown>,
  ): PromptAssemblyHistorySnapshot
}