/**
 * RenderEntity — a lightweight representation of a runtime entity
 * for the rendering layer.
 *
 * Properties:
 *   - `id`: unique entity identifier (mirrors Runtime Entity.id)
 *   - `type`: entity type string (mirrors Runtime Entity.type)
 *   - `position`: optional 2D spatial position (when PositionComponent exists)
 *
 * Constraints (WO-S9-002, WO-S9-003):
 *   - No components
 *   - No runtime system references
 *   - Foundation only
 */

import type { RenderPosition } from './RenderPosition'

export interface RenderEntity {
  readonly id: string
  readonly type: string
  readonly position?: RenderPosition
}