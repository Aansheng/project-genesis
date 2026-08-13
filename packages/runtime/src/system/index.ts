/**
 * Runtime System — exports for the Runtime System Foundation.
 *
 * Provides the RuntimeSystem interface, RuntimeSystemRegistry contract,
 * DefaultRuntimeSystemRegistry implementation, and NoOpRuntimeSystem.
 *
 * Design principles:
 * - Pure: no side effects, no I/O, no external calls
 * - Deterministic: same input always produces same output
 * - Immutable: outputs are frozen where applicable
 * - Foundation only: no ECS, no scheduler, no update loop, no gameplay
 * - Framework-independent: no Vue, Pinia, or web framework imports
 * - UI-independent: no ViewModel or UI type imports
 */
export type { RuntimeSystem } from './RuntimeSystem'
export type { RuntimeSystemRegistry } from './RuntimeSystemRegistry'
export { DefaultRuntimeSystemRegistry } from './DefaultRuntimeSystemRegistry'
export { NoOpRuntimeSystem } from './NoOpRuntimeSystem'