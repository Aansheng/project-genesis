/**
 * CommandRoutingIntegration.test.ts — integration test for CommandRouting Integration.
 *
 * Verifies the end-to-end flow:
 *   input → DefaultCommandExecutor → IntentRouter → CreateWorldRuntimeExecutor
 *     → CreateWorldPipeline → RuntimeWorldStore
 *
 * Also verifies that the injected world is visible through a store-backed
 * visualization provider, simulating what the visualization loop sees.
 *
 * WO-S10-004: Web Command Routing Integration.
 * No changes to Runtime, Renderer, or AI packages are tested here.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { DefaultRuntimeWorldStore, DefaultRuntimeProjection } from '@genesis/runtime'
import type { RuntimeWorldStore } from '@genesis/runtime'
import {
  DefaultIntentRouter,
  DefaultGameIntentExtractor,
  DefaultCreateWorldPipeline,
  DefaultCreateWorldRuntimeExecutor,
  DefaultSemanticWorldGenerator,
  DefaultSemanticGameDslBuilder,
} from '@genesis/ai'
import { DefaultCommandExecutor } from '../command'
import type { CommandExecutor } from '../command'
import { useGameStore } from '../stores/gameStore'
import type { World } from '@genesis/shared'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Create a CommandExecutor with the full production pipeline.
 *
 * Mirrors the construction in gameStore.ts so integration tests
 * verify the same code path as the running application.
 */
function createIntegrationExecutor(store?: RuntimeWorldStore): {
  executor: CommandExecutor
  worldStore: RuntimeWorldStore
} {
  const worldStore = store ?? new DefaultRuntimeWorldStore()

  const pipeline = new DefaultCreateWorldPipeline(
    new DefaultIntentRouter(),
    new DefaultGameIntentExtractor(),
    new DefaultSemanticWorldGenerator(),
    new DefaultSemanticGameDslBuilder(),
    new DefaultRuntimeProjection(),
  )

  const createWorldExecutor = new DefaultCreateWorldRuntimeExecutor(pipeline, worldStore)
  const executor = new DefaultCommandExecutor(new DefaultIntentRouter(), createWorldExecutor)

  return { executor, worldStore }
}

/**
 * Simple visualization provider for test verification.
 * Wraps a RuntimeWorldStore as a world source, simulating
 * what StoreBackedWorldProvider does in the renderer package.
 */
class TestWorldProvider {
  private readonly store: RuntimeWorldStore

  constructor(store: RuntimeWorldStore) {
    this.store = store
  }

  getWorld(): World {
    return this.store.getWorld()
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CommandRouting Integration', () => {
  describe('DefaultCommandExecutor — end to end', () => {
    it('should route "创建 MarioWorld" and update RuntimeWorldStore', () => {
      const { executor, worldStore } = createIntegrationExecutor()

      const result = executor.execute('创建 MarioWorld')

      expect(result.success).toBe(true)
      expect(result.message).toContain('Created world')

      const world = worldStore.getWorld()
      expect(world.entities.length).toBeGreaterThan(0)
    })

    it('should inject a player entity into the world store', () => {
      const { executor, worldStore } = createIntegrationExecutor()

      executor.execute('创建 MarioWorld')

      const world = worldStore.getWorld()
      const playerEntity = world.entities.find((e) => e.type === 'player')
      expect(playerEntity).toBeDefined()
      expect(playerEntity!.id).toBeTruthy()
    })

    it('should make the injected world visible through a visualization provider', () => {
      const { executor, worldStore } = createIntegrationExecutor()

      executor.execute('创建 MarioWorld')

      // This simulates what StoreBackedWorldProvider does:
      // the visualization loop reads getWorld() on each tick
      const provider = new TestWorldProvider(worldStore)
      const seenWorld = provider.getWorld()

      expect(seenWorld.entities.length).toBeGreaterThan(0)
      expect(seenWorld.entities.find((e) => e.type === 'player')).toBeDefined()
    })

    it('should return unknown for unrecognized input', () => {
      const { executor } = createIntegrationExecutor()

      const result = executor.execute('hello world')

      expect(result.success).toBe(false)
      expect(result.message).toContain('Unknown command')
    })

    it('should create world with at least one entity', () => {
      const { executor, worldStore } = createIntegrationExecutor()

      executor.execute('创建 MarioWorld')

      const world = worldStore.getWorld()
      expect(world.entities.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('gameStore — command routing via store.send()', () => {
    beforeEach(() => {
      setActivePinia(createPinia())
    })

    it('should route through CommandExecutor from store.send()', async () => {
      const store = useGameStore()

      await store.send('创建 MarioWorld')

      expect(store.log.length).toBeGreaterThan(0)
      expect(store.log[0]).toContain('Created world')
    })

    it('should update renderVersion after successful command', async () => {
      const store = useGameStore()

      const before = store.renderVersion
      await store.send('创建 MarioWorld')
      const after = store.renderVersion

      expect(after).toBeGreaterThan(before)
    })

    it('should not increment renderVersion for unknown commands', async () => {
      const store = useGameStore()

      const before = store.renderVersion
      await store.send('hello')
      const after = store.renderVersion

      expect(after).toBe(before)
    })

    it('should inject world into store.worldStore', async () => {
      const store = useGameStore()

      await store.send('创建 MarioWorld')

      const world = store.worldStore.getWorld()
      expect(world.entities.length).toBeGreaterThan(0)
    })

    it('should have empty world for unknown commands', async () => {
      const store = useGameStore()

      await store.send('hello')

      const world = store.worldStore.getWorld()
      expect(world.entities.length).toBe(0)
    })
  })
})
