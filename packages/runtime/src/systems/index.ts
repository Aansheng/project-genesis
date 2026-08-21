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

// Gravity System Foundation (WO-S9-012)
export type { GravitySystem } from './GravitySystem'
export type { GravitySystemResult } from './GravitySystemResult'
export { DefaultGravitySystem } from './DefaultGravitySystem'

// Ground Collision System Foundation (WO-S9-013)
export type { GroundCollisionSystem } from './GroundCollisionSystem'
export type { GroundCollisionSystemResult } from './GroundCollisionSystemResult'
export { DefaultGroundCollisionSystem } from './DefaultGroundCollisionSystem'
export type { VerticalMotionSystem } from './VerticalMotionSystem'
export { DefaultVerticalMotionSystem } from './DefaultVerticalMotionSystem'

// Jump System Foundation (WO-S9-014)
export type { JumpSystem } from './JumpSystem'
export type { JumpSystemResult } from './JumpSystemResult'
export { DefaultJumpSystem } from './DefaultJumpSystem'

// Runtime Gameplay Event Observation (WO-S15-002)
export { DefaultEntityContactSystem } from './EntityContactSystem'
