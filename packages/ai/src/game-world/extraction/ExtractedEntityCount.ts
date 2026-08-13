/**
 * ExtractedEntityCount — a quantity associated with an extracted entity.
 *
 * Describes how many instances of a specific entity were identified
 * in a prompt through rule-based number+keyword matching. Each count
 * entry has a keyword name and a numeric count.
 *
 * This is NOT an AI-generated count. This is purely rule-based extraction.
 * No LLM, no semantic analysis, no interpretation.
 *
 * Design principles:
 * - Immutable: all fields are readonly
 * - Serializable: all types are JSON-serializable primitives
 * - Framework-independent: no Vue, Pinia, or web framework imports
 * - Runtime-independent: no Runtime type imports
 * - UI-independent: no ViewModel or UI type imports
 * - Rule-based: no AI, no LLM, no heuristics
 */
export interface ExtractedEntityCount {
  /**
   * The keyword name this count applies to (lowercase).
   *
   * Matches the entity keyword in singular lowercase form.
   * Example: "farmer" (not "farmers"), "merchant" (not "merchants")
   */
  readonly name: string

  /**
   * The numeric count of how many instances to create.
   *
   * Derived from numeric digits or word-based numbers in the prompt.
   * Minimum value is 1.
   * Example: 2 for "two farmers", 3 for "3 merchants"
   */
  readonly count: number
}