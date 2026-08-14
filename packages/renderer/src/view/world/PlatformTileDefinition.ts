/**
 * PlatformTileDefinition — describes the size of a platform-style tile
 * for a specific entity type.
 *
 * Tile definitions provide semantic dimensions (width × height) that
 * visually distinguish entity types in a platform game world. These are
 * used by the PixiEntityRenderer to draw the correct shape per type.
 *
 * Design principles:
 * - Graphics only: no sprites, textures, or asset references
 * - Serializable: all fields are JSON-serializable primitives
 * - Immutable: all fields are readonly
 * - Framework-independent: no PixiJS, Vue, or web framework imports
 */
export interface PlatformTileDefinition {
  /** Width of the tile in pixels */
  readonly width: number

  /** Height of the tile in pixels */
  readonly height: number
}