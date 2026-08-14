/**
 * CreateWorldCommand — the input command for the Create World Pipeline.
 *
 * This is a pure command model — no Runtime, no Renderer, no DSL, no Planner,
 * no PromptBuilder, no LLM integration.
 *
 * Design principles:
 * - Pure: no side effects, no I/O, no external calls
 * - Immutable: all fields are readonly
 * - Serializable: all types are JSON-serializable primitives
 * - Framework-independent: no Vue, Pinia, or web framework imports
 * - Runtime-independent: no Runtime type imports
 * - Renderer-independent: no Renderer type imports
 * - UI-independent: no ViewModel or UI type imports
 */
export interface CreateWorldCommand {
  /** The raw natural language input from the user. */
  readonly input: string
}