/**
 * CameraState — an immutable snapshot of camera position.
 *
 * Represents the camera's current focus point in world space.
 * The renderer uses this state to offset the visible viewport.
 *
 * Design principles:
 * - Immutable: all fields are readonly
 * - Serializable: all values are JSON-serializable primitives
 * - Framework-independent: no PixiJS, Vue, or web framework imports
 */
export interface CameraState {
  /** X-coordinate of the camera focus point. */
  readonly x: number

  /** Y-coordinate of the camera focus point. */
  readonly y: number
}

/** Frozen default camera state at origin. */
export const DEFAULT_CAMERA_STATE: CameraState = Object.freeze({
  x: 0,
  y: 0,
})