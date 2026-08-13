/**
 * PromptEntityExtractor — extracts entities from prompt content.
 *
 * Provides a deterministic, rule-based mechanism for identifying entities
 * within a PromptAssemblyDomainModel. The extractor scans the model's
 * content for known keywords and maps them to semantic entity categories.
 *
 * This is NOT AI extraction. This is deterministic, rule-based extraction.
 * No LLM, no NLP, no semantic analysis, no interpretation.
 *
 * Design principles:
 * - Pure: no side effects, no I/O, no external calls
 * - Stateless: no internal state between extractions
 * - Deterministic: same input always produces same output
 * - Immutable: output is always a frozen readonly array
 * - Rule-based: no AI, no LLM, no heuristics
 * - Framework-independent: no Vue, Pinia, or web framework imports
 * - Runtime-independent: no Runtime type imports
 * - UI-independent: no ViewModel or UI type imports
 */
import type { ExtractedEntity } from './ExtractedEntity'
import type { PromptAssemblyDomainModel } from '../../observatory/domain'

export interface PromptEntityExtractor {
  /**
   * Extract entities from a PromptAssemblyDomainModel.
   *
   * Scans the domain model's content for known entity keywords and
   * produces a deduplicated, deterministically ordered list of
   * extracted entities.
   *
   * @param model — typed PromptAssemblyDomainModel
   * @returns Frozen readonly array of ExtractedEntity
   */
  extract(model: PromptAssemblyDomainModel): readonly ExtractedEntity[]
}