/**
 * RuntimeRendererAdapter — maps a Runtime World to a RenderWorld.
 *
 * This is the sole bridge between the Runtime layer and the Renderer layer.
 * It extracts only the data the renderer needs (id, type) and discards
 * everything else (position, components, runtime internals).
 *
 * Constraints (WO-S9-002):
 *   - No Runtime changes
 *   - No Pixi changes
 *   - No Position rendering
 *   - No Sprite creation
 *   - Foundation only
 */

import type { World } from '@genesis/shared'
import type { RenderWorld } from '../model'

export interface RuntimeRendererAdapter {
  adapt(world: World): RenderWorld
}