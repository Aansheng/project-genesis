/**
 * PlatformTileCatalog — maps entity types to their tile definitions.
 *
 * Provides a single source of truth for tile dimensions in a platform
 * world. The catalog is queried by the PixiEntityRenderer during the
 * rendering pipeline to determine the size of each entity's visual.
 *
 * Flow:
 *   entity.type
 *     ↓
 *   catalog.getTile(entityType)
 *     ↓
 *   PlatformTileDefinition { width, height }
 *     ↓
 *   PixiEntityRenderer draws the shape
 *
 * Design principles:
 * - Stateless: pure lookup, no side effects
 * - Deterministic: same type → same definition
 * - Immutable: returned definitions are frozen
 * - Extensible: new types can be added without breaking existing mappings
 */
import type { PlatformTileDefinition } from './PlatformTileDefinition'

export interface PlatformTileCatalog {
  /**
   * Get the tile definition for a given entity type.
   *
   * @param entityType — the type string from RenderEntity.type
   * @returns A frozen PlatformTileDefinition for the entity type.
   *          Unknown types return a default tile definition.
   */
  getTile(entityType: string): PlatformTileDefinition
}