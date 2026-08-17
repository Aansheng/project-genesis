/**
 * CreateWorldPipeline — the first executable AI command pipeline.
 *
 * Orchestrates the full creation flow:
 *   IntentRouter → GameIntentExtractor → SemanticWorldGenerator →
 *   SemanticGameDslBuilder → RuntimeProjection → World
 *
 * This is a pure orchestration layer. It composes existing components
 * into a linear pipeline. No LLM, no rendering, no UI.
 *
 * Design principles:
 * - Pure: no side effects, no I/O, no external calls
 * - Stateless: no internal state between executions
 * - Deterministic: same input always produces same output
 * - Immutable: output is always frozen
 * - Rule-based: no AI, no LLM, no heuristics
 * - Framework-independent: no Vue, Pinia, or web framework imports
 * - UI-independent: no ViewModel or UI type imports
 */
import type { CreateWorldCommand } from './CreateWorldCommand'
import type { CreateWorldPipelineResult } from './CreateWorldPipelineResult'

export interface CreateWorldPipeline {
  /**
   * Execute the Create World Pipeline for the given command.
   *
   * Routes the input, extracts intent, generates a semantic world,
   * builds a Game DSL, and projects it onto a Runtime world.
   *
   * @param command — the CreateWorldCommand with user input
   * @returns Frozen CreateWorldPipelineResult with route, world, and success
   */
  execute(command: CreateWorldCommand): CreateWorldPipelineResult

  /** Execute through the async semantic world-generation provider boundary. */
  executeAsync(command: CreateWorldCommand): Promise<CreateWorldPipelineResult>
}
