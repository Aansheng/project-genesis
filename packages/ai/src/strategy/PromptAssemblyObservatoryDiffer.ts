import type { PromptAssemblyObservatory } from './PromptAssemblyObservatory'
import type { PromptAssemblyObservatoryDiff } from './PromptAssemblyObservatoryDiff'

/**
 * PromptAssemblyObservatoryDiffer — compares two PromptAssemblyObservatory
 * instances.
 *
 * Produces a structured diff showing which observatory fields were added,
 * removed, or changed between two observatories. This enables inspection
 * of how the full observatory state evolved between builds without coupling
 * to the builder or any downstream consumers.
 *
 * The diff operates on six named fields: trace, timeline, history,
 * traceSnapshot, timelineSnapshot, and historySnapshot.
 *
 * Design principles:
 * - Pure: same before/after always produces same diff
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - No side effects: does not modify either observatory
 * - Independent: no dependencies on Planner, Runtime, Provider, or Pipeline
 */
export interface PromptAssemblyObservatoryDiffer {
  /**
   * Diff two PromptAssemblyObservatory instances.
   *
   * @param before — The observatory before the change (or baseline)
   * @param after — The observatory after the change (or comparison)
   * @returns A PromptAssemblyObservatoryDiff describing the field-level changes
   */
  diff(
    before: PromptAssemblyObservatory,
    after: PromptAssemblyObservatory,
  ): PromptAssemblyObservatoryDiff
}