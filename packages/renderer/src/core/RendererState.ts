/**
 * RendererState — read-only snapshot of the renderer's current configuration.
 *
 * Properties:
 *   - `initialized`: whether the renderer has been successfully booted
 *   - `width`: viewport width in pixels (0 before initialize)
 *   - `height`: viewport height in pixels (0 before initialize)
 */

export interface RendererState {
  readonly initialized: boolean
  readonly width: number
  readonly height: number
}