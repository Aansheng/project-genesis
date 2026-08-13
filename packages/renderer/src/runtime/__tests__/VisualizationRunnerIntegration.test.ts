/**
 * VisualizationRunnerIntegration.test.ts — integration test verifying the
 * full real-time visualization pipeline.
 *
 * Pipeline:
 *   DefaultAnimationFrameScheduler → requestAnimationFrame
 *     ↓
 *   DefaultVisualizationRunner → tick callback
 *     ↓
 *   RuntimeVisualizationLoop.tick()
 *     ↓
 *   executionLoop.tick() → adapter.adapt() → entityRenderer.render()
 *     ↓
 *   Canvas Update
 *
 * WO-S9-006 — Real-Time Runtime Visualization Loop Foundation
 *
 * Coverage:
 *   - start → ticks occur
 *   - world updates through continuous ticks
 *   - render updates through continuous ticks
 *   - stop → ticks stop
 *   - start-stop-start restart cycle
 *
 * Note: Uses a controlled mock for requestAnimationFrame that stores
 * pending callbacks without invoking them automatically. Tests call
 * the exported tick() function to deterministically advance one frame
 * at a time.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import type { World, Entity } from '@genesis/shared'
import { createPositionComponent } from '@genesis/shared'
import type { RuntimeExecutionLoop } from '@genesis/runtime'
import { DefaultRuntimeExecutionLoop, DefaultRuntimeSystemRegistry, DefaultMovementSystem } from '@genesis/runtime'
import type { RuntimeRendererAdapter } from '../../adapter'
import type { RenderWorld } from '../../model'
import type { Graphics, Container } from 'pixi.js'
import { DefaultPixiEntityRenderer } from '../../view'
import { DefaultRuntimeVisualizationLoop } from '../DefaultRuntimeVisualizationLoop'
import { DefaultAnimationFrameScheduler } from '../DefaultAnimationFrameScheduler'
import { DefaultVisualizationRunner } from '../DefaultVisualizationRunner'

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

interface MockGraphicsData {
  destroyed: boolean
}

function createMockGraphics(): Graphics & { _data: MockGraphicsData } {
  const data: MockGraphicsData = { destroyed: false }
  return {
    _data: data,
    x: 0,
    y: 0,
    beginFill: () => { /* no-op */ },
    drawRect: () => { /* no-op */ },
    endFill: () => { /* no-op */ },
    destroy: () => { data.destroyed = true },
  } as unknown as Graphics & { _data: MockGraphicsData }
}

interface MockContainerState {
  childCount: number
  childAt: (index: number) => Graphics | undefined
}

function createMockContainer(): Container & { _state: MockContainerState } {
  const children: Graphics[] = []
  const state: MockContainerState = {
    get childCount() { return children.length },
    childAt: (i: number) => children[i],
  }
  return {
    _state: state,
    addChild: (child: Graphics) => {
      children.push(child)
      return child
    },
    removeChild: (child: Graphics) => {
      const idx = children.indexOf(child)
      if (idx !== -1) children.splice(idx, 1)
      return child
    },
  } as unknown as Container & { _state: MockContainerState }
}

// ---------------------------------------------------------------------------
// Integration adapter: reads position from entity.x/y
// (same pattern as RuntimeVisualizationLoopIntegration.test.ts)
// ---------------------------------------------------------------------------

class IntegrationRendererAdapter implements RuntimeRendererAdapter {
  adapt(world: World): RenderWorld {
    const entities = world.entities
      .filter((e) => e.components && e.components.length > 0)
      .map((e) =>
        Object.freeze({
          id: e.id,
          type: e.type,
          position: Object.freeze({ x: e.x, y: e.y }),
        }),
      )
    return Object.freeze({
      entities: Object.freeze(entities),
    })
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createWorldWithMovingEntity(): World {
  const position = createPositionComponent(10, 20)

  const entity: Entity = Object.freeze({
    id: 'moving-entity',
    type: 'player',
    x: 10,
    y: 20,
    components: Object.freeze([position]),
  })

  return Object.freeze({
    entities: Object.freeze([entity]),
  }) as unknown as World
}

function createWorldWithTwoEntities(): World {
  const pos1 = createPositionComponent(0, 0)
  const pos2 = createPositionComponent(100, 100)

  const entity1: Entity = Object.freeze({
    id: 'entity-1',
    type: 'player',
    x: 0,
    y: 0,
    components: Object.freeze([pos1]),
  })

  const entity2: Entity = Object.freeze({
    id: 'entity-2',
    type: 'enemy',
    x: 100,
    y: 100,
    components: Object.freeze([pos2]),
  })

  return Object.freeze({
    entities: Object.freeze([entity1, entity2]),
  }) as unknown as World
}

function createWorldWithNonPositionedEntity(): World {
  const pos = createPositionComponent(50, 50)

  const positioned: Entity = Object.freeze({
    id: 'positioned',
    type: 'player',
    x: 50,
    y: 50,
    components: Object.freeze([pos]),
  })

  const nonPositioned: Entity = Object.freeze({
    id: 'non-positioned',
    type: 'decor',
    x: 999,
    y: 999,
  })

  return Object.freeze({
    entities: Object.freeze([positioned, nonPositioned]),
  }) as unknown as World
}

function createMovementExecutionLoop(deltaX: number, deltaY: number): RuntimeExecutionLoop {
  const registry = new DefaultRuntimeSystemRegistry()
  registry.register(new DefaultMovementSystem(deltaX, deltaY))
  return new DefaultRuntimeExecutionLoop(registry)
}

interface IntegrationContext {
  runner: DefaultVisualizationRunner
  container: Container & { _state: MockContainerState }
  tick: () => void
}

/**
 * Creates a controlled mock for requestAnimationFrame.
 * Stores pending callbacks without invoking them.
 * Tests call tick() to advance one frame.
 */
function createMockRAF(): { tick: () => void } {
  let pendingCallback: FrameRequestCallback | null = null

  vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation(
    (callback: FrameRequestCallback): number => {
      pendingCallback = callback
      return 1
    },
  )

  vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(
    (_id: number): void => {
      pendingCallback = null
    },
  )

  const tick = (): void => {
    const cb = pendingCallback
    pendingCallback = null
    if (cb) {
      cb(performance.now())
    }
  }

  return { tick }
}

function createIntegrationEnvironment(
  world: World,
  deltaX: number,
  deltaY: number,
): IntegrationContext {
  const { tick } = createMockRAF()

  const executionLoop = createMovementExecutionLoop(deltaX, deltaY)
  const adapter = new IntegrationRendererAdapter()
  const container = createMockContainer()
  const entityRenderer = new DefaultPixiEntityRenderer(container, {
    createGraphics: () => createMockGraphics() as unknown as Graphics,
  })
  const visualizationLoop = new DefaultRuntimeVisualizationLoop(
    executionLoop,
    adapter,
    entityRenderer,
    world,
  )
  const scheduler = new DefaultAnimationFrameScheduler()
  const runner = new DefaultVisualizationRunner(scheduler, visualizationLoop)

  return { runner, container, tick }
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('VisualizationRunner Integration', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('start → ticks occur', () => {
    it('start causes entity to move (world update)', () => {
      const { runner, container, tick } = createIntegrationEnvironment(
        createWorldWithMovingEntity(),
        5,
        10,
      )

      runner.start()
      tick()

      // Entity should have moved: (10, 20) + (5, 10) = (15, 30)
      expect(container._state.childCount).toBe(1)
      expect(container._state.childAt(0)!.x).toBe(15)
      expect(container._state.childAt(0)!.y).toBe(30)
    })

    it('multiple ticks accumulate position changes', () => {
      const { runner, container, tick } = createIntegrationEnvironment(
        createWorldWithMovingEntity(),
        3,
        7,
      )

      runner.start()
      tick()

      // First frame: (10, 20) + (3, 7) = (13, 27)
      expect(container._state.childAt(0)!.x).toBe(13)
      expect(container._state.childAt(0)!.y).toBe(27)

      // After tick(), scheduleNext() was called which called RAF again.
      // The mock stored the new callback. Second tick() invokes it.
      tick()

      // Second frame: (13, 27) + (3, 7) = (16, 34)
      expect(container._state.childAt(0)!.x).toBe(16)
      expect(container._state.childAt(0)!.y).toBe(34)
    })
  })

  describe('world updates', () => {
    it('entities are rendered after start', () => {
      const { runner, container, tick } = createIntegrationEnvironment(
        createWorldWithMovingEntity(),
        3,
        7,
      )

      runner.start()
      tick()

      // Entity rendered at position: (10, 20) + (3, 7) = (13, 27)
      expect(container._state.childAt(0)!.x).toBe(13)
      expect(container._state.childAt(0)!.y).toBe(27)
    })

    it('two entities both move independently', () => {
      const { runner, container, tick } = createIntegrationEnvironment(
        createWorldWithTwoEntities(),
        1,
        -1,
      )

      runner.start()
      tick()

      // Entity 1: (0, 0) + (1, -1) = (1, -1)
      // Entity 2: (100, 100) + (1, -1) = (101, 99)
      expect(container._state.childAt(0)!.x).toBe(1)
      expect(container._state.childAt(0)!.y).toBe(-1)
      expect(container._state.childAt(1)!.x).toBe(101)
      expect(container._state.childAt(1)!.y).toBe(99)
    })
  })

  describe('render updates', () => {
    it('graphics positions reflect runtime world after start', () => {
      const { runner, container, tick } = createIntegrationEnvironment(
        createWorldWithMovingEntity(),
        0,
        -5,
      )

      runner.start()
      tick()

      // Entity: (10, 20) + (0, -5) = (10, 15)
      expect(container._state.childAt(0)!.x).toBe(10)
      expect(container._state.childAt(0)!.y).toBe(15)
    })

    it('non-positioned entities are not rendered', () => {
      const { runner, container, tick } = createIntegrationEnvironment(
        createWorldWithNonPositionedEntity(),
        1,
        1,
      )

      runner.start()
      tick()

      // Only 1 entity (the positioned one) should be rendered
      expect(container._state.childCount).toBe(1)
    })
  })

  describe('stop → ticks stop', () => {
    it('stop prevents further world updates', () => {
      const { runner, container, tick } = createIntegrationEnvironment(
        createWorldWithMovingEntity(),
        5,
        10,
      )

      runner.start()
      tick()

      // First tick: (10, 20) + (5, 10) = (15, 30)
      // After tick(), a new RAF was scheduled (pending callback stored)
      expect(container._state.childAt(0)!.x).toBe(15)

      runner.stop()

      // After stop, the pending callback was cleared by cancelAnimationFrame.
      // tick() should do nothing. Position remains unchanged.
      tick()
      expect(container._state.childAt(0)!.x).toBe(15)
      expect(container._state.childAt(0)!.y).toBe(30)
    })
  })

  describe('restart cycle', () => {
    it('start-stop-start cycle continues world updates', () => {
      const { runner, container, tick } = createIntegrationEnvironment(
        createWorldWithMovingEntity(),
        5,
        10,
      )

      // Cycle 1: start → tick → stop
      runner.start()
      tick()
      expect(container._state.childAt(0)!.x).toBe(15)
      runner.stop()

      // Cycle 2: start → tick → stop
      runner.start()
      tick()
      expect(container._state.childAt(0)!.x).toBe(20)
      runner.stop()

      // Cycle 3: start → tick → stop
      runner.start()
      tick()
      expect(container._state.childAt(0)!.x).toBe(25)
      runner.stop()
    })
  })
})