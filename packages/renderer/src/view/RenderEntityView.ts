/**
 * RenderEntityView — a rendered entity with a primitive fallback and optional Sprite.
 *
 * Properties:
 *   - `id`: mirrors the source RenderEntity.id
 *   - `graphics`: the PIXI.Graphics instance drawn on the canvas
 *
 * The Graphics reference remains available as the fallback view; displayObject
 * identifies the currently visible Pixi object.
 */

import type { Graphics, Sprite } from 'pixi.js'

export interface RenderEntityView {
  readonly id: string
  readonly graphics: Graphics
  readonly sprite?: Sprite
  readonly displayObject?: Graphics | Sprite
}
