/**
 * CameraController — tracks the primary player entity and produces
 * a CameraState that follows it.
 *
 * On each update, the controller scans the RenderWorld for an entity
 * with type 'player'. If found and the entity has a position, the
 * camera state is set to match the player's position. If no player
 * is found, the previous camera state is preserved.
 *
 * Design principles:
 * - Deterministic: same (world, previousState) produces same output
 * - Immutable: all outputs are deeply frozen
 * - Framework-independent: no PixiJS, Vue, or web framework imports
 */
import type { CameraState } from './CameraState'
import type { RenderWorld } from '../model'

export interface CameraController {
  /**
   * Update the camera state based on the current RenderWorld.
   *
   * @param world — The current render world to scan for player
   * @returns Frozen CameraState following the player
   */
  update(world: RenderWorld): CameraState

  /**
   * Get the current camera state without updating.
   *
   * @returns Frozen CameraState from the last update
   */
  getState(): CameraState
}