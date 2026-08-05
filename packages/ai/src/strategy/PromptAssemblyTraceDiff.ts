/**
 * PromptAssemblyTraceDiff — the result of comparing two PromptAssemblyTrace instances.
 *
 * Captures the differences between a "before" trace and an "after" trace:
 * - added: fields present in "after" but not in "before"
 * - removed: fields present in "before" but not in "after"
 * - changed: fields present in both traces but with different values
 *
 * This is a pure data structure with no behavior. It enables downstream
 * consumers (observers, loggers, debug UIs, timeline tools) to inspect
 * what changed during the prompt assembly lifecycle.
 *
 * Design principles:
 * - Immutable: all fields are readonly
 * - Pure data: no methods, no behavior
 * - Independent: no dependencies on Planner, Runtime, Provider, or Pipeline
 * - Serializable: only string arrays (field names)
 */
export interface PromptAssemblyTraceDiff {
  /** Field names present in "after" trace but absent in "before" trace */
  readonly added: readonly string[]

  /** Field names present in "before" trace but absent in "after" trace */
  readonly removed: readonly string[]

  /** Field names present in both traces but with different values */
  readonly changed: readonly string[]
}