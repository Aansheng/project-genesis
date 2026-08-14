/**
 * DefaultPlatformTileCatalog — the default implementation of
 * PlatformTileCatalog.
 *
 * Mappings:
 *   player:   24 × 24
 *   terrain:  64 × 32  (wide platform)
 *   goal:     24 × 96  (tall flag)
 *   platform: 96 × 24  (horizontal platform)
 *   enemy:    24 × 24
 *   fallback: 20 × 20
 *
 * Design principles:
 * - Stateless: no internal state beyond the frozen map
 * - Deterministic: same type → same frozen definition
 * - Immutable: all definitions and the map are deeply frozen
 * - Extensible: new mappings can be added via subclass or wrapper
 * - Fallback: unknown types return a sensible default (20×20)
 */
import type { PlatformTileCatalog } from './PlatformTileCatalog'
import type { PlatformTileDefinition } from './PlatformTileDefinition'

/** Default fallback: 20×20 used when no mapping exists. */
const DEFAULT_TILE: PlatformTileDefinition = Object.freeze({
  width: 20,
  height: 20,
})

/** Predefined tile definitions for known entity types. */
const TILE_MAP: Readonly<Record<string, PlatformTileDefinition>> = Object.freeze({
  player: Object.freeze<PlatformTileDefinition>({
    width: 24,
    height: 24,
  }),
  terrain: Object.freeze<PlatformTileDefinition>({
    width: 64,
    height: 32,
  }),
  goal: Object.freeze<PlatformTileDefinition>({
    width: 24,
    height: 96,
  }),
  platform: Object.freeze<PlatformTileDefinition>({
    width: 96,
    height: 24,
  }),
  enemy: Object.freeze<PlatformTileDefinition>({
    width: 24,
    height: 24,
  }),
  checkpoint: Object.freeze<PlatformTileDefinition>({
    width: 16,
    height: 48,
  }),
  item: Object.freeze<PlatformTileDefinition>({
    width: 16,
    height: 16,
  }),
})

export class DefaultPlatformTileCatalog implements PlatformTileCatalog {
  getTile(entityType: string): PlatformTileDefinition {
    return TILE_MAP[entityType] ?? DEFAULT_TILE
  }
}