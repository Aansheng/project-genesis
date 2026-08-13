/**
 * RenderWorld — a lightweight representation of the runtime world
 * for the rendering layer.
 *
 * Properties:
 *   - `entities`: ordered list of RenderEntity instances
 *
 * Constraints (WO-S9-002):
 *   - No position data
 *   - No components
 *   - No runtime system references
 *   - Foundation only
 */

import type { RenderEntity } from './RenderEntity'

export interface RenderWorld {
  readonly entities: readonly RenderEntity[]
}

/** Frozen empty RenderWorld constant. */
export const EMPTY_RENDER_WORLD: RenderWorld = Object.freeze({
  entities: Object.freeze([]) as readonly RenderEntity[],
})