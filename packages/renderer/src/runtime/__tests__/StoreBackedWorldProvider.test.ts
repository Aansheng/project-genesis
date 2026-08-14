/**
 * StoreBackedWorldProvider.test.ts — comprehensive test suite for StoreBackedWorldProvider.
 *
 * Target: 20+ tests
 * Coverage: construction, getWorld, world forwarding, store updates reflected,
 *           frozen output, determinism
 */
import { describe, it, expect } from 'vitest'
import { DefaultRuntimeWorldStore } from '@genesis/runtime'
import { StoreBackedWorldProvider } from '../StoreBackedWorldProvider'
import type { VisualizationWorldProvider } from '../VisualizationWorldProvider'
import type { World } from '@genesis/shared'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createWorld(entities?: Array<{ id: string; type: string; x: number; y: number }>): World {
  return { entities: entities ?? [] }
}

function createProvider(initialWorld?: World): {
  store: DefaultRuntimeWorldStore
  provider: VisualizationWorldProvider
} {
  const store = new DefaultRuntimeWorldStore(initialWorld)
  const provider = new StoreBackedWorldProvider(store)
  return { store, provider }
}

// ---------------------------------------------------------------------------
// Construction
// ---------------------------------------------------------------------------

describe('construction', () => {
  it('should create a StoreBackedWorldProvider instance', () => {
    const { provider } = createProvider()
    expect(provider).toBeInstanceOf(StoreBackedWorldProvider)
  })

  it('should implement VisualizationWorldProvider interface', () => {
    const { provider } = createProvider()
    expect(provider).toBeDefined()
  })

  it('should have a getWorld method', () => {
    const { provider } = createProvider()
    expect(typeof provider.getWorld).toBe('function')
  })
})

// ---------------------------------------------------------------------------
// getWorld
// ---------------------------------------------------------------------------

describe('getWorld', () => {
  it('should return a World object', () => {
    const { provider } = createProvider()
    const world = provider.getWorld()
    expect(world).toHaveProperty('entities')
    expect(Array.isArray(world.entities)).toBe(true)
  })

  it('should never return undefined or null', () => {
    const { provider } = createProvider()
    const world = provider.getWorld()
    expect(world).toBeDefined()
    expect(world).not.toBeNull()
  })

  it('should return frozen world', () => {
    const { provider } = createProvider()
    expect(Object.isFrozen(provider.getWorld())).toBe(true)
  })

  it('should return initial world when provided', () => {
    const world = createWorld([{ id: 'player-1', type: 'player', x: 10, y: 20 }])
    const { provider } = createProvider(world)
    expect(provider.getWorld().entities.length).toBe(1)
    expect(provider.getWorld().entities[0].id).toBe('player-1')
  })
})

// ---------------------------------------------------------------------------
// Store updates reflected
// ---------------------------------------------------------------------------

describe('store updates reflected', () => {
  it('should reflect store updates immediately', () => {
    const { store, provider } = createProvider()
    expect(provider.getWorld().entities.length).toBe(0)
    store.setWorld(createWorld([{ id: 'hero', type: 'player', x: 0, y: 0 }]))
    expect(provider.getWorld().entities.length).toBe(1)
  })

  it('should reflect multiple store updates', () => {
    const { store, provider } = createProvider()
    store.setWorld(createWorld([{ id: 'a', type: 'a', x: 0, y: 0 }]))
    expect(provider.getWorld().entities.length).toBe(1)
    store.setWorld(createWorld([{ id: 'b', type: 'b', x: 1, y: 1 }, { id: 'c', type: 'c', x: 2, y: 2 }]))
    expect(provider.getWorld().entities.length).toBe(2)
    store.setWorld(createWorld([]))
    expect(provider.getWorld().entities.length).toBe(0)
  })

  it('should reflect replacement with different entity data', () => {
    const { store, provider } = createProvider()
    store.setWorld(createWorld([{ id: 'old', type: 'old', x: 0, y: 0 }]))
    expect(provider.getWorld().entities[0].id).toBe('old')
    store.setWorld(createWorld([{ id: 'new', type: 'new', x: 99, y: 88 }]))
    expect(provider.getWorld().entities[0].id).toBe('new')
    expect(provider.getWorld().entities[0].type).toBe('new')
    expect(provider.getWorld().entities[0].x).toBe(99)
  })

  it('should reflect store with large world', () => {
    const { store, provider } = createProvider()
    const entities = Array.from({ length: 50 }, (_, i) => ({
      id: `e-${i}`,
      type: 'test',
      x: i,
      y: i * 2,
    }))
    store.setWorld(createWorld(entities))
    expect(provider.getWorld().entities.length).toBe(50)
  })
})

// ---------------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------------

describe('determinism', () => {
  it('should return same world when store unchanged', () => {
    const { provider } = createProvider(createWorld([{ id: 'player', type: 'player', x: 0, y: 0 }]))
    const r1 = provider.getWorld()
    const r2 = provider.getWorld()
    expect(r1).toEqual(r2)
  })

  it('two providers wrapping same store should return same world', () => {
    const store = new DefaultRuntimeWorldStore()
    const provider1 = new StoreBackedWorldProvider(store)
    const provider2 = new StoreBackedWorldProvider(store)
    expect(provider1.getWorld()).toEqual(provider2.getWorld())
  })
})