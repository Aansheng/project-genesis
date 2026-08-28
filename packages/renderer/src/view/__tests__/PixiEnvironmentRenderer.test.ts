import { describe, expect, it, vi } from 'vitest'
import type { Container, Graphics, Sprite, Texture } from 'pixi.js'
import type { AssetManifest } from '@genesis/shared'
import type { AssetStore, AssetResolutionResult, ResolvedAssetResource } from '@genesis/assets'
import { PixiEnvironmentRenderer } from '../PixiEnvironmentRenderer'
import type { CameraController } from '../../camera'
import type { RenderWorld } from '../../model'

const resource: ResolvedAssetResource = {
  assetId: 'terrain-main',
  kind: 'terrain',
  target: 'environment',
  uri: '/terrain.png',
}

const manifest: AssetManifest = {
  entries: [{
    assetId: resource.assetId,
    kind: resource.kind,
    target: resource.target,
    status: 'resolved',
    resource: { uri: resource.uri },
  }],
}

const roleAwareManifest: AssetManifest = {
  entries: [
    {
      assetId: 'background-main',
      kind: 'background',
      target: 'environment',
      renderUsage: 'background-cover',
      status: 'resolved',
      resource: { uri: '/background.png' },
    },
    {
      assetId: 'terrain-main',
      kind: 'terrain',
      target: 'environment',
      renderUsage: 'ground-repeat-x',
      status: 'resolved',
      resource: { uri: '/ground.png' },
    },
    {
      assetId: 'entity-platform-primary',
      kind: 'prop',
      target: 'entity',
      entityId: 'platform',
      renderUsage: 'entity-sprite',
      status: 'resolved',
      resource: { uri: '/platform.png' },
    },
  ],
}

const topDownManifest: AssetManifest = {
  entries: [
    {
      assetId: 'arena-main',
      kind: 'terrain',
      target: 'environment',
      renderUsage: 'arena-fill',
      status: 'resolved',
      resource: { uri: '/arena.png' },
    },
  ],
}

function rootContainer(): Container & { children: Container[] } {
  const children: Container[] = []
  return {
    children,
    addChild(...items: Container[]) { children.push(...items); return items[items.length - 1] },
    removeChild(...items: Container[]) { items.forEach(item => { const index = children.indexOf(item); if (index >= 0) children.splice(index, 1) }); return items[0] },
    destroy() {},
  } as unknown as Container & { children: Container[] }
}

function environmentLayer(): Container & { children: Sprite[] } {
  const children: Sprite[] = []
  return {
    children,
    position: { x: 0, y: 0, set(x: number, y: number) { this.x = x; this.y = y } },
    addChild(...items: Sprite[]) { children.push(...items); return items[items.length - 1] },
    removeChildren() { return children.splice(0) },
    destroy() {},
  } as unknown as Container & { children: Sprite[] }
}

function store(result: AssetResolutionResult): AssetStore {
  return { get: () => undefined, has: () => false, resolve: async () => result, invalidate() {}, clear() {} }
}

function sprite(): Sprite {
  return { x: 0, y: 0, width: 0, height: 0, destroy() {} } as unknown as Sprite
}

function tilingSprite(width = 0, height = 0): Sprite & { tileScale: { x: number; y: number; set(x: number, y?: number): void } } {
  return {
    x: 0,
    y: 0,
    width,
    height,
    tileScale: {
      x: 1,
      y: 1,
      set(x: number, y = x) { this.x = x; this.y = y },
    },
    destroy() {},
  } as unknown as Sprite & { tileScale: { x: number; y: number; set(x: number, y?: number): void } }
}

function graphics(): Graphics {
  return { beginFill() { return this }, drawRect() { return this }, endFill() { return this }, destroy() {} } as unknown as Graphics
}

function world(): RenderWorld {
  return {
    entities: [
      { id: 'ground', type: 'terrain', position: { x: 160, y: 400 } },
      { id: 'platform', type: 'terrain', semanticName: 'Platform', position: { x: 300, y: 320 } },
    ],
  }
}

function legacyPlatformWorld(): RenderWorld {
  return {
    entities: [
      { id: 'ground', type: 'terrain', position: { x: 160, y: 400 } },
      { id: 'platform', type: 'platform', position: { x: 300, y: 320 } },
    ],
  }
}

async function flush(): Promise<void> {
  await Promise.resolve()
  await Promise.resolve()
  await new Promise(resolve => setTimeout(resolve, 0))
  await Promise.resolve()
}

describe('PixiEnvironmentRenderer geometry contract', () => {
  it('fits generated terrain to every existing world-space terrain bound', async () => {
    const root = rootContainer()
    const renderer = new PixiEnvironmentRenderer(root, {
      width: 800,
      height: 600,
      assetManifest: manifest,
      assetStore: store({ status: 'resolved', resource }),
      assetAdapter: { load: async () => ({ width: 1024, height: 1024 } as Texture), clear() {} },
      createSprite: sprite,
      createGraphics: graphics,
      createContainer: environmentLayer,
    })

    renderer.render(world())
    await flush()

    const actualTerrainLayer = root.children[1]
    expect(actualTerrainLayer.children).toHaveLength(2)
    const sprites = actualTerrainLayer.children as unknown as Sprite[]
    expect(sprites.map(item => ({ x: item.x, y: item.y, width: item.width, height: item.height }))).toEqual([
      { x: 160, y: 400, width: 64, height: 32 },
      { x: 252, y: 308, width: 96, height: 24 },
    ])
  })

  it('keeps terrain aligned when the camera moves', () => {
    const root = rootContainer()
    const camera = { update: () => ({ x: 50, y: 20 }) } as unknown as CameraController
    new PixiEnvironmentRenderer(root, {
      width: 800,
      height: 600,
      cameraController: camera,
      cameraAnchor: { x: 400, y: 300 },
      createGraphics: graphics,
      createContainer: environmentLayer,
    }).render(world())

    const terrainLayer = root.children[1] as unknown as Container & { position: { x: number; y: number } }
    expect(terrainLayer.position.x).toBe(350)
    expect(terrainLayer.position.y).toBe(280)
  })

  it('uses the platform entity visual instead of reusing the ground material', async () => {
    const root = rootContainer()
    const applied: Array<{ assetId: string; entityId?: string }> = []
    const renderer = new PixiEnvironmentRenderer(root, {
      width: 800,
      height: 600,
      assetManifest: roleAwareManifest,
      assetStore: store({ status: 'resolved', resource }),
      assetAdapter: { load: async () => ({ width: 128, height: 32 } as Texture), clear() {} },
      createSprite: sprite,
      createTilingSprite: (_texture, width, height) => tilingSprite(width, height),
      createGraphics: graphics,
      createContainer: environmentLayer,
      onAssetApplication: event => applied.push({ assetId: event.assetId, entityId: event.entityId }),
    })

    renderer.render(world())
    await flush()

    expect(applied.filter(event => event.assetId !== 'background-main')).toEqual([
      { assetId: 'terrain-main', entityId: 'ground' },
      { assetId: 'entity-platform-primary', entityId: 'platform' },
    ])
  })

  it('keeps legacy platform render types compatible with the role-aware selection', async () => {
    const root = rootContainer()
    const applied: Array<{ assetId: string; entityId?: string }> = []
    const renderer = new PixiEnvironmentRenderer(root, {
      width: 800,
      height: 600,
      assetManifest: roleAwareManifest,
      assetStore: store({ status: 'resolved', resource }),
      assetAdapter: { load: async () => ({ width: 128, height: 32 } as Texture), clear() {} },
      createSprite: sprite,
      createTilingSprite: (_texture, width, height) => tilingSprite(width, height),
      createGraphics: graphics,
      createContainer: environmentLayer,
      onAssetApplication: event => applied.push({ assetId: event.assetId, entityId: event.entityId }),
    })

    renderer.render(legacyPlatformWorld())
    await flush()

    expect(applied).toContainEqual({ assetId: 'entity-platform-primary', entityId: 'platform' })
  })

  it('keeps the current environment target when texture loading crosses a render tick', async () => {
    const root = rootContainer()
    const applied: Array<{ assetId: string; entityId?: string }> = []
    const textureResolvers: Array<(texture: Texture) => void> = []
    const renderer = new PixiEnvironmentRenderer(root, {
      width: 800,
      height: 600,
      assetManifest: roleAwareManifest,
      assetStore: store({ status: 'resolved', resource }),
      assetAdapter: { load: () => new Promise<Texture>(resolve => { textureResolvers.push(resolve) }), clear() {} },
      createSprite: sprite,
      createTilingSprite: (_texture, width, height) => tilingSprite(width, height),
      createGraphics: graphics,
      createContainer: environmentLayer,
      onAssetApplication: event => applied.push({ assetId: event.assetId, entityId: event.entityId }),
    })

    renderer.render(world())
    renderer.render(world())
    await Promise.resolve()
    await Promise.resolve()
    for (const resolveTexture of textureResolvers) resolveTexture({ width: 128, height: 32 } as Texture)
    await flush()

    expect(applied).toContainEqual({ assetId: 'terrain-main', entityId: 'ground' })
    expect(applied).toContainEqual({ assetId: 'entity-platform-primary', entityId: 'platform' })
  })

  it('tiles ground-repeat-x across the current camera-visible ground plane without widening a platform', async () => {
    const root = rootContainer()
    const camera = { update: () => ({ x: 500, y: 0 }) } as unknown as CameraController
    const tiles: Array<Sprite & { tileScale: { x: number; y: number } }> = []
    const renderer = new PixiEnvironmentRenderer(root, {
      width: 800,
      height: 600,
      cameraController: camera,
      cameraAnchor: { x: 400, y: 300 },
      assetManifest: roleAwareManifest,
      assetStore: store({ status: 'resolved', resource }),
      assetAdapter: { load: async () => ({ width: 128, height: 32 } as Texture), clear() {} },
      createSprite: sprite,
      createTilingSprite: (_texture, width, height) => {
        const tile = tilingSprite(width, height)
        tiles.push(tile)
        return tile
      },
      createGraphics: graphics,
      createContainer: environmentLayer,
    })

    renderer.render(world())
    await flush()

    expect(tiles).toHaveLength(1)
    expect(tiles[0]).toMatchObject({ x: 100, y: 400, width: 800, height: 32 })
    expect(tiles[0]!.tileScale).toMatchObject({ x: 1, y: 1 })
    const sprites = (root.children[1] as unknown as Container & { children: Sprite[] }).children
    expect(sprites).toHaveLength(2)
    expect(sprites[1]).toMatchObject({ x: 252, y: 308, width: 96, height: 24 })
  })

  it('tiles a top-down arena surface across both axes without using a Runtime terrain plane', async () => {
    const root = rootContainer()
    const tiles: Array<Sprite & { tileScale: { x: number; y: number } }> = []
    const applied: Array<{ assetId: string; entityId?: string }> = []
    const arenaResource: ResolvedAssetResource = {
      assetId: 'arena-main', kind: 'terrain', target: 'environment', uri: '/arena.png',
    }
    const renderer = new PixiEnvironmentRenderer(root, {
      width: 800,
      height: 600,
      assetManifest: topDownManifest,
      assetStore: store({ status: 'resolved', resource: arenaResource }),
      assetAdapter: { load: async () => ({ width: 128, height: 64 } as Texture), clear() {} },
      createTilingSprite: (_texture, width, height) => {
        const tile = tilingSprite(width, height)
        tiles.push(tile)
        return tile
      },
      createGraphics: graphics,
      createContainer: environmentLayer,
      onAssetApplication: event => applied.push({ assetId: event.assetId, entityId: event.entityId }),
    })

    renderer.render({
      spatialMode: 'top-down',
      entities: [{ id: 'ground', type: 'terrain', position: { x: 160, y: 400 } }],
    })
    await flush()

    expect(tiles).toHaveLength(1)
    expect(tiles[0]).toMatchObject({ x: 0, y: 0, width: 800, height: 600 })
    expect(tiles[0]!.tileScale).toMatchObject({ x: 0.5, y: 0.5 })
    expect(applied).toEqual([{ assetId: 'arena-main' }])
  })

  it('shows a resource-independent two-dimensional arena fallback before arena art resolves', () => {
    const root = rootContainer()
    const renderer = new PixiEnvironmentRenderer(root, {
      width: 800,
      height: 600,
      createGraphics: graphics,
      createContainer: environmentLayer,
    })

    renderer.render({ spatialMode: 'top-down', entities: [] })

    expect((root.children[1] as unknown as Container & { children: Graphics[] }).children).toHaveLength(1)
  })

  it('invalidates only a changed environment resource when the manifest is rebound', () => {
    const root = rootContainer()
    const invalidate = vi.fn()
    const renderer = new PixiEnvironmentRenderer(root, {
      width: 800,
      height: 600,
      assetManifest: manifest,
      assetAdapter: { load: async () => ({ width: 1024, height: 1024 } as Texture), invalidate, clear() {} },
      createGraphics: graphics,
      createContainer: environmentLayer,
    })

    renderer.setAssetManifest({ entries: [{ ...manifest.entries[0]!, resource: { uri: '/night.png' } }] })

    expect(invalidate).toHaveBeenCalledOnce()
    expect(invalidate).toHaveBeenCalledWith('terrain-main')
  })
})
