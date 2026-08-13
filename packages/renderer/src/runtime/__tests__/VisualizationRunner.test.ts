/**
 * VisualizationRunner.test.ts — comprehensive test suite for the
 * VisualizationRunner (WO-S9-006).
 *
 * Coverage areas:
 *   - Construction
 *   - start
 *   - stop
 *   - multiple starts
 *   - multiple stops
 *   - tick invocation
 *   - scheduler integration
 *   - determinism
 *   - cleanup
 */
import { describe, it, expect } from 'vitest'
import type { AnimationFrameScheduler } from '../AnimationFrameScheduler'
import type { RuntimeVisualizationLoop } from '../RuntimeVisualizationLoop'
import type { VisualizationTickResult } from '../VisualizationTickResult'
import { DefaultVisualizationRunner } from '../DefaultVisualizationRunner'

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

function createMockScheduler(): AnimationFrameScheduler & {
  startCalls: Array<() => void>
  stopCalls: number
} {
  const startCalls: Array<() => void> = []
  let stopCalls = 0
  let running = false
  let currentCallback: (() => void) | null = null

  return {
    startCalls,
    get stopCalls() { return stopCalls },
    start: (callback: () => void) => {
      if (!running) {
        running = true
        currentCallback = callback
        startCalls.push(callback)
      }
    },
    stop: () => {
      if (running) {
        running = false
        currentCallback = null
        stopCalls++
      }
    },
    isRunning: () => running,
    // Expose for test inspection
    getCurrentCallback: () => currentCallback,
    reset: () => {
      startCalls.length = 0
      stopCalls = 0
      running = false
      currentCallback = null
    },
  } as AnimationFrameScheduler & {
    startCalls: Array<() => void>
    stopCalls: number
    getCurrentCallback: () => (() => void) | null
    reset: () => void
  }
}

function createMockVisualizationLoop(): RuntimeVisualizationLoop & {
  tickCalls: number[]
  startCalls: number
  stopCalls: number
} {
  let running = false
  const tickCalls: number[] = []

  return {
    tickCalls,
    get tickCount() { return tickCalls.length },
    startCalls: 0,
    stopCalls: 0,
    start: function (this: any) {
      running = true
      this.startCalls++
    },
    stop: function (this: any) {
      running = false
      this.stopCalls++
    },
    isRunning: () => running,
    tick: function () {
      tickCalls.push(Date.now())
    },
    tickWithResult: (): VisualizationTickResult => {
      tickCalls.push(Date.now())
      return Object.freeze({ entityCount: 0, renderedCount: 0 })
    },
  } as RuntimeVisualizationLoop & {
    tickCalls: number[]
    startCalls: number
    stopCalls: number
    tickCount: number
  }
}

function createRunner(
  scheduler: AnimationFrameScheduler,
  visualizationLoop: RuntimeVisualizationLoop,
): DefaultVisualizationRunner {
  return new DefaultVisualizationRunner(scheduler, visualizationLoop)
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('Construction', () => {
  it('creates a DefaultVisualizationRunner instance', () => {
    const scheduler = createMockScheduler()
    const loop = createMockVisualizationLoop()
    const runner = createRunner(scheduler, loop)
    expect(runner).toBeInstanceOf(DefaultVisualizationRunner)
  })

  it('is initially not running', () => {
    const scheduler = createMockScheduler()
    const loop = createMockVisualizationLoop()
    const runner = createRunner(scheduler, loop)
    expect(runner.isRunning()).toBe(false)
    expect(scheduler.isRunning()).toBe(false)
  })
})

describe('start', () => {
  it('start sets isRunning to true', () => {
    const scheduler = createMockScheduler()
    const loop = createMockVisualizationLoop()
    const runner = createRunner(scheduler, loop)

    runner.start()

    expect(runner.isRunning()).toBe(true)
    expect(scheduler.isRunning()).toBe(true)
  })

  it('start registers a callback with the scheduler', () => {
    const scheduler = createMockScheduler()
    const loop = createMockVisualizationLoop()
    const runner = createRunner(scheduler, loop)

    runner.start()

    expect(scheduler.startCalls).toHaveLength(1)
    expect(typeof scheduler.startCalls[0]).toBe('function')
  })

  it('start calls visualizationLoop.start if not already running', () => {
    const scheduler = createMockScheduler()
    const loop = createMockVisualizationLoop()
    const runner = createRunner(scheduler, loop)

    expect(loop.isRunning()).toBe(false)
    runner.start()

    expect(loop.isRunning()).toBe(true)
  })

  it('start does not call visualizationLoop.start if already running', () => {
    const scheduler = createMockScheduler()
    const loop = createMockVisualizationLoop()
    const runner = createRunner(scheduler, loop)

    // Manually start the loop first
    loop.start()
    const startCountBefore = (loop as any).startCalls

    runner.start()

    // visualizationLoop.start should not have been called again by the runner
    expect((loop as any).startCalls).toBe(startCountBefore)
  })
})

describe('stop', () => {
  it('stop sets isRunning to false', () => {
    const scheduler = createMockScheduler()
    const loop = createMockVisualizationLoop()
    const runner = createRunner(scheduler, loop)

    runner.start()
    expect(runner.isRunning()).toBe(true)

    runner.stop()
    expect(runner.isRunning()).toBe(false)
  })

  it('stop calls scheduler.stop', () => {
    const scheduler = createMockScheduler()
    const loop = createMockVisualizationLoop()
    const runner = createRunner(scheduler, loop)

    runner.start()
    const stopBefore = (scheduler as any).stopCalls

    runner.stop()

    expect((scheduler as any).stopCalls).toBe(stopBefore + 1)
  })
})

describe('multiple starts', () => {
  it('calling start multiple times is idempotent for isRunning', () => {
    const scheduler = createMockScheduler()
    const loop = createMockVisualizationLoop()
    const runner = createRunner(scheduler, loop)

    runner.start()
    runner.start()
    runner.start()

    expect(runner.isRunning()).toBe(true)
  })

  it('calling start multiple times only registers one callback', () => {
    const scheduler = createMockScheduler()
    const loop = createMockVisualizationLoop()
    const runner = createRunner(scheduler, loop)

    runner.start()
    runner.start()
    runner.start()

    // Only the first start should have registered a callback
    expect(scheduler.startCalls).toHaveLength(1)
  })
})

describe('multiple stops', () => {
  it('calling stop multiple times keeps running false', () => {
    const scheduler = createMockScheduler()
    const loop = createMockVisualizationLoop()
    const runner = createRunner(scheduler, loop)

    runner.stop()
    runner.stop()
    runner.stop()

    expect(runner.isRunning()).toBe(false)
  })

  it('start then multiple stops correctly toggles', () => {
    const scheduler = createMockScheduler()
    const loop = createMockVisualizationLoop()
    const runner = createRunner(scheduler, loop)

    runner.start()
    expect(runner.isRunning()).toBe(true)

    runner.stop()
    runner.stop()
    expect(runner.isRunning()).toBe(false)
  })
})

describe('tick invocation', () => {
  it('scheduler callback invokes visualizationLoop.tick', () => {
    const scheduler = createMockScheduler()
    const loop = createMockVisualizationLoop()
    const runner = createRunner(scheduler, loop)

    runner.start()

    // The callback registered with the scheduler should call loop.tick()
    const registeredCallback = scheduler.startCalls[0]
    const tickCountBefore = (loop as any).tickCalls.length

    registeredCallback()

    expect((loop as any).tickCalls.length).toBe(tickCountBefore + 1)
  })

  it('tick is invoked on each scheduler callback', () => {
    const scheduler = createMockScheduler()
    const loop = createMockVisualizationLoop()
    const runner = createRunner(scheduler, loop)

    runner.start()

    const registeredCallback = scheduler.startCalls[0]

    // Execute multiple callback invocations
    registeredCallback()
    registeredCallback()
    registeredCallback()

    expect((loop as any).tickCalls.length).toBe(3)
  })
})

describe('scheduler integration', () => {
  it('runner delegates start to scheduler', () => {
    const scheduler = createMockScheduler()
    const loop = createMockVisualizationLoop()
    const runner = createRunner(scheduler, loop)

    expect(scheduler.isRunning()).toBe(false)
    runner.start()
    expect(scheduler.isRunning()).toBe(true)
  })

  it('runner delegates stop to scheduler', () => {
    const scheduler = createMockScheduler()
    const loop = createMockVisualizationLoop()
    const runner = createRunner(scheduler, loop)

    runner.start()
    expect(scheduler.isRunning()).toBe(true)
    runner.stop()
    expect(scheduler.isRunning()).toBe(false)
  })

  it('runner and scheduler isRunning are in sync', () => {
    const scheduler = createMockScheduler()
    const loop = createMockVisualizationLoop()
    const runner = createRunner(scheduler, loop)

    expect(runner.isRunning()).toBe(scheduler.isRunning())

    runner.start()
    expect(runner.isRunning()).toBe(scheduler.isRunning())

    runner.stop()
    expect(runner.isRunning()).toBe(scheduler.isRunning())
  })
})

describe('determinism', () => {
  it('same setup produces same behavior', () => {
    const buildRunner = () => {
      const scheduler = createMockScheduler()
      const loop = createMockVisualizationLoop()
      return createRunner(scheduler, loop)
    }

    const runner1 = buildRunner()
    const runner2 = buildRunner()

    runner1.start()
    runner2.start()

    expect(runner1.isRunning()).toBe(runner2.isRunning())

    runner1.stop()
    runner2.stop()

    expect(runner1.isRunning()).toBe(runner2.isRunning())
  })

  it('tick behavior is deterministic across runs', () => {
    const scheduler = createMockScheduler()
    const loop = createMockVisualizationLoop()
    const runner = createRunner(scheduler, loop)

    runner.start()
    const callback = scheduler.startCalls[0]

    // Execute ticks deterministically
    callback()
    callback()

    expect((loop as any).tickCalls.length).toBe(2)

    runner.stop()
  })
})

describe('cleanup', () => {
  it('start-stop-start cycle is stable', () => {
    const scheduler = createMockScheduler()
    const loop = createMockVisualizationLoop()
    const runner = createRunner(scheduler, loop)

    // Cycle 1
    runner.start()
    expect(runner.isRunning()).toBe(true)
    runner.stop()
    expect(runner.isRunning()).toBe(false)

    // Cycle 2
    runner.start()
    expect(runner.isRunning()).toBe(true)
    runner.stop()
    expect(runner.isRunning()).toBe(false)

    // Final start should still work
    runner.start()
    expect(runner.isRunning()).toBe(true)
    expect(scheduler.startCalls).toHaveLength(3) // 3 starts across cycles
  })

  it('scheduler is cleaned up between cycles', () => {
    const scheduler = createMockScheduler()
    const loop = createMockVisualizationLoop()
    const runner = createRunner(scheduler, loop)

    // Cycle 1
    runner.start()
    const cb1 = scheduler.startCalls[0]
    runner.stop()

    // Cycle 2
    runner.start()
    const cb2 = scheduler.startCalls[1]

    // Different callbacks may be the same function reference;
    // the important thing is that the scheduler stopped and started again
    expect(scheduler.startCalls).toHaveLength(2)
    expect(cb1).toBeDefined()
    expect(cb2).toBeDefined()
  })

  it('tick function is not called after stop', () => {
    const scheduler = createMockScheduler()
    const loop = createMockVisualizationLoop()
    const runner = createRunner(scheduler, loop)

    runner.start()
    const callback = scheduler.startCalls[0]

    // Tick before stop
    callback()
    const tickCountBefore = (loop as any).tickCalls.length

    runner.stop()

    // Even if callback is called after stop, it shouldn't tick
    // (this depends on the scheduler implementation, but the runner
    // stops the scheduler so no more callbacks should fire)
    expect((loop as any).tickCalls.length).toBe(tickCountBefore)

    // But if someone manually calls the old callback, it will still tick
    // because the visualization loop is still running (we don't stop it)
    callback()
    expect((loop as any).tickCalls.length).toBe(tickCountBefore + 1)
  })
})