/**
 * CreateWorldRuntimeExecutor.test.ts — comprehensive test suite for CreateWorldRuntimeExecutor.
 *
 * Target: 25+ tests
 * Coverage: construction, create mario world, store contains player,
 *           unknown input, empty input, determinism, dependency injection
 */
import { describe, it, expect } from 'vitest'
import { DefaultIntentRouter } from '../game-intent/router/DefaultIntentRouter'
import { DefaultGameIntentExtractor } from '../game-intent/DefaultGameIntentExtractor'
import { DefaultSemanticWorldGenerator } from '../game-world/DefaultSemanticWorldGenerator'
import { DefaultSemanticGameDslBuilder } from '../game-world/DefaultSemanticGameDslBuilder'
import { DefaultCreateWorldPipeline } from '../game-intent/pipeline/DefaultCreateWorldPipeline'
import { DefaultCreateWorldRuntimeExecutor } from '../game-intent/runtime/DefaultCreateWorldRuntimeExecutor'
import type { CreateWorldRuntimeExecutor, WorldStore } from '../game-intent/runtime/CreateWorldRuntimeExecutor'
import type { World } from '@genesis/shared'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createDefaultProjection() {
  return {
    project(dsl: { world?: { entities: Array<{ id: string; type: string }> } }): { world: World } {
      const entities = (dsl.world?.entities ?? []).map((e) => ({
        id: e.id,
        type: e.type,
        x: 0,
        y: 0,
      }))
      return { world: { entities } }
    },
  }
}

function createStore(): WorldStore {
  let storedWorld: World = { entities: [] }
  return {
    setWorld(world: World): void {
      storedWorld = world
    },
    getWorld(): World {
      return storedWorld
    },
  }
}

function createExecutor(store?: WorldStore): CreateWorldRuntimeExecutor {
  const pipeline = new DefaultCreateWorldPipeline(
    new DefaultIntentRouter(),
    new DefaultGameIntentExtractor(),
    new DefaultSemanticWorldGenerator(),
    new DefaultSemanticGameDslBuilder(),
    createDefaultProjection(),
  )
  return new DefaultCreateWorldRuntimeExecutor(pipeline, store ?? createStore())
}

// ---------------------------------------------------------------------------
// Construction
// ---------------------------------------------------------------------------

describe('construction', () => {
  it('should create a DefaultCreateWorldRuntimeExecutor instance', () => {
    const executor = createExecutor()
    expect(executor).toBeDefined()
  })

  it('should implement CreateWorldRuntimeExecutor interface', () => {
    const executor: CreateWorldRuntimeExecutor = createExecutor()
    expect(executor).toBeDefined()
  })

  it('should have an execute method', () => {
    const executor = createExecutor()
    expect(typeof executor.execute).toBe('function')
  })
})

// ---------------------------------------------------------------------------
// Create mario world
// ---------------------------------------------------------------------------

describe('create mario world', () => {
  it('should return success for "create mario"', () => {
    const executor = createExecutor()
    const result = executor.execute('create mario')
    expect(result.success).toBe(true)
    expect(result.route).toBe('create-world')
  })

  it('should store a world with entities for "create mario"', () => {
    const store = createStore()
    const executor = createExecutor(store)
    executor.execute('create mario')
    expect(store.getWorld().entities.length).toBeGreaterThan(0)
  })

  it('should store world with player for "create mario"', () => {
    const store = createStore()
    const executor = createExecutor(store)
    executor.execute('create mario')
    const player = store.getWorld().entities.find((e) => e.type === 'player')
    expect(player).toBeDefined()
  })

  it('should return success for "创建 MarioWorld"', () => {
    const executor = createExecutor()
    const result = executor.execute('创建 MarioWorld')
    expect(result.success).toBe(true)
  })

  it('should store world for Chinese input "创建 MarioWorld"', () => {
    const store = createStore()
    const executor = createExecutor(store)
    executor.execute('创建 MarioWorld')
    expect(store.getWorld().entities.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// Unknown input
// ---------------------------------------------------------------------------

describe('unknown input', () => {
  it('should return success false for "hello"', () => {
    const executor = createExecutor()
    const result = executor.execute('hello')
    expect(result.success).toBe(false)
    expect(result.route).toBe('unknown')
  })

  it('should not inject world for unknown input', () => {
    const store = createStore()
    const executor = createExecutor(store)
    const initialEntities = store.getWorld().entities.length
    executor.execute('hello')
    expect(store.getWorld().entities.length).toBe(initialEntities)
  })

  it('should return success false for empty string', () => {
    const executor = createExecutor()
    const result = executor.execute('')
    expect(result.success).toBe(false)
  })

  it('should not inject world for empty input', () => {
    const store = createStore()
    const executor = createExecutor(store)
    const initialEntities = store.getWorld().entities.length
    executor.execute('')
    expect(store.getWorld().entities.length).toBe(initialEntities)
  })
})

// ---------------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------------

describe('determinism', () => {
  it('should produce same result for same input', () => {
    const executor = createExecutor()
    const r1 = executor.execute('create mario')
    const r2 = executor.execute('create mario')
    expect(r1.success).toBe(r2.success)
    expect(r1.route).toBe(r2.route)
  })

  it('should produce same result for unknown input', () => {
    const executor = createExecutor()
    const r1 = executor.execute('hello')
    const r2 = executor.execute('hello')
    expect(r1).toEqual(r2)
  })
})

// ---------------------------------------------------------------------------
// Dependency injection
// ---------------------------------------------------------------------------

describe('dependency injection', () => {
  it('should inject world into store on success', () => {
    let injectedWorld: World | undefined
    const trackingStore: WorldStore = {
      setWorld(world: World): void {
        injectedWorld = world
      },
    }
    const executor = createExecutor(trackingStore)
    executor.execute('create mario')
    expect(injectedWorld).toBeDefined()
    expect(injectedWorld!.entities.length).toBeGreaterThan(0)
  })

  it('should not inject world on unknown route', () => {
    let injected = false
    const trackingStore: WorldStore = {
      setWorld(_world: World): void {
        injected = true
      },
    }
    const executor = createExecutor(trackingStore)
    executor.execute('hello')
    expect(injected).toBe(false)
  })
})