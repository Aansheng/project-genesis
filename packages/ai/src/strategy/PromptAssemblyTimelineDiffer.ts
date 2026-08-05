import type { PromptAssemblyTimeline } from './PromptAssemblyTimeline'
import type { PromptAssemblyTimelineDiff } from './PromptAssemblyTimelineDiff'

/**
 * PromptAssemblyTimelineDiffer — compares two PromptAssemblyTimeline instances.
 *
 * Produces a structured diff showing which timeline entry indexes were added,
 * removed, or changed between two timelines. This enables inspection of how
 * the timeline evolved between builds without coupling to the builder or any
 * downstream consumers.
 *
 * Design principles:
 * - Pure: same before/after always produces same diff
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - No side effects: does not modify either timeline
 * - Independent: no dependencies on Planner, Runtime, Provider, or Pipeline
 */
export interface PromptAssemblyTimelineDiffer {
  /**
   * Diff two PromptAssemblyTimeline instances.
   *
   * @param before — The timeline before the change (or baseline)
   * @param after — The timeline after the change (or comparison)
   * @returns A PromptAssemblyTimelineDiff describing the index-level changes
   */
  diff(
    before: PromptAssemblyTimeline,
    after: PromptAssemblyTimeline,
  ): PromptAssemblyTimelineDiff
}