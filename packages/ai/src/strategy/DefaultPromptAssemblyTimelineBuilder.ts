import type { PromptAssemblyTrace } from './PromptAssemblyTrace'
import type { PromptAssemblyTimeline } from './PromptAssemblyTimeline'
import type { PromptAssemblyTimelineBuilder } from './PromptAssemblyTimelineBuilder'

/**
 * DefaultPromptAssemblyTimelineBuilder — default implementation.
 *
 * Maps each trace to a timeline entry with a zero-based index.
 * Preserves insertion order — no sorting, no filtering, no deduplication.
 *
 * Design principles:
 * - Pure: same traces always produce same timeline
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - No side effects: does not modify the input traces
 * - Immutable: all fields on the result are readonly
 * - Independent: no dependencies on Planner, Runtime, Provider, or Pipeline
 */
export class DefaultPromptAssemblyTimelineBuilder
  implements PromptAssemblyTimelineBuilder
{
  /**
   * Build a PromptAssemblyTimeline from an ordered list of traces.
   *
   * @param traces — Ordered array of PromptAssemblyTrace instances
   * @returns A PromptAssemblyTimeline with indexed entries
   */
  build(traces: readonly PromptAssemblyTrace[]): PromptAssemblyTimeline {
    const entries = traces.map(
      (trace, index) =>
        Object.freeze({
          index,
          trace,
        })
    )
    return Object.freeze({ entries: Object.freeze(entries) })
  }
}