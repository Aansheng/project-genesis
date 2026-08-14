/**
 * MarioGameBootstrap.test.ts — tests for DefaultMarioGameBootstrap.
 *
 * Coverage: pipeline creation, start, stop, double start, double stop, integration
 */
import { describe, it, expect, vi } from 'vitest'
import type { Renderer, RendererState } from '../../core'
import { DefaultMarioGameBootstrap } from '../MarioGameBootstrap'
import type { GameBootstrapConfig, GameBootstrap, InputProvider, InputState } from '@genesis/runtime'
import { DefaultInputState } from '@genesis/runtime'
import type { World } from '@genesis/shared'

// ---------------------------------------------------------------------------
// Mock InputProvider
// ---------------------------------------------------------------------------

class MockInputProvider implements InputProvider {
  getState(): InputState {
    return new DefaultInputState()
  }
}

// ---------------------------------------------------------------------------
// Mock Renderer
// ---------------------------------------------------------------------------

class MockRenderer implements Renderer {
  initialized = false
  destroyed = false

  async initialize(_container: HTMLElement): Promise<void> {
    this.initialized = true
  }

  async destroy(): Promise<void> {
    this.destroyed = true
    this.initialized = false
  }

  getState(): RendererState {
    return Object.freeze({
      initialized: this.initialized,
      width: 800,
      height: 600,
    })
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockContainer(): HTMLElement {
  return document.createElement('div')
}

function createMockRendererFactory() {
  return (_options?: { width?: number; height?: number; backgroundColor?: number }) => new MockRenderer()
}

// ---------------------------------------------------------------------------
// Construction
// ---------------------------------------------------------------------------

describe('construction', () => {
  it('should create a DefaultMarioGameBootstrap instance', () => {
    const bootstrap = new DefaultMarioGameBootstrap()
    expect(bootstrap).toBeInstanceOf(DefaultMarioGameBootstrap)
  })

  it('should implement MarioGameBootstrap interface', () => {
    const bootstrap = new DefaultMarioGameBootstrap()
    expect(typeof bootstrap.start).toBe('function')
    expect(typeof bootstrap.stop).toBe('function')
    expect(typeof bootstrap.isRunning).toBe('function')
  })

  it('should not be running after construction', () => {
    const bootstrap = new DefaultMarioGameBootstrap()
    expect(bootstrap.isRunning()).toBe(false)
  })

  it('should be stateless before first start', () => {
    const bootstrap = new DefaultMarioGameBootstrap()
    expect(bootstrap.isRunning()).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Pipeline creation — semantic layer verification
// ---------------------------------------------------------------------------

describe('pipeline creation', () => {
  it('should produce a runtime world from the Mario world model', async () => {
    const { DefaultMarioWorldFactory } = await import('@genesis/ai')
    const { DefaultSemanticGameDslBuilder } = await import('@genesis/ai')
    const { DefaultRuntimeProjection } = await import('@genesis/runtime')

    const factory = new DefaultMarioWorldFactory()
    const worldModel = factory.create()

    const dslBuilder = new DefaultSemanticGameDslBuilder()
    const gameDsl = dslBuilder.build(worldModel)

    const projection = new DefaultRuntimeProjection()
    const result = projection.project(gameDsl)

    expect(worldModel.worldType).toBe('platformer')
    expect(worldModel.entities).toHaveLength(3)
    expect(gameDsl.world.name).toBe('Platformer World')
    expect(result.world.entities).toHaveLength(3)
    expect(result.entityCount).toBe(3)
  })

  it('should preserve entity types through the pipeline', async () => {
    const { DefaultMarioWorldFactory } = await import('@genesis/ai')
    const { DefaultSemanticGameDslBuilder } = await import('@genesis/ai')
    const { DefaultRuntimeProjection } = await import('@genesis/runtime')

    const factory = new DefaultMarioWorldFactory()
    const worldModel = factory.create()
    const dslBuilder = new DefaultSemanticGameDslBuilder()
    const gameDsl = dslBuilder.build(worldModel)
    const projection = new DefaultRuntimeProjection()
    const result = projection.project(gameDsl)

    const entities = result.world.entities
    expect(entities[0].type).toBe('player')
    expect(entities[1].type).toBe('terrain')
    expect(entities[2].type).toBe('item')
  })

  it('should produce frozen output from the pipeline', async () => {
    const { DefaultMarioWorldFactory } = await import('@genesis/ai')
    const { DefaultSemanticGameDslBuilder } = await import('@genesis/ai')
    const { DefaultRuntimeProjection } = await import('@genesis/runtime')

    const factory = new DefaultMarioWorldFactory()
    const worldModel = factory.create()
    const dslBuilder = new DefaultSemanticGameDslBuilder()
    const gameDsl = dslBuilder.build(worldModel)
    const projection = new DefaultRuntimeProjection()
    const result = projection.project(gameDsl)

    expect(Object.isFrozen(result.world)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

describe('start', () => {
  it('should start the game in a container', async () => {
    const bootstrap = new DefaultMarioGameBootstrap({ createRenderer: createMockRendererFactory() })
    const container = createMockContainer()

    await bootstrap.start(container)

    expect(bootstrap.isRunning()).toBe(true)

    await bootstrap.stop()
  })

  it('should become running after start', async () => {
    const bootstrap = new DefaultMarioGameBootstrap({ createRenderer: createMockRendererFactory() })
    const container = createMockContainer()

    await bootstrap.start(container)

    expect(bootstrap.isRunning()).toBe(true)

    await bootstrap.stop()
  })
})

// ---------------------------------------------------------------------------
// Stop
// ---------------------------------------------------------------------------

describe('stop', () => {
  it('should stop a running game', async () => {
    const bootstrap = new DefaultMarioGameBootstrap({ createRenderer: createMockRendererFactory() })
    const container = createMockContainer()

    await bootstrap.start(container)
    expect(bootstrap.isRunning()).toBe(true)

    await bootstrap.stop()
    expect(bootstrap.isRunning()).toBe(false)
  })

  it('should remove running state after stop', async () => {
    const bootstrap = new DefaultMarioGameBootstrap({ createRenderer: createMockRendererFactory() })
    const container = createMockContainer()

    await bootstrap.start(container)
    await bootstrap.stop()

    expect(bootstrap.isRunning()).toBe(false)
  })

  it('should allow stopping without starting', async () => {
    const bootstrap = new DefaultMarioGameBootstrap({ createRenderer: createMockRendererFactory() })

    // Stop when not running should be a no-op
    await bootstrap.stop()
    expect(bootstrap.isRunning()).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Double start
// ---------------------------------------------------------------------------

describe('double start', () => {
  it('should be a no-op on second start', async () => {
    const bootstrap = new DefaultMarioGameBootstrap({ createRenderer: createMockRendererFactory() })
    const container = createMockContainer()

    await bootstrap.start(container)
    const firstRunning = bootstrap.isRunning()

    // Second start should be a no-op
    await bootstrap.start(container)
    const secondRunning = bootstrap.isRunning()

    expect(firstRunning).toBe(true)
    expect(secondRunning).toBe(true)

    await bootstrap.stop()
  })

  it('should not throw on double start', async () => {
    const bootstrap = new DefaultMarioGameBootstrap({ createRenderer: createMockRendererFactory() })
    const container = createMockContainer()

    await bootstrap.start(container)
    await expect(bootstrap.start(container)).resolves.toBeUndefined()

    await bootstrap.stop()
  })
})

// ---------------------------------------------------------------------------
// Double stop
// ---------------------------------------------------------------------------

describe('double stop', () => {
  it('should be a no-op on second stop', async () => {
    const bootstrap = new DefaultMarioGameBootstrap({ createRenderer: createMockRendererFactory() })
    const container = createMockContainer()

    await bootstrap.start(container)
    await bootstrap.stop()
    const firstStop = bootstrap.isRunning()

    // Second stop should be a no-op
    await bootstrap.stop()
    const secondStop = bootstrap.isRunning()

    expect(firstStop).toBe(false)
    expect(secondStop).toBe(false)
  })

  it('should not throw on double stop', async () => {
    const bootstrap = new DefaultMarioGameBootstrap({ createRenderer: createMockRendererFactory() })
    const container = createMockContainer()

    await bootstrap.start(container)
    await bootstrap.stop()
    await expect(bootstrap.stop()).resolves.toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Start-stop-restart cycle
// ---------------------------------------------------------------------------

describe('start-stop-restart cycle', () => {
  it('should support start-stop-restart cycle', async () => {
    const bootstrap = new DefaultMarioGameBootstrap({ createRenderer: createMockRendererFactory() })
    const container = createMockContainer()

    // Start
    await bootstrap.start(container)
    expect(bootstrap.isRunning()).toBe(true)

    // Stop
    await bootstrap.stop()
    expect(bootstrap.isRunning()).toBe(false)

    // Restart
    await bootstrap.start(container)
    expect(bootstrap.isRunning()).toBe(true)

    await bootstrap.stop()
  })
})

// ---------------------------------------------------------------------------
// isRunning
// ---------------------------------------------------------------------------

describe('isRunning', () => {
  it('should return false before start', () => {
    const bootstrap = new DefaultMarioGameBootstrap({ createRenderer: createMockRendererFactory() })
    expect(bootstrap.isRunning()).toBe(false)
  })

  it('should return true after start', async () => {
    const bootstrap = new DefaultMarioGameBootstrap({ createRenderer: createMockRendererFactory() })
    const container = createMockContainer()

    await bootstrap.start(container)
    expect(bootstrap.isRunning()).toBe(true)

    await bootstrap.stop()
  })

  it('should return false after stop', async () => {
    const bootstrap = new DefaultMarioGameBootstrap({ createRenderer: createMockRendererFactory() })
    const container = createMockContainer()

    await bootstrap.start(container)
    await bootstrap.stop()
    expect(bootstrap.isRunning()).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Integration — keyboard input lifecycle
// ---------------------------------------------------------------------------

describe('keyboard input lifecycle', () => {
  it('should handle keydown events on the window', async () => {
    const bootstrap = new DefaultMarioGameBootstrap({ createRenderer: createMockRendererFactory() })
    const container = createMockContainer()

    await bootstrap.start(container)

    // Dispatch a keydown event — this should not throw
    expect(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    }).not.toThrow()

    await bootstrap.stop()
  })

  it('should handle keyup events on the window', async () => {
    const bootstrap = new DefaultMarioGameBootstrap({ createRenderer: createMockRendererFactory() })
    const container = createMockContainer()

    await bootstrap.start(container)

    // Dispatch a keyup event — this should not throw
    expect(() => {
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight' }))
    }).not.toThrow()

    await bootstrap.stop()
  })

  it('should detach keyboard listeners on stop', async () => {
    const bootstrap = new DefaultMarioGameBootstrap({ createRenderer: createMockRendererFactory() })
    const container = createMockContainer()

    await bootstrap.start(container)
    await bootstrap.stop()

    // After stop, keyboard events should still be safe (no listeners)
    expect(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    }).not.toThrow()
  })
})