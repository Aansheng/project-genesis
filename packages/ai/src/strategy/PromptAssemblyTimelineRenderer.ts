import type { PromptAssemblyTimeline } from './PromptAssemblyTimeline'

/**
 * PromptAssemblyTimelineRenderer — renders a PromptAssemblyTimeline as
 * human-readable text.
 *
 * Converts the structured timeline model into a formatted string
 * suitable for logging, debugging, observability, and diagnostics.
 *
 * Design principles:
 * - Pure: same timeline always produces same string
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - No side effects: does not modify the timeline
 * - Independent: no dependencies on Planner, Runtime, Provider, or Pipeline
 */
export interface PromptAssemblyTimelineRenderer {
  /**
   * Render a PromptAssemblyTimeline as a human-readable string.
   *
   * @param timeline — The timeline to render
   * @returns A formatted string representation of the timeline
   */
  render(timeline: PromptAssemblyTimeline): string
}