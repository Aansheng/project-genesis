/**
 * GameIntentExtractor — extracts GameIntent from a PromptAssemblyDomainModel.
 *
 * This is a pure semantic extraction layer. It consumes a typed domain model
 * and produces a frozen GameIntent. No AI, no LLM, no NLP. Rule-based only.
 *
 * Design principles:
 * - Pure: no side effects, no I/O, no external calls
 * - Stateless: no internal state between extracts
 * - Deterministic: same input always produces same output
 * - Immutable: output is always frozen
 * - Rule-based: no AI, no LLM, no heuristics
 * - Framework-independent: no Vue, Pinia, or web framework imports
 * - Runtime-independent: no Runtime type imports
 * - Renderer-independent: no Renderer type imports
 * - UI-independent: no ViewModel or UI type imports
 */
import type { PromptAssemblyDomainModel } from '../observatory/domain'
import type { GameIntent } from './GameIntent'

export interface GameIntentExtractor {
  /**
   * Extract a GameIntent from a PromptAssemblyDomainModel.
   *
   * Uses deterministic rule-based detection to classify the game genre.
   * The title is extracted from the overview.title field.
   *
   * @param model — typed PromptAssemblyDomainModel
   * @returns Frozen GameIntent with genre and title
   */
  extract(model: PromptAssemblyDomainModel): GameIntent
}