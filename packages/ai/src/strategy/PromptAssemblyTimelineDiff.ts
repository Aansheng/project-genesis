/**
 * PromptAssemblyTimelineDiff — the result of comparing two PromptAssemblyTimeline instances.
 *
 * Captures the differences between a "before" timeline and an "after" timeline:
 * - added: entry indexes present in "after" but not in "before"
 * - removed: entry indexes present in "before" but not in "after"
 * - changed: entry indexes present in both timelines but with different trace references
 *
 * This is a pure data structure with no behavior. It enables downstream
 * consumers (observers, loggers, debug UIs) to inspect how the timeline
 * evolved between two builds.
 *
 * Design principles:
 * - Immutable: all fields are readonly
 * - Pure data: no methods, no behavior
 * - Independent: no dependencies on Planner, Runtime, Provider, or Pipeline
 * - Serializable: only number arrays (entry indexes)
 */
export interface PromptAssemblyTimelineDiff {
  /** Entry indexes present in "after" timeline but absent in "before" timeline */
  readonly added: readonly number[]

  /** Entry indexes present in "before" timeline but absent in "after" timeline */
  readonly removed: readonly number[]

  /** Entry indexes present in both timelines but with different trace references */
  readonly changed: readonly number[]
}