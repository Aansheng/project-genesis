import type {
  ArtDirection,
  VisualPaletteSemantics,
  VisualTheme,
} from '../visual-design'

export type AssetKind = 'character' | 'terrain' | 'background' | 'prop' | 'icon'
export type AssetTarget = 'entity' | 'environment'
export type AssetView = 'side' | 'front' | 'top'
export type AssetVisualState = 'idle' | 'run' | 'jump'

/**
 * Bounded current platformer render usages. This is request/manifest metadata,
 * not a universal visual taxonomy or a source of Runtime geometry.
 */
export type AssetRenderUsage =
  | 'entity-sprite'
  | 'background-cover'
  | 'ground-repeat-x'

export interface AssetTechnicalProfile {
  readonly transparentBackground: boolean
  readonly view: AssetView
}

export interface AssetVisualContext {
  readonly artDirection: ArtDirection
  readonly theme: VisualTheme
  readonly palette: VisualPaletteSemantics
}

export interface AssetRequirement {
  readonly id: string
  readonly kind: AssetKind
  readonly target: AssetTarget
  readonly subject: string
  readonly entityId?: string
  readonly visualRole?: string
  readonly visualArchetype?: string
  /** How the current consumer should compose the generated visual. */
  readonly renderUsage?: AssetRenderUsage
  readonly requiredStates: readonly AssetVisualState[]
  readonly technicalProfile: AssetTechnicalProfile
}

/** Semantic asset needs; it contains no resolved file or renderer resource. */
export interface AssetSpecification {
  readonly visualContext: AssetVisualContext
  readonly assets: readonly AssetRequirement[]
}
