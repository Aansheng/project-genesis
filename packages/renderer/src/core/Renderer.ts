/**
 * Renderer — the abstract interface for rendering layers in Project Genesis.
 *
 * Foundation contract:
 *   - `initialize(container)`: boot the renderer into a host HTMLElement
 *   - `destroy()`: tear down the renderer and release resources
 */

export interface Renderer {
  initialize(container: HTMLElement): Promise<void>
  destroy(): Promise<void>
}