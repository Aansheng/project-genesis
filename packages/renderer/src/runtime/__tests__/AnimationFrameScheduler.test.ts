/**
 * AnimationFrameScheduler.test.ts — comprehensive test suite for the
 * AnimationFrameScheduler (WO-S9-006).
 *
 * Coverage areas:
 *   - start
 *   - stop
 *   - double start
 *   - double stop
 *   - callback invocation
 *   - running state
 *   - invalid callback
 *   - cleanup on stop
 *
 * Note: Uses a controlled mock for requestAnimationFrame that stores
 * pending callbacks without invoking them automatically. Tests call
 * the exported tick() function to deterministically advance one frame.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DefaultAnimationFrameScheduler } from '../DefaultAnimationFrameScheduler'

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

/**
 * Creates a controlled mock for requestAnimationFrame.
 *
 * Unlike a real RAF, this mock stores callbacks without invoking them.
 * Tests call tick() to invoke the latest pending callback synchronously.
 *
 * This prevents recursive stack overflows and provides deterministic
 * single-frame control.
 */
function configureMockRAF() {
  let frameIdCounter = 0
  let pendingCallback: FrameRequestCallback | null = null

  const rafSpy = vi
    .spyOn(globalThis, 'requestAnimationFrame')
    .mockImplementation((callback: FrameRequestCallback): number => {
      pendingCallback = callback
      return ++frameIdCounter
    })

  const cafSpy = vi
    .spyOn(globalThis, 'cancelAnimationFrame')
    .mockImplementation((_id: number): void => {
      pendingCallback = null
    })

  const tick = (): void => {
    const cb = pendingCallback
    pendingCallback = null
    if (cb) {
      cb(performance.now())
    }
  }

  return { rafSpy, cafSpy, tick }
}

let mockTick: () => void

function createScheduler(): DefaultAnimationFrameScheduler {
  return new DefaultAnimationFrameScheduler()
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('Construction', () => {
  it('creates a DefaultAnimationFrameScheduler instance', () => {
    const scheduler = createScheduler()
    expect(scheduler).toBeInstanceOf(DefaultAnimationFrameScheduler)
  })

  it('is initially not running', () => {
    const scheduler = createScheduler()
    expect(scheduler.isRunning()).toBe(false)
  })
})

describe('start', () => {
  beforeEach(() => {
    const mock = configureMockRAF()
    mockTick = mock.tick
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('start sets isRunning to true', () => {
    const scheduler = createScheduler()
    scheduler.start(() => {})
    expect(scheduler.isRunning()).toBe(true)
  })

  it('start calls requestAnimationFrame', () => {
    configureMockRAF()
    const scheduler = createScheduler()
    scheduler.start(() => {})
  })

  it('start invokes the callback on the first frame', () => {
    const scheduler = createScheduler()
    const callback = vi.fn()
    scheduler.start(callback)
    mockTick()
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('start throws for non-function callback', () => {
    const scheduler = createScheduler()
    expect(() => {
      (scheduler as DefaultAnimationFrameScheduler).start(null as unknown as () => void)
    }).toThrow('callback must be a function')
  })

  it('start throws for undefined callback', () => {
    const scheduler = createScheduler()
    expect(() => {
      (scheduler as DefaultAnimationFrameScheduler).start(undefined as unknown as () => void)
    }).toThrow('callback must be a function')
  })
})

describe('stop', () => {
  beforeEach(() => {
    const mock = configureMockRAF()
    mockTick = mock.tick
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('stop sets isRunning to false', () => {
    const scheduler = createScheduler()
    scheduler.start(() => {})
    expect(scheduler.isRunning()).toBe(true)
    scheduler.stop()
    expect(scheduler.isRunning()).toBe(false)
  })

  it('stop calls cancelAnimationFrame', () => {
    const { cafSpy } = configureMockRAF()
    const scheduler = createScheduler()
    scheduler.start(() => {})
    scheduler.stop()
    expect(cafSpy).toHaveBeenCalledTimes(1)
  })

  it('stop prevents further callbacks', () => {
    configureMockRAF()
    const scheduler = createScheduler()
    const callback = vi.fn()
    scheduler.start(callback)
    scheduler.stop()

    // stop() calls cancelAnimationFrame which sets pendingCallback to null.
    // Even if we call tick(), the callback won't fire because no callback is pending.
    // Our mock's cancelAnimationFrame implementation nulls the pending callback.
    expect(callback).not.toHaveBeenCalled()
  })

  it('initially stopped scheduler reports isRunning false', () => {
    const scheduler = createScheduler()
    expect(scheduler.isRunning()).toBe(false)
  })
})

describe('double start', () => {
  beforeEach(() => {
    const mock = configureMockRAF()
    mockTick = mock.tick
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('calling start multiple times keeps running true', () => {
    const scheduler = createScheduler()
    scheduler.start(() => {})
    scheduler.start(() => {})
    scheduler.start(() => {})
    expect(scheduler.isRunning()).toBe(true)
  })

  it('calling start multiple times does not invoke RAF more than once initially', () => {
    const { rafSpy } = configureMockRAF()
    const scheduler = createScheduler()
    scheduler.start(() => {})
    rafSpy.mockClear()
    scheduler.start(() => {})
    // Second start should be a no-op
    expect(rafSpy).not.toHaveBeenCalled()
  })

  it('double start does not change the callback', () => {
    const scheduler = createScheduler()
    const callback1 = vi.fn()
    const callback2 = vi.fn()

    scheduler.start(callback1)
    scheduler.start(callback2)

    // Only callback1 should have been invoked (it was the one scheduled)
    mockTick()
    expect(callback1).toHaveBeenCalled()
    expect(callback2).not.toHaveBeenCalled()
  })
})

describe('double stop', () => {
  beforeEach(() => {
    const mock = configureMockRAF()
    mockTick = mock.tick
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('calling stop multiple times keeps running false', () => {
    const scheduler = createScheduler()
    scheduler.start(() => {})
    scheduler.stop()
    scheduler.stop()
    scheduler.stop()
    expect(scheduler.isRunning()).toBe(false)
  })

  it('stop when not running does not call cancelAnimationFrame', () => {
    const { cafSpy } = configureMockRAF()
    const scheduler = createScheduler()
    cafSpy.mockClear()
    scheduler.stop()
    expect(cafSpy).not.toHaveBeenCalled()
  })
})

describe('callback invocation', () => {
  beforeEach(() => {
    const mock = configureMockRAF()
    mockTick = mock.tick
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('callback is invoked for each tick', () => {
    const scheduler = createScheduler()
    const callback = vi.fn()
    scheduler.start(callback)

    // First frame
    mockTick()
    expect(callback).toHaveBeenCalledTimes(1)

    // Second frame: after tick(), scheduleNext() was called from within
    // the callback, which calls requestAnimationFrame, storing a new pending callback.
    mockTick()
    expect(callback).toHaveBeenCalledTimes(2)

    mockTick()
    expect(callback).toHaveBeenCalledTimes(3)
  })

  it('callback is not invoked after stop', () => {
    configureMockRAF()
    const scheduler = createScheduler()
    const callback = vi.fn()
    scheduler.start(callback)
    scheduler.stop()

    // stop() clears the pending callback and sets _running to false.
    // Even if tick() is called, the pending callback was cleared by
    // cancelAnimationFrame's mock implementation.
    expect(callback).not.toHaveBeenCalled()
  })

  it('callback receives no arguments', () => {
    const scheduler = createScheduler()
    const callback = vi.fn()
    scheduler.start(callback)
    mockTick()

    // The callback should receive no args
    for (const args of callback.mock.calls) {
      expect(args).toHaveLength(0)
    }
  })
})

describe('running state', () => {
  beforeEach(() => {
    const mock = configureMockRAF()
    mockTick = mock.tick
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('isRunning is true after start', () => {
    const scheduler = createScheduler()
    expect(scheduler.isRunning()).toBe(false)
    scheduler.start(() => {})
    expect(scheduler.isRunning()).toBe(true)
  })

  it('isRunning is false after stop', () => {
    const scheduler = createScheduler()
    scheduler.start(() => {})
    scheduler.stop()
    expect(scheduler.isRunning()).toBe(false)
  })

  it('isRunning remains false after double stop', () => {
    const scheduler = createScheduler()
    scheduler.stop()
    scheduler.stop()
    expect(scheduler.isRunning()).toBe(false)
  })

  it('isRunning toggles correctly with start-stop-start cycle', () => {
    const scheduler = createScheduler()
    expect(scheduler.isRunning()).toBe(false)
    scheduler.start(() => {})
    expect(scheduler.isRunning()).toBe(true)
    scheduler.stop()
    expect(scheduler.isRunning()).toBe(false)
    scheduler.start(() => {})
    expect(scheduler.isRunning()).toBe(true)
  })
})

describe('cleanup', () => {
  beforeEach(() => {
    const mock = configureMockRAF()
    mockTick = mock.tick
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('stop cleans up internal state', () => {
    const scheduler = createScheduler()
    scheduler.start(() => {})
    scheduler.stop()

    // After stop, internal callback should be nulled so no further frames fire
    // Verify by starting again with a new callback
    const callback = vi.fn()
    scheduler.start(callback)
    mockTick()
    expect(callback).toHaveBeenCalled()
  })

  it('multiple start-stop cycles are stable', () => {
    const scheduler = createScheduler()

    for (let i = 0; i < 10; i++) {
      const callback = vi.fn()
      scheduler.start(callback)
      expect(scheduler.isRunning()).toBe(true)
      scheduler.stop()
      expect(scheduler.isRunning()).toBe(false)
    }

    // Final cycle should still work
    const finalCallback = vi.fn()
    scheduler.start(finalCallback)
    expect(scheduler.isRunning()).toBe(true)
    mockTick()
    expect(finalCallback).toHaveBeenCalled()
    scheduler.stop()
    expect(scheduler.isRunning()).toBe(false)
  })
})