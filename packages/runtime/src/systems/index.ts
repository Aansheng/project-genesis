/**
 * Runtime Gameplay Systems — exports for gameplay system implementations.
 *
 * Provides the MovementSystem interface, MovementSystemResult type, and
 * DefaultMovementSystem implementation.
 *
 * Design principles:
 * - Pure: no side effects, no I/O, no external calls
 * - Deterministic: same input always produces same output
 * - Immutable: outputs are frozen where applicable
 * - Foundation only: no physics, no collision, no input, no AI
 * - Framework-independent: no Vue, Pinia, or web framework imports
 * - UI-independent: no ViewModel or UI type imports
 */
export type { MovementSystem } from './MovementSystem'
export type { MovementSystemResult } from './MovementSystemResult'
export { DefaultMovementSystem } from './DefaultMovementSystem'

// Player Controller System Foundation (WO-S9-009)
export type { PlayerControllerSystem } from './PlayerControllerSystem'
export type { PlayerControllerResult } from './PlayerControllerResult'
export { DefaultPlayerControllerSystem } from './DefaultPlayerControllerSystem'