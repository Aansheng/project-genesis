/**
 * EntityVisualDefinition — describes how a specific entity type should
 * be rendered visually using basic Graphics shapes.
 *
 * This is the foundation for visual distinction between entity types:
 * - player: circle
 * - enemy: small rectangle
 * - merchant: wide rectangle
 * - boss: large rectangle
 *
 * Design principles:
 * - Graphics only: no sprites, textures, or asset references
 * - Serializable: all fields are JSON-serializable primitives
 * - Immutable: all fields are readonly
 * - Framework-independent: no PixiJS, Vue, or web framework imports
 */
export interface EntityVisualDefinition {
  /** Width of the entity visual in pixels */
  readonly width: number

  /** Height of the entity visual in pixels */
  readonly height: number

  /**
   * Shape of the entity visual.
   * - 'rectangle': drawn via Graphics.drawRect(0, 0, width, height)
   * - 'circle': drawn via Graphics.drawCircle(0, 0, radius)
   *   where radius = Math.min(width, height) / 2
   */
  readonly shape: 'rectangle' | 'circle'
}