/**
 * PromptAssemblyObservatorySnapshot — a condensed summary of a
 * PromptAssemblyObservatory.
 *
 * Captures key metadata about the observatory: total artifact count,
 * presence flags for each of the six artifacts (trace, timeline, history,
 * traceSnapshot, timelineSnapshot, historySnapshot), and optional rendered/
 * exported representations pulled from metadata.
 *
 * Design principles:
 * - Immutable: all fields are readonly
 * - Pure data: no methods, no behavior
 * - Independent: no dependencies on Planner, Runtime, Provider, or Pipeline
 * - Extensible: future fields can be added without breaking changes
 */
export interface PromptAssemblyObservatorySnapshot {
  /**
   * Number of artifacts present in the observatory (0–6).
   * Counts trace, timeline, history, traceSnapshot, timelineSnapshot,
   * and historySnapshot.
   */
  readonly artifactCount: number

  /**
   * Whether the observatory contains a trace artifact.
   */
  readonly hasTrace: boolean

  /**
   * Whether the observatory contains a timeline artifact.
   */
  readonly hasTimeline: boolean

  /**
   * Whether the observatory contains a history artifact.
   */
  readonly hasHistory: boolean

  /**
   * Whether the observatory contains a traceSnapshot artifact.
   */
  readonly hasTraceSnapshot: boolean

  /**
   * Whether the observatory contains a timelineSnapshot artifact.
   */
  readonly hasTimelineSnapshot: boolean

  /**
   * Whether the observatory contains a historySnapshot artifact.
   */
  readonly hasHistorySnapshot: boolean

  /**
   * Optional rendered representation from metadata.
   * Present when metadata.observatoryRendered is provided as a string.
   */
  readonly rendered?: string

  /**
   * Optional exported representation from metadata.
   * Present when metadata.observatoryExported is provided as a string.
   */
  readonly exported?: string
}