/**
 * WorldTemplate — a predefined template for a semantic game world.
 *
 * Each template defines a fixed set of GameWorldEntities for a given
 * WorldType. Templates are used by the WorldTemplateCatalog to provide
 * deterministic, rule-based entity generation without AI or LLM calls.
 *
 * Design principles:
 * - Immutable: all fields are readonly
 * - Deterministic: same world type always produces the same template
 * - Serializable: all types are JSON-serializable primitives
 * - No AI: no LLM, no generation logic, no interpretation
 * - No Runtime: no Runtime type imports
 * - Framework-independent: no Vue, Pinia, or web framework imports
 */
import type { WorldType, GameWorldEntity } from '@genesis/shared'

export interface WorldTemplate {
  /**
   * The world type this template represents.
   */
  readonly worldType: WorldType

  /**
   * The fixed set of entities for this world type.
   * Each entity is frozen and immutable.
   */
  readonly entities: readonly GameWorldEntity[]
}