import type { PromptAssemblyTrace } from './PromptAssemblyTrace'
import type { PromptAssemblyTimeline } from './PromptAssemblyTimeline'
import type { PromptAssemblyHistory } from './PromptAssemblyHistory'
import type { PromptAssemblySnapshot } from './PromptAssemblySnapshot'
import type { PromptAssemblyTimelineSnapshot } from './PromptAssemblyTimelineSnapshot'
import type { PromptAssemblyHistorySnapshot } from './PromptAssemblyHistorySnapshot'

/**
 * PromptAssemblyObservatory — unified container for all Prompt Assembly
 * observability data.
 *
 * Aggregates all observability artifacts (trace, timeline, history, and their
 * snapshot representations) into a single, well-defined structure. This enables
 * downstream consumers (observers, loggers, debug UIs) to access the full
 * observable state of prompt assembly in one place.
 *
 * Design principles:
 * - Immutable: all fields are readonly
 * - Pure data: no methods, no behavior
 * - Independent: no dependencies on Planner, Runtime, Provider, or Pipeline
 * - Extensible: future fields can be added without breaking changes
 */
export interface PromptAssemblyObservatory {
  /**
   * The PromptAssemblyTrace capturing the current build's diagnostic data.
   */
  readonly trace?: PromptAssemblyTrace

  /**
   * The PromptAssemblyTimeline capturing all trace entries across builds.
   */
  readonly timeline?: PromptAssemblyTimeline

  /**
   * The PromptAssemblyHistory capturing the full history across builds.
   */
  readonly history?: PromptAssemblyHistory

  /**
   * The PromptAssemblySnapshot (trace-level snapshot) of the current build.
   */
  readonly traceSnapshot?: PromptAssemblySnapshot

  /**
   * The PromptAssemblyTimelineSnapshot (condensed timeline summary).
   */
  readonly timelineSnapshot?: PromptAssemblyTimelineSnapshot

  /**
   * The PromptAssemblyHistorySnapshot (condensed history summary).
   */
  readonly historySnapshot?: PromptAssemblyHistorySnapshot
}