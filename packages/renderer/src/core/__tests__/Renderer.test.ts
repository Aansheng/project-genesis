/**
 * Renderer.test.ts — comprehensive test suite for the Renderer foundation.
 *
 * Coverage areas (WO-S9-001):
 *   - Construction
 *   - Initialize
 *   - Destroy
 *   - Multiple initialize
 *   - Multiple destroy
 *   - State transitions
 *   - Immutability
 *   - Determinism
 *   - Error handling
 */

import { describe, it, expect } from 'vitest'
import { PixiRenderer } from '../PixiRenderer'
import type { Application } from 'pixi.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createContainer(): HTMLElement {
  const el = document.createElement('div')
  el.style.width = '800px'
  el.style.height = '600px'
  return el
}

function createMockApp(): Application {
  const canvas = document.createElement('canvas')
  return {
    view: canvas,
    destroy: () => {
      // no-op mock
    },
  } as unknown as Application
}

function createMockAppFactory(): (opts: unknown) => Application {
  return (_opts: unknown) => createMockApp()
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('Renderer Construction', () => {
  it('creates an instance without options', () => {
    const renderer = new PixiRenderer()
    const state = renderer.getState()
    expect(state.initialized).toBe(false)
    expect(state.width).toBe(800)
    expect(state.height).toBe(600)
  })

  it('creates an instance with custom dimensions', () => {
    const renderer = new PixiRenderer({ width: 1024, height: 768 })
    const state = renderer.getState()
    expect(state.width).toBe(1024)
    expect(state.height).toBe(768)
    expect(state.initialized).toBe(false)
  })

  it('creates an instance with custom backgroundColor', () => {
    const renderer = new PixiRenderer({ backgroundColor: 0xff0000 })
    const state = renderer.getState()
    expect(state.initialized).toBe(false)
    expect(state.width).toBe(800)
    expect(state.height).toBe(600)
  })

  it('exposes getState even before initialization', () => {
    const renderer = new PixiRenderer()
    const state = renderer.getState()
    expect(state).toBeDefined()
    expect(typeof state.initialized).toBe('boolean')
    expect(typeof state.width).toBe('number')
    expect(typeof state.height).toBe('number')
  })

  it('state is frozen (immutable)', () => {
    const renderer = new PixiRenderer()
    const state = renderer.getState()
    expect(Object.isFrozen(state)).toBe(true)
  })
})

describe('Renderer Initialize', () => {
  it('initializes and appends a canvas to the container', async () => {
    const renderer = new PixiRenderer({ createApp: createMockAppFactory() })
    const container = createContainer()

    await renderer.initialize(container)

    const state = renderer.getState()
    expect(state.initialized).toBe(true)
    expect(container.querySelector('canvas')).not.toBeNull()
  })

  it('state reflects initialization', async () => {
    const renderer = new PixiRenderer({ width: 1280, height: 720, createApp: createMockAppFactory() })
    const container = createContainer()

    await renderer.initialize(container)

    const state = renderer.getState()
    expect(state.initialized).toBe(true)
    expect(state.width).toBe(1280)
    expect(state.height).toBe(720)
  })

  it('attaches a canvas to the supplied DOM element', async () => {
    const renderer = new PixiRenderer({ createApp: createMockAppFactory() })
    const container = createContainer()

    await renderer.initialize(container)

    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInstanceOf(HTMLCanvasElement)
    expect(canvas?.parentElement).toBe(container)
  })

  it('createElement works as a container', async () => {
    const renderer = new PixiRenderer({ createApp: createMockAppFactory() })
    const container = createContainer()

    await renderer.initialize(container)

    expect(container.children.length).toBeGreaterThan(0)
  })
})

describe('Renderer Destroy', () => {
  it('destroys the application and clears state', async () => {
    const renderer = new PixiRenderer({ createApp: createMockAppFactory() })
    const container = createContainer()

    await renderer.initialize(container)
    await renderer.destroy()

    const state = renderer.getState()
    expect(state.initialized).toBe(false)
  })

  it('can be destroyed after initialization', async () => {
    const renderer = new PixiRenderer({ createApp: createMockAppFactory() })
    const container = createContainer()

    await renderer.initialize(container)
    await renderer.destroy()

    const state = renderer.getState()
    expect(state.initialized).toBe(false)
  })
})

describe('Multiple Initialize (Error Handling)', () => {
  it('throws when initialize is called twice', async () => {
    const renderer = new PixiRenderer({ createApp: createMockAppFactory() })
    const container = createContainer()

    await renderer.initialize(container)
    await expect(renderer.initialize(container)).rejects.toThrow(
      /already initialized/i
    )
  })

  it('second initialize does not change state', async () => {
    const renderer = new PixiRenderer({ createApp: createMockAppFactory() })
    const container = createContainer()

    await renderer.initialize(container)
    try {
      await renderer.initialize(container)
    } catch {
      // expected
    }

    const state = renderer.getState()
    expect(state.initialized).toBe(true)
  })
})

describe('Multiple Destroy (Error Handling)', () => {
  it('throws when destroy is called twice', async () => {
    const renderer = new PixiRenderer({ createApp: createMockAppFactory() })
    const container = createContainer()

    await renderer.initialize(container)
    await renderer.destroy()
    await expect(renderer.destroy()).rejects.toThrow(/not initialized/i)
  })

  it('throws when destroy is called before initialize', async () => {
    const renderer = new PixiRenderer()

    await expect(renderer.destroy()).rejects.toThrow(/not initialized/i)
  })
})

describe('Destroy Before Initialize (Error Handling)', () => {
  it('throws on destroy without prior initialize', async () => {
    const renderer = new PixiRenderer()

    await expect(renderer.destroy()).rejects.toThrow(/not initialized/i)
  })
})

describe('State Transitions', () => {
  it('starts uninitialized', () => {
    const renderer = new PixiRenderer()
    expect(renderer.getState().initialized).toBe(false)
  })

  it('becomes initialized after initialize', async () => {
    const renderer = new PixiRenderer({ createApp: createMockAppFactory() })
    const container = createContainer()

    await renderer.initialize(container)
    expect(renderer.getState().initialized).toBe(true)
  })

  it('returns to uninitialized after destroy', async () => {
    const renderer = new PixiRenderer({ createApp: createMockAppFactory() })
    const container = createContainer()

    await renderer.initialize(container)
    await renderer.destroy()
    expect(renderer.getState().initialized).toBe(false)
  })

  it('width and height persist through state transitions', async () => {
    const renderer = new PixiRenderer({ width: 640, height: 480, createApp: createMockAppFactory() })
    const container = createContainer()

    const s1 = renderer.getState()
    expect(s1.width).toBe(640)
    expect(s1.height).toBe(480)

    await renderer.initialize(container)
    const s2 = renderer.getState()
    expect(s2.width).toBe(640)
    expect(s2.height).toBe(480)

    await renderer.destroy()
    const s3 = renderer.getState()
    expect(s3.width).toBe(640)
    expect(s3.height).toBe(480)
  })
})

describe('Immutability', () => {
  it('getState returns a frozen object', () => {
    const renderer = new PixiRenderer()
    const state = renderer.getState()
    expect(Object.isFrozen(state)).toBe(true)
  })

  it('state after initialize is frozen', async () => {
    const renderer = new PixiRenderer({ createApp: createMockAppFactory() })
    const container = createContainer()

    await renderer.initialize(container)
    expect(Object.isFrozen(renderer.getState())).toBe(true)
  })

  it('state after destroy is frozen', async () => {
    const renderer = new PixiRenderer({ createApp: createMockAppFactory() })
    const container = createContainer()

    await renderer.initialize(container)
    await renderer.destroy()
    expect(Object.isFrozen(renderer.getState())).toBe(true)
  })
})

describe('Determinism', () => {
  it('two renderers with the same options produce the same state', () => {
    const a = new PixiRenderer({ width: 800, height: 600 })
    const b = new PixiRenderer({ width: 800, height: 600 })

    expect(a.getState()).toEqual(b.getState())
  })

  it('two renderers with different options produce different dimensions', () => {
    const a = new PixiRenderer({ width: 800, height: 600 })
    const b = new PixiRenderer({ width: 1024, height: 768 })

    const sa = a.getState()
    const sb = b.getState()
    expect(sa.width).not.toBe(sb.width)
    expect(sa.height).not.toBe(sb.height)
    expect(sa.initialized).toBe(sb.initialized)
  })
})

describe('Error Handling', () => {
  it('initialize works with a fresh container', async () => {
    const renderer = new PixiRenderer({ createApp: createMockAppFactory() })
    const container = createContainer()

    await renderer.initialize(container)
    expect(renderer.getState().initialized).toBe(true)
  })

  it('initialize with an arbitrary element works', async () => {
    const renderer = new PixiRenderer({ createApp: createMockAppFactory() })
    const container = document.createElement('section')

    await renderer.initialize(container)
    expect(renderer.getState().initialized).toBe(true)
  })

  it('multiple initialize attempts only succeed once', async () => {
    const renderer = new PixiRenderer({ createApp: createMockAppFactory() })
    const container = createContainer()

    await renderer.initialize(container)
    await expect(renderer.initialize(container)).rejects.toThrow()
  })
})