/**
 * @genesis/renderer — the Renderer package for Project Genesis.
 *
 * Foundation (WO-S9-001):
 *   - PixiJS-backed Renderer shell
 *   - initialize / destroy lifecycle
 *   - State querying via RendererState
 *
 * Runtime/Renderer Sync (WO-S9-002):
 *   - RenderEntity / RenderWorld model types
 *   - RuntimeRendererAdapter — transforms Runtime World → RenderWorld
 *
 * Entity Visualization (WO-S9-004):
 *   - PixiEntityRenderer — renders RenderWorld onto canvas via Graphics
 *   - RenderEntityView / RenderWorldView — view interfaces
 */
export type { Renderer } from './core'
export type { RendererState } from './core'
export type { RendererResult } from './core'
export { PixiRenderer } from './core'
export type { PixiRendererOptions } from './core'

// Model types
export type { RenderEntity } from './model'
export type { RenderWorld } from './model'
export { EMPTY_RENDER_WORLD } from './model'

// Adapter
export type { RuntimeRendererAdapter } from './adapter'
export { DefaultRuntimeRendererAdapter } from './adapter'

// View types
export type { RenderEntityView } from './view'
export type { RenderWorldView } from './view'
export type { PixiEntityRenderer, PixiEntityRendererOptions } from './view'
export { DefaultPixiEntityRenderer } from './view'

// Existing Canvas2D renderer (Sprint 1 foundation — preserved for backward compatibility)
export { renderWorld, CANVAS_WIDTH, CANVAS_HEIGHT } from './renderWorld'