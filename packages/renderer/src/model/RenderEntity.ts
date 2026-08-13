/**
 * RenderEntity — a lightweight representation of a runtime entity
 * for the rendering layer.
 *
 * Properties:
 *   - `id`: unique entity identifier (mirrors Runtime Entity.id)
 *   - `type`: entity type string (mirrors Runtime Entity.type)
 *
 * Constraints (WO-S9-002):
 *   - No position data
 *   - No components
 *   - No runtime system references
 *   - Foundation only
 */

export interface RenderEntity {
  readonly id: string
  readonly type: string
}