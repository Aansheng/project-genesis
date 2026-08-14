/**
 * DefaultCameraController — default implementation of CameraController.
 *
 * On each update, scans for the first entity with type === 'player'
 * in the RenderWorld. If that entity has a position, the camera state
 * is set to (position.x, position.y). If no player is found, the
 * previous camera state is preserved.
 *
 * State management:
 * - update(): computes new state from RenderWorld, stores internally
 * - getState(): returns the internally stored state (frozen)
 *
 * Behaviors:
 * - Constructed with default state at (0, 0)
 * - Only entity.type === 'player' is tracked
 * - Only the first player entity is followed (multiple players → follows first)
 * - Player without position → keeps previous state
 * - Empty world → keeps previous state
 * - All outputs are deeply frozen
 *
 * Design principles:
 * - Deterministic: same (world, previousState) produces same output
 * - Immutable: all outputs are deeply frozen
 * - Minimal: single responsibility — follow primary player
 * - Framework-independent: no PixiJS, Vue, or web framework imports
 */
import type { CameraState } from './CameraState'
import { DEFAULT_CAMERA_STATE } from './CameraState'
import type { CameraController } from './CameraController'
import type { RenderWorld } from '../model'

export class DefaultCameraController implements CameraController {
  private _state: CameraState

  constructor() {
    this._state = DEFAULT_CAMERA_STATE
  }

  /**
   * Update the camera to follow the primary player.
   *
   * @param world — current RenderWorld
   * @returns Frozen CameraState
   */
  update(world: RenderWorld): CameraState {
    const player = this.findPlayer(world)

    if (player && player.position) {
      this._state = Object.freeze({
        x: player.position.x,
        y: player.position.y,
      })
    }
    // If no player or no position, keep previous state (no change)

    return this._state
  }

  /**
   * Get the current camera state.
   *
   * @returns Frozen CameraState from the last update
   */
  getState(): CameraState {
    return this._state
  }

  // ---------------------------------------------------------------------------
  // Private Helpers
  // ---------------------------------------------------------------------------

  /**
   * Find the first player entity in the world.
   */
  private findPlayer(
    world: RenderWorld,
  ): { readonly type: string; readonly position?: { readonly x: number; readonly y: number } } | undefined {
    for (const entity of world.entities) {
      if (entity.type === 'player') {
        return entity
      }
    }
    return undefined
  }
}