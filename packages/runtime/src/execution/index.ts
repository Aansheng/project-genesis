/**
 * Runtime Execution — exports for the Runtime Execution Loop Foundation.
 *
 * Provides the RuntimeExecutionLoop interface, ExecutionTickResult type,
 * and DefaultRuntimeExecutionLoop implementation.
 *
 * Design principles:
 * - Pure: no side effects, no I/O, no external calls
 * - Deterministic: same input always produces same output
 * - Immutable: outputs are frozen where applicable
 * - Foundation only: no ECS scheduler, no prioritized execution, no async
 * - Framework-independent: no Vue, Pinia, or web framework imports
 * - UI-independent: no ViewModel or UI type imports
 */
export type { ExecutionTickResult } from './ExecutionTickResult'
export type { RuntimeExecutionLoop } from './RuntimeExecutionLoop'
export { DefaultRuntimeExecutionLoop } from './DefaultRuntimeExecutionLoop'
export type {
  RuntimeGameplayRespawnResult,
  RuntimeGameplayRuleExecutionConfig,
} from './DefaultRuntimeExecutionLoop'
