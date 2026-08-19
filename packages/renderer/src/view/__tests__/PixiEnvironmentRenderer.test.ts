import { describe, expect, it } from 'vitest'
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

function graphics(): Graphics {
  return { beginFill() { return this }, drawRect() { return this }, endFill() { return this }, destroy() {} } as unknown as Graphics
}

function world(): RenderWorld {
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
      { x: 300, y: 320, width: 96, height: 24 },
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
})
