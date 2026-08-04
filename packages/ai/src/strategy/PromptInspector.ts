import type { PromptInspectorSection } from './PromptInspectorSection'

/**
 * PromptInspector — domain model representing human-readable inspection data
 * for a prompt assembly execution.
 *
 * The inspector provides a structured view of the prompt assembly process,
 * breaking down the unified PromptAssemblySnapshot into labeled sections
 * with their respective content.
 *
 * Design principles:
 * - Immutable: all fields are readonly
 * - Pure data: no methods, no behavior
 * - Independent: no dependencies on Planner, Runtime, Provider, or Pipeline
 * - Extensible: new sections can be added without breaking changes
 */
export interface PromptInspector {
  /** Name of the selected strategy (e.g., "create", "query") */
  readonly strategy?: string

  /** Ordered list of inspection sections derived from the snapshot */
  readonly sections: readonly PromptInspectorSection[]
}