/**
 * RuntimeComponent — a single component owned by a Runtime Entity.
 *
 * Components represent the projected state of a DSL ComponentDsl at
 * Runtime. Each component has a type identifier and a bag of arbitrary
 * properties that are JSON-serializable.
 *
 * This is a FOUNDATION contract — no gameplay logic, no simulation,
 * no interpretation of component data.
 *
 * Design principles:
 * - Immutable: all fields are readonly
 * - Serializable: all types are JSON-serializable primitives
 * - Framework-independent: no Vue, Pinia, or web framework imports
 * - Runtime-independent: no Runtime type imports
 * - UI-independent: no ViewModel or UI type imports
 * - Types only: no behavior, no methods, no logic
 */
export interface RuntimeComponent {
  /** Component type identifier (e.g., "Position", "Health", "AI"). */
  readonly type: string

  /** Component properties — arbitrary key-value bag. */
  readonly properties: Readonly<Record<string, unknown>>
}