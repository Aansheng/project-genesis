import type { PromptAssemblyTimeline } from './PromptAssemblyTimeline'
import type { PromptAssemblyTimelineSnapshot } from './PromptAssemblyTimelineSnapshot'

/**
 * PromptAssemblyTimelineSnapshotBuilder — builds a condensed
 * PromptAssemblyTimelineSnapshot from a full PromptAssemblyTimeline
 * and optional metadata.
 *
 * Enables downstream consumers to obtain a lightweight summary of the
 * timeline without traversing the full entry structure.
 *
 * Design principles:
 * - Pure: same timeline + metadata always produces same snapshot
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - No side effects: does not modify the timeline or metadata
 * - Independent: no dependencies on Planner, Runtime, Provider, or Pipeline
 */
export interface PromptAssemblyTimelineSnapshotBuilder {
  /**
   * Build a PromptAssemblyTimelineSnapshot from a timeline and optional metadata.
   *
   * @param timeline — The timeline to summarize
   * @param metadata — Optional metadata containing rendered/exported values
   * @returns A condensed snapshot of the timeline
   */
  build(
    timeline: PromptAssemblyTimeline,
    metadata?: Record<string, unknown>,
  ): PromptAssemblyTimelineSnapshot
}