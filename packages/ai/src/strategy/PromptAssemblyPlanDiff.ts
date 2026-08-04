/**
 * PromptAssemblyPlanDiff — the result of comparing two PromptAssemblyPlan instances.
 *
 * Captures the differences between a "before" plan and an "after" plan:
 * - added: sections present in "after" but not in "before"
 * - removed: sections present in "before" but not in "after"
 * - changed: sections whose priority value changed between the two plans
 *
 * This is a pure data structure with no behavior. It enables downstream
 * consumers (optimizers, diagnostics, logging) to inspect what changed
 * during the optimization step.
 *
 * Design principles:
 * - Immutable: all fields are readonly
 * - Pure data: no methods, no behavior
 * - Independent: no dependencies on Planner, Runtime, Provider, or Pipeline
 * - Serializable: only primitive types (string, number)
 */
export interface PromptAssemblyPlanDiff {
  /** Section names present in "after" but absent in "before" */
  readonly added: readonly string[]

  /** Section names present in "before" but absent in "after" */
  readonly removed: readonly string[]

  /** Sections whose priority changed between "before" and "after" */
  readonly changed: readonly {
    /** Section name */
    readonly section: string
    /** Priority value in the "before" plan */
    readonly before: number
    /** Priority value in the "after" plan */
    readonly after: number
  }[]
}