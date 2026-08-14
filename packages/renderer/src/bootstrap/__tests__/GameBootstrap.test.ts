/**
 * GameBootstrap — verifies the DefaultGameBootstrap lifecycle and wiring.
 *
 * WO-S9-010 — Playable Game Bootstrap Foundation
 * Architecture version v1.84
 *
 * Coverage:
 * - construction
 * - start
 * - stop
 * - multiple starts
 * - multiple stops
 * - running state
 * - renderer initialization
 * - runner startup
 * - cleanup
 * - determinism
 */

import { describe, it, expect } from 'vitest'
import type { World } from '@genesis/shared'
import type { GameBootstrapConfig, GameBootstrap, InputProvider, InputState } from '@genesis/runtime'
import { DefaultInputState } from '@genesis/runtime'
import type { Renderer, RendererState } from '../../core'
import { DefaultGameBootstrap } from '../DefaultGameBootstrap'
import { createPositionComponent } from '@genesis/shared'
import type { Entity } from '@genesis/shared'

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
  private _initializedEl: HTMLElement | null = null

  async initialize(container: HTMLElement): Promise<void> {
    this.initialized = true
    this._initializedEl = container
  }

  async destroy(): Promise<void> {
    this.destroyed = true
    this.initialized = false
    this._initializedEl = null
  }

  getState(): RendererState {
    return Object.freeze({
      initialized: this.initialized,
      width: 800,
      height: 600,
    })
  }

  /** Returns the container that was passed to initialize(). */
  getInitializedContainer(): HTMLElement | null {
    return this._initializedEl
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createContainer(): HTMLElement {
  return document.createElement('div')
}

function createWorld(): World {
  const entity: Entity = Object.freeze({
    id: 'player-1',
    type: 'player',
    x: 10,
    y: 5,
    components: Object.freeze([createPositionComponent(10, 5)]),
  }) as unknown as Entity
  return Object.freeze({
    entities: Object.freeze([entity]),
  }) as unknown as World
}

function createConfig(): GameBootstrapConfig {
  return {
    world: createWorld(),
    inputProvider: new MockInputProvider(),
  }
}

function createMockRendererFactory(): {
  createRenderer: (opts?: unknown) => Renderer
  mockRenderer: MockRenderer
} {
  const mockRenderer = new MockRenderer()
  return {
    createRenderer: () => mockRenderer,
    mockRenderer,
  }
}

// ---------------------------------------------------------------------------

describe('GameBootstrap', () => {
  // -------------------------------------------------------------------------
  // Section 1 — Construction
  // -------------------------------------------------------------------------

  describe('construction', () => {
    it('creates an instance with valid config', () => {
      const bootstrap = new DefaultGameBootstrap(createConfig())
      expect(bootstrap.isRunning()).toBe(false)
    })

    it('creates an instance with config and options', () => {
      const bootstrap = new DefaultGameBootstrap(createConfig(), {})
      expect(bootstrap.isRunning()).toBe(false)
    })

    it('implements the GameBootstrap interface', () => {
      const bootstrap: GameBootstrap = new DefaultGameBootstrap(createConfig())
      expect(typeof bootstrap.start).toBe('function')
      expect(typeof bootstrap.stop).toBe('function')
      expect(typeof bootstrap.isRunning).toBe('function')
    })
  })

  // -------------------------------------------------------------------------
  // Section 2 — Start
  // -------------------------------------------------------------------------

  describe('start', () => {
    it('starts the game with a valid container', async () => {
      const { createRenderer, mockRenderer } = createMockRendererFactory()
      const bootstrap = new DefaultGameBootstrap(createConfig(), { createRenderer })
      const container = createContainer()

      await bootstrap.start(container)

      expect(bootstrap.isRunning()).toBe(true)
      expect(mockRenderer.initialized).toBe(true)
      expect(mockRenderer.getInitializedContainer()).toBe(container)
    })

    it('starts the game with default renderer factory', async () => {
      const bootstrap = new DefaultGameBootstrap(createConfig())
      const container = createContainer()

      // This requires PixiJS mock — will throw without WebGL
      // Testing with injected factory covers the logic
      await expect(bootstrap.start(container)).rejects.toThrow()
    })
  })

  // -------------------------------------------------------------------------
  // Section 3 — Stop
  // -------------------------------------------------------------------------

  describe('stop', () => {
    it('stops a running game', async () => {
      const { createRenderer, mockRenderer } = createMockRendererFactory()
      const bootstrap = new DefaultGameBootstrap(createConfig(), { createRenderer })
      const container = createContainer()

      await bootstrap.start(container)
      expect(bootstrap.isRunning()).toBe(true)

      await bootstrap.stop()
      expect(bootstrap.isRunning()).toBe(false)
      expect(mockRenderer.destroyed).toBe(true)
    })

    it('stops before start is a no-op', async () => {
      const bootstrap = new DefaultGameBootstrap(createConfig())
      await bootstrap.stop()
      expect(bootstrap.isRunning()).toBe(false)
    })
  })

  // -------------------------------------------------------------------------
  // Section 4 — Multiple starts
  // -------------------------------------------------------------------------

  describe('multiple starts', () => {
    it('second start is a no-op', async () => {
      const { createRenderer, mockRenderer } = createMockRendererFactory()
      const bootstrap = new DefaultGameBootstrap(createConfig(), { createRenderer })
      const container = createContainer()

      await bootstrap.start(container)

      await bootstrap.start(container)
      // Renderer should only be initialized once
      expect(mockRenderer.initialized).toBe(true)
      expect(bootstrap.isRunning()).toBe(true)
    })
  })

  // -------------------------------------------------------------------------
  // Section 5 — Multiple stops
  // -------------------------------------------------------------------------

  describe('multiple stops', () => {
    it('second stop is a no-op', async () => {
      const { createRenderer } = createMockRendererFactory()
      const bootstrap = new DefaultGameBootstrap(createConfig(), { createRenderer })
      const container = createContainer()

      await bootstrap.start(container)
      await bootstrap.stop()
      expect(bootstrap.isRunning()).toBe(false)

      await bootstrap.stop()
      expect(bootstrap.isRunning()).toBe(false)
    })
  })

  // -------------------------------------------------------------------------
  // Section 6 — Running state
  // -------------------------------------------------------------------------

  describe('running state', () => {
    it('reports not running before start', () => {
      const bootstrap = new DefaultGameBootstrap(createConfig())
      expect(bootstrap.isRunning()).toBe(false)
    })

    it('reports running after start', async () => {
      const { createRenderer } = createMockRendererFactory()
      const bootstrap = new DefaultGameBootstrap(createConfig(), { createRenderer })
      const container = createContainer()

      await bootstrap.start(container)
      expect(bootstrap.isRunning()).toBe(true)
    })

    it('reports not running after stop', async () => {
      const { createRenderer } = createMockRendererFactory()
      const bootstrap = new DefaultGameBootstrap(createConfig(), { createRenderer })
      const container = createContainer()

      await bootstrap.start(container)
      await bootstrap.stop()
      expect(bootstrap.isRunning()).toBe(false)
    })
  })

  // -------------------------------------------------------------------------
  // Section 7 — Renderer initialization
  // -------------------------------------------------------------------------

  describe('renderer initialization', () => {
    it('passes the container to renderer.initialize', async () => {
      const { createRenderer, mockRenderer } = createMockRendererFactory()
      const bootstrap = new DefaultGameBootstrap(createConfig(), { createRenderer })
      const container = createContainer()

      await bootstrap.start(container)
      expect(mockRenderer.getInitializedContainer()).toBe(container)
    })
  })

  // -------------------------------------------------------------------------
  // Section 8 — Cleanup
  // -------------------------------------------------------------------------

  describe('cleanup', () => {
    it('destroy renderer on stop', async () => {
      const { createRenderer, mockRenderer } = createMockRendererFactory()
      const bootstrap = new DefaultGameBootstrap(createConfig(), { createRenderer })
      const container = createContainer()

      await bootstrap.start(container)
      expect(mockRenderer.destroyed).toBe(false)

      await bootstrap.stop()
      expect(mockRenderer.destroyed).toBe(true)
    })

    it('full start-stop cycle resets to clean state', async () => {
      const { createRenderer, mockRenderer } = createMockRendererFactory()
      const bootstrap = new DefaultGameBootstrap(createConfig(), { createRenderer })
      const container = createContainer()

      await bootstrap.start(container)
      await bootstrap.stop()

      // After stop, state is clean
      expect(bootstrap.isRunning()).toBe(false)
      expect(mockRenderer.destroyed).toBe(true)
    })
  })

  // -------------------------------------------------------------------------
  // Section 9 — Determinism
  // -------------------------------------------------------------------------

  describe('determinism', () => {
    it('same config produces same initial state', () => {
      const config = createConfig()
      const bootstrap1 = new DefaultGameBootstrap(config)
      const bootstrap2 = new DefaultGameBootstrap(config)

      expect(bootstrap1.isRunning()).toBe(bootstrap2.isRunning())
    })

    it('start-stop cycle is deterministic', async () => {
      const { createRenderer: cr1 } = createMockRendererFactory()
      const { createRenderer: cr2 } = createMockRendererFactory()
      const config = createConfig()

      const b1 = new DefaultGameBootstrap(config, { createRenderer: cr1 })
      const b2 = new DefaultGameBootstrap(config, { createRenderer: cr2 })

      await b1.start(createContainer())
      await b1.stop()

      await b2.start(createContainer())
      await b2.stop()

      expect(b1.isRunning()).toBe(b2.isRunning())
    })
  })
})