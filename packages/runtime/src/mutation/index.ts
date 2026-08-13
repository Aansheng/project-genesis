/**
 * Runtime Mutation — exports for the Runtime World Mutation Foundation.
 *
 * Provides the WorldMutator interface, WorldMutationResult type,
 * and DefaultWorldMutator implementation.
 *
 * Design principles:
 * - Pure: no side effects, no I/O, no external calls
 * - Stateless: no internal state between operations
 * - Deterministic: same input always produces same output
 * - Immutable: outputs are frozen where applicable
 * - Foundation only: no ECS, no game logic
 * - Framework-independent: no Vue, Pinia, or web framework imports
 * - UI-independent: no ViewModel or UI type imports
 */
export type { WorldMutationResult } from './WorldMutationResult'
export type { WorldMutator } from './WorldMutator'
export { DefaultWorldMutator } from './DefaultWorldMutator'