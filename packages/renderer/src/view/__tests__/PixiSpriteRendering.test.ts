import { describe, expect, it } from 'vitest'
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

function store(result: AssetResolutionResult): AssetStore {
  return { get: () => undefined, has: () => false, resolve: async () => result, invalidate() {}, clear() {} }
}

function sprite(): Sprite {
  return { x: 0, y: 0, width: 0, height: 0, anchor: { set() {} }, destroy() {} } as unknown as Sprite
}

describe('Pixi sprite rendering foundation', () => {
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
    await Promise.resolve()
    resolveTexture({ width: 24, height: 24 } as Texture)
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
    expect(view.sprite).toBeDefined()
    expect(view.displayObject).toBe(view.sprite)
    renderer.clear()
    expect(graphicsDestroyCount).toBe(1)
  })

  it('retains the primitive when resolution fails', async () => {
    const c = container()
    const renderer = new DefaultPixiEntityRenderer(c, {
      createGraphics: graphics,
      assetManifest: manifest,
      assetStore: store({ status: 'failed', assetId: resource.assetId, reason: 'load_failed' }),
      assetAdapter: { load: async () => { throw new Error('bad texture') }, clear() {} },
      createSprite: sprite,
    })

    const view = renderer.render(world()).entities[0]
    await Promise.resolve()
    expect(view.sprite).toBeUndefined()
    expect(view.displayObject).toBe(view.graphics)
  })
})
