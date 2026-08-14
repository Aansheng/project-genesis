/**
 * CreateWorldRuntimeExecutor — executes the Create World Pipeline and
 * injects the result into the Runtime World Store.
 *
 * Orchestrates the complete flow:
 *   User Input
 *     ↓
 *   CreateWorldPipeline.execute()
 *     ↓
 *   World
 *     ↓
 *   worldStore.setWorld(world)
 *     ↓
 *   return success
 *
 * This is the bridge between AI generation and the running game runtime.
 * No AI, no LLM, no rendering, no networking.
 *
 * Design principles:
 * - Pure: no side effects beyond setWorld
 * - Stateless: no internal state between executions
 * - Deterministic: same input always produces same result
 * - Framework-independent: no Vue, Pinia, or web framework imports
 * - Renderer-independent: no Renderer type imports
 * - UI-independent: no ViewModel or UI type imports
 */
import type { CreateWorldPipelineResult } from '../pipeline/CreateWorldPipelineResult'

// ---------------------------------------------------------------------------
// Local WorldStore interface
// ---------------------------------------------------------------------------

/**
 * WorldStore — a minimal store interface for injecting worlds into the runtime.
 *
 * This local interface avoids importing from @genesis/runtime.
 * The actual RuntimeWorldStore from @genesis/runtime is type-compatible
 * via duck typing (same method signature).
 */
export interface WorldStore {
  /** Set the currently active world. */
  setWorld(world: { entities: Array<{ id: string; type: string; x: number; y: number }> }): void
}

// ---------------------------------------------------------------------------
// CreateWorldRuntimeExecutor
// ---------------------------------------------------------------------------

export interface CreateWorldRuntimeExecutor {
  /**
   * Execute the create world pipeline and inject the result.
   *
   * @param input — raw user input string
   * @returns CreateWorldPipelineResult with route, world, and success
   */
  execute(input: string): CreateWorldPipelineResult
}