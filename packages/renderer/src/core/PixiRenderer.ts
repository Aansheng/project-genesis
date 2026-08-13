/**
 * PixiRenderer — a concrete Renderer implementation backed by PixiJS.
 *
 * Responsibilities (foundation only):
 *   - Create a PIXI.Application when `initialize()` is called
 *   - Append the PixiJS canvas into the supplied host element
 *   - Destroy the PIXI.Application (and all of its resources) on `destroy()`
 *
 * Constraints (WO-S9-001):
 *   - No Runtime synchronization
 *   - No Position rendering
 *   - No sprites, textures, or assets
 *   - No animation
 *   - No gameplay visualization
 */

import { Application } from 'pixi.js'
import type { Renderer } from './Renderer'
import type { RendererState } from './RendererState'

/** Default canvas dimensions used when the container has no intrinsic size. */
const DEFAULT_WIDTH = 800
const DEFAULT_HEIGHT = 600

export interface PixiRendererOptions {
  readonly width?: number
  readonly height?: number
  readonly backgroundColor?: number
  /**
   * Optional factory that creates a PixiJS Application.
   * Defaults to `new Application(options)`. Provided for testability
   * so tests can inject a mock without depending on a real WebGL context.
   */
  readonly createApp?: (options: {
    readonly width: number
    readonly height: number
    readonly backgroundColor: number
    readonly antialias: boolean
    readonly resolution: number
    readonly autoDensity: boolean
  }) => Application
}

export class PixiRenderer implements Renderer {
  private _app: Application | null = null
  private _initialized = false
  private _width: number
  private _height: number
  private readonly _backgroundColor: number
  private readonly _createApp: NonNullable<PixiRendererOptions['createApp']>

  constructor(options?: PixiRendererOptions) {
    this._width = options?.width ?? DEFAULT_WIDTH
    this._height = options?.height ?? DEFAULT_HEIGHT
    this._backgroundColor = options?.backgroundColor ?? 0x1a1a2e
    this._createApp =
      options?.createApp ??
      ((opts) => new Application(opts))
  }

  // ─── Renderer interface ────────────────────────────────────────────

  async initialize(container: HTMLElement): Promise<void> {
    if (this._initialized) {
      throw new Error('PixiRenderer is already initialized')
    }

    const app = this._createApp({
      width: this._width,
      height: this._height,
      backgroundColor: this._backgroundColor,
      antialias: true,
      resolution: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
      autoDensity: true,
    })

    this._app = app
    container.appendChild(app.view as HTMLCanvasElement)
    this._initialized = true
  }

  async destroy(): Promise<void> {
    if (!this._app) {
      throw new Error('PixiRenderer is not initialized')
    }

    this._app.destroy(true, { children: true, texture: true })
    this._app = null
    this._initialized = false
  }

  // ─── State access ──────────────────────────────────────────────────

  getState(): RendererState {
    return Object.freeze({
      initialized: this._initialized,
      width: this._width,
      height: this._height,
    })
  }
}