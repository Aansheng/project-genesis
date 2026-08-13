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