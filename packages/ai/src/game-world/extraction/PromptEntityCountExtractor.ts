/**
 * PromptEntityCountExtractor — extracts entity counts from prompt content.
 *
 * Provides a deterministic, rule-based mechanism for identifying quantities
 * associated with entities in a PromptAssemblyDomainModel. The extractor
 * scans the model's content for patterns like "<number> <keyword>" and
 * maps them to entity count entries.
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
import type { ExtractedEntityCount } from './ExtractedEntityCount'
import type { PromptAssemblyDomainModel } from '../../observatory/domain'

export interface PromptEntityCountExtractor {
  /**
   * Extract entity counts from a PromptAssemblyDomainModel.
   *
   * Scans the domain model's overview title for patterns like
   * "<number> <keyword>" and produces a deduplicated, deterministically
   * ordered list of entity counts.
   *
   * Supported number formats:
   * - Numeric: 1, 2, 3, ..., 10
   * - Word-based: one, two, three, ..., ten
   *
   * @param model — typed PromptAssemblyDomainModel
   * @returns Frozen readonly array of ExtractedEntityCount
   */
  extractCounts(
    model: PromptAssemblyDomainModel,
  ): readonly ExtractedEntityCount[]
}