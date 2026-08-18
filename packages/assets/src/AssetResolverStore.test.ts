import { describe, expect, it, vi } from 'vitest'
import type { AssetManifest } from '@genesis/shared'
import { DefaultAssetResolver, type AssetResolutionResult } from './AssetResolver'
import { DefaultAssetStore } from './AssetStore'
import type { AssetResourceLoader } from './AssetResourceLoader'

const manifest: AssetManifest = Object.freeze({
  entries: Object.freeze([
    Object.freeze({ assetId: 'player-main', kind: 'character' as const, target: 'entity' as const, entityId: 'player-1', status: 'resolved' as const, resource: Object.freeze({ uri: '/assets/player.png' }), metadata: Object.freeze({ mimeType: 'image/png', width: 64, height: 64 }) }),
    Object.freeze({ assetId: 'enemy-main', kind: 'character' as const, target: 'entity' as const, entityId: 'enemy-1', status: 'unresolved' as const }),
    Object.freeze({ assetId: 'boss-main', kind: 'character' as const, target: 'entity' as const, entityId: 'boss-1', status: 'failed' as const }),
    Object.freeze({ assetId: 'terrain-main', kind: 'terrain' as const, target: 'environment' as const, status: 'resolved' as const, resource: Object.freeze({ uri: 'https://cdn.example.test/terrain.png' }) }),
    Object.freeze({ assetId: 'unsupported-main', kind: 'prop' as const, target: 'entity' as const, status: 'resolved' as const, resource: Object.freeze({ uri: 'asset://generated/prop' }) }),
  ]),
})

describe('DefaultAssetResolver', () => {
  it('resolves a supported static URI into a neutral resource', async () => {
    const result = await new DefaultAssetResolver().resolve('player-main', manifest)

    expect(result).toEqual({
      status: 'resolved',
      resource: {
        assetId: 'player-main',
        kind: 'character',
        target: 'entity',
        entityId: 'player-1',
        uri: '/assets/player.png',
        mimeType: 'image/png',
        width: 64,
        height: 64,
      },
    })
  })

  it.each([
    ['missing', 'unknown_asset', 'unavailable'],
    ['enemy-main', 'manifest_unresolved', 'unavailable'],
    ['boss-main', 'manifest_failed', 'failed'],
    ['unsupported-main', 'unsupported_scheme', 'failed'],
  ] as const)('handles %s truthfully', async (assetId, reason, status) => {
    const result = await new DefaultAssetResolver().resolve(assetId, manifest)

    expect(result).toMatchObject({ assetId, reason, status })
  })

  it('supports HTTP and HTTPS resource references', async () => {
    const result = await new DefaultAssetResolver().resolve('terrain-main', manifest)

    expect(result).toMatchObject({ status: 'resolved', resource: { uri: 'https://cdn.example.test/terrain.png', kind: 'terrain' } })
  })

  it('uses an injected loader and converts loader failures into a failed result', async () => {
    const loader: AssetResourceLoader = {
      load: vi.fn().mockRejectedValue(new Error('network unavailable')),
    }
    const result = await new DefaultAssetResolver(loader).resolve('player-main', manifest)

    expect(loader.load).toHaveBeenCalledOnce()
    expect(result).toEqual({ status: 'failed', assetId: 'player-main', reason: 'load_failed' })
  })

  it('does not mutate the manifest during resolution', async () => {
    const snapshot = JSON.stringify(manifest)

    await new DefaultAssetResolver().resolve('player-main', manifest)

    expect(JSON.stringify(manifest)).toBe(snapshot)
    expect(Object.isFrozen(manifest)).toBe(true)
  })
})

describe('DefaultAssetStore', () => {
  it('caches successful resolution and avoids duplicate loads', async () => {
    let calls = 0
    const resolver = {
      resolve: vi.fn(async (): Promise<AssetResolutionResult> => {
        calls += 1
        await Promise.resolve()
        return { status: 'resolved', resource: { assetId: 'player-main', kind: 'character', target: 'entity', entityId: 'player-1', uri: '/assets/player.png' } }
      }),
    }
    const store = new DefaultAssetStore(resolver)

    const first = await store.resolve('player-main', manifest)
    const second = await store.resolve('player-main', manifest)

    expect(first).toEqual(second)
    expect(calls).toBe(1)
    expect(store.has('player-main')).toBe(true)
    expect(store.get('player-main')).toEqual((first as { resource: unknown }).resource)
  })

  it('shares concurrent requests for the same asset', async () => {
    let release: (() => void) | undefined
    const gate = new Promise<void>(resolve => { release = resolve })
    const resolver = { resolve: vi.fn(async (): Promise<AssetResolutionResult> => {
      await gate
      return { status: 'resolved', resource: { assetId: 'player-main', kind: 'character', target: 'entity', uri: '/assets/player.png' } }
    }) }
    const store = new DefaultAssetStore(resolver)
    const first = store.resolve('player-main', manifest)
    const second = store.resolve('player-main', manifest)

    release?.()
    await expect(Promise.all([first, second])).resolves.toHaveLength(2)
    expect(resolver.resolve).toHaveBeenCalledOnce()
  })

  it('does not cache failures and allows retry', async () => {
    let calls = 0
    const resolver = { resolve: vi.fn(async (): Promise<AssetResolutionResult> => {
      calls += 1
      return calls === 1
        ? { status: 'failed', assetId: 'player-main', reason: 'load_failed' }
        : { status: 'resolved', resource: { assetId: 'player-main', kind: 'character', target: 'entity', uri: '/assets/player.png' } }
    }) }
    const store = new DefaultAssetStore(resolver)

    expect((await store.resolve('player-main', manifest)).status).toBe('failed')
    expect((await store.resolve('player-main', manifest)).status).toBe('resolved')
    expect(calls).toBe(2)
  })

  it('invalidates one asset and clears the whole cache', async () => {
    const resolver = { resolve: vi.fn(async (assetId: string): Promise<AssetResolutionResult> => ({
      status: 'resolved',
      resource: { assetId, kind: 'character', target: 'entity', uri: `/assets/${assetId}.png` },
    })) }
    const store = new DefaultAssetStore(resolver)

    await store.resolve('player-main', manifest)
    await store.resolve('terrain-main', manifest)
    store.invalidate('player-main')
    expect(store.has('player-main')).toBe(false)
    expect(store.has('terrain-main')).toBe(true)
    store.clear()
    expect(store.has('terrain-main')).toBe(false)
  })

  it('keeps distinct asset IDs independent', async () => {
    const resolver = { resolve: vi.fn(async (assetId: string): Promise<AssetResolutionResult> => ({
      status: 'resolved',
      resource: { assetId, kind: 'character', target: 'entity', uri: `/assets/${assetId}.png` },
    })) }
    const store = new DefaultAssetStore(resolver)

    await Promise.all([store.resolve('player-main', manifest), store.resolve('terrain-main', manifest)])

    expect(store.get('player-main')?.assetId).toBe('player-main')
    expect(store.get('terrain-main')?.assetId).toBe('terrain-main')
    expect(resolver.resolve).toHaveBeenCalledTimes(2)
  })
})
