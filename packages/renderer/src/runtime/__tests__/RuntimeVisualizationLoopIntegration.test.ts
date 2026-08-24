/**
 * RuntimeVisualizationLoopIntegration.test.ts — integration test verifying
 * end-to-end pipeline: World(t0) → tick → World(t1) with position changes
 * reflected on Graphics.
 *
 * WO-S9-005 — Runtime Visualization Loop Foundation
 *
 * Coverage:
 *   - World(t0) → tick → World(t1)
 *   - Position changes after movement tick
 *   - Graphics positions are updated after tick
 *
 * Note: This test uses mock containers/graphics instead of real PIXI.js
 * instances because PIXI.js requires a real HTMLCanvasElement context
 * which is not available in jsdom test environment.
 *
 * Integration adapter: reads position from entity.x/y (not component
 * properties) because DefaultMovementSystem mutates entity.x/y rather
 * than PositionComponent.properties.
 */

import { describe, it, expect } from 'vitest'
import type { Graphics, Container } from 'pixi.js'
import type { World, Entity } from '@genesis/shared'
import { createPositionComponent } from '@genesis/shared'
import type { RuntimeExecutionLoop, RuntimeGameplaySessionState } from '@genesis/runtime'
import { DefaultRuntimeExecutionLoop, DefaultRuntimeSystemRegistry, DefaultMovementSystem } from '@genesis/runtime'
import type { RuntimeRendererAdapter } from '../../adapter'
import type { RenderWorld } from '../../model'
import { DefaultPixiEntityRenderer } from '../../view'
import { DefaultRuntimeVisualizationLoop } from '..'

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
// Integration adapter: reads position from entity.x/y (not component
// properties). This bridges the gap between DefaultMovementSystem (which
// mutates entity.x/y) and the renderer (which renders based on position).
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

function createWorldWithMixedEntities(): World {
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

function createVisualizationLoop(
  executionLoop: RuntimeExecutionLoop,
  adapter: RuntimeRendererAdapter,
  container: Container & { _state: MockContainerState },
  world: World,
): DefaultRuntimeVisualizationLoop {
  const entityRenderer = new DefaultPixiEntityRenderer(container, {
    createGraphics: () => createMockGraphics() as unknown as Graphics,
  })
  return new DefaultRuntimeVisualizationLoop(
    executionLoop,
    adapter,
    entityRenderer,
    world,
  )
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('RuntimeVisualizationLoop Integration', () => {
  describe('World(t0) → tick → World(t1) — position changes', () => {
    it('single tick moves entity position', () => {
      const executionLoop = createMovementExecutionLoop(5, 10)
      const adapter = new IntegrationRendererAdapter()
      const container = createMockContainer()
      const loop = createVisualizationLoop(executionLoop, adapter, container, createWorldWithMovingEntity())

      loop.start()
      loop.tick()

      // The entity should have moved — verify via graphics position
      expect(container._state.childCount).toBe(1)
      expect(container._state.childAt(0)!.x).toBe(15)
      expect(container._state.childAt(0)!.y).toBe(30)
    })

    it('multiple ticks accumulate position changes', () => {
      const executionLoop = createMovementExecutionLoop(3, 7)
      const adapter = new IntegrationRendererAdapter()
      const container = createMockContainer()
      const loop = createVisualizationLoop(executionLoop, adapter, container, createWorldWithMovingEntity())

      loop.start()
      loop.tick()
      loop.tick()
      loop.tick()

      // Three ticks: (10, 20) + 3*(3, 7) = (19, 41)
      expect(container._state.childAt(0)!.x).toBe(19)
      expect(container._state.childAt(0)!.y).toBe(41)
    })

    it('two entities both move independently', () => {
      const executionLoop = createMovementExecutionLoop(1, -1)
      const adapter = new IntegrationRendererAdapter()
      const container = createMockContainer()
      const loop = createVisualizationLoop(executionLoop, adapter, container, createWorldWithTwoEntities())

      loop.start()
      loop.tick()

      expect(container._state.childCount).toBe(2)
      // Entity 1: (0, 0) + (1, -1) = (1, -1)
      expect(container._state.childAt(0)!.x).toBe(1)
      expect(container._state.childAt(0)!.y).toBe(-1)
      // Entity 2: (100, 100) + (1, -1) = (101, 99)
      expect(container._state.childAt(1)!.x).toBe(101)
      expect(container._state.childAt(1)!.y).toBe(99)
    })
  })

  describe('World(t0) → tick → World(t1) — Graphics positions after tick', () => {
    it('graphics positions reflect runtime world after tick', () => {
      const executionLoop = createMovementExecutionLoop(0, -5)
      const adapter = new IntegrationRendererAdapter()
      const container = createMockContainer()
      const loop = createVisualizationLoop(executionLoop, adapter, container, createWorldWithMovingEntity())

      loop.start()
      loop.tick()

      expect(container._state.childAt(0)!.x).toBe(10)
      expect(container._state.childAt(0)!.y).toBe(15)
    })

    it('non-positioned entities are not rendered', () => {
      const executionLoop = createMovementExecutionLoop(1, 1)
      const adapter = new IntegrationRendererAdapter()
      const container = createMockContainer()
      const loop = createVisualizationLoop(executionLoop, adapter, container, createWorldWithMixedEntities())

      loop.start()
      loop.tick()

      // Only 1 entity has a position component, so only 1 is rendered
      expect(container._state.childCount).toBe(1)
    })

    it('tickWithResult returns rendered count matching graphics', () => {
      const executionLoop = createMovementExecutionLoop(2, 2)
      const adapter = new IntegrationRendererAdapter()
      const container = createMockContainer()
      const loop = createVisualizationLoop(executionLoop, adapter, container, createWorldWithTwoEntities())

      loop.start()
      const result = loop.tickWithResult()

      expect(result.renderedCount).toBe(2)
      expect(result.entityCount).toBe(2)
      expect(container._state.childCount).toBe(2)
    })

    it('zero movement delta preserves positions', () => {
      const executionLoop = createMovementExecutionLoop(0, 0)
      const adapter = new IntegrationRendererAdapter()
      const container = createMockContainer()
      const loop = createVisualizationLoop(executionLoop, adapter, container, createWorldWithMovingEntity())

      loop.start()
      loop.tick()

      expect(container._state.childAt(0)!.x).toBe(10)
      expect(container._state.childAt(0)!.y).toBe(20)
    })

    it('stop+start cycle resets tick capability', () => {
      const executionLoop = createMovementExecutionLoop(5, 5)
      const adapter = new IntegrationRendererAdapter()
      const container = createMockContainer()
      const loop = createVisualizationLoop(executionLoop, adapter, container, createWorldWithMovingEntity())

      loop.start()
      loop.tick()
      expect(container._state.childAt(0)!.x).toBe(15)

      loop.stop()
      loop.tick() // Should be no-op
      expect(container._state.childAt(0)!.x).toBe(15) // Unchanged

      loop.start()
      loop.tick()
      expect(container._state.childAt(0)!.x).toBe(20) // Progressed
    })

    it('publishes the committed Runtime World before gameplay observers read it', () => {
      const executionLoop = createMovementExecutionLoop(5, 0)
      const adapter = new IntegrationRendererAdapter()
      const container = createMockContainer()
      let publishedWorld: World | undefined
      let observedX: number | undefined
      const loop = new DefaultRuntimeVisualizationLoop(
        executionLoop,
        adapter,
        new DefaultPixiEntityRenderer(container, {
          createGraphics: () => createMockGraphics() as unknown as Graphics,
        }),
        createWorldWithMovingEntity(),
        undefined,
        {
          setWorld(world: World): void {
            publishedWorld = world
          },
        },
        undefined,
        {
          observe(): void {
            observedX = publishedWorld?.entities[0]?.x
          },
        },
      )

      loop.start()
      loop.tick()

      expect(observedX).toBe(15)
    })

    it('publishes committed Runtime session completion to the projection observer', () => {
      const world = createWorldWithMovingEntity()
      const executionLoop: RuntimeExecutionLoop = {
        tick(input): World {
          return input
        },
        tickWithResult(input) {
          return Object.freeze({
            world: input,
            executedSystems: Object.freeze([]),
            systemCount: 0,
            gameplaySessionState: Object.freeze({
              status: 'completed' as const,
              completedByGoalId: 'goal',
              completedAtTick: 3,
            }),
          })
        },
      }
      const adapter = new IntegrationRendererAdapter()
      const container = createMockContainer()
      let observedState: RuntimeGameplaySessionState | undefined
      const loop = new DefaultRuntimeVisualizationLoop(
        executionLoop,
        adapter,
        new DefaultPixiEntityRenderer(container, {
          createGraphics: () => createMockGraphics() as unknown as Graphics,
        }),
        world,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        {
          observe(state): void {
            observedState = state
          },
        },
      )

      loop.start()
      loop.tick()

      expect(observedState).toEqual({
        status: 'completed',
        completedByGoalId: 'goal',
        completedAtTick: 3,
      })
    })

    it('clear between ticks re-renders correctly', () => {
      const executionLoop = createMovementExecutionLoop(10, 10)
      const adapter = new IntegrationRendererAdapter()
      const container = createMockContainer()
      const loop = createVisualizationLoop(executionLoop, adapter, container, createWorldWithMovingEntity())

      loop.start()
      loop.tick()
      expect(container._state.childCount).toBe(1)
      expect(container._state.childAt(0)!.x).toBe(20)

      // Clear manually to simulate what the loop does
      // (the PixiEntityRenderer clears on each render())
      // Next tick should re-render with updated position
      loop.tick()
      expect(container._state.childCount).toBe(1)
      expect(container._state.childAt(0)!.x).toBe(30)
    })
  })
})
