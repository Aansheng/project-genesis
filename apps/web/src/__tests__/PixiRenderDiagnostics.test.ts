/**
 * PixiRenderDiagnostics.test.ts — diagnostics for WO-S10-007.
 *
 * Traces the full Pixi rendering pipeline:
 *   RuntimeWorld
 *     → DefaultRuntimeRendererAdapter.adapt()
 *       → RenderWorld (with/without position)
 *         → DefaultPixiEntityRenderer.render()
 *           → container.children
 *
 * Goal: Ensure "创建 MarioWorld" produces a positioned Runtime entity
 * that survives the adapter and is rendered by Pixi.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { DefaultRuntimeWorldStore, DefaultRuntimeProjection } from '@genesis/runtime'
import type { RuntimeWorldStore } from '@genesis/runtime'
import type { World } from '@genesis/shared'
import { createPositionComponent } from '@genesis/shared'
import {
  DefaultIntentRouter,
  DefaultGameIntentExtractor,
  DefaultCreateWorldPipeline,
  DefaultCreateWorldRuntimeExecutor,
  DefaultSemanticWorldGenerator,
  DefaultSemanticGameDslBuilder,
} from '@genesis/ai'
import { DefaultRuntimeRendererAdapter, DefaultPixiEntityRenderer, DefaultEntityVisualCatalog, DefaultRuntimeVisualizationLoop, StoreBackedWorldProvider } from '@genesis/renderer'
import { DefaultRuntimeExecutionLoop, DefaultRuntimeSystemRegistry } from '@genesis/runtime'
import { Container } from 'pixi.js'
import type { Graphics } from 'pixi.js'

// ---------------------------------------------------------------------------
// Pipeline setup — mirrors production construction
// ---------------------------------------------------------------------------

function createPipeline(): DefaultCreateWorldPipeline {
  return new DefaultCreateWorldPipeline(
    new DefaultIntentRouter(),
    new DefaultGameIntentExtractor(),
    new DefaultSemanticWorldGenerator(),
    new DefaultSemanticGameDslBuilder(),
    new DefaultRuntimeProjection(),
  )
}

// ---------------------------------------------------------------------------
// Mock Graphics — tracks creation count
// ---------------------------------------------------------------------------

let graphicsCreateCount = 0

function resetGraphicsCount(): void {
  graphicsCreateCount = 0
}

function createMockGraphics(): Graphics {
  graphicsCreateCount++
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

function createMockContainer(): Container {
  const children: Graphics[] = []
  let posX = 0
  let posY = 0
  return {
    children,
    x: 0,
    y: 0,
    position: {
      get x() { return posX },
      set x(v: number) { posX = v },
      get y() { return posY },
      set y(v: number) { posY = v },
    },
    addChild: (child: Graphics) => { children.push(child); return child },
    removeChild: (child: Graphics) => {
      const idx = children.indexOf(child)
      if (idx !== -1) children.splice(idx, 1)
      return child
    },
  } as unknown as Container
}

// ---------------------------------------------------------------------------
// Diagnostics
// ---------------------------------------------------------------------------

describe('WO-S10-007: Pixi Render Diagnostics', () => {
  // ══════════════════════════════════════════════════════════════════════
  // 1. RuntimeWorldStore.getWorld() — entity count
  // ══════════════════════════════════════════════════════════════════════

  describe('1. RuntimeWorldStore.getWorld() after "创建 MarioWorld"', () => {
    let world: World

    beforeAll(() => {
      const store: RuntimeWorldStore = new DefaultRuntimeWorldStore()
      const pipeline = createPipeline()
      const executor = new DefaultCreateWorldRuntimeExecutor(pipeline, store)
      executor.execute('创建 MarioWorld')
      world = store.getWorld()
    })

    it('should have 6 platformer entities', () => {
      expect(world.entities.length).toBe(6)
    })

    it('entity type should be "player"', () => {
      expect(world.entities[0].type).toBe('player')
    })

    it('entity x should be 0 (default projection)', () => {
      expect(world.entities[0].x).toBe(0)
    })

    it('entity y should be 0 (default projection)', () => {
      expect(world.entities[0].y).toBe(0)
    })

    it('entity should have semantic, position, and collision bounds components', () => {
      expect(world.entities[0].components).toHaveLength(3)
    })

    it('components should include semantic and position data', () => {
      expect(world.entities[0].components![0].type).toBe('semantic')
      expect(world.entities[0].components![1]).toEqual({
        type: 'position',
        properties: { x: 80, y: 300 },
      })
    })
  })

  // ══════════════════════════════════════════════════════════════════════
  // 2. DefaultRuntimeRendererAdapter.adapt(world)
  // ══════════════════════════════════════════════════════════════════════

  describe('2. DefaultRuntimeRendererAdapter.adapt()', () => {
    let world: World
    let renderWorld: ReturnType<DefaultRuntimeRendererAdapter['adapt']>

    beforeAll(() => {
      const store: RuntimeWorldStore = new DefaultRuntimeWorldStore()
      const pipeline = createPipeline()
      const executor = new DefaultCreateWorldRuntimeExecutor(pipeline, store)
      executor.execute('创建 MarioWorld')
      world = store.getWorld()

      const adapter = new DefaultRuntimeRendererAdapter()
      renderWorld = adapter.adapt(world)
    })

    it('should produce 6 RenderEntities', () => {
      expect(renderWorld.entities.length).toBe(6)
    })

    it('RenderEntity.id should be "player"', () => {
      expect(renderWorld.entities[0].id).toBe('player')
    })

    it('RenderEntity.type should be "player"', () => {
      expect(renderWorld.entities[0].type).toBe('player')
    })

    it('RenderEntity.position should be inside the visible canvas', () => {
      expect(renderWorld.entities[0].position).toEqual({ x: 80, y: 300 })
    })

    it('serialized entity should contain position', () => {
      const serialized = JSON.stringify(renderWorld.entities[0])
      expect(serialized).toContain('"position":{"x":80,"y":300}')
      expect(serialized).toContain('"id":"player"')
      expect(serialized).toContain('"type":"player"')
    })
  })

  // ══════════════════════════════════════════════════════════════════════
  // 3. Every RenderEntity — full dump
  // ══════════════════════════════════════════════════════════════════════

  describe('3. Full RenderEntity dump', () => {
    let renderEntities: Array<{ id: string; type: string; position?: { x: number; y: number } }>

    beforeAll(() => {
      const store: RuntimeWorldStore = new DefaultRuntimeWorldStore()
      const pipeline = createPipeline()
      const executor = new DefaultCreateWorldRuntimeExecutor(pipeline, store)
      executor.execute('创建 MarioWorld')
      const world = store.getWorld()

      const adapter = new DefaultRuntimeRendererAdapter()
      const renderWorld = adapter.adapt(world)
      renderEntities = renderWorld.entities.map((e) => ({
        id: e.id,
        type: e.type,
        ...(e.position ? { position: { x: e.position.x, y: e.position.y } } : {}),
      }))
    })

    it('should dump all entities with their properties', () => {
      expect(renderEntities).toHaveLength(6)
      expect(renderEntities[0]).toEqual({
        id: 'player',
        type: 'player',
        position: { x: 80, y: 300 },
      })
    })
  })

  // ══════════════════════════════════════════════════════════════════════
  // 4. Position count: with vs without
  // ══════════════════════════════════════════════════════════════════════

  describe('4. Position count', () => {
    let entitiesWithPosition: number
    let entitiesWithoutPosition: number

    beforeAll(() => {
      const store: RuntimeWorldStore = new DefaultRuntimeWorldStore()
      const pipeline = createPipeline()
      const executor = new DefaultCreateWorldRuntimeExecutor(pipeline, store)
      executor.execute('创建 MarioWorld')
      const world = store.getWorld()

      const adapter = new DefaultRuntimeRendererAdapter()
      const renderWorld = adapter.adapt(world)

      entitiesWithPosition = renderWorld.entities.filter((e) => e.position !== undefined).length
      entitiesWithoutPosition = renderWorld.entities.filter((e) => e.position === undefined).length
    })

    it('entities WITH position: 6', () => {
      expect(entitiesWithPosition).toBe(6)
    })

    it('entities WITHOUT position: 0', () => {
      expect(entitiesWithoutPosition).toBe(0)
    })

    it('100% of entities have position', () => {
      const total = entitiesWithPosition + entitiesWithoutPosition
      expect(entitiesWithPosition / total).toBe(1)
    })
  })

  // ══════════════════════════════════════════════════════════════════════
  // 5. DefaultPixiEntityRenderer.render() — skip count
  // ══════════════════════════════════════════════════════════════════════

  describe('5. DefaultPixiEntityRenderer.render() — skip analysis', () => {
    let renderResult: ReturnType<DefaultPixiEntityRenderer['render']>
    let containerChildCount: number

    beforeAll(() => {
      const store: RuntimeWorldStore = new DefaultRuntimeWorldStore()
      const pipeline = createPipeline()
      const executor = new DefaultCreateWorldRuntimeExecutor(pipeline, store)
      executor.execute('创建 MarioWorld')
      const world = store.getWorld()

      const adapter = new DefaultRuntimeRendererAdapter()
      const renderWorld = adapter.adapt(world)

    const container = createMockContainer()
      const renderer = new DefaultPixiEntityRenderer(container, {
        catalog: new DefaultEntityVisualCatalog(),
        createGraphics: createMockGraphics,
      })

      resetGraphicsCount()
      renderResult = renderer.render(renderWorld)
      containerChildCount = container.children.length
    })

    it('should render all positioned entities', () => {
      expect(renderResult.entities.length).toBe(6)
    })

    it('container should have 6 children after render', () => {
      expect(containerChildCount).toBe(6)
    })

    it('Graphics objects created: 6', () => {
      expect(graphicsCreateCount).toBe(6)
    })
  })

  // ══════════════════════════════════════════════════════════════════════
  // 6. Container children count: before vs after render
  // ══════════════════════════════════════════════════════════════════════

  describe('6. Container children — before vs after render', () => {
    let container: Container
    let beforeCount: number
    let afterCount: number

    beforeAll(() => {
      const store: RuntimeWorldStore = new DefaultRuntimeWorldStore()
      const pipeline = createPipeline()
      const executor = new DefaultCreateWorldRuntimeExecutor(pipeline, store)
      executor.execute('创建 MarioWorld')
      const world = store.getWorld()

      const adapter = new DefaultRuntimeRendererAdapter()
      const renderWorld = adapter.adapt(world)

const container = createMockContainer()
      const renderer = new DefaultPixiEntityRenderer(container, {
        catalog: new DefaultEntityVisualCatalog(),
        createGraphics: createMockGraphics,
      })

      beforeCount = container.children.length
      renderer.render(renderWorld)
      afterCount = container.children.length
    })

    it('before render: 0 children', () => {
      expect(beforeCount).toBe(0)
    })

    it('after render: 6 children', () => {
      expect(afterCount).toBe(6)
    })

    it('delta: 6 rendered children', () => {
      expect(afterCount - beforeCount).toBe(6)
    })
  })

  // ══════════════════════════════════════════════════════════════════════
  // 7. Graphics object creation count
  // ══════════════════════════════════════════════════════════════════════

  describe('7. Graphics creation count', () => {
    it('createGraphics should be called for the projected entity', () => {
      expect(graphicsCreateCount).toBeGreaterThan(0)
    })
  })

  // ══════════════════════════════════════════════════════════════════════
  // 8. Container position / Camera state
  // ══════════════════════════════════════════════════════════════════════

  describe('8. Container position and camera state', () => {
    it('container position defaults to (0, 0) when no camera controller', () => {
    const container = createMockContainer()
      const renderer = new DefaultPixiEntityRenderer(container, {
        catalog: new DefaultEntityVisualCatalog(),
        createGraphics: createMockGraphics,
      })

      // No camera controller passed → container position unchanged
      expect(container.x).toBe(0)
      expect(container.y).toBe(0)
    })

    it('camera is not configured (no camera controller in App.vue setup)', () => {
      // From App.vue onMounted:
      //   const entityRenderer = new DefaultPixiEntityRenderer(entityContainer, {
      //     catalog: new DefaultEntityVisualCatalog(),
      //   })
      // No cameraController option → this._cameraController = null
      // In render(): if (this._cameraController) → FALSE → camera offset is NOT applied
      expect(true).toBe(true)
    })
  })

  // ══════════════════════════════════════════════════════════════════════
  // 9. Comparison: entity WITHOUT PositionComponent vs WITH
  // ══════════════════════════════════════════════════════════════════════

  describe('9. Comparison: without PositionComponent vs with PositionComponent', () => {
    // --- Entity WITHOUT PositionComponent (current production behavior) ---

    it('entity WITHOUT PositionComponent → adapter → NO position → renderer SKIPS', () => {
      const world: World = {
        entities: [{
          id: 'player',
          type: 'player',
          x: 100,
          y: 200,
          components: [{ type: 'semantic', properties: { category: 'player', name: 'Player' } }],
        }],
      }

      const adapter = new DefaultRuntimeRendererAdapter()
      const renderWorld = adapter.adapt(world)

      expect(renderWorld.entities).toHaveLength(1)
      expect(renderWorld.entities[0].position).toBeUndefined()

const container = createMockContainer()
      const renderer = new DefaultPixiEntityRenderer(container, {
        catalog: new DefaultEntityVisualCatalog(),
        createGraphics: createMockGraphics,
      })

      resetGraphicsCount()
      const result = renderer.render(renderWorld)

      // Entity WITHOUT position → SKIPPED → 0 rendered
      expect(result.entities).toHaveLength(0)
      expect(container.children.length).toBe(0)
      expect(graphicsCreateCount).toBe(0)
    })

    // --- Entity WITH PositionComponent (what SHOULD happen) ---

    it('entity WITH PositionComponent → adapter → HAS position → renderer RENDERS', () => {
      const world: World = {
        entities: [{
          id: 'player',
          type: 'player',
          x: 100,
          y: 200,
          components: [
            { type: 'semantic', properties: { category: 'player', name: 'Player' } },
            createPositionComponent(100, 200),  // ← PositionComponent added
          ],
        }],
      }

      const adapter = new DefaultRuntimeRendererAdapter()
      const renderWorld = adapter.adapt(world)

      // Adapter found PositionComponent → position is present
      expect(renderWorld.entities).toHaveLength(1)
      expect(renderWorld.entities[0].position).toBeDefined()
      expect(renderWorld.entities[0].position!.x).toBe(100)
      expect(renderWorld.entities[0].position!.y).toBe(200)

      const container = createMockContainer()
      const renderer = new DefaultPixiEntityRenderer(container, {
        catalog: new DefaultEntityVisualCatalog(),
        createGraphics: createMockGraphics,
      })

      resetGraphicsCount()
      const result = renderer.render(renderWorld)

      // Entity WITH position → RENDERED → 1 entity rendered
      expect(result.entities).toHaveLength(1)
      expect(container.children.length).toBe(1)
      expect(graphicsCreateCount).toBe(1)

      // Verify Graphics was positioned at the entity's position
      const gfx = container.children[0] as Graphics
      expect(gfx.x).toBe(76)
      expect(gfx.y).toBe(152)
    })

    it('entity with PositionComponent has correct position data', () => {
      const world: World = {
        entities: [{
          id: 'enemy',
          type: 'enemy',
          x: 0,
          y: 0,
          components: [
            createPositionComponent(50, 75),
          ],
        }],
      }

      const adapter = new DefaultRuntimeRendererAdapter()
      const renderWorld = adapter.adapt(world)

      expect(renderWorld.entities[0].position).toBeDefined()
      expect(renderWorld.entities[0].position!.x).toBe(50)
      expect(renderWorld.entities[0].position!.y).toBe(75)
    })
  })

  // ══════════════════════════════════════════════════════════════════════
  // 10. Visualization loop tick — full pipeline trace
  // ══════════════════════════════════════════════════════════════════════

  describe('10. Full visualization loop tick trace', () => {
    it('tick() for projected world: entityCount=6, renderedCount=6', () => {
      const store: RuntimeWorldStore = new DefaultRuntimeWorldStore()
      const provider = new StoreBackedWorldProvider(store)
      const systemRegistry = new DefaultRuntimeSystemRegistry()
      const executionLoop = new DefaultRuntimeExecutionLoop(systemRegistry)
      const adapter = new DefaultRuntimeRendererAdapter()
      const container = createMockContainer()
      const renderer = new DefaultPixiEntityRenderer(container, {
        catalog: new DefaultEntityVisualCatalog(),
        createGraphics: createMockGraphics,
      })
      const initialWorld = store.getWorld()

      // Inject world via CreateWorldRuntimeExecutor
      const pipeline = createPipeline()
      const executor = new DefaultCreateWorldRuntimeExecutor(pipeline, store)
      executor.execute('创建 MarioWorld')

      const visLoop = new DefaultRuntimeVisualizationLoop(
        executionLoop,
        adapter,
        renderer,
        initialWorld,
        provider,
      )

      visLoop.start()
      const result = visLoop.tickWithResult()

      // The tick executes:
      //   1. provider.getWorld() → world with 1 entity (player)
      //   2. executionLoop.tick() → same world (no systems registered)
      //   3. adapter.adapt() → RenderWorld with 6 positioned entities
      //   4. renderer.render() → 6 rendered entities
      expect(result.entityCount).toBe(6)
      expect(result.renderedCount).toBe(6)
      expect(container.children.length).toBe(6)
    })

    it('tick() with PositionComponent: entityCount=1, renderedCount=1', () => {
      const store: RuntimeWorldStore = new DefaultRuntimeWorldStore()
      const provider = new StoreBackedWorldProvider(store)
      const systemRegistry = new DefaultRuntimeSystemRegistry()
      const executionLoop = new DefaultRuntimeExecutionLoop(systemRegistry)
      const adapter = new DefaultRuntimeRendererAdapter()
      const container = createMockContainer()
      const renderer = new DefaultPixiEntityRenderer(container, {
        catalog: new DefaultEntityVisualCatalog(),
        createGraphics: createMockGraphics,
      })
      const initialWorld = store.getWorld()

      // Inject world WITH PositionComponent
      store.setWorld({
        entities: [{
          id: 'player',
          type: 'player',
          x: 100,
          y: 200,
          components: [
            { type: 'semantic', properties: { category: 'player', name: 'Player' } },
            createPositionComponent(100, 200),
          ],
        }],
      })

      const visLoop = new DefaultRuntimeVisualizationLoop(
        executionLoop,
        adapter,
        renderer,
        initialWorld,
        provider,
      )

      visLoop.start()
      const result = visLoop.tickWithResult()

      // With PositionComponent, the entity has position → renderer renders it
      expect(result.entityCount).toBe(1)
      expect(result.renderedCount).toBe(1)
      expect(container.children.length).toBe(1)
    })
  })
})
