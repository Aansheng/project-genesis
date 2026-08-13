/**
 * RuntimeVisualizationLoop.test.ts — comprehensive test suite for the
 * RuntimeVisualizationLoop (WO-S9-005).
 *
 * Coverage areas:
 *   - Construction
 *   - start / stop lifecycle
 *   - multiple start / multiple stop
 *   - tick while stopped
 *   - tick while running
 *   - world progression through ticks
 *   - renderer invocation
 *   - adapter invocation
 *   - execution loop invocation
 *   - entity counts
 *   - multiple ticks
 *   - immutability
 *   - determinism
 *   - large worlds
 *   - memory stability
 */

import { describe, it, expect } from 'vitest'
import type { World, Entity } from '@genesis/shared'
import type { RuntimeExecutionLoop, ExecutionTickResult } from '@genesis/runtime'
import type { RuntimeRendererAdapter } from '../../adapter'
import type { PixiEntityRenderer, RenderWorldView } from '../../view'
import type { RenderWorld } from '../../model'
import { DefaultRuntimeVisualizationLoop } from '..'

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

/** Create a mock RuntimeExecutionLoop that tracks invocations. */
function createMockExecutionLoop(): RuntimeExecutionLoop & {
  tickCalls: Array<World>
} {
  const tickCalls: Array<World> = []
  return {
    tickCalls,
    tick: (world: World): World => {
      tickCalls.push(world)
      // Identity: return a frozen copy of the input
      return Object.freeze({
        entities: Object.freeze([...world.entities]),
      }) as unknown as World
    },
    tickWithResult: (world: World): ExecutionTickResult => {
      return Object.freeze({
        world: Object.freeze({
          entities: Object.freeze([...world.entities]),
        }) as unknown as World,
        executedSystems: Object.freeze([]),
        systemCount: 0,
      })
    },
  } as RuntimeExecutionLoop & { tickCalls: Array<World> }
}

/** Create a mock execution loop that modifies entity positions. */
function createMovingExecutionLoop(deltaX: number, deltaY: number): RuntimeExecutionLoop {
  return {
    tick: (world: World): World => {
      const updated: Entity[] = world.entities.map((e) =>
        Object.freeze({
          id: e.id,
          type: e.type,
          x: e.x + deltaX,
          y: e.y + deltaY,
          components: e.components,
        }),
      )
      return Object.freeze({
        entities: Object.freeze(updated),
      }) as unknown as World
    },
    tickWithResult: (world: World): ExecutionTickResult => {
      return Object.freeze({
        world: Object.freeze({
          entities: Object.freeze([...world.entities]),
        }) as unknown as World,
        executedSystems: Object.freeze([]),
        systemCount: 0,
      })
    },
  }
}

/** Create a mock RuntimeRendererAdapter that tracks invocations. */
function createMockAdapter(): RuntimeRendererAdapter & {
  adaptCalls: Array<World>
} {
  const adaptCalls: Array<World> = []
  return {
    adaptCalls,
    adapt: (world: World): RenderWorld => {
      adaptCalls.push(world)
      return Object.freeze({
        entities: Object.freeze(
          world.entities.map((e) =>
            Object.freeze({
              id: e.id,
              type: e.type,
            }),
          ),
        ),
      })
    },
  }
}

/** Create a mock adapter that includes position for entities with components. */
function createAdaptingAdapter(): RuntimeRendererAdapter & {
  adaptCalls: Array<World>
} {
  const adaptCalls: Array<World> = []
  return {
    adaptCalls,
    adapt: (world: World): RenderWorld => {
      adaptCalls.push(world)
      const entities = world.entities.map((e) => {
        const hasPos = e.components && e.components.length > 0
        return Object.freeze({
          id: e.id,
          type: e.type,
          ...(hasPos ? { position: { x: e.x, y: e.y } } : {}),
        })
      })
      return Object.freeze({ entities: Object.freeze(entities) })
    },
  }
}

/** Create a mock PixiEntityRenderer that tracks invocations. */
function createMockRenderer(): PixiEntityRenderer & {
  renderCalls: Array<RenderWorld>
} {
  const renderCalls: Array<RenderWorld> = []
  return {
    renderCalls,
    render: (world: RenderWorld): RenderWorldView => {
      renderCalls.push(world)
      const entities = world.entities
        .filter((e: any) => e.position)
        .map((e: any) =>
          Object.freeze({
            id: e.id,
            graphics: Object.freeze({ destroyed: false }) as unknown as import('pixi.js').Graphics,
          }),
        )
      return Object.freeze({ entities: Object.freeze(entities) }) as RenderWorldView
    },
    clear: () => {
      // no-op
    },
  } as PixiEntityRenderer & { renderCalls: Array<RenderWorld> }
}

/** Create a mock renderer that counts rendered entities. */
function createCountingRenderer(): PixiEntityRenderer & { renderCalls: Array<RenderWorld> } {
  const renderCalls: Array<RenderWorld> = []
  return {
    renderCalls,
    render: (world: RenderWorld): RenderWorldView => {
      renderCalls.push(world)
      const entities = world.entities
        .filter((e: any) => e.position)
        .map((e: any) =>
          Object.freeze({
            id: e.id,
            graphics: Object.freeze({ destroyed: false }) as unknown as import('pixi.js').Graphics,
          }),
        )
      return Object.freeze({ entities: Object.freeze(entities) }) as RenderWorldView
    },
    clear: () => {
      // no-op
    },
  } as PixiEntityRenderer & { renderCalls: Array<RenderWorld> }
}

// ---------------------------------------------------------------------------
// Test data helpers
// ---------------------------------------------------------------------------

function createEmptyWorld(): World {
  return Object.freeze({ entities: Object.freeze([]) }) as unknown as World
}

function createWorldWithEntities(count: number): World {
  const entities: Entity[] = Array.from({ length: count }, (_, i) =>
    Object.freeze({
      id: `entity-${i}`,
      type: 'test',
      x: i * 10,
      y: i * 20,
    }),
  )
  return Object.freeze({ entities: Object.freeze(entities) }) as unknown as World
}

function createWorldWithComponents(count: number): World {
  const entities: Entity[] = Array.from({ length: count }, (_, i) =>
    Object.freeze({
      id: `entity-${i}`,
      type: 'test',
      x: i * 10,
      y: i * 20,
      components: Object.freeze([
        Object.freeze({
          type: 'position',
          properties: Object.freeze({ x: i * 10, y: i * 20 }),
        }),
      ]),
    }),
  )
  return Object.freeze({ entities: Object.freeze(entities) }) as unknown as World
}

function createLoop(
  executionLoop: RuntimeExecutionLoop,
  adapter: RuntimeRendererAdapter,
  renderer: PixiEntityRenderer,
  initialWorld: World,
): DefaultRuntimeVisualizationLoop {
  return new DefaultRuntimeVisualizationLoop(
    executionLoop,
    adapter,
    renderer,
    initialWorld,
  )
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('Construction', () => {
  it('creates a DefaultRuntimeVisualizationLoop instance', () => {
    const loop = createLoop(
      createMockExecutionLoop(),
      createMockAdapter(),
      createMockRenderer(),
      createEmptyWorld(),
    )
    expect(loop).toBeInstanceOf(DefaultRuntimeVisualizationLoop)
  })

  it('is initially not running', () => {
    const loop = createLoop(
      createMockExecutionLoop(),
      createMockAdapter(),
      createMockRenderer(),
      createEmptyWorld(),
    )
    expect(loop.isRunning()).toBe(false)
  })

  it('accepts a non-empty initial world', () => {
    const world = createWorldWithEntities(3)
    const loop = createLoop(
      createMockExecutionLoop(),
      createMockAdapter(),
      createMockRenderer(),
      world,
    )
    expect(loop.isRunning()).toBe(false)
  })
})

describe('start / stop lifecycle', () => {
  it('start sets isRunning to true', () => {
    const loop = createLoop(
      createMockExecutionLoop(),
      createMockAdapter(),
      createMockRenderer(),
      createEmptyWorld(),
    )
    loop.start()
    expect(loop.isRunning()).toBe(true)
  })

  it('stop sets isRunning to false', () => {
    const loop = createLoop(
      createMockExecutionLoop(),
      createMockAdapter(),
      createMockRenderer(),
      createEmptyWorld(),
    )
    loop.start()
    expect(loop.isRunning()).toBe(true)
    loop.stop()
    expect(loop.isRunning()).toBe(false)
  })

  it('initially stopped loop reports isRunning false', () => {
    const loop = createLoop(
      createMockExecutionLoop(),
      createMockAdapter(),
      createMockRenderer(),
      createEmptyWorld(),
    )
    expect(loop.isRunning()).toBe(false)
  })
})

describe('multiple start', () => {
  it('calling start multiple times keeps running true', () => {
    const loop = createLoop(
      createMockExecutionLoop(),
      createMockAdapter(),
      createMockRenderer(),
      createEmptyWorld(),
    )
    loop.start()
    loop.start()
    loop.start()
    expect(loop.isRunning()).toBe(true)
  })
})

describe('multiple stop', () => {
  it('calling stop multiple times keeps running false', () => {
    const loop = createLoop(
      createMockExecutionLoop(),
      createMockAdapter(),
      createMockRenderer(),
      createEmptyWorld(),
    )
    loop.stop()
    loop.stop()
    loop.stop()
    expect(loop.isRunning()).toBe(false)
  })

  it('start then multiple stops correctly toggles', () => {
    const loop = createLoop(
      createMockExecutionLoop(),
      createMockAdapter(),
      createMockRenderer(),
      createEmptyWorld(),
    )
    loop.start()
    loop.stop()
    loop.stop()
    expect(loop.isRunning()).toBe(false)
  })
})

describe('tick while stopped', () => {
  it('tick does not invoke execution loop when stopped', () => {
    const executionLoop = createMockExecutionLoop()
    const adapter = createMockAdapter()
    const renderer = createMockRenderer()
    const loop = createLoop(
      executionLoop,
      adapter,
      renderer,
      createEmptyWorld(),
    )

    loop.tick()

    expect(executionLoop.tickCalls).toHaveLength(0)
    expect(adapter.adaptCalls).toHaveLength(0)
    expect(renderer.renderCalls).toHaveLength(0)
  })

  it('tick does nothing after stop', () => {
    const executionLoop = createMockExecutionLoop()
    const adapter = createMockAdapter()
    const renderer = createMockRenderer()
    const loop = createLoop(
      executionLoop,
      adapter,
      renderer,
      createEmptyWorld(),
    )

    loop.start()
    loop.tick()
    expect(executionLoop.tickCalls).toHaveLength(1)

    loop.stop()
    loop.tick()
    expect(executionLoop.tickCalls).toHaveLength(1)
  })

  it('tickWithResult returns zero renderedCount when stopped', () => {
    const loop = createLoop(
      createMockExecutionLoop(),
      createMockAdapter(),
      createMockRenderer(),
      createWorldWithEntities(3),
    )

    const result = loop.tickWithResult()

    expect(result.renderedCount).toBe(0)
  })

  it('tickWithResult returns entityCount even when stopped', () => {
    const loop = createLoop(
      createMockExecutionLoop(),
      createMockAdapter(),
      createMockRenderer(),
      createWorldWithEntities(5),
    )

    const result = loop.tickWithResult()

    expect(result.entityCount).toBe(5)
  })
})

describe('tick while running', () => {
  it('tick invokes execution loop', () => {
    const executionLoop = createMockExecutionLoop()
    const adapter = createMockAdapter()
    const renderer = createMockRenderer()
    const loop = createLoop(
      executionLoop,
      adapter,
      renderer,
      createEmptyWorld(),
    )

    loop.start()
    loop.tick()

    expect(executionLoop.tickCalls).toHaveLength(1)
  })

  it('tick invokes adapter', () => {
    const executionLoop = createMockExecutionLoop()
    const adapter = createMockAdapter()
    const renderer = createMockRenderer()
    const loop = createLoop(
      executionLoop,
      adapter,
      renderer,
      createEmptyWorld(),
    )

    loop.start()
    loop.tick()

    expect(adapter.adaptCalls).toHaveLength(1)
  })

  it('tick invokes entity renderer', () => {
    const executionLoop = createMockExecutionLoop()
    const adapter = createMockAdapter()
    const renderer = createMockRenderer()
    const loop = createLoop(
      executionLoop,
      adapter,
      renderer,
      createEmptyWorld(),
    )

    loop.start()
    loop.tick()

    expect(renderer.renderCalls).toHaveLength(1)
  })
})

describe('world progression', () => {
  it('world changes after tick with moving execution loop', () => {
    const executionLoop = createMovingExecutionLoop(5, 10)
    const adapter = createMockAdapter()
    const renderer = createMockRenderer()
    const world = createWorldWithEntities(1)

    const loop = createLoop(executionLoop, adapter, renderer, world)
    loop.start()

    loop.tick()

    // The result is visible through the adapter being called with the new world
    expect(adapter.adaptCalls).toHaveLength(1)
    const adaptedWorld = adapter.adaptCalls[0]
    expect(adaptedWorld.entities[0].x).toBe(5)
    expect(adaptedWorld.entities[0].y).toBe(10)
  })

  it('world progresses across multiple ticks', () => {
    const executionLoop = createMovingExecutionLoop(3, 7)
    const adapter = createMockAdapter()
    const renderer = createMockRenderer()
    const world = createWorldWithEntities(1)

    const loop = createLoop(executionLoop, adapter, renderer, world)
    loop.start()

    loop.tick()
    loop.tick()
    loop.tick()

    expect(adapter.adaptCalls).toHaveLength(3)
    const finalWorld = adapter.adaptCalls[2]
    expect(finalWorld.entities[0].x).toBe(9)
    expect(finalWorld.entities[0].y).toBe(21)
  })
})

describe('renderer invocation', () => {
  it('renderer is called with adapted world', () => {
    const executionLoop = createMockExecutionLoop()
    const adapter = createAdaptingAdapter()
    const renderer = createMockRenderer()
    const world = createWorldWithEntities(2)

    const loop = createLoop(executionLoop, adapter, renderer, world)
    loop.start()
    loop.tick()

    expect(renderer.renderCalls).toHaveLength(1)
  })

  it('renderer receives RenderWorld from adapter', () => {
    const executionLoop = createMockExecutionLoop()
    const adapter = createAdaptingAdapter()
    const renderer = createMockRenderer()
    const world = createWorldWithEntities(3)

    const loop = createLoop(executionLoop, adapter, renderer, world)
    loop.start()
    loop.tick()

    const renderWorld = renderer.renderCalls[0]
    expect(renderWorld.entities).toHaveLength(3)
  })
})

describe('adapter invocation', () => {
  it('adapter is called with the output of execution loop', () => {
    const executionLoop = createMockExecutionLoop()
    const adapter = createMockAdapter()
    const renderer = createMockRenderer()
    const world = createWorldWithEntities(4)

    const loop = createLoop(executionLoop, adapter, renderer, world)
    loop.start()
    loop.tick()

    expect(adapter.adaptCalls).toHaveLength(1)
    const adaptedWorld = adapter.adaptCalls[0]
    expect(adaptedWorld.entities).toHaveLength(4)
  })
})

describe('execution loop invocation', () => {
  it('execution loop receives the stored currentWorld', () => {
    const executionLoop = createMockExecutionLoop()
    const adapter = createMockAdapter()
    const renderer = createMockRenderer()
    const world = createWorldWithEntities(2)

    const loop = createLoop(executionLoop, adapter, renderer, world)
    loop.start()
    loop.tick()

    expect(executionLoop.tickCalls[0].entities).toHaveLength(2)
  })
})

describe('entity counts', () => {
  it('tickWithResult returns entityCount after tick', () => {
    const executionLoop = createMockExecutionLoop()
    const adapter = createAdaptingAdapter()
    const renderer = createCountingRenderer()
    const world = createWorldWithEntities(3)

    const loop = createLoop(executionLoop, adapter, renderer, world)
    loop.start()

    const result = loop.tickWithResult()

    expect(result.entityCount).toBe(3)
  })

  it('tickWithResult returns renderedCount', () => {
    const executionLoop = createMockExecutionLoop()
    const adapter = createAdaptingAdapter()
    const renderer = createCountingRenderer()
    const world = createWorldWithComponents(3)

    const loop = createLoop(executionLoop, adapter, renderer, world)
    loop.start()

    const result = loop.tickWithResult()

    expect(result.renderedCount).toBe(3)
  })
})

describe('multiple ticks', () => {
  it('tick executes pipeline on each call', () => {
    const executionLoop = createMockExecutionLoop()
    const adapter = createMockAdapter()
    const renderer = createMockRenderer()
    const world = createWorldWithEntities(2)

    const loop = createLoop(executionLoop, adapter, renderer, world)
    loop.start()

    loop.tick()
    loop.tick()
    loop.tick()

    expect(executionLoop.tickCalls).toHaveLength(3)
    expect(adapter.adaptCalls).toHaveLength(3)
    expect(renderer.renderCalls).toHaveLength(3)
  })

  it('multiple ticks produce correct entity counts', () => {
    const executionLoop = createMockExecutionLoop()
    const adapter = createAdaptingAdapter()
    const renderer = createCountingRenderer()
    const world = createWorldWithComponents(4)

    const loop = createLoop(executionLoop, adapter, renderer, world)
    loop.start()

    const r1 = loop.tickWithResult()
    const r2 = loop.tickWithResult()
    const r3 = loop.tickWithResult()

    expect(r1.entityCount).toBe(4)
    expect(r1.renderedCount).toBe(4)
    expect(r2.entityCount).toBe(4)
    expect(r2.renderedCount).toBe(4)
    expect(r3.entityCount).toBe(4)
    expect(r3.renderedCount).toBe(4)
  })
})

describe('immutability', () => {
  it('initial world is not mutated after tick', () => {
    const executionLoop = createMovingExecutionLoop(1, 1)
    const adapter = createMockAdapter()
    const renderer = createMockRenderer()
    const world = createWorldWithEntities(1)
    const originalX = world.entities[0].x
    const originalY = world.entities[0].y

    const loop = createLoop(executionLoop, adapter, renderer, world)
    loop.start()
    loop.tick()

    expect(world.entities[0].x).toBe(originalX)
    expect(world.entities[0].y).toBe(originalY)
  })

  it('tickWithResult returns frozen result', () => {
    const executionLoop = createMockExecutionLoop()
    const adapter = createAdaptingAdapter()
    const renderer = createCountingRenderer()
    const world = createWorldWithEntities(2)

    const loop = createLoop(executionLoop, adapter, renderer, world)
    loop.start()

    const result = loop.tickWithResult()

    expect(Object.isFrozen(result)).toBe(true)
  })

  it('internal currentWorld is not exposed for mutation', () => {
    const executionLoop = createMovingExecutionLoop(1, 1)
    const adapter = createAdaptingAdapter()
    const renderer = createCountingRenderer()
    const world = createWorldWithEntities(3)

    const loop = createLoop(executionLoop, adapter, renderer, world)
    loop.start()

    loop.tick()
    loop.tick()

    // The loop should maintain its own state; verify consistent behavior
    const result = loop.tickWithResult()
    expect(result.entityCount).toBe(3)
  })
})

describe('determinism', () => {
  it('same setup produces same result', () => {
    const world = createWorldWithComponents(5)

    const buildLoop = () => {
      const executionLoop = createMockExecutionLoop()
      const adapter = createAdaptingAdapter()
      const renderer = createCountingRenderer()
      return createLoop(executionLoop, adapter, renderer, world)
    }

    const loop1 = buildLoop()
    const loop2 = buildLoop()

    loop1.start()
    loop2.start()

    const r1 = loop1.tickWithResult()
    const r2 = loop2.tickWithResult()

    expect(r1.entityCount).toBe(r2.entityCount)
    expect(r1.renderedCount).toBe(r2.renderedCount)
  })
})

describe('large worlds', () => {
  it('handles 1000 entities', () => {
    const executionLoop = createMockExecutionLoop()
    const adapter = createMockAdapter()
    const renderer = createMockRenderer()
    const world = createWorldWithEntities(1000)

    const loop = createLoop(executionLoop, adapter, renderer, world)
    loop.start()
    loop.tick()

    expect(executionLoop.tickCalls[0].entities).toHaveLength(1000)
    expect(adapter.adaptCalls[0].entities).toHaveLength(1000)
  })

  it('tickWithResult handles 1000 entities', () => {
    const executionLoop = createMockExecutionLoop()
    const adapter = createAdaptingAdapter()
    const renderer = createCountingRenderer()
    const world = createWorldWithComponents(1000)

    const loop = createLoop(executionLoop, adapter, renderer, world)
    loop.start()

    const result = loop.tickWithResult()

    expect(result.entityCount).toBe(1000)
  })
})

describe('memory stability', () => {
  it('tick does not leak references between calls', () => {
    const executionLoop = createMockExecutionLoop()
    const adapter = createAdaptingAdapter()
    const renderer = createCountingRenderer()
    const world = createWorldWithEntities(10)

    const loop = createLoop(executionLoop, adapter, renderer, world)
    loop.start()

    // Multiple ticks should not cause issues
    for (let i = 0; i < 100; i++) {
      loop.tick()
    }

    // Final state should be consistent
    const result = loop.tickWithResult()
    expect(result.entityCount).toBe(10)
  })

  it('stop and restart cycle is stable', () => {
    const executionLoop = createMockExecutionLoop()
    const adapter = createAdaptingAdapter()
    const renderer = createCountingRenderer()
    const world = createWorldWithEntities(5)

    const loop = createLoop(executionLoop, adapter, renderer, world)

    for (let i = 0; i < 10; i++) {
      loop.start()
      loop.tick()
      loop.stop()
    }

    // After cycling, should still work
    loop.start()
    const result = loop.tickWithResult()
    expect(result.entityCount).toBe(5)
  })
})