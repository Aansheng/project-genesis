/**
 * SemanticWorldGenerator — converts PromptAssemblyDomainModel to GameWorldModel.
 *
 * Provides the first generation path between the Prompt Assembly observability
 * metadata and the Semantic Game World Model. This generator uses deterministic
 * rule-based synthesis to produce a semantic game world from domain model data.
 *
 * This is NOT AI generation. This is rule-based semantic synthesis.
 * No LLM, no gameplay logic, no interpretation of domain data semantics.
 *
 * Design principles:
 * - Pure: no side effects, no I/O, no external calls
 * - Stateless: no internal state between generates
 * - Deterministic: same input always produces same output
 * - Immutable: output is always frozen
 * - Rule-based: no AI, no LLM, no heuristics
 * - Framework-independent: no Vue, Pinia, or web framework imports
 * - Runtime-independent: no Runtime type imports
 * - UI-independent: no ViewModel or UI type imports
 */
import type { PromptAssemblyDomainModel } from '../observatory/domain'
import type { GameWorldModel } from '@genesis/shared'

export interface SemanticWorldGenerator {
  /**
   * Generate a GameWorldModel from a PromptAssemblyDomainModel.
   *
   * Uses deterministic rule-based synthesis to produce a semantic game
   * world model. The world type is derived from the domain model overview
   * title, and default entities are created based on the world type.
   *
   * @param model — typed PromptAssemblyDomainModel
   * @returns Frozen GameWorldModel with world type and entities
   */
  generate(model: PromptAssemblyDomainModel): GameWorldModel
}