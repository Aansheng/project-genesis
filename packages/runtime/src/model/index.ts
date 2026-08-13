/**
 * Runtime Model — exports for the Runtime Component Model Foundation.
 *
 * Provides the component model types for the Runtime layer.
 * These types represent projected DSL components at Runtime.
 *
 * Design principles:
 * - Types only: no behavior, no methods, no logic
 * - Immutable: all fields are readonly
 * - Serializable: all types are JSON-serializable primitives
 * - Framework-independent: no Vue, Pinia, or web framework imports
 */
export type { RuntimeComponent } from './RuntimeComponent'