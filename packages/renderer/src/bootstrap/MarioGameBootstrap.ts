/**
 * MarioGameBootstrap — one-call playable Mario demo bootstrap.
 *
 * WO-S9-011 — Mario Playable Slice Foundation
 * Architecture version v1.86
 *
 * Builds the full pipeline:
 *
 *   MarioWorldFactory
 *     ↓
 *   SemanticGameDslBuilder
 *     ↓
 *   GameDsl
 *     ↓
 *   RuntimeProjection
 *     ↓
 *   World
 *     ↓
 *   DefaultGameBootstrap
 *
 * This becomes a one-call playable Mario demo:
 *   const bootstrap = new MarioGameBootstrap()
 *   await bootstrap.start(document.getElementById('game')!)
 *
 * Lifecycle:
 *   start(container):
 *     1. Create Mario world model via MarioWorldFactory
 *     2. Convert to GameDsl via SemanticGameDslBuilder
 *     3. Project to Runtime World via RuntimeProjection
 *     4. Create KeyboardInputProvider
 *     5. Create GameBootstrapConfig with world + input
 *     6. Create DefaultGameBootstrap with config
 *     7. Call bootstrap.start(container) → game is playable
 *
 *   stop():
 *     Delegates to DefaultGameBootstrap.stop()
 *
 * Design principles:
 * - Single API: one start() call for a fully playable Mario demo
 * - Clean teardown: stop() destroys all resources
 * - Framework-independent: no Vue, Pinia, or web framework imports
 * - No gravity, no collision, no camera, no assets
 */
import { DefaultMarioWorldFactory } from '@genesis/ai'
import { DefaultSemanticGameDslBuilder } from '@genesis/ai'
import type { GameBootstrap } from '@genesis/runtime'
import type { GameBootstrapConfig } from '@genesis/runtime'
import { DefaultRuntimeProjection } from '@genesis/runtime'
import { DefaultGameBootstrap } from './DefaultGameBootstrap'
import { KeyboardInputProvider } from '../input'
import type { Renderer } from '../core'

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

/**
 * Optional configuration for DefaultMarioGameBootstrap.
 *
 * All fields are optional. Defaults provide production-ready behavior.
 * Test environments can inject a renderer factory to avoid requiring
 * a real WebGL context.
 */
export interface MarioGameBootstrapOptions {
  /**
   * Optional factory for creating the Renderer.
   * Defaults to creating a PixiRenderer with default options.
   * Tests can inject a mock Renderer to avoid PixiJS/WebGL dependency.
   */
  readonly createRenderer?: (
    options?: { width?: number; height?: number; backgroundColor?: number }
  ) => Renderer
}

export interface MarioGameBootstrap {
  /**
   * Start the Mario demo game.
   *
   * Creates the full pipeline from MarioWorldFactory through
   * to the renderer and starts the game loop.
   *
   * @param container — DOM element to host the game canvas
   */
  start(container: HTMLElement): Promise<void>

  /**
   * Stop the Mario demo game and release all resources.
   */
  stop(): Promise<void>

  /**
   * Check whether the game is currently running.
   *
   * @returns True if the game has been started and not yet stopped
   */
  isRunning(): boolean
}

/**
 * DefaultMarioGameBootstrap — default implementation of MarioGameBootstrap.
 *
 * Wires together the complete Mario demo pipeline:
 *   MarioWorldFactory → SemanticGameDslBuilder → RuntimeProjection → DefaultGameBootstrap
 *
 * Pure pipeline orchestration. No AI. No LLM. No templates.
 * Predefined world with player, ground, and goal entities.
 */
export class DefaultMarioGameBootstrap implements MarioGameBootstrap {
  private bootstrap: GameBootstrap | null = null
  private inputProvider: KeyboardInputProvider | null = null
  private _running = false
  private readonly createRenderer?: (opts?: { width?: number; height?: number; backgroundColor?: number }) => Renderer

  constructor(options?: MarioGameBootstrapOptions) {
    this.createRenderer = options?.createRenderer
  }

  /**
   * Start the Mario demo game.
   *
   * @param container — DOM element to host the game canvas
   */
  async start(container: HTMLElement): Promise<void> {
    if (this._running) return

    // 1. Create the Mario world model
    const worldFactory = new DefaultMarioWorldFactory()
    const worldModel = worldFactory.create()

    // 2. Convert to GameDsl
    const dslBuilder = new DefaultSemanticGameDslBuilder()
    const gameDsl = dslBuilder.build(worldModel)

    // 3. Project to Runtime World
    const projection = new DefaultRuntimeProjection()
    const projectionResult = projection.project(gameDsl)
    const world = projectionResult.world

    // 4. Create the input provider
    const inputProvider = new KeyboardInputProvider()
    inputProvider.attach()
    this.inputProvider = inputProvider

    // 5. Create the game bootstrap config
    const config: GameBootstrapConfig = {
      world,
      inputProvider,
    }

    // 6. Create and start the game bootstrap
    const options = this.createRenderer ? { createRenderer: this.createRenderer } : undefined
    const bootstrap = new DefaultGameBootstrap(config, options)
    await bootstrap.start(container)
    this.bootstrap = bootstrap

    this._running = true
  }

  /**
   * Stop the Mario demo game and release all resources.
   */
  async stop(): Promise<void> {
    if (!this._running) return

    // 1. Stop the bootstrap
    if (this.bootstrap) {
      await this.bootstrap.stop()
      this.bootstrap = null
    }

    // 2. Detach the input provider
    if (this.inputProvider) {
      this.inputProvider.detach()
      this.inputProvider = null
    }

    this._running = false
  }

  /**
   * Check whether the game is currently running.
   *
   * @returns True if the game has been started and not yet stopped
   */
  isRunning(): boolean {
    return this._running
  }
}