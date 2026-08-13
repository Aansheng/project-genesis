/**
 * RenderEntityView — a rendered entity, backed by a PixiJS Graphics object.
 *
 * Properties:
 *   - `id`: mirrors the source RenderEntity.id
 *   - `graphics`: the PIXI.Graphics instance drawn on the canvas
 *
 * Constraints (WO-S9-004):
 *   - No sprites
 *   - No textures
 *   - No assets
 *   - No animation
 *   - Foundation only
 */

import type { Graphics } from 'pixi.js'

export interface RenderEntityView {
  readonly id: string
  readonly graphics: Graphics
}