/**
 * DefaultCreateWorldRuntimeExecutor — default implementation of
 * CreateWorldRuntimeExecutor.
 *
 * Flow:
 *   input
 *     ↓
 *   CreateWorldPipeline.execute()
 *     ↓
 *   if success → worldStore.setWorld(world)
 *     ↓
 *   return result
 *
 * Pure (except setWorld side effect). Stateless. Deterministic.
 */
import type { CreateWorldPipeline } from '../pipeline/CreateWorldPipeline'
import type { CreateWorldPipelineResult } from '../pipeline/CreateWorldPipelineResult'
import type { CreateWorldRuntimeExecutor, WorldStore } from './CreateWorldRuntimeExecutor'

export class DefaultCreateWorldRuntimeExecutor
  implements CreateWorldRuntimeExecutor
{
  private readonly pipeline: CreateWorldPipeline
  private readonly worldStore: WorldStore

  /**
   * @param pipeline   — the CreateWorldPipeline to execute
   * @param worldStore — the store to inject the resulting world into
   */
  constructor(
    pipeline: CreateWorldPipeline,
    worldStore: WorldStore
  ) {
    this.pipeline = pipeline
    this.worldStore = worldStore
  }

  /**
   * Execute the create world pipeline and inject the result.
   *
   * @param input — raw user input string
   * @returns Frozen CreateWorldPipelineResult
   */
  execute(input: string): CreateWorldPipelineResult {
    const command = Object.freeze({ input })
    const result = this.pipeline.execute(command)

    if (result.success) {
      this.worldStore.setWorld(result.world)
    }

    return result
  }

  async executeAsync(input: string): Promise<CreateWorldPipelineResult> {
    const command = Object.freeze({ input })
    const result = await this.pipeline.executeAsync(command)

    if (result.success) {
      this.worldStore.setWorld(result.world)
    }

    return result
  }
}
