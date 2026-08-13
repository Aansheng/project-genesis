/**
 * ExtractedEntity — an entity identified via prompt keyword extraction.
 *
 * Describes an entity that was identified within a prompt's content through
 * rule-based keyword matching. Each extracted entity has a semantic category
 * and a human-readable name derived from the matched keyword.
 *
 * This is NOT an AI-generated entity. This is purely rule-based extraction.
 * No LLM, no semantic analysis, no interpretation.
 *
 * Design principles:
 * - Immutable: all fields are readonly
 * - Serializable: all types are JSON-serializable primitives
 * - Framework-independent: no Vue, Pinia, or web framework imports
 * - Runtime-independent: no Runtime type imports
 * - UI-independent: no ViewModel or UI type imports
 * - Rule-based: no AI, no LLM, no heuristics
 * - Semantic: uses EntityCategory (not 'player') for role classification
 */
import type { EntityCategory } from '@genesis/shared'

export interface ExtractedEntity {
  /**
   * Semantic category — the role this entity plays in the game world.
   *
   * Determined by a keyword-to-category mapping.
   * Example: "merchant" → 'npc', "barn" → 'building'
   */
  readonly category: EntityCategory

  /**
   * Human-readable entity name derived from the matched keyword.
   *
   * Capitalized from the matched keyword.
   * Example: "merchant" → "Merchant", "campfire" → "Campfire"
   */
  readonly name: string
}