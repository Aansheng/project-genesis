/**
 * Command Routing Foundation (WO-S10-004).
 *
 * Provides the CommandExecutor interface and DefaultCommandExecutor
 * that routes user commands through IntentRouter → CreateWorldRuntimeExecutor.
 */
export type { CommandExecutionResult } from './CommandExecutionResult'
export type { CommandExecutor } from './CommandExecutor'
export { DefaultCommandExecutor } from './DefaultCommandExecutor'