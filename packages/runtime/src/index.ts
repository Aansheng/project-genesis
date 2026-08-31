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
export type {
  RuntimeGameplayRespawnResult,
  RuntimeGameplayRuleExecutionConfig,
} from './execution/DefaultRuntimeExecutionLoop'
export type { RuntimeGameplayEventCollector } from './events'
export { DefaultRuntimeGameplayEventCollector } from './events'

// Runtime World Mutation Foundation
export type { WorldMutator, WorldMutationResult } from './mutation'
export { DefaultWorldMutator } from './mutation'

// Narrow Runtime entity composition shared by semantic evolution and gameplay creation
export {
  createComposedRuntimeEntity,
  findSafeRuntimeEntityPosition,
  runtimeEntityPosition,
} from './composition'

// Runtime Gameplay Systems
export type { MovementSystem, MovementSystemResult } from './systems'
export { DefaultMovementSystem } from './systems'
export type { PlayerControllerSystem, PlayerControllerMotionMode, PlayerControllerOptions, PlayerControllerResult } from './systems'
export { DefaultPlayerControllerSystem } from './systems'
export type { GravitySystem, GravitySystemResult } from './systems'
export { DefaultGravitySystem } from './systems'
export type { GroundCollisionSystem, GroundCollisionSystemResult } from './systems'
export { DefaultGroundCollisionSystem } from './systems'
export type { VerticalMotionSystem } from './systems'
export { DefaultVerticalMotionSystem } from './systems'
export { DefaultTargetDirectedMovementSystem, DefaultVelocityMotionSystem } from './systems'
export type { JumpSystem, JumpSystemResult } from './systems'
export { DefaultJumpSystem } from './systems'
export { DefaultEntityContactSystem } from './systems'

// Input Foundation (WO-S9-008)
export type { InputKey } from './input'
export type { InputState } from './input'
export type { InputProvider } from './input'
export { DefaultInputState } from './input'

// Game Bootstrap Foundation (WO-S9-010)
export type { GameBootstrap } from './bootstrap'
export type { GameBootstrapConfig } from './bootstrap'

// Runtime World Store Foundation (WO-S10-003)
export type { RuntimeWorldStore } from './world'
export { DefaultRuntimeWorldStore } from './world'

// Targeted semantic-to-Runtime synchronization
export type {
  RuntimeEvolutionFailureReason,
  RuntimeEvolutionImpact,
  RuntimeEvolutionResult,
  RuntimeEvolutionStatus,
  RuntimeEvolutionSynchronizationOptions,
  RuntimePreservedComponentFacts,
  RuntimeWorldEvolutionSynchronizer as RuntimeWorldEvolutionSynchronizerContract,
} from '@genesis/shared'
export {
  DefaultRuntimeWorldEvolutionSynchronizer,
  RuntimeWorldEvolutionSynchronizer,
} from './evolution'

// Gameplay rule execution vertical slice (WO-S15-004)
export type {
  GameplayActionExecutionRequest,
  GameplayActionExecutionResult,
  GameplayActionExecutionStatus,
  GameplayActionExecutor,
  GameplayConditionEvaluation,
  GameplayConditionEvaluationStatus,
  GameplayConditionEvaluator,
  GameplayRuleExecutionBatch,
  GameplayRuleExecutionContext,
  GameplayRuleExecutionObserver,
  GameplayRuleExecutionResult,
  GameplayRuleExecutionStatus,
  GameplayRuleExecutor,
  GameplayRuleMatcher,
  RuntimeGameplaySessionBinding,
  RuntimeGameplaySessionCompletionOutcome,
  RuntimeGameplaySessionCompletionResult,
  RuntimeGameplaySessionFailureOutcome,
  RuntimeGameplaySessionFailureResult,
  RuntimeGameplaySessionRespawnOutcome,
  RuntimeGameplaySessionRespawnResult,
  RuntimeGameplaySessionState,
  RuntimeGameplaySessionStatus,
  RuntimeGameplayNumericChangeResult,
  RuntimeGameplayProgressionBinding,
  RuntimeGameplayProgressionState,
} from './gameplay'
export {
  DefaultGameplayActionExecutor,
  DefaultGameplayConditionEvaluator,
  DefaultGameplayRuleExecutor,
  DefaultGameplayRuleMatcher,
  completeRuntimeGameplaySession,
  createRuntimeGameplaySessionState,
  DefaultRuntimeGameplaySessionStateStore,
  failRuntimeGameplaySession,
  respawnRuntimeGameplaySession,
  applyRuntimeGameplayNumericChange,
  createRuntimeGameplayProgressionState,
  DefaultRuntimeGameplayProgressionStateStore,
} from './gameplay'
