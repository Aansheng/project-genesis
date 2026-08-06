import type { PromptAssemblyTimeline } from './PromptAssemblyTimeline'

/**
 * PromptAssemblyTimelineExporter — exports a PromptAssemblyTimeline as a
 * serialized string representation.
 *
 * Enables downstream consumers (loggers, debug UIs, storage, network)
 * to obtain a portable, stable external representation of the full
 * prompt assembly timeline.
 *
 * Design principles:
 * - Pure: same timeline always produces same string
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - No side effects: does not modify the timeline
 * - Independent: no dependencies on Planner, Runtime, Provider, or Pipeline
 */
export interface PromptAssemblyTimelineExporter {
  /**
   * Export a PromptAssemblyTimeline as a serialized string.
   *
   * @param timeline — The timeline to export
   * @returns A stable external representation of the timeline
   */
  export(
    timeline: PromptAssemblyTimeline
  ): string
}