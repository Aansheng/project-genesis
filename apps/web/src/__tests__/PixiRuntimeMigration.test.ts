/**
 * PixiRuntimeMigration.test.ts — integration test for WO-S10-006.
 *
 * Proves the full rendering pipeline:
 *   CreateWorldRuntimeExecutor
 *     → RuntimeWorldStore
 *       → StoreBackedWorldProvider
 *         → DefaultRuntimeVisualizationLoop
 *           → PixiEntityRenderer
 *             → renders entities
 *
 * Uses mock Pixi Graphics since test environment has no WebGL.
 */
import { describe, it, expect } from 'vitest'
import { DefaultRuntimeWorldStore, DefaultRuntimeExecutionLoop, DefaultRuntimeSystemRegistry } from '@genesis/runtime'
import type { RuntimeWorldStore } from '@genesis/runtime'
import type { World } from '@genesis/shared'
import {
  DefaultIntentRouter,
  DefaultGameIntentExtractor,
  DefaultCreateWorldPipeline,
  DefaultCreateWorldRuntimeExecutor,
  DefaultSemanticWorldGenerator,
  DefaultSemanticGameDslBuilder,
} from '@genesis/ai'
import { DefaultRuntimeProjection } from '@genesis/runtime'
import { DefaultRuntimeVisualizationLoop, DefaultRuntimeRendererAdapter, StoreBackedWorldProvider } from '@genesis/renderer'
import type { RenderWorld, RenderWorldView, PixiEntityRenderer } from '@genesis/renderer'
import { Container } from 'pixi.js'
import type { Graphics } from 'pixi.js'

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

function createMockGraphics(): Graphics {
  return {
    x: 0,
    y: 0,
    beginFill: () => {},
    drawCircle: () => {},
    drawRect: () => {},
    endFill: () => {},
    destroy: () => {},
  } as unknown as Graphics
}

// ---------------------------------------------------------------------------
// Helper: create world with PositionComponent entities
// PositionComponent is required by DefaultRuntimeRendererAdapter.extractPosition()
// ---------------------------------------------------------------------------

function createPositionedWorld(entities: Array<{ id: string; type: string; x: number; y: number }>): World {
  return {
    entities: entities.map((e) => ({
      id: e.id,
      type: e.type,
      x: e.x,
      y: e.y,
      components: [
        {
          type: 'position',
          properties: { x: e.x, y: e.y },
        },
      ],
    })),
  }
}

// ---------------------------------------------------------------------------
// Test helper: create a testable renderer with mock graphics
// ---------------------------------------------------------------------------

function createTestRenderer(): PixiEntityRenderer & { getLastWorld(): RenderWorld | null } {
  let lastWorld: RenderWorld | null = null

  const renderer = {
    render(world: RenderWorld): RenderWorldView {
      lastWorld = world
      const views = world.entities.map((e) => ({
        id: e.id,
        graphics: createMockGraphics(),
      }))
      return { entities: views }
    },

    clear(): void {
      lastWorld = null
    },

    getLastWorld(): RenderWorld | null {
      return lastWorld
    },
  } as PixiEntityRenderer & { getLastWorld(): RenderWorld | null }

  return renderer
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Pixi Runtime Migration Integration', () => {
  // ── Stage 1: CreateWorldRuntimeExecutor → RuntimeWorldStore ──────────

  describe('Stage 1: CreateWorldRuntimeExecutor → RuntimeWorldStore', () => {
    it('should inject world into store via CreateWorldRuntimeExecutor', () => {
      const store: RuntimeWorldStore = new DefaultRuntimeWorldStore()
      const pipeline = new DefaultCreateWorldPipeline(
        new DefaultIntentRouter(),
        new DefaultGameIntentExtractor(),
        new DefaultSemanticWorldGenerator(),
        new DefaultSemanticGameDslBuilder(),
        new DefaultRuntimeProjection(),
      )
      const executor = new DefaultCreateWorldRuntimeExecutor(pipeline, store)

      executor.execute('创建 MarioWorld')

      const world = store.getWorld()
      expect(world.entities.length).toBeGreaterThan(0)
      expect(world.entities[0].type).toBe('player')
    })
  })

  // ── Stage 2: RuntimeWorldStore → StoreBackedWorldProvider ───────────

  describe('Stage 2: RuntimeWorldStore → StoreBackedWorldProvider', () => {
    it('should propagate world from store to provider', () => {
      const store: RuntimeWorldStore = new DefaultRuntimeWorldStore()
      const world = createPositionedWorld([
        { id: 'player', type: 'player', x: 100, y: 200 },
        { id: 'enemy', type: 'enemy', x: 300, y: 400 },
      ])
      store.setWorld(world)

      const provider = new StoreBackedWorldProvider(store)
      const provided = provider.getWorld()

      expect(provided.entities).toHaveLength(2)
      expect(provided.entities[0].id).toBe('player')
      expect(provided.entities[1].id).toBe('enemy')
    })

    it('should reflect store updates immediately through provider', () => {
      const store: RuntimeWorldStore = new DefaultRuntimeWorldStore()
      const provider = new StoreBackedWorldProvider(store)

      expect(provider.getWorld().entities).toHaveLength(0)

      store.setWorld(createPositionedWorld([{ id: 'a', type: 'test', x: 0, y: 0 }]))
      expect(provider.getWorld().entities).toHaveLength(1)

      store.setWorld(createPositionedWorld([{ id: 'b', type: 'test', x: 1, y: 1 }]))
      expect(provider.getWorld().entities[0].id).toBe('b')
    })
  })

  // ── Stage 3: Full pipeline — visualization → renderer ──────────────

  describe('Stage 3: Full pipeline renders entities', () => {
    it('visualization loop should read from store and pass world to renderer', () => {
      const store: RuntimeWorldStore = new DefaultRuntimeWorldStore()
      const provider = new StoreBackedWorldProvider(store)
      const systemRegistry = new DefaultRuntimeSystemRegistry()
      const executionLoop = new DefaultRuntimeExecutionLoop(systemRegistry)
      const adapter = new DefaultRuntimeRendererAdapter()
      const entityRenderer = createTestRenderer()
      const initialWorld = store.getWorld()

      const visLoop = new DefaultRuntimeVisualizationLoop(
        executionLoop,
        adapter,
        entityRenderer,
        initialWorld,
        provider,
      )

      // Inject world into store (with PositionComponent)
      store.setWorld(createPositionedWorld([
        { id: 'player', type: 'player', x: 100, y: 200 },
        { id: 'enemy', type: 'enemy', x: 300, y: 400 },
      ]))

      // Tick the visualization loop
      visLoop.start()
      visLoop.tick()

      // Verify the renderer received the world via the pipeline
      const rendered = entityRenderer.getLastWorld()
      expect(rendered).not.toBeNull()
      expect(rendered!.entities).toHaveLength(2)
      expect(rendered!.entities[0].id).toBe('player')
      expect(rendered!.entities[1].id).toBe('enemy')
    })

    it('should render entities with position data', () => {
      const store: RuntimeWorldStore = new DefaultRuntimeWorldStore()
      const provider = new StoreBackedWorldProvider(store)
      const systemRegistry = new DefaultRuntimeSystemRegistry()
      const executionLoop = new DefaultRuntimeExecutionLoop(systemRegistry)
      const adapter = new DefaultRuntimeRendererAdapter()
      const entityRenderer = createTestRenderer()
      const initialWorld = store.getWorld()

      const visLoop = new DefaultRuntimeVisualizationLoop(
        executionLoop,
        adapter,
        entityRenderer,
        initialWorld,
        provider,
      )

      // Entity with PositionComponent at (150, 250)
      store.setWorld(createPositionedWorld([
        { id: 'player', type: 'player', x: 150, y: 250 },
      ]))

      visLoop.start()
      visLoop.tick()

      const rendered = entityRenderer.getLastWorld()
      expect(rendered).not.toBeNull()
      expect(rendered!.entities).toHaveLength(1)

      // Verify position was extracted by the adapter
      const renderEntity = rendered!.entities[0]
      expect(renderEntity.position).toBeDefined()
      expect(renderEntity.position!.x).toBe(150)
      expect(renderEntity.position!.y).toBe(250)
    })

    it('should update rendered output when store world changes', () => {
      const store: RuntimeWorldStore = new DefaultRuntimeWorldStore()
      const provider = new StoreBackedWorldProvider(store)
      const systemRegistry = new DefaultRuntimeSystemRegistry()
      const executionLoop = new DefaultRuntimeExecutionLoop(systemRegistry)
      const adapter = new DefaultRuntimeRendererAdapter()
      const entityRenderer = createTestRenderer()
      const initialWorld = store.getWorld()

      const visLoop = new DefaultRuntimeVisualizationLoop(
        executionLoop,
        adapter,
        entityRenderer,
        initialWorld,
        provider,
      )

      visLoop.start()

      // First world
      store.setWorld(createPositionedWorld([
        { id: 'player', type: 'player', x: 0, y: 0 },
      ]))
      visLoop.tick()
      expect(entityRenderer.getLastWorld()!.entities).toHaveLength(1)

      // Second world (replaces first)
      store.setWorld(createPositionedWorld([
        { id: 'a', type: 'enemy', x: 50, y: 50 },
        { id: 'b', type: 'enemy', x: 100, y: 100 },
      ]))
      visLoop.tick()
      expect(entityRenderer.getLastWorld()!.entities).toHaveLength(2)
      expect(entityRenderer.getLastWorld()!.entities[0].id).toBe('a')
    })
  })
})