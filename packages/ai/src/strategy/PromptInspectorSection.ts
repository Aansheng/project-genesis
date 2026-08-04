/**
 * PromptInspectorSection — a single labeled section within a PromptInspector.
 *
 * Each section pairs a human-readable title with the raw content value from
 * the PromptAssemblySnapshot. The content type is unknown — consumers are
 * expected to handle each known section title with its expected type.
 *
 * Design principles:
 * - Immutable: all fields are readonly
 * - Pure data: no methods, no behavior
 * - Independent: no dependencies on any other component
 */
export interface PromptInspectorSection {
  /** Human-readable section title (e.g., "Rendered Strategy", "Prompt Plan") */
  readonly title: string

  /** Raw section content from the snapshot (type varies per section) */
  readonly content: unknown
}