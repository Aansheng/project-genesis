import { describe, expect, it, vi } from 'vitest'
import type { Container, Graphics, Sprite, Texture } from 'pixi.js'
import type { AssetManifest } from '@genesis/shared'
import type { AssetStore, AssetResolutionResult, ResolvedAssetResource } from '@genesis/assets'
import { DefaultPixiEntityRenderer } from '../PixiEntityRenderer'
import type { PixiAssetAdapter } from '../PixiAssetAdapter'
import type { RenderWorld } from '../../model'

const resource: ResolvedAssetResource = {
  assetId: 'player-asset', kind: 'character', target: 'entity', entityId: 'player', uri: '/player.png',
}
const manifest: AssetManifest = { entries: [{ assetId: resource.assetId, kind: resource.kind, target: resource.target, entityId: resource.entityId, status: 'resolved', resource: { uri: resource.uri } }] }
const environmentManifest: AssetManifest = { entries: [{ assetId: 'terrain-asset', kind: 'terrain', target: 'environment', status: 'resolved', resource: { uri: '/terrain.png' } }] }

function graphics(): Graphics {
  return { x: 0, y: 0, beginFill() {}, drawRect() {}, drawCircle() {}, endFill() {}, destroy() {} } as unknown as Graphics
}

function container(): Container & { children: unknown[] } {
  const children: unknown[] = []
  return {
    children,
    addChild(child: unknown) { children.push(child); return child },
    removeChild(child: unknown) { const index = children.indexOf(child); if (index >= 0) children.splice(index, 1); return child },
  } as unknown as Container & { children: unknown[] }
}

function world(): RenderWorld {
  return { entities: [{ id: 'player', type: 'player', position: { x: 10, y: 20 } }] }
}

function terrainWorld(): RenderWorld {
  return { entities: [{ id: 'ground', type: 'terrain', position: { x: 10, y: 20 } }] }
}

function store(result: AssetResolutionResult): AssetStore {
  return { get: () => undefined, has: () => false, resolve: async () => result, invalidate() {}, clear() {} }
}

function sprite(): Sprite {
  return { x: 0, y: 0, width: 0, height: 0, rotation: 0, scale: { x: 1, y: 1 }, anchor: { set() {} }, destroy() {} } as unknown as Sprite
}

describe('Pixi sprite rendering foundation', () => {
  it('does not draw primitive terrain over a resolved environment terrain asset', () => {
    const c = container()
    const renderer = new DefaultPixiEntityRenderer(c, {
      createGraphics: graphics,
      assetManifest: environmentManifest,
      assetStore: store({ status: 'resolved', resource: { assetId: 'terrain-asset', kind: 'terrain', target: 'environment', uri: '/terrain.png' } }),
      assetAdapter: { load: async () => ({ width: 64, height: 32 } as Texture), clear() {} },
      createSprite: sprite,
    })

    expect(renderer.render(terrainWorld()).entities).toHaveLength(0)
    expect(c.children).toHaveLength(0)
  })

  it('omits a top-down Ground plane while keeping terrain props eligible for entity rendering', () => {
    const renderer = new DefaultPixiEntityRenderer(container(), {
      createGraphics: graphics,
      assetManifest: environmentManifest,
    })

    expect(renderer.render({
      spatialMode: 'top-down',
      entities: [{ id: 'ground', type: 'terrain', semanticName: 'Ground', position: { x: 10, y: 20 } }],
    }).entities).toHaveLength(0)
    expect(renderer.render({
      spatialMode: 'top-down',
      entities: [{ id: 'tree', type: 'terrain', semanticName: 'Oak Tree', position: { x: 10, y: 20 } }],
    }).entities).toHaveLength(1)
  })

  it('keeps the primitive visible while pending, then upgrades it', async () => {
    let resolveTexture!: (texture: Texture) => void
    let graphicsDestroyCount = 0
    const adapter: PixiAssetAdapter = { load: () => new Promise(resolve => { resolveTexture = resolve }), clear() {} }
    const c = container()
    const renderer = new DefaultPixiEntityRenderer(c, {
      createGraphics: () => ({ ...graphics(), destroy() { graphicsDestroyCount++ } } as unknown as Graphics),
      assetManifest: manifest,
      assetStore: store({ status: 'resolved', resource }),
      assetAdapter: adapter,
      createSprite: sprite,
    })

    const view = renderer.render(world()).entities[0]
    expect(view.displayObject).toBe(view.graphics)
    expect(c.children).toEqual([view.graphics])
    await Promise.resolve()
    resolveTexture({ width: 24, height: 24 } as Texture)
    await new Promise(resolve => setTimeout(resolve, 0))
    await Promise.resolve()
    expect(view.sprite).toBeDefined()
    expect(view.displayObject).toBe(view.sprite)
    expect(c.children).toEqual([view.sprite])
    expect(view.sprite?.x).toBe(10)
    expect(view.sprite?.y).toBe(20)
    renderer.clear()
    expect(graphicsDestroyCount).toBe(1)
  })

  it('reports the renderer application only after the sprite is active', async () => {
    let resolveTexture!: (texture: Texture) => void
    const applications: Array<{ assetId: string; entityId: string; status: string }> = []
    const adapter: PixiAssetAdapter = { load: () => new Promise(resolve => { resolveTexture = resolve }), clear() {} }
    const renderer = new DefaultPixiEntityRenderer(container(), {
      createGraphics: graphics,
      assetManifest: manifest,
      assetStore: store({ status: 'resolved', resource }),
      assetAdapter: adapter,
      createSprite: sprite,
      onAssetApplication: event => applications.push(event),
    })

    const view = renderer.render(world()).entities[0]
    expect(applications).toHaveLength(0)
    await Promise.resolve()
    resolveTexture({ width: 24, height: 24 } as Texture)
    await new Promise(resolve => setTimeout(resolve, 0))
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
    expect(view.sprite).toBeDefined()
    expect(applications).toEqual([{ assetId: 'player-asset', entityId: 'player', status: 'applied' }])
  })

  it('applies a generated presentation-state asset after a later render tick', async () => {
    let resolveTexture!: (texture: Texture) => void
    const runResource: ResolvedAssetResource = {
      assetId: 'player-run', kind: 'character', target: 'entity', entityId: 'player', uri: '/player-run.png',
    }
    const runManifest: AssetManifest = {
      entries: [{
        assetId: runResource.assetId,
        kind: runResource.kind,
        target: runResource.target,
        entityId: runResource.entityId,
        presentationState: 'run',
        status: 'resolved',
        resource: { uri: runResource.uri },
      }],
    }
    const applications: Array<{ assetId: string; entityId: string; status: string }> = []
    const adapter: PixiAssetAdapter = {
      load: () => new Promise(resolve => { resolveTexture = resolve }),
      clear() {},
    }
    const renderer = new DefaultPixiEntityRenderer(container(), {
      createGraphics: graphics,
      assetManifest: runManifest,
      assetStore: store({ status: 'resolved', resource: runResource }),
      assetAdapter: adapter,
      createSprite: sprite,
      onAssetApplication: event => applications.push(event),
    })
    const runWorld: RenderWorld = {
      entities: [{ id: 'player', type: 'player', position: { x: 10, y: 20 }, presentationState: 'run', velocity: { x: 3, y: 0 } }],
    }

    const first = renderer.render(runWorld).entities[0]
    renderer.render(runWorld)
    await new Promise(resolve => setTimeout(resolve, 0))
    resolveTexture({ width: 24, height: 24 } as Texture)
    await Promise.resolve()
    await Promise.resolve()

    expect(first.sprite).toBeUndefined()
    expect(applications).toEqual([{ assetId: 'player-run', entityId: 'player', status: 'applied' }])
  })

  it('cycles between separate Player run frame assets on render ticks', () => {
    const runFramesManifest: AssetManifest = {
      entries: [
        {
          assetId: 'player-run-frame-1', kind: 'character', target: 'entity', entityId: 'player',
          presentationState: 'run', presentationFrame: 0, status: 'resolved', resource: { uri: '/player-run-1.png' },
        },
        {
          assetId: 'player-run-frame-2', kind: 'character', target: 'entity', entityId: 'player',
          presentationState: 'run', presentationFrame: 1, status: 'resolved', resource: { uri: '/player-run-2.png' },
        },
      ],
    }
    const renderer = new DefaultPixiEntityRenderer(container(), {
      createGraphics: graphics,
      assetManifest: runFramesManifest,
    })
    const runWorld: RenderWorld = {
      entities: [{ id: 'player', type: 'player', position: { x: 10, y: 20 }, presentationState: 'run', velocity: { x: 3, y: 0 } }],
    }

    const assetIds = Array.from({ length: 17 }, () => renderer.render(runWorld).entities[0]?.assetId)

    expect(new Set(assetIds)).toEqual(new Set(['player-run-frame-1', 'player-run-frame-2']))
    expect(assetIds[0]).toBe('player-run-frame-1')
    expect(assetIds[8]).toBe('player-run-frame-2')
  })

  it('mirrors a generated Player sprite when Runtime velocity faces left', async () => {
    const leftWorld: RenderWorld = {
      entities: [{ id: 'player', type: 'player', position: { x: 10, y: 20 }, presentationState: 'run', velocity: { x: -3, y: 0 } }],
    }
    const renderer = new DefaultPixiEntityRenderer(container(), {
      createGraphics: graphics,
      assetManifest: manifest,
      assetStore: store({ status: 'resolved', resource }),
      assetAdapter: { load: async () => ({ width: 24, height: 24 } as Texture), clear() {} },
      createSprite: sprite,
    })

    const view = renderer.render(leftWorld).entities[0]
    await new Promise(resolve => setTimeout(resolve, 0))
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()

    expect(view.sprite?.scale.x).toBe(-1)
  })

  it('rotates a top-down generated Player from Runtime direction without mirroring', async () => {
    const renderer = new DefaultPixiEntityRenderer(container(), {
      createGraphics: graphics,
      assetManifest: manifest,
      assetStore: store({ status: 'resolved', resource }),
      assetAdapter: { load: async () => ({ width: 24, height: 24 } as Texture), clear() {} },
      createSprite: sprite,
    })
    const view = renderer.render({
      spatialMode: 'top-down',
      entities: [{
        id: 'player', type: 'player', position: { x: 10, y: 20 },
        presentationState: 'run', presentationDirection: 'up', velocity: { x: 0, y: -3 },
      }],
    }).entities[0]

    await new Promise(resolve => setTimeout(resolve, 0))
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()

    expect(view.sprite?.rotation).toBe(Math.PI)
    expect(view.sprite?.scale.x).toBe(1)
  })

  it('retains the primitive when resolution fails', async () => {
    const applications: Array<{ status: string; reason?: string }> = []
    const c = container()
    const renderer = new DefaultPixiEntityRenderer(c, {
      createGraphics: graphics,
      assetManifest: manifest,
      assetStore: store({ status: 'failed', assetId: resource.assetId, reason: 'load_failed' }),
      assetAdapter: { load: async () => { throw new Error('bad texture') }, clear() {} },
      createSprite: sprite,
      onAssetApplication: event => applications.push(event),
    })

    const view = renderer.render(world()).entities[0]
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(view.sprite).toBeUndefined()
    expect(view.displayObject).toBe(view.graphics)
    expect(applications).toEqual([{ assetId: 'player-asset', entityId: 'player', status: 'failed', reason: 'resolution' }])
  })

  it('retains an existing Sprite while a rebound resource is loading', async () => {
    let releaseNewTexture!: (texture: Texture) => void
    let currentResource = resource
    const oldTexture = { width: 24, height: 24 } as Texture
    const newTexture = { width: 24, height: 24 } as Texture
    const oldSpriteDestroy = vi.fn()
    const adapter: PixiAssetAdapter = {
      load: (nextResource) => nextResource.uri === '/new.png'
        ? new Promise(resolve => { releaseNewTexture = resolve })
        : Promise.resolve(oldTexture),
      invalidate: vi.fn(),
      clear() {},
    }
    const assetStore: AssetStore = {
      get: () => currentResource,
      has: () => true,
      resolve: async () => ({ status: 'resolved' as const, resource: currentResource }),
      invalidate: () => {},
      clear: () => {},
    }
    const sprites: Sprite[] = []
    const c = container()
    const renderer = new DefaultPixiEntityRenderer(c, {
      createGraphics: graphics,
      assetManifest: manifest,
      assetStore,
      assetAdapter: adapter,
      createSprite: () => {
        const next = { ...sprite(), destroy: oldSpriteDestroy } as unknown as Sprite
        sprites.push(next)
        return next
      },
    })

    const first = renderer.render(world()).entities[0]
    await Promise.resolve()
    await Promise.resolve()
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(first.sprite).toBeDefined()
    const oldSprite = first.sprite

    currentResource = { ...resource, uri: '/new.png' }
    renderer.setAssetManifest({ entries: [{ ...manifest.entries[0]!, resource: { uri: '/new.png' } }] })
    const rebound = renderer.render(world()).entities[0]
    expect(rebound.displayObject).toBe(oldSprite)
    expect(c.children).toEqual([oldSprite])

    await Promise.resolve()
    await Promise.resolve()
    releaseNewTexture(newTexture)
    await Promise.resolve()
    await Promise.resolve()
    expect(rebound.sprite).toBe(sprites[1])
    expect(c.children).toEqual([sprites[1]])
    expect(oldSpriteDestroy).toHaveBeenCalledOnce()
  })
})
