import type { PromptAssemblyTrace } from './PromptAssemblyTrace'
import type { PromptAssemblyTimeline } from './PromptAssemblyTimeline'
import type { PromptAssemblyHistory } from './PromptAssemblyHistory'
import type { PromptAssemblySnapshot } from './PromptAssemblySnapshot'
import type { PromptAssemblyTimelineSnapshot } from './PromptAssemblyTimelineSnapshot'
import type { PromptAssemblyHistorySnapshot } from './PromptAssemblyHistorySnapshot'
import type { PromptAssemblyObservatory } from './PromptAssemblyObservatory'

/**
 * PromptAssemblyObservatoryBuilder — builds a PromptAssemblyObservatory from
 * individual observability components.
 *
 * Enables downstream consumers to construct a unified observability container
 * by passing in individual artifacts (trace, timeline, history, snapshots).
 *
 * Design principles:
 * - Pure: same inputs always produce same observatory
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - No side effects: does not modify the input objects
 * - Independent: no dependencies on Planner, Runtime, Provider, or Pipeline
 */
export interface PromptAssemblyObservatoryBuilder {
  /**
   * Build a PromptAssemblyObservatory from individual observability components.
   *
   * @param input — Object containing optional trace, timeline, history, and snapshot artifacts
   * @returns A unified observatory containing all provided artifacts
   */
  build(
    input: {
      trace?: PromptAssemblyTrace
      timeline?: PromptAssemblyTimeline
      history?: PromptAssemblyHistory
      traceSnapshot?: PromptAssemblySnapshot
      timelineSnapshot?: PromptAssemblyTimelineSnapshot
      historySnapshot?: PromptAssemblyHistorySnapshot
    },
  ): PromptAssemblyObservatory
}