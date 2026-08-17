import type { CommandExecutionResult } from './CommandExecutionResult'

/**
 * CommandExecutor — executes a user command string and returns a result.
 *
 * Routes the input through the IntentRouter to determine the command type,
 * then delegates to the appropriate executor.
 *
 * Design principles:
 * - Pure: no side effects, no I/O, no external calls (delegates to injected executors)
 * - Stateless: no internal state between executions
 * - Deterministic: same input always produces same output
 * - Framework-independent: no Vue, Pinia, or web framework imports
 */
export interface CommandExecutor {
  /**
   * Execute a user command string.
   *
   * @param input — raw user input string
   * @returns CommandExecutionResult with success flag and message
   */
  execute(input: string): CommandExecutionResult

  executeAsync?(input: string): Promise<CommandExecutionResult>
}
