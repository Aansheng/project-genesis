/**
 * PixiEntityRenderer — renders a RenderWorld onto a PixiJS canvas
 * using basic Graphics rectangles (no sprites, no textures).
 *
 * Rules:
 *   - If entity.position exists: draw a 20×20 rectangle at (x, y)
 *   - If no position: do not draw
 *
 * Constraints (WO-S9-004):
 *   - No sprites
 *   - No textures
 *   - No assets
 *   - No animation
 *   - No gameplay rendering
 *   - Foundation only
 */

import { Container, Graphics } from 'pixi.js'
import type { RenderWorld } from '../model'
import type { RenderEntityView } from './RenderEntityView'
import type { RenderWorldView } from './RenderWorldView'

/** Default width/height for the entity rectangle. */
const ENTITY_SIZE = 20

/** Fill color for the entity rectangle. */
const ENTITY_COLOR = 0x4fc3f7

export interface PixiEntityRendererOptions {
  /**
   * Optional factory for creating PIXI.Graphics instances.
   * Defaults to `new Graphics()`. Provided for testability
   * so tests can inject a mock without depending on a real canvas context.
   */
  readonly createGraphics?: () => Graphics
}

export interface PixiEntityRenderer {
  render(world: RenderWorld): RenderWorldView
  clear(): void
}

export class DefaultPixiEntityRenderer implements PixiEntityRenderer {
  private readonly _container: Container
  private readonly _createGraphics: () => Graphics
  private _entityViews: RenderEntityView[] = []

  constructor(
    container: Container,
    options?: PixiEntityRendererOptions
  ) {
    this._container = container
    this._createGraphics =
      options?.createGraphics ?? (() => new Graphics())
  }

  // ─── Public API ─────────────────────────────────────────────────────

  render(world: RenderWorld): RenderWorldView {
    // Clear previous render
    this.clear()

    const views: RenderEntityView[] = []

    for (const entity of world.entities) {
      if (!entity.position) continue

      const gfx = this._createGraphics()

      // Draw a filled rectangle
      gfx.beginFill(ENTITY_COLOR)
      gfx.drawRect(0, 0, ENTITY_SIZE, ENTITY_SIZE)
      gfx.endFill()

      // Position the graphics in world space
      gfx.x = entity.position.x
      gfx.y = entity.position.y

      this._container.addChild(gfx)

      const view: RenderEntityView = { id: entity.id, graphics: gfx }
      views.push(view)
    }

    this._entityViews = views

    return { entities: views }
  }

  clear(): void {
    for (const view of this._entityViews) {
      this._container.removeChild(view.graphics)
      view.graphics.destroy()
    }
    this._entityViews = []
  }
}