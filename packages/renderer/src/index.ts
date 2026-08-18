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
 *
 * Entity Visual Mapping (WO-S9-007):
 *   - EntityVisualDefinition — shape, width, height per entity type
 *   - EntityVisualCatalog — maps entity types to visual definitions
 *   - DefaultEntityVisualCatalog — built-in mappings for player/enemy/merchant/boss
 *
 * Real-Time Visualization Loop (WO-S9-006):
 *   - AnimationFrameScheduler — requestAnimationFrame scheduling
 *   - DefaultAnimationFrameScheduler — RAF-backed implementation
 *   - VisualizationRunner — drives continuous visualization ticks
 *   - DefaultVisualizationRunner — connects scheduler to visualization loop
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
export { PixiEnvironmentRenderer } from './view'
export type { PixiEnvironmentRendererOptions } from './view'
export type { EntityVisualDefinition } from './view'
export type { EntityVisualCatalog } from './view'
export { DefaultEntityVisualCatalog } from './view'

// Runtime Visualization Loop types
export type { RuntimeVisualizationLoop } from './runtime'
export { DefaultRuntimeVisualizationLoop } from './runtime'
export type { VisualizationTickResult } from './runtime'

// World Injection (WO-S10-003)
export type { VisualizationWorldProvider } from './runtime'
export { StoreBackedWorldProvider } from './runtime'

// Scheduler types
export type { AnimationFrameScheduler } from './runtime'
export { DefaultAnimationFrameScheduler } from './runtime'

// Runner types
export type { VisualizationRunner } from './runtime'
export { DefaultVisualizationRunner } from './runtime'

// Existing Canvas2D renderer (Sprint 1 foundation — preserved for backward compatibility)
export { renderWorld, CANVAS_WIDTH, CANVAS_HEIGHT } from './renderWorld'

// Input Foundation (WO-S9-008)
export { KeyboardInputProvider, isEditableKeyboardTarget } from './input'

// Game Bootstrap Foundation (WO-S9-010)
export { DefaultGameBootstrap } from './bootstrap'
export type { GameBootstrapOptions } from './bootstrap'
export type { MarioGameBootstrap } from './bootstrap'
export type { MarioGameBootstrapOptions } from './bootstrap'
export { DefaultMarioGameBootstrap } from './bootstrap'

// Camera Foundation (WO-S9-015)
export type { CameraState } from './camera'
export { DEFAULT_CAMERA_STATE } from './camera'
export type { CameraController } from './camera'
export { DefaultCameraController } from './camera'

// Platform Tile Catalog (WO-S9-016)
export type { PlatformTileDefinition } from './view'
export type { PlatformTileCatalog } from './view'
export { DefaultPlatformTileCatalog } from './view'
