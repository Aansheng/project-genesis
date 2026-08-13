/**
 * @genesis/renderer — the Renderer package for Project Genesis.
 *
 * Foundation (WO-S9-001):
 *   - PixiJS-backed Renderer shell
 *   - initialize / destroy lifecycle
 *   - State querying via RendererState
 */
export type { Renderer } from './core'
export type { RendererState } from './core'
export type { RendererResult } from './core'
export { PixiRenderer } from './core'
export type { PixiRendererOptions } from './core'

// Existing Canvas2D renderer (Sprint 1 foundation — preserved for backward compatibility)
export { renderWorld, CANVAS_WIDTH, CANVAS_HEIGHT } from './renderWorld'