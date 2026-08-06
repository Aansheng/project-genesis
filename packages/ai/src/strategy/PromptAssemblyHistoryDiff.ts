/**
 * PromptAssemblyHistoryDiff — the result of comparing two PromptAssemblyHistory instances.
 *
 * Captures the differences between a "before" history and an "after" history:
 * - added: history entry indexes present in "after" but not in "before"
 * - removed: history entry indexes present in "before" but not in "after"
 * - changed: history entry indexes present in both histories but with different
 *   trace references (using !== comparison)
 *
 * This is a pure data structure with no behavior. It enables downstream
 * consumers (observers, loggers, debug UIs) to inspect how the history
 * evolved between two builds.
 *
 * Design principles:
 * - Immutable: all fields are readonly
 * - Pure data: no methods, no behavior
 * - Independent: no dependencies on Planner, Runtime, Provider, or Pipeline
 * - Serializable: only number arrays (entry indexes)
 */
export interface PromptAssemblyHistoryDiff {
  /** Entry indexes present in "after" history but absent in "before" history */
  readonly added: readonly number[]

  /** Entry indexes present in "before" history but absent in "after" history */
  readonly removed: readonly number[]

  /** Entry indexes present in both histories but with different trace references */
  readonly changed: readonly number[]
}