import type { PromptSectionPriority } from './PromptSectionPriority'

/**
 * PromptAssemblyPlan — the output of PromptAssemblyPlanner.
 *
 * Contains the full set of section priorities that guide the PromptAssemblyStrategy
 * in reordering prompt sections. Each section in the prompt is assigned a priority
 * that determines its placement weight during assembly.
 *
 * The plan is produced by PromptAssemblyPlanner.buildPlan() and consumed by
 * PromptAssemblyStrategy.apply() to determine section ordering.
 *
 * Design principles:
 * - Immutable: all fields are readonly
 * - Pure data: no methods, no behavior
 * - Independent: no dependencies on Planner, Runtime, Provider, or Pipeline
 * - Serializable: only primitive types (string, number)
 */
export interface PromptAssemblyPlan {
  /** Ordered list of section priorities (preserves section order from input) */
  readonly priorities: readonly PromptSectionPriority[]
}