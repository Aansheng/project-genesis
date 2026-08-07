/**
 * PromptAssemblyObservatoryDiff — the result of comparing two
 * PromptAssemblyObservatory instances.
 *
 * Captures the differences between a "before" observatory and an "after"
 * observatory across its six fields (trace, timeline, history, traceSnapshot,
 * timelineSnapshot, historySnapshot):
 *
 * - added: field names present in "after" but not in "before"
 * - removed: field names present in "before" but not in "after"
 * - changed: field names present in both observatories but with different
 *   values (using !== comparison)
 *
 * This is a pure data structure with no behavior. It enables downstream
 * consumers (observers, loggers, debug UIs) to inspect how the full
 * observatory state evolved between two builds.
 *
 * Design principles:
 * - Immutable: all fields are readonly
 * - Pure data: no methods, no behavior
 * - Independent: no dependencies on Planner, Runtime, Provider, or Pipeline
 * - Serializable: only string arrays (field names)
 */
export interface PromptAssemblyObservatoryDiff {
  /** Field names present in "after" observatory but absent in "before" observatory */
  readonly added: readonly string[]

  /** Field names present in "before" observatory but absent in "after" observatory */
  readonly removed: readonly string[]

  /** Field names present in both observatories but with different values */
  readonly changed: readonly string[]
}