/**
 * RenderWorldView — the full set of rendered entities on the canvas.
 *
 * Properties:
 *   - `entities`: ordered list of rendered entity views
 *
 * Constraints (WO-S9-004):
 *   - No sprites
 *   - No textures
 *   - No assets
 *   - No animation
 *   - Foundation only
 */

import type { RenderEntityView } from './RenderEntityView'

export interface RenderWorldView {
  readonly entities: readonly RenderEntityView[]
}