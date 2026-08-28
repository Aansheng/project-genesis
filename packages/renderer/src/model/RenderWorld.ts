/**
 * RenderWorld — a lightweight representation of the runtime world
 * for the rendering layer.
 *
 * Properties:
 *   - `entities`: ordered list of RenderEntity instances
 *
 * Constraints (WO-S9-002):
 *   - No components
 *   - No runtime system references
 *   - Spatial mode is projection metadata; Runtime geometry remains on
 *     RenderEntity and is authoritative for positions
 */

import type { RenderEntity } from './RenderEntity'
import type { WorldSpatialMode } from '@genesis/shared'

export interface RenderWorld {
  readonly entities: readonly RenderEntity[]
  /** Optional spatial mode projected by the active Runtime adapter. */
  readonly spatialMode?: WorldSpatialMode
}

/** Frozen empty RenderWorld constant. */
export const EMPTY_RENDER_WORLD: RenderWorld = Object.freeze({
  entities: Object.freeze([]) as readonly RenderEntity[],
})
