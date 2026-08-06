import type { PromptAssemblyHistory } from './PromptAssemblyHistory'
import type { PromptAssemblyHistoryDiff } from './PromptAssemblyHistoryDiff'

/**
 * PromptAssemblyHistoryDiffer — compares two PromptAssemblyHistory instances.
 *
 * Produces a structured diff showing which history entry indexes were added,
 * removed, or changed between two histories. This enables inspection of how
 * the history evolved between builds without coupling to the builder or any
 * downstream consumers.
 *
 * Design principles:
 * - Pure: same before/after always produces same diff
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - No side effects: does not modify either history
 * - Independent: no dependencies on Planner, Runtime, Provider, or Pipeline
 */
export interface PromptAssemblyHistoryDiffer {
  /**
   * Diff two PromptAssemblyHistory instances.
   *
   * @param before — The history before the change (or baseline)
   * @param after — The history after the change (or comparison)
   * @returns A PromptAssemblyHistoryDiff describing the index-level changes
   */
  diff(
    before: PromptAssemblyHistory,
    after: PromptAssemblyHistory,
  ): PromptAssemblyHistoryDiff
}