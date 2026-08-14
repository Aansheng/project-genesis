/**
 * PixiEntityRenderer — renders a RenderWorld onto a PixiJS canvas
 * using basic Graphics shapes (no sprites, no textures).
 *
 * Rendering is driven by an EntityVisualCatalog:
 *   entity.type
 *     ↓
 *   catalog.getVisual(entityType)
 *     ↓
 *   EntityVisualDefinition { width, height, shape }
 *     ↓
 *   Graphics (rectangle or circle at entity.position.x/y)
 *
 * Rules:
 *   - If entity.position exists: draw the shape at (x, y)
 *   - If no position: do not draw
 *   - If no catalog provided: fall back to 20×20 rectangle (backward compatible)
 *
 * Constraints (WO-S9-004, WO-S9-007):
 *   - No sprites
 *   - No textures
 *   - No assets
 *   - No animation
 *   - No gameplay rendering
 *   - Graphics only
 */

import { Container, Graphics } from 'pixi.js'
import type { RenderWorld } from '../model'
import type { RenderEntityView } from './RenderEntityView'
import type { RenderWorldView } from './RenderWorldView'
import type { EntityVisualCatalog } from './EntityVisualCatalog'
import type { EntityVisualDefinition } from './EntityVisualDefinition'
import type { CameraController } from '../camera'

/** Default fallback visual definition (20×20 rectangle). */
const DEFAULT_VISUAL: EntityVisualDefinition = Object.freeze({
  width: 20,
  height: 20,
  shape: 'rectangle',
})

/** Fill color for entity shapes. */
const ENTITY_COLOR = 0x4fc3f7

export interface PixiEntityRendererOptions {
  /**
   * Optional factory for creating PIXI.Graphics instances.
   * Defaults to `new Graphics()`. Provided for testability
   * so tests can inject a mock without depending on a real canvas context.
   */
  readonly createGraphics?: () => Graphics

  /**
   * Optional catalog for entity visual definitions.
   * When provided, entity type determines the rendered shape and size.
   * When omitted, all entities render as 20×20 rectangles (backward compatible).
   */
  readonly catalog?: EntityVisualCatalog

  /**
   * Optional camera controller.
   * When provided, the container is offset by -camera.x / -camera.y
   * before rendering entities, creating a camera-follow effect.
   */
  readonly cameraController?: CameraController
}

export interface PixiEntityRenderer {
  render(world: RenderWorld): RenderWorldView
  clear(): void
}

export class DefaultPixiEntityRenderer implements PixiEntityRenderer {
  private readonly _container: Container
  private readonly _createGraphics: () => Graphics
  private readonly _catalog: EntityVisualCatalog | null
  private readonly _cameraController: CameraController | null
  private _entityViews: RenderEntityView[] = []

  constructor(
    container: Container,
    options?: PixiEntityRendererOptions
  ) {
    this._container = container
    this._createGraphics =
      options?.createGraphics ?? (() => new Graphics())
    this._catalog = options?.catalog ?? null
    this._cameraController = options?.cameraController ?? null
  }

  // ─── Public API ─────────────────────────────────────────────────────

  render(world: RenderWorld): RenderWorldView {
    // Apply camera offset before rendering
    if (this._cameraController) {
      const camera = this._cameraController.update(world)
      this._container.position.x = -camera.x
      this._container.position.y = -camera.y
    }

    // Clear previous render
    this.clear()

    const views: RenderEntityView[] = []

    for (const entity of world.entities) {
      if (!entity.position) continue

      const gfx = this._createGraphics()
      const visual = this.resolveVisual(entity.type)

      gfx.beginFill(ENTITY_COLOR)

      if (visual.shape === 'circle') {
        const radius = Math.min(visual.width, visual.height) / 2
        gfx.drawCircle(0, 0, radius)
      } else {
        gfx.drawRect(0, 0, visual.width, visual.height)
      }

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

  // ─── Private ────────────────────────────────────────────────────────

  /**
   * Resolve the visual definition for an entity type.
   * Uses the catalog if available; falls back to default 20×20 rectangle.
   */
  private resolveVisual(entityType: string): EntityVisualDefinition {
    if (this._catalog) {
      return this._catalog.getVisual(entityType)
    }
    return DEFAULT_VISUAL
  }
}