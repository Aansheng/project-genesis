/**
 * PromptSectionPriority — a section name paired with its priority score.
 *
 * Represents a single section's priority level for the Prompt Assembly Plan.
 * Higher priority values indicate sections that should be preserved or
 * emphasized during assembly reordering.
 *
 * This is the atomic unit of a PromptAssemblyPlan — each section in the
 * prompt gets a priority assignment that guides assembly decisions.
 *
 * Design principles:
 * - Immutable: all fields are readonly
 * - Pure data: no methods, no behavior
 * - Independent: no dependencies on Planner, Runtime, Provider, or Pipeline
 */
export interface PromptSectionPriority {
  /** The section key name (matches PromptContext field names) */
  readonly section: string
  /** Priority value — higher = more important (100 is default) */
  readonly priority: number
}