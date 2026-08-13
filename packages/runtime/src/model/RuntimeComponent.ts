/**
 * RuntimeComponent — a single component owned by a Runtime Entity.
 *
 * Projects a ComponentDsl into Runtime. Each RuntimeComponent has a type
 * identifier and a bag of arbitrary properties that are JSON-serializable.
 *
 * Structurally identical to ComponentDsl with different semantics:
 * ComponentDsl is declarative DSL; RuntimeComponent is projected Runtime.
 *
 * This is a FOUNDATION contract — no gameplay logic, no simulation,
 * no interpretation of component data.
 *
 * Design principles:
 * - Immutable: all fields are readonly
 * - Serializable: all types are JSON-serializable primitives
 * - Framework-independent: no Vue, Pinia, or web framework imports
 * - UI-independent: no ViewModel or UI type imports
 * - Types only: no behavior, no methods, no logic
 */
export type { RuntimeComponent } from '@genesis/shared'