/**
 * @genesis/runtime — the Runtime package for Project Genesis.
 */
export { Runtime } from './runtime'
export { RuntimeQuery } from './query'
export type { RuntimeComponent } from './model'
export type { RuntimeProjection, RuntimeProjectionResult } from './projection'
export { DefaultRuntimeProjection } from './projection'

// Runtime System Foundation
export type { RuntimeSystem, RuntimeSystemRegistry } from './system'
export { DefaultRuntimeSystemRegistry, NoOpRuntimeSystem } from './system'

// Runtime Execution Loop Foundation
export type { RuntimeExecutionLoop, ExecutionTickResult } from './execution'
export { DefaultRuntimeExecutionLoop } from './execution'

// Runtime World Mutation Foundation
export type { WorldMutator, WorldMutationResult } from './mutation'
export { DefaultWorldMutator } from './mutation'

// Runtime Gameplay Systems
export type { MovementSystem, MovementSystemResult } from './systems'
export { DefaultMovementSystem } from './systems'

// Input Foundation (WO-S9-008)
export type { InputKey } from './input'
export type { InputState } from './input'
export type { InputProvider } from './input'
export { DefaultInputState } from './input'