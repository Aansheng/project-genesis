/**
 * WorldTemplateCatalog — provides deterministic WorldTemplate instances.
 *
 * The catalog maps each WorldType to a predefined WorldTemplate. This is
 * the single source of truth for default entity generation across all
 * semantic world types.
 *
 * No AI, no LLM, no generation logic. Pure lookup.
 *
 * Design principles:
 * - Deterministic: same world type always returns the same template
 * - Stateless: no mutable state between lookups
 * - Immutable: all returned templates are frozen
 * - No AI: no LLM, no generation logic, no interpretation
 * - No Runtime: no Runtime type imports
 * - Framework-independent: no Vue, Pinia, or web framework imports
 */
import type { WorldType } from '@genesis/shared'
import type { WorldTemplate } from './WorldTemplate'

export interface WorldTemplateCatalog {
  /**
   * Retrieve the WorldTemplate for the given WorldType.
   *
   * Every WorldType is guaranteed to have a template.
   *
   * @param worldType — the semantic genre of the game world
   * @returns Frozen WorldTemplate with entity definitions
   */
  getTemplate(worldType: WorldType): WorldTemplate
}