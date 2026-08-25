import { Container, Graphics, Sprite, type Texture } from 'pixi.js'
import type { AssetManifest } from '@genesis/shared'
import type { AssetStore } from '@genesis/assets'
import type { RenderEntity, RenderWorld } from '../model'
import type { CameraController } from '../camera'
import type { PixiAssetAdapter } from './PixiAssetAdapter'
import { DefaultPixiAssetAdapter } from './PixiAssetAdapter'
import type { EntityVisualCatalog } from './EntityVisualCatalog'
import { DefaultEntityVisualCatalog } from './DefaultEntityVisualCatalog'
import { projectRenderBounds, type RenderBounds } from './RenderGeometry'

export interface PixiEnvironmentRendererOptions {
  readonly width: number
  readonly height: number
  readonly cameraController?: CameraController
  readonly cameraAnchor?: Readonly<{ x: number; y: number }>
  readonly assetManifest?: AssetManifest
  readonly assetStore?: AssetStore
  readonly assetAdapter?: PixiAssetAdapter
  readonly visualCatalog?: EntityVisualCatalog
  readonly createGraphics?: () => Graphics
  readonly createContainer?: () => Container
  readonly createSprite?: (texture: Texture) => Sprite
  readonly onAssetApplication?: (event: { readonly assetId: string; readonly status: 'applied' | 'failed'; readonly reason?: 'resolution' | 'renderer' }) => void
}

/** World-level visuals; no environment asset is a Runtime entity. */
export class PixiEnvironmentRenderer {
  private readonly backgroundLayer: Container
  private readonly terrainLayer: Container
  private readonly cameraController: CameraController | null
  private readonly cameraAnchor: Readonly<{ x: number; y: number }>
  private readonly assetStore: AssetStore | null
  private readonly assetAdapter: PixiAssetAdapter | null
  private readonly createSprite: (texture: Texture) => Sprite
  private readonly onAssetApplication?: PixiEnvironmentRendererOptions['onAssetApplication']
  private readonly visualCatalog: EntityVisualCatalog
  private readonly createGraphics: () => Graphics
  private width: number
  private height: number
  private manifest: AssetManifest | null
  private readonly assetUris = new Map<string, string>()
  private readonly pendingAssetReplacements = new Set<string>()
  private backgroundSprite: Sprite | null = null
  private generation = 0

  constructor(private readonly root: Container, options: PixiEnvironmentRendererOptions) {
    const createContainer = options.createContainer ?? (() => new Container())
    this.backgroundLayer = createContainer()
    this.terrainLayer = createContainer()
    this.width = options.width
    this.height = options.height
    this.cameraController = options.cameraController ?? null
    this.cameraAnchor = options.cameraAnchor ?? { x: 0, y: 0 }
    this.assetStore = options.assetStore ?? null
    this.assetAdapter = options.assetAdapter ?? (this.assetStore ? new DefaultPixiAssetAdapter() : null)
    this.visualCatalog = options.visualCatalog ?? new DefaultEntityVisualCatalog()
    this.createGraphics = options.createGraphics ?? (() => new Graphics())
    this.createSprite = options.createSprite ?? ((texture) => new Sprite(texture))
    this.onAssetApplication = options.onAssetApplication
    this.manifest = options.assetManifest ?? null
    for (const entry of this.manifest?.entries ?? []) {
      if (entry.resource?.uri) this.assetUris.set(entry.assetId, entry.resource.uri)
    }
    this.root.addChild(this.backgroundLayer, this.terrainLayer)
    this.drawFallbackBackground()
  }

  render(world: RenderWorld): void {
    this.generation += 1
    const generation = this.generation
    const camera = this.cameraController?.update(world)
    if (camera) this.terrainLayer.position.set(this.cameraAnchor.x - camera.x, this.cameraAnchor.y - camera.y)
    this.terrainLayer.removeChildren().forEach(child => child.destroy())
    if (this.assetStore && this.assetAdapter) {
      for (const entity of world.entities) {
        if ((entity.type !== 'terrain' && entity.type !== 'platform') || !entity.position) continue
        const visual = this.environmentVisualEntry(entity)
        if (!visual) continue
        const bounds = projectRenderBounds(entity.position, this.visualCatalog.getVisual(entity.type))
        this.upgradeTerrain(visual.assetId, bounds, generation)
      }
    }
    const background = this.manifest?.entries.find(entry => entry.renderUsage === 'background-cover' && entry.status === 'resolved')
      ?? this.manifest?.entries.find(entry => entry.kind === 'background' && entry.status === 'resolved')
    const preservedBackground = background && this.pendingAssetReplacements.has(background.assetId) ? this.backgroundSprite : null
    this.backgroundLayer.removeChildren().forEach(child => {
      if (child !== preservedBackground) child.destroy()
    })
    if (preservedBackground) this.backgroundLayer.addChild(preservedBackground)
    if (background && this.assetStore && this.assetAdapter) this.upgradeBackground(background.assetId, generation)
  }

  setAssetManifest(manifest: AssetManifest | undefined): void {
    const nextUris = new Map<string, string>()
    for (const entry of manifest?.entries ?? []) {
      const nextUri = entry.resource?.uri
      if (!nextUri) continue
      nextUris.set(entry.assetId, nextUri)
      const previousUri = this.assetUris.get(entry.assetId)
      if (previousUri && nextUri !== previousUri) {
        this.pendingAssetReplacements.add(entry.assetId)
        this.assetAdapter?.invalidate?.(entry.assetId)
      }
    }
    this.assetUris.clear()
    for (const [assetId, uri] of nextUris) this.assetUris.set(assetId, uri)
    this.manifest = manifest ?? null
  }

  setViewport(width: number, height: number): void {
    this.width = Math.max(1, width)
    this.height = Math.max(1, height)
  }

  destroy(): void {
    this.generation += 1
    this.root.removeChild(this.backgroundLayer, this.terrainLayer)
    this.backgroundLayer.destroy({ children: true })
    this.terrainLayer.destroy({ children: true })
    this.assetAdapter?.clear()
  }

  private drawFallbackBackground(): void {
    const fallback = this.createGraphics()
    fallback.beginFill(0x0c0d10).drawRect(0, 0, this.width, this.height).endFill()
    this.backgroundLayer.addChild(fallback)
    this.backgroundSprite = null
  }

  /**
   * Select the smallest existing role-aware asset for one environment entity.
   * Ground keeps the environment material; a platform prefers its exact
   * entity-sprite requirement so the environment material is not reused for a
   * semantically different surface. Legacy manifests without renderUsage keep
   * the previous terrain fallback.
   */
  private environmentVisualEntry(entity: RenderEntity): AssetManifest['entries'][number] | undefined {
    const entries = this.manifest?.entries ?? []
    if (entity.type === 'platform') {
      const platform = entries.find(entry =>
        entry.status === 'resolved'
        && entry.target === 'entity'
        && entry.entityId === entity.id
        && (entry.renderUsage === 'entity-sprite' || entry.renderUsage === undefined),
      )
      if (platform) return platform
    }
    return entries.find(entry =>
      entry.status === 'resolved'
      && entry.target === 'environment'
      && (entry.renderUsage === 'ground-repeat-x' || (entry.renderUsage === undefined && entry.kind === 'terrain')),
    )
  }

  private resolveTexture(assetId: string): Promise<Texture> {
    const entry = this.manifest?.entries.find(item => item.assetId === assetId)
    if (!entry || !this.assetStore || !this.assetAdapter) return Promise.reject(new Error('environment asset unavailable'))
    const cached = this.assetStore.get(assetId)
    const resolved = cached ? Promise.resolve({ status: 'resolved' as const, resource: cached }) : this.assetStore.resolve(assetId, this.manifest!)
    return resolved.then(result => result.status === 'resolved' ? this.assetAdapter!.load(result.resource) : Promise.reject(new Error('environment asset unavailable')))
  }

  private upgradeTerrain(assetId: string, bounds: RenderBounds, generation: number): void {
    void this.resolveTexture(assetId).then(texture => {
      if (generation !== this.generation) return
      const sprite = this.createSprite(texture)
      sprite.x = bounds.x
      sprite.y = bounds.y
      // The generated image is skin; the Runtime/render bounds remain authoritative.
      sprite.width = bounds.width
      sprite.height = bounds.height
      this.terrainLayer.addChild(sprite)
      this.onAssetApplication?.({ assetId, status: 'applied' })
    }).catch(() => this.onAssetApplication?.({ assetId, status: 'failed', reason: 'resolution' }))
  }

  private upgradeBackground(assetId: string, generation: number): void {
    void this.resolveTexture(assetId).then(texture => {
      if (generation !== this.generation) return
      const scale = Math.max(this.width / (texture.width || this.width), this.height / (texture.height || this.height))
      const sprite = this.createSprite(texture)
      sprite.width = (texture.width || this.width) * scale; sprite.height = (texture.height || this.height) * scale
      sprite.x = (this.width - sprite.width) / 2; sprite.y = (this.height - sprite.height) / 2
      this.backgroundLayer.removeChildren().forEach(child => child.destroy())
      this.backgroundLayer.addChild(sprite)
      this.backgroundSprite = sprite
      this.pendingAssetReplacements.delete(assetId)
      this.onAssetApplication?.({ assetId, status: 'applied' })
    }).catch(() => this.onAssetApplication?.({ assetId, status: 'failed', reason: 'resolution' }))
  }
}
