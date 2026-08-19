import type { RenderPosition } from '../model'
import type { EntityVisualDefinition } from './EntityVisualDefinition'

export interface RenderBounds {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

export interface RenderAnchor {
  readonly x: number
  readonly y: number
}

/** Projects one world position and visual envelope into a shared world bound. */
export function projectRenderBounds(
  position: RenderPosition,
  visual: EntityVisualDefinition,
): RenderBounds {
  const anchor = visual.anchor ?? 'top-left'
  return Object.freeze({
    x: anchor === 'feet' || anchor === 'center' ? position.x - visual.width / 2 : position.x,
    y: anchor === 'feet' ? position.y - visual.height : anchor === 'center' ? position.y - visual.height / 2 : position.y,
    width: visual.width,
    height: visual.height,
  })
}

/** Returns the Sprite anchor for the same PositionComponent semantics. */
export function getRenderAnchor(visual: EntityVisualDefinition): RenderAnchor {
  switch (visual.anchor) {
    case 'feet': return Object.freeze({ x: 0.5, y: 1 })
    case 'center': return Object.freeze({ x: 0.5, y: 0.5 })
    default: return Object.freeze({ x: 0, y: 0 })
  }
}
