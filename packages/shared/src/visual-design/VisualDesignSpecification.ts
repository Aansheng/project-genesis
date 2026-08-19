import type { EntityCategory } from '../game-world'

/** Small, vendor-independent vocabulary for the first visual semantic layer. */
export type ArtDirection = 'stylized-2d' | 'pixel-art' | 'minimal-2d'

export type VisualTemperature = 'neutral' | 'warm' | 'cool'
export type VisualContrast = 'standard' | 'high'
export type VisualMood = 'bright' | 'dark' | 'pastel' | 'neon' | 'neutral'

export interface VisualTheme {
  /** Original game-design theme, preserved without creating a second truth. */
  readonly sourceTheme: string
  /** Theme wording refined for future visual planning. */
  readonly visualTheme: string
}

export interface VisualPaletteSemantics {
  readonly temperature: VisualTemperature
  readonly contrast: VisualContrast
  readonly mood: VisualMood
}

export interface EnvironmentVisualDesign {
  readonly terrain: string
  readonly background: string
  readonly atmosphere: string
}

export interface EntityVisualDesign {
  readonly entityId: string
  readonly category: EntityCategory
  readonly visualRole: string
  readonly visualArchetype?: string
}

/** Semantic appearance intent; no assets, renderer values, or provider state. */
export interface VisualDesignSpecification {
  readonly artDirection: ArtDirection
  readonly theme: VisualTheme
  readonly palette: VisualPaletteSemantics
  readonly environment: EnvironmentVisualDesign
  readonly entities: readonly EntityVisualDesign[]
}
