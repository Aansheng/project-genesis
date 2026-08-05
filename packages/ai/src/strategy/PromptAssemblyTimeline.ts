import type { PromptAssemblyTimelineEntry } from './PromptAssemblyTimelineEntry'

/**
 * PromptAssemblyTimeline — a timeline of PromptAssemblyTrace entries
 * across multiple builds.
 *
 * The timeline captures the sequential history of prompt assembly builds,
 * enabling downstream consumers (observers, loggers, debug UIs) to inspect
 * how the assembly evolved over time.
 *
 * Design principles:
 * - Immutable: all fields are readonly
 * - Pure data: no methods, no behavior
 * - Independent: no dependencies on Planner, Runtime, Provider, or Pipeline
 * - Extensible: future fields can be added without breaking changes
 */
export interface PromptAssemblyTimeline {
  /**
   * Ordered list of timeline entries.
   * Entries are in build order (index 0 = first build).
   */
  readonly entries: readonly PromptAssemblyTimelineEntry[]
}