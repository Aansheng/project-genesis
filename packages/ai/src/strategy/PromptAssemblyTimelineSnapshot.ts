/**
 * PromptAssemblyTimelineSnapshot — a condensed summary of a
 * PromptAssemblyTimeline.
 *
 * Captures key metadata about the timeline: number of entries, first
 * and last strategy names, all unique strategies, and optional rendered/
 * exported representations pulled from metadata.
 *
 * Design principles:
 * - Immutable: all fields are readonly
 * - Pure data: no methods, no behavior
 * - Independent: no dependencies on Planner, Runtime, Provider, or Pipeline
 * - Extensible: future fields can be added without breaking changes
 */
export interface PromptAssemblyTimelineSnapshot {
  /**
   * Number of entries in the timeline.
   * Undefined when the timeline is empty.
   */
  readonly entryCount?: number

  /**
   * Strategy name of the first timeline entry.
   * Undefined when the timeline is empty.
   */
  readonly firstStrategy?: string

  /**
   * Strategy name of the last timeline entry.
   * Undefined when the timeline is empty.
   */
  readonly lastStrategy?: string

  /**
   * Ordered list of all strategy names from the timeline entries,
   * preserving insertion order.
   * Undefined when the timeline is empty.
   */
  readonly strategies?: readonly string[]

  /**
   * Optional rendered representation from metadata.
   * Present when metadata.timelineRendered is provided.
   */
  readonly rendered?: string

  /**
   * Optional exported representation from metadata.
   * Present when metadata.timelineExported is provided.
   */
  readonly exported?: string
}