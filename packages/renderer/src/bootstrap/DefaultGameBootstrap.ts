/**
 * DefaultGameBootstrap — the default implementation of GameBootstrap.
 *
 * WO-S9-010 — Playable Game Bootstrap Foundation
 * Architecture version v1.84
 *
 * Wires together the full game pipeline:
 *
 *   World → ExecutionLoop
 *     ├─ PlayerControllerSystem (input-driven player movement)
 *     ├─ MovementSystem (general-purpose delta movement)
 *     ↓
 *   RuntimeVisualizationLoop
 *     → RuntimeRendererAdapter → PixiEntityRenderer
 *     ↓
 *   VisualizationRunner (AnimationFrameScheduler)
 *     → PixiRenderer → Canvas
 *
 * Lifecycle:
 *   start(container):
 *     1. Initialize PixiRenderer → appends canvas to container
 *     2. Create RuntimeSystemRegistry
 *     3. Register PlayerControllerSystem (reads InputProvider)
 *     4. Register MovementSystem (no-op: delta 0,0 by default)
 *     5. Create RuntimeExecutionLoop with registry
 *     6. Create RuntimeRendererAdapter (DefaultRuntimeRendererAdapter)
 *     7. Create PixiEntityRenderer with a stage Container
 *     8. Create RuntimeVisualizationLoop
 *     9. Create AnimationFrameScheduler (DefaultAnimationFrameScheduler)
 *     10. Create VisualizationRunner
 *     11. Start runner → game is playable
 *
 *   stop():
 *     1. Stop runner
 *     2. Stop visualization loop
 *     3. Destroy renderer
 *     4. Clear internal references
 *
 * Design principles:
 * - Single API: one start() call for a fully playable game
 * - Clean teardown: stop() destroys all resources in reverse order
 * - Deterministic: same config always produces the same wiring
 * - Foundation only: no physics, no collision, no camera
 * - Framework-independent: no Vue, Pinia, or web framework imports
 */

import type { GameBootstrap, GameBootstrapConfig } from '@genesis/runtime'
import type { Renderer } from '../core'
import { PixiRenderer } from '../core'
import type { PixiRendererOptions } from '../core'
import { DefaultRuntimeRendererAdapter } from '../adapter'
import { DefaultPixiEntityRenderer } from '../view'
import type { AnimationFrameScheduler } from '../runtime'
import { DefaultAnimationFrameScheduler } from '../runtime'
import type { RuntimeVisualizationLoop } from '../runtime'
import { DefaultRuntimeVisualizationLoop } from '../runtime'
import type { VisualizationRunner } from '../runtime'
import { DefaultVisualizationRunner } from '../runtime'
import {
  DefaultRuntimeSystemRegistry,
  DefaultRuntimeExecutionLoop,
  DefaultPlayerControllerSystem,
  DefaultMovementSystem,
} from '@genesis/runtime'
import { Container } from 'pixi.js'

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

/**
 * Optional configuration for DefaultGameBootstrap.
 *
 * All fields are optional. Defaults provide production-ready behavior.
 * Test environments can inject factories to avoid requiring a real
 * WebGL context or animation frame scheduling.
 */
export interface GameBootstrapOptions {
  /**
   * Optional factory for creating the Renderer.
   * Defaults to creating a PixiRenderer with default options.
   * Tests can inject a mock Renderer to avoid PixiJS/WebGL dependency.
   */
  readonly createRenderer?: (
    options?: PixiRendererOptions
  ) => Renderer
}

/** Default movement speed for the MovementSystem (no-op by default). */
const DEFAULT_MOVEMENT_DELTA_X = 0
const DEFAULT_MOVEMENT_DELTA_Y = 0

export class DefaultGameBootstrap implements GameBootstrap {
  private readonly config: GameBootstrapConfig
  private readonly options: GameBootstrapOptions

  private renderer: Renderer | null = null
  private runner: VisualizationRunner | null = null
  private visualizationLoop: RuntimeVisualizationLoop | null = null
  private scheduler: AnimationFrameScheduler | null = null
  private _running = false

  /**
   * @param config  — game configuration (world, input provider)
   * @param options — optional factories for testability
   */
  constructor(config: GameBootstrapConfig, options?: GameBootstrapOptions) {
    this.config = config
    this.options = options ?? {}
  }

  // -------------------------------------------------------------------------
  // GameBootstrap
  // -------------------------------------------------------------------------

  /**
   * Start the game.
   *
   * @param container — DOM element to host the game canvas
   */
  async start(container: HTMLElement): Promise<void> {
    if (this._running) return

    // 1. Create and initialize the renderer
    const createRenderer =
      this.options.createRenderer ?? ((_opts?: PixiRendererOptions) => new PixiRenderer())
    const renderer = createRenderer()
    await renderer.initialize(container)
    this.renderer = renderer

    // 2. Create the system registry and register gameplay systems
    const registry = new DefaultRuntimeSystemRegistry()

    const playerController = new DefaultPlayerControllerSystem(
      this.config.inputProvider,
    )
    registry.register(playerController)

    const movementSystem = new DefaultMovementSystem(
      DEFAULT_MOVEMENT_DELTA_X,
      DEFAULT_MOVEMENT_DELTA_Y,
    )
    registry.register(movementSystem)

    // 3. Create the execution loop
    const executionLoop = new DefaultRuntimeExecutionLoop(registry)

    // 4. Create the renderer adapter and entity renderer
    const adapter = new DefaultRuntimeRendererAdapter()
    const stageContainer = new Container()
    const entityRenderer = new DefaultPixiEntityRenderer(stageContainer)

    // 5. Create the visualization loop
    const visLoop = new DefaultRuntimeVisualizationLoop(
      executionLoop,
      adapter,
      entityRenderer,
      this.config.world,
    )
    this.visualizationLoop = visLoop

    // 6. Create the scheduler and runner
    const scheduler = new DefaultAnimationFrameScheduler()
    this.scheduler = scheduler

    const runner = new DefaultVisualizationRunner(scheduler, visLoop)
    this.runner = runner

    // 7. Start the runner → continuous visualization begins
    runner.start()

    this._running = true
  }

  /**
   * Stop the game and release all resources.
   */
  async stop(): Promise<void> {
    if (!this._running) return

    // 1. Stop the runner
    if (this.runner) {
      this.runner.stop()
      this.runner = null
    }

    // 2. Stop the visualization loop
    if (this.visualizationLoop) {
      this.visualizationLoop.stop()
      this.visualizationLoop = null
    }

    // 3. Stop the scheduler
    if (this.scheduler) {
      this.scheduler = null
    }

    // 4. Destroy the renderer
    if (this.renderer) {
      await this.renderer.destroy()
      this.renderer = null
    }

    this._running = false
  }

  /**
   * Check whether the game is currently running.
   */
  isRunning(): boolean {
    return this._running
  }
}