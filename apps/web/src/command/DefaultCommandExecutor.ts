/**
 * DefaultCommandExecutor — default implementation of CommandExecutor.
 *
 * Routes user input via IntentRouter and delegates to the appropriate
 * executor based on the detected route.
 *
 * Flow:
 *   input
 *     ↓
 *   intentRouter.route(input)
 *     ↓
 *   if route is "create-world":
 *       createWorldExecutor.execute(input)
 *       ↓
 *       return { success: true, message: ... }
 *     ↓
 *   else:
 *       return { success: false, message: "Unknown command" }
 *
 * Pure (delegates side effects to injected executors). Stateless.
 * Framework-independent: no Vue, Pinia, or web framework imports.
 */
import type { IntentRouter } from '@genesis/ai'
import type { CreateWorldRuntimeExecutor } from '@genesis/ai'
import type { CommandExecutionResult } from './CommandExecutionResult'
import type { CommandExecutor } from './CommandExecutor'

/** Expected route for world creation. */
const ROUTE_CREATE_WORLD = 'create-world'

export class DefaultCommandExecutor implements CommandExecutor {
  private readonly intentRouter: IntentRouter
  private readonly createWorldExecutor: CreateWorldRuntimeExecutor

  /**
   * @param intentRouter       — routes the raw input string
   * @param createWorldExecutor — executes world creation via pipeline + store
   */
  constructor(
    intentRouter: IntentRouter,
    createWorldExecutor: CreateWorldRuntimeExecutor,
  ) {
    this.intentRouter = intentRouter
    this.createWorldExecutor = createWorldExecutor
  }

  /**
   * Execute a user command string.
   *
   * Routes the input, delegates to the matching executor, and returns
   * a result with success flag and human-readable message.
   *
   * @param input — raw user input string
   * @returns CommandExecutionResult with success flag and message
   */
  execute(input: string): CommandExecutionResult {
    const routingResult = this.intentRouter.route(input)

    if (routingResult.route === ROUTE_CREATE_WORLD) {
      const pipelineResult = this.createWorldExecutor.execute(input)

      if (pipelineResult.success) {
        const entityCount = pipelineResult.world.entities.length
        return {
          success: true,
          message: `Created world with ${entityCount} entit${entityCount === 1 ? 'y' : 'ies'}`,
          entityCount,
          generationDiagnostics: pipelineResult.generationDiagnostics,
        }
      }

      return {
        success: false,
        message: `Failed to create world: route=${pipelineResult.route}`,
      }
    }

    return {
      success: false,
      message: `Unknown command: "${input}"`,
    }
  }

  async executeAsync(input: string): Promise<CommandExecutionResult> {
    const routingResult = this.intentRouter.route(input)

    if (routingResult.route === ROUTE_CREATE_WORLD) {
      const pipelineResult = this.createWorldExecutor.executeAsync
        ? await this.createWorldExecutor.executeAsync(input)
        : this.createWorldExecutor.execute(input)

      if (pipelineResult.success) {
        const entityCount = pipelineResult.world.entities.length
        return {
          success: true,
          message: `Created world with ${entityCount} entit${entityCount === 1 ? 'y' : 'ies'}`,
          entityCount,
        }
      }

      return {
        success: false,
        message: `Failed to create world: route=${pipelineResult.route}`,
      }
    }

    return {
      success: false,
      message: `Unknown command: "${input}"`,
    }
  }
}
