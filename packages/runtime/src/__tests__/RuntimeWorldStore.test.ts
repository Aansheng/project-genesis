/**
 * RuntimeWorldStore.test.ts — comprehensive test suite for RuntimeWorldStore.
 *
 * Target: 30+ tests
 * Coverage: construction, getWorld, setWorld, world replacement, empty world,
 *           frozen output, determinism, multiple set/get cycles
 */
import { describe, it, expect } from 'vitest'
import { DefaultRuntimeWorldStore } from '../world/DefaultRuntimeWorldStore'
import type { RuntimeWorldStore } from '../world/RuntimeWorldStore'
import type { World } from '@genesis/shared'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createWorld(entities?: Array<{ id: string; type: string; x: number; y: number }>): World {
  return { entities: entities ?? [] }
}

function createPlayerWorld(): World {
  return { entities: [{ id: 'player-1', type: 'player', x: 10, y: 20 }] }
}

function createFarmWorld(): World {
  return {
    entities: [
      { id: 'player-1', type: 'player', x: 0, y: 0 },
      { id: 'npc-1', type: 'npc', x: 5, y: 5 },
      { id: 'npc-2', type: 'npc', x: 10, y: 10 },
    ],
  }
}

// ---------------------------------------------------------------------------
// Construction
// ---------------------------------------------------------------------------

describe('construction', () => {
  it('should create a DefaultRuntimeWorldStore instance', () => {
    const store = new DefaultRuntimeWorldStore()
    expect(store).toBeInstanceOf(DefaultRuntimeWorldStore)
  })

  it('should implement RuntimeWorldStore interface', () => {
    const store: RuntimeWorldStore = new DefaultRuntimeWorldStore()
    expect(store).toBeDefined()
  })

  it('should have getWorld and setWorld methods', () => {
    const store = new DefaultRuntimeWorldStore()
    expect(typeof store.getWorld).toBe('function')
    expect(typeof store.setWorld).toBe('function')
  })

  it('should initialize with empty world when no argument given', () => {
    const store = new DefaultRuntimeWorldStore()
    const world = store.getWorld()
    expect(world.entities).toEqual([])
  })

  it('should initialize with provided world', () => {
    const world = createPlayerWorld()
    const store = new DefaultRuntimeWorldStore(world)
    expect(store.getWorld().entities.length).toBe(1)
    expect(store.getWorld().entities[0].id).toBe('player-1')
  })

  it('should initialize with empty world when undefined given', () => {
    const store = new DefaultRuntimeWorldStore(undefined)
    const world = store.getWorld()
    expect(world.entities).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// getWorld
// ---------------------------------------------------------------------------

describe('getWorld', () => {
  it('should return a World object', () => {
    const store = new DefaultRuntimeWorldStore()
    const world = store.getWorld()
    expect(world).toHaveProperty('entities')
    expect(Array.isArray(world.entities)).toBe(true)
  })

  it('should never return undefined or null', () => {
    const store = new DefaultRuntimeWorldStore()
    const world = store.getWorld()
    expect(world).toBeDefined()
    expect(world).not.toBeNull()
  })

  it('should return the same world after setWorld', () => {
    const store = new DefaultRuntimeWorldStore()
    const world = createPlayerWorld()
    store.setWorld(world)
    expect(store.getWorld().entities[0].id).toBe('player-1')
  })

  it('should return frozen world', () => {
    const store = new DefaultRuntimeWorldStore()
    expect(Object.isFrozen(store.getWorld())).toBe(true)
  })

  it('should return frozen world after setWorld', () => {
    const store = new DefaultRuntimeWorldStore()
    store.setWorld(createPlayerWorld())
    expect(Object.isFrozen(store.getWorld())).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// setWorld
// ---------------------------------------------------------------------------

describe('setWorld', () => {
  it('should replace the stored world', () => {
    const store = new DefaultRuntimeWorldStore()
    const world = createPlayerWorld()
    store.setWorld(world)
    expect(store.getWorld().entities.length).toBe(1)
  })

  it('should replace multiple times', () => {
    const store = new DefaultRuntimeWorldStore()
    store.setWorld(createWorld([{ id: 'a', type: 'player', x: 0, y: 0 }]))
    expect(store.getWorld().entities.length).toBe(1)
    store.setWorld(createWorld([{ id: 'b', type: 'npc', x: 1, y: 1 }, { id: 'c', type: 'npc', x: 2, y: 2 }]))
    expect(store.getWorld().entities.length).toBe(2)
    store.setWorld(createWorld([]))
    expect(store.getWorld().entities.length).toBe(0)
  })

  it('should overwrite the old world completely', () => {
    const store = new DefaultRuntimeWorldStore(createPlayerWorld())
    store.setWorld(createFarmWorld())
    const world = store.getWorld()
    expect(world.entities.length).toBe(3)
    expect(world.entities[0].type).toBe('player')
    expect(world.entities[1].type).toBe('npc')
  })

  it('old world should not be accessible after setWorld', () => {
    const store = new DefaultRuntimeWorldStore()
    const oldWorld = store.getWorld()
    store.setWorld(createPlayerWorld())
    expect(store.getWorld().entities.length).not.toBe(oldWorld.entities.length)
  })
})

// ---------------------------------------------------------------------------
// World replacement
// ---------------------------------------------------------------------------

describe('world replacement', () => {
  it('should allow setWorld to replace with larger world', () => {
    const store = new DefaultRuntimeWorldStore()
    store.setWorld(createFarmWorld())
    expect(store.getWorld().entities.length).toBe(3)
  })

  it('should allow setWorld to replace with smaller world', () => {
    const store = new DefaultRuntimeWorldStore(createFarmWorld())
    expect(store.getWorld().entities.length).toBe(3)
    store.setWorld(createPlayerWorld())
    expect(store.getWorld().entities.length).toBe(1)
  })

  it('should allow setWorld to replace with empty world', () => {
    const store = new DefaultRuntimeWorldStore(createPlayerWorld())
    store.setWorld(createWorld([]))
    expect(store.getWorld().entities.length).toBe(0)
  })

  it('should preserve frozen output after multiple replacements', () => {
    const store = new DefaultRuntimeWorldStore()
    const worlds = [createPlayerWorld(), createFarmWorld(), createWorld([])]
    for (const w of worlds) {
      store.setWorld(w)
      expect(Object.isFrozen(store.getWorld())).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------------

describe('determinism', () => {
  it('should return same world after same setWorld', () => {
    const store = new DefaultRuntimeWorldStore()
    const world = createPlayerWorld()
    store.setWorld(world)
    expect(store.getWorld().entities).toEqual(store.getWorld().entities)
  })

  it('should produce same result across multiple stores with same initial world', () => {
    const world = createPlayerWorld()
    const store1 = new DefaultRuntimeWorldStore(world)
    const store2 = new DefaultRuntimeWorldStore(world)
    expect(store1.getWorld().entities).toEqual(store2.getWorld().entities)
  })

  it('getWorld should return consistent results after no mutations', () => {
    const store = new DefaultRuntimeWorldStore(createPlayerWorld())
    const r1 = store.getWorld()
    const r2 = store.getWorld()
    const r3 = store.getWorld()
    expect(r1).toEqual(r2)
    expect(r2).toEqual(r3)
  })
})

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('edge cases', () => {
  it('should handle world with many entities', () => {
    const store = new DefaultRuntimeWorldStore()
    const entities = Array.from({ length: 100 }, (_, i) => ({
      id: `entity-${i}`,
      type: 'test',
      x: i,
      y: i * 2,
    }))
    store.setWorld({ entities })
    expect(store.getWorld().entities.length).toBe(100)
  })

  it('should handle setWorld with entities containing all fields', () => {
    const store = new DefaultRuntimeWorldStore()
    store.setWorld({
      entities: [
        { id: 'full-1', type: 'hero', x: 100, y: 200 },
      ],
    })
    const entity = store.getWorld().entities[0]
    expect(entity.id).toBe('full-1')
    expect(entity.type).toBe('hero')
    expect(entity.x).toBe(100)
    expect(entity.y).toBe(200)
  })
})