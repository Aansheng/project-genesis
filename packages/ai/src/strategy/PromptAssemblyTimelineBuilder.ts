import type { PromptAssemblyTrace } from './PromptAssemblyTrace'
import type { PromptAssemblyTimeline } from './PromptAssemblyTimeline'

/**
 * PromptAssemblyTimelineBuilder — builds a PromptAssemblyTimeline from
 * an ordered list of PromptAssemblyTrace instances.
 *
 * Each trace is mapped to a timeline entry with a zero-based index
 * representing build order. The builder preserves insertion order —
 * no sorting, no filtering, no deduplication.
 *
 * Design principles:
 * - Pure: same traces always produce same timeline
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - No side effects: does not modify the input traces
 * - Independent: no dependencies on Planner, Runtime, Provider, or Pipeline
 */
export interface PromptAssemblyTimelineBuilder {
  /**
   * Build a PromptAssemblyTimeline from an ordered list of traces.
   *
   * @param traces — Ordered array of PromptAssemblyTrace instances
   * @returns A PromptAssemblyTimeline with indexed entries
   */
  build(traces: readonly PromptAssemblyTrace[]): PromptAssemblyTimeline
}