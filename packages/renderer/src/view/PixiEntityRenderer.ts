/**
 * PixiEntityRenderer — renders a RenderWorld onto a PixiJS canvas
 * using basic Graphics shapes with per-entity-type colors and sizes, with an
 * optional asynchronous asset-to-Sprite upgrade.
 *
 * Rendering is driven by an EntityVisualCatalog and an optional
 * PlatformTileCatalog:
 *   entity.type
 *     ↓
 *   catalog.getVisual(entityType) → shape (circle | rectangle)
 *     ↓
 *   tileCatalog.getTile(entityType) → dimensions (width, height)
 *     ↓
 *   Graphics draws the shape with type-specific color
 *
 * Per-type colors (WO-S9-016):
 *   player:    0x4fc3f7  (light blue, circle)
 *   terrain:   0x8d6e63  (brown — ground)
 *   goal:      0xffd54f  (yellow — flag)
 *   platform:  0x66bb6a  (green — platforms)
 *   enemy:     0xef5350  (red — enemy)
 *   item:      0xffd54f  (yellow — collectible)
 *   checkpoint: 0xce93d8 (purple — marker)
 *   default:   0x4fc3f7  (light blue — same as original)
 *
 * Rules:
 *   - If entity.position exists: draw the shape at (x, y)
 *   - If no position: do not draw
 *   - If no catalog provided: fall back to 20×20 rectangle (backward compatible)
 *
 * Primitive Graphics remains the fallback for all missing or failed assets.
 */

import { Container, Graphics, Sprite, type Texture } from 'pixi.js'
import type { AssetManifest, AssetManifestEntry, AssetVisualState, WorldSpatialMode } from '@genesis/shared'
import type { AssetStore } from '@genesis/assets'
import type { RenderWorld } from '../model'
import type { RenderEntity } from '../model'
import type { RenderEntityView } from './RenderEntityView'
import type { RenderWorldView } from './RenderWorldView'
import type { EntityVisualCatalog } from './EntityVisualCatalog'
import type { EntityVisualDefinition } from './EntityVisualDefinition'
import type { PlatformTileCatalog } from './world/PlatformTileCatalog'
import type { CameraController } from '../camera'
import type { PixiAssetAdapter } from './PixiAssetAdapter'
import { DefaultPixiAssetAdapter } from './PixiAssetAdapter'
import { getRenderAnchor, projectRenderBounds } from './RenderGeometry'

/** Default fallback visual definition (20×20 rectangle). */
const DEFAULT_VISUAL: EntityVisualDefinition = Object.freeze({
  width: 20,
  height: 20,
  shape: 'rectangle',
  anchor: 'top-left',
})

/** Bounded Player-only cadence for switching between separate run images. */
const PLAYER_RUN_FRAME_TICKS = 8

/**
 * Per-entity-type fill colors.
 * Makes the platform world visually distinct per entity type.
 */
const ENTITY_COLORS: Record<string, number> = {
  player: 0x4fc3f7,
  terrain: 0x8d6e63,
  goal: 0xffd54f,
  platform: 0x66bb6a,
  enemy: 0xef5350,
  item: 0xffd54f,
  checkpoint: 0xce93d8,
}

/** Default entity color (used when no specific mapping exists). */
const DEFAULT_ENTITY_COLOR = 0x4fc3f7

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
   * Optional tile catalog for platform-specific tile dimensions.
   * When provided alongside a catalog, tile dimensions override the
   * visual catalog's dimensions for known tile types.
   */
  readonly tileCatalog?: PlatformTileCatalog

  /**
   * Optional camera controller.
   * When provided, the container is offset by -camera.x / -camera.y
   * before rendering entities, creating a camera-follow effect.
   */
  readonly cameraController?: CameraController

  /** World-space camera position is rendered relative to this viewport anchor. */
  readonly cameraAnchor?: Readonly<{ x: number; y: number }>

  /** Optional asset inputs. Omit both to retain primitive-only rendering. */
  readonly assetManifest?: AssetManifest
  readonly assetStore?: AssetStore
  readonly assetAdapter?: PixiAssetAdapter
  readonly createSprite?: (texture: Texture) => Sprite
  readonly onAssetApplication?: (event: {
    readonly assetId: string
    readonly entityId: string
    readonly status: 'applied' | 'failed'
    readonly reason?: 'resolution' | 'renderer'
  }) => void
}

export interface PixiEntityRenderer {
  render(world: RenderWorld): RenderWorldView
  clear(): void
  destroy?(): void
  setAssetManifest?(manifest: AssetManifest | undefined): void
}

export class DefaultPixiEntityRenderer implements PixiEntityRenderer {
  private readonly _container: Container
  private readonly _createGraphics: () => Graphics
  private readonly _catalog: EntityVisualCatalog | null
  private readonly _tileCatalog: PlatformTileCatalog | null
  private readonly _cameraController: CameraController | null
  private readonly _cameraAnchor: Readonly<{ x: number; y: number }>
  private _assetManifest: AssetManifest | null
  private _assetUris = new Map<string, string>()
  private readonly _pendingAssetReplacements = new Set<string>()
  private readonly _assetStore: AssetStore | null
  private readonly _assetAdapter: PixiAssetAdapter | null
  private readonly _createSprite: (texture: Texture) => Sprite
  private readonly _onAssetApplication?: PixiEntityRendererOptions['onAssetApplication']
  private _entityViews: RenderEntityView[] = []
  private _renderGeneration = 0
  private readonly _runFrameTicks = new Map<string, number>()

  constructor(
    container: Container,
    options?: PixiEntityRendererOptions
  ) {
    this._container = container
    this._createGraphics =
      options?.createGraphics ?? (() => new Graphics())
    this._catalog = options?.catalog ?? null
    this._tileCatalog = options?.tileCatalog ?? null
    this._cameraController = options?.cameraController ?? null
    this._cameraAnchor = options?.cameraAnchor ?? { x: 0, y: 0 }
    this._assetManifest = options?.assetManifest ?? null
    for (const entry of this._assetManifest?.entries ?? []) {
      if (entry.resource?.uri) this._assetUris.set(entry.assetId, entry.resource.uri)
    }
    this._assetStore = options?.assetStore ?? null
    this._assetAdapter = options?.assetAdapter ??
      (this._assetStore ? new DefaultPixiAssetAdapter() : null)
    this._createSprite = options?.createSprite ?? ((texture) => new Sprite(texture))
    this._onAssetApplication = options?.onAssetApplication
  }

  // ─── Public API ─────────────────────────────────────────────────────

  render(world: RenderWorld): RenderWorldView {
    // Apply camera offset before rendering
    if (this._cameraController) {
      const camera = this._cameraController.update(world)
      this._container.position.x = this._cameraAnchor.x - camera.x
      this._container.position.y = this._cameraAnchor.y - camera.y
    }

    // Keep an already-visible generated Sprite while a state/frame replacement
    // texture is loading. Primitive-only views still follow the existing
    // clear-and-render path.
    const preservedViews = this.detachReusableAssetViews(world)

    // Clear previous render
    this.clear()
    const views: RenderEntityView[] = []

    for (const entity of world.entities) {
      if (!entity.position) continue
      if (this.isEnvironmentRendered(entity, world.spatialMode)) continue

      const preserved = preservedViews.get(entity.id)
      if (preserved?.sprite) {
        const visual = this.resolveVisual(entity.type, world.spatialMode)
        const presentationFrame = this.resolvePresentationFrame(entity)
        const assetEntry = this.resolveAssetEntry(entity.id, entity.presentationState, presentationFrame)
        this.syncSpriteTransform(preserved.sprite, entity.position, entity.velocity, entity.presentationDirection, world.spatialMode)
        this._container.addChild(preserved.sprite)
        views.push(preserved)
        this.tryUpgradeToSprite(entity.id, preserved, visual, entity.position, entity.velocity, entity.presentationDirection, assetEntry, world.spatialMode)
        continue
      }

      const gfx = this._createGraphics()
      const visual = this.resolveVisual(entity.type, world.spatialMode)
      const color = this.resolveColor(entity.type)
      const presentationFrame = this.resolvePresentationFrame(entity)
      const assetEntry = this.resolveAssetEntry(entity.id, entity.presentationState, presentationFrame)

      gfx.beginFill(color)

      const bounds = projectRenderBounds(entity.position, visual)
      if (visual.shape === 'circle') {
        const radius = Math.min(visual.width, visual.height) / 2
        gfx.drawCircle(visual.width / 2, visual.height / 2, radius)
      } else {
        gfx.drawRect(0, 0, visual.width, visual.height)
      }

      gfx.endFill()

      // Position the graphics in world space
      gfx.x = bounds.x
      gfx.y = bounds.y

      this._container.addChild(gfx)

      const view: RenderEntityView = {
        id: entity.id,
        ...(assetEntry ? { assetId: assetEntry.assetId } : {}),
        graphics: gfx,
        displayObject: gfx,
      }
      views.push(view)
      this.tryUpgradeToSprite(entity.id, view, visual, entity.position, entity.velocity, entity.presentationDirection, assetEntry, world.spatialMode)
    }

    this._entityViews = views

    return { entities: views }
  }

  private isEnvironmentRendered(entity: RenderEntity, spatialMode?: WorldSpatialMode): boolean {
    const entityType = entity.type
    if (entityType !== 'terrain' && entityType !== 'platform') return false
    // Top-down terrain is a world-level arena surface. Keep terrain-like props
    // available to the entity renderer instead of collapsing the whole scene
    // into a horizontal ground strip. A semantic Ground/Platform plane is
    // intentionally omitted; its visual role is the arena-fill asset.
    if (spatialMode === 'top-down') {
      const semanticName = entity.semanticName?.trim().toLocaleLowerCase()
      return entityType === 'platform' || semanticName === 'ground' || semanticName?.includes('ground') === true
    }
    return this._assetManifest?.entries.some(entry =>
      entry.target === 'environment' && entry.kind === 'terrain' && entry.status === 'resolved',
    ) ?? false
  }

  clear(): void {
    this._renderGeneration += 1
    for (const view of this._entityViews) {
      if (view.sprite) {
        this._container.removeChild(view.sprite)
        view.sprite.destroy({ texture: false, baseTexture: false })
      } else {
        this._container.removeChild(view.graphics)
        view.graphics.destroy()
      }
    }
    this._entityViews = []
  }

  destroy(): void {
    this.clear()
    this._assetAdapter?.clear()
  }

  setAssetManifest(manifest: AssetManifest | undefined): void {
    const nextUris = new Map<string, string>()
    for (const entry of manifest?.entries ?? []) {
      const nextUri = entry.resource?.uri
      if (!nextUri) continue
      nextUris.set(entry.assetId, nextUri)
      const previousUri = this._assetUris.get(entry.assetId)
      if (previousUri && nextUri !== previousUri) {
        this._pendingAssetReplacements.add(entry.assetId)
        this._assetAdapter?.invalidate?.(entry.assetId)
      }
    }
    this._assetUris = nextUris
    this._assetManifest = manifest ?? null
  }

  private detachReusableAssetViews(world: RenderWorld): Map<string, RenderEntityView> {
    const preserved = new Map<string, RenderEntityView>()
    const currentEntityIds = new Set(
      world.entities
        .filter(entity => entity.position && !this.isEnvironmentRendered(entity, world.spatialMode))
        .map(entity => entity.id),
    )
    const remaining: RenderEntityView[] = []
    for (const view of this._entityViews) {
      if (currentEntityIds.has(view.id) && view.sprite) {
        this._container.removeChild(view.sprite)
        preserved.set(view.id, view)
      } else {
        remaining.push(view)
      }
    }
    this._entityViews = remaining
    return preserved
  }

  private tryUpgradeToSprite(
    entityId: string,
    view: RenderEntityView,
    visual: EntityVisualDefinition,
    position: NonNullable<RenderEntity['position']>,
    velocity?: Readonly<{ x: number; y: number }>,
    presentationDirection?: RenderEntity['presentationDirection'],
    entry?: AssetManifestEntry,
    spatialMode?: WorldSpatialMode,
  ): void {
    if (!this._assetManifest || !this._assetStore || !this._assetAdapter) return

    if (!entry) return

    if (view.sprite && view.assetId === entry.assetId && !this._pendingAssetReplacements.has(entry.assetId)) {
      this.syncSpriteTransform(view.sprite, position, velocity, presentationDirection, spatialMode)
      return
    }

    const resource = this._assetStore.get(entry.assetId)
    const resolved = resource
      ? Promise.resolve({ status: 'resolved' as const, resource })
      : this._assetStore.resolve(entry.assetId, this._assetManifest)

    void resolved
      .then(result => result.status === 'resolved'
        ? this._assetAdapter!.load(result.resource)
        : Promise.reject(new Error('asset unavailable')))
      .then(texture => {
        if (!this._entityViews.includes(view)) return
        try {
          this.upgrade(view, texture, visual, position, velocity, presentationDirection, spatialMode, entry.assetId)
          this._pendingAssetReplacements.delete(entry.assetId)
          this._onAssetApplication?.({ assetId: entry.assetId, entityId, status: 'applied' })
        } catch {
          this._onAssetApplication?.({ assetId: entry.assetId, entityId, status: 'failed', reason: 'renderer' })
        }
      })
      .catch(() => {
        // The primitive remains visible; failed resources never blank an entity.
        this._onAssetApplication?.({ assetId: entry.assetId, entityId, status: 'failed', reason: 'resolution' })
      })
  }

  private resolveAssetEntry(entityId: string, presentationState?: AssetVisualState, presentationFrame?: number): AssetManifestEntry | undefined {
    const entries = this._assetManifest?.entries.filter(item => item.entityId === entityId) ?? []
    return entries.find(item => item.presentationState === presentationState && item.presentationFrame === presentationFrame)
      ?? entries.find(item => item.presentationState === presentationState && item.presentationFrame === undefined)
      ?? entries.find(item => !item.presentationState)
      ?? entries[0]
  }

  private resolvePresentationFrame(entity: RenderEntity): number | undefined {
    if (entity.type !== 'player' || entity.presentationState !== 'run') {
      this._runFrameTicks.delete(entity.id)
      return undefined
    }

    const frames = (this._assetManifest?.entries ?? [])
      .filter(entry => entry.entityId === entity.id && entry.presentationState === 'run' && entry.presentationFrame !== undefined)
      .sort((left, right) => (left.presentationFrame ?? 0) - (right.presentationFrame ?? 0))
    if (frames.length < 2) return undefined

    const tick = this._runFrameTicks.get(entity.id) ?? 0
    this._runFrameTicks.set(entity.id, tick + 1)
    return frames[Math.floor(tick / PLAYER_RUN_FRAME_TICKS) % frames.length]?.presentationFrame
  }

  private upgrade(
    view: RenderEntityView,
    texture: Texture,
    visual: EntityVisualDefinition,
    position: NonNullable<RenderEntity['position']>,
    velocity?: Readonly<{ x: number; y: number }>,
    presentationDirection?: RenderEntity['presentationDirection'],
    spatialMode?: WorldSpatialMode,
    assetId?: string,
  ): void {
    const sprite = this._createSprite(texture)
    const anchor = getRenderAnchor(visual)
    sprite.anchor.set(anchor.x, anchor.y)
    const nativeWidth = texture.width || visual.width
    const nativeHeight = texture.height || visual.height
    const scale = Math.min(visual.width / nativeWidth, visual.height / nativeHeight)
    sprite.width = nativeWidth * scale
    sprite.height = nativeHeight * scale
    this.syncSpriteTransform(sprite, position, velocity, presentationDirection, spatialMode)

    const previousDisplay = view.sprite ?? view.graphics
    this._container.removeChild(previousDisplay)
    if (view.sprite) view.sprite.destroy({ texture: false, baseTexture: false })
    else view.graphics.destroy()
    this._container.addChild(sprite)
    Object.assign(view, { ...(assetId ? { assetId } : {}), sprite, displayObject: sprite })
  }

  private syncSpriteTransform(
    sprite: Sprite,
    position: NonNullable<RenderEntity['position']>,
    velocity?: Readonly<{ x: number; y: number }>,
    presentationDirection?: RenderEntity['presentationDirection'],
    spatialMode?: WorldSpatialMode,
  ): void {
    if (spatialMode === 'top-down') {
      sprite.scale.x = Math.abs(sprite.scale.x)
      if (presentationDirection) {
        sprite.rotation = directionToRotation(presentationDirection)
      }
    } else {
      sprite.scale.x = Math.abs(sprite.scale.x) * (velocity?.x && velocity.x < 0 ? -1 : 1)
    }
    sprite.x = position.x
    sprite.y = position.y
  }

  // ─── Private ────────────────────────────────────────────────────────

  /**
   * Resolve the visual definition for an entity type.
   * Uses the catalog if available, falling back to tile catalog, then
   * default 20×20 rectangle.
   */
  private resolveVisual(entityType: string, spatialMode?: WorldSpatialMode): EntityVisualDefinition {
    if (this._catalog) {
      return this.applySpatialVisual(entityType, this._catalog.getVisual(entityType), spatialMode)
    }
    if (this._tileCatalog) {
      const tile = this._tileCatalog.getTile(entityType)
      return this.applySpatialVisual(entityType, {
        width: tile.width,
        height: tile.height,
        shape: 'rectangle',
      }, spatialMode)
    }
    return this.applySpatialVisual(entityType, DEFAULT_VISUAL, spatialMode)
  }

  private applySpatialVisual(
    entityType: string,
    visual: EntityVisualDefinition,
    spatialMode?: WorldSpatialMode,
  ): EntityVisualDefinition {
    if (spatialMode !== 'top-down' || !TOP_DOWN_ACTOR_TYPES.has(entityType)) return visual
    return { ...visual, anchor: 'center' }
  }

  /**
   * Resolve the fill color for an entity type.
   * Uses the per-type color map; falls back to default light blue.
   */
  private resolveColor(entityType: string): number {
    return ENTITY_COLORS[entityType] ?? DEFAULT_ENTITY_COLOR
  }
}

const TOP_DOWN_ACTOR_TYPES = new Set(['player', 'enemy', 'npc', 'animal', 'merchant', 'boss'])

function directionToRotation(direction: NonNullable<RenderEntity['presentationDirection']>): number {
  switch (direction) {
    case 'right': return Math.PI / 2
    case 'up': return Math.PI
    case 'left': return -Math.PI / 2
    default: return 0
  }
}
