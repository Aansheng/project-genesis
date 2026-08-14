/**
 * EntityVisualCatalog — maps entity types to their visual definitions.
 *
 * Provides a single source of truth for how each entity type should be
 * rendered. The catalog is queried by the PixiEntityRenderer during
 * the rendering pipeline.
 *
 * Flow:
 *   entity.type
 *     ↓
 *   catalog.getVisual(entityType)
 *     ↓
 *   EntityVisualDefinition { width, height, shape }
 *     ↓
 *   PixiEntityRenderer draws the shape
 *
 * Design principles:
 * - Stateless: pure lookup, no side effects
 * - Deterministic: same type → same definition
 * - Immutable: returned definitions are frozen
 * - Extensible: new types can be added without breaking existing mappings
 */
import type { EntityVisualDefinition } from './EntityVisualDefinition'

export interface EntityVisualCatalog {
  /**
   * Get the visual definition for a given entity type.
   *
   * @param entityType — the type string from RenderEntity.type
   * @returns A frozen EntityVisualDefinition for the entity type.
   *          Unknown types return a default definition.
   */
  getVisual(entityType: string): EntityVisualDefinition
}