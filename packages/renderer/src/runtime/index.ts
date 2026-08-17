/**
 * Runtime Visualization Loop Foundation (WO-S9-005).
 *
 * Provides the RuntimeVisualizationLoop that synchronises Runtime World
 * updates with visual rendering on the canvas.
 */

/**
 * Real-Time Runtime Visualization Loop Foundation (WO-S9-006).
 *
 * Provides AnimationFrameScheduler and VisualizationRunner that drive
 * continuous visualization via requestAnimationFrame.
 */
export type { AnimationFrameScheduler } from './AnimationFrameScheduler'
export { DefaultAnimationFrameScheduler } from './DefaultAnimationFrameScheduler'
export type { VisualizationRunner } from './VisualizationRunner'
export { DefaultVisualizationRunner } from './DefaultVisualizationRunner'
export type { RuntimeVisualizationLoop } from './RuntimeVisualizationLoop'
export type { RuntimeWorldSink } from './RuntimeVisualizationLoop'
export { DefaultRuntimeVisualizationLoop } from './DefaultRuntimeVisualizationLoop'
export type { VisualizationTickResult } from './VisualizationTickResult'

// Runtime World Injection Foundation (WO-S10-003)
export type { VisualizationWorldProvider } from './VisualizationWorldProvider'
export { StoreBackedWorldProvider } from './StoreBackedWorldProvider'
