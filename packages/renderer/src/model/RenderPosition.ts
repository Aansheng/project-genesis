/**
 * RenderPosition — 2D spatial position data for the rendering layer.
 *
 * Properties:
 *   - `x`: X-coordinate (mirrors PositionComponent.properties.x)
 *   - `y`: Y-coordinate (mirrors PositionComponent.properties.y)
 *
 * Constraints (WO-S9-003):
 *   - No movement
 *   - No velocity
 *   - No acceleration
 *   - No animation
 *   - Foundation only
 */

export interface RenderPosition {
  readonly x: number
  readonly y: number
}

/** Frozen zero-position constant. */
export const EMPTY_RENDER_POSITION: RenderPosition = Object.freeze({
  x: 0,
  y: 0,
})