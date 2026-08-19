import type {
  ArtDirection,
  VisualPaletteSemantics,
  VisualTheme,
} from '../visual-design'

export type AssetKind = 'character' | 'terrain' | 'background' | 'prop' | 'icon'
export type AssetTarget = 'entity' | 'environment'
export type AssetView = 'side' | 'front' | 'top'
export type AssetVisualState = 'idle' | 'run' | 'jump'

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
  readonly requiredStates: readonly AssetVisualState[]
  readonly technicalProfile: AssetTechnicalProfile
}

/** Semantic asset needs; it contains no resolved file or renderer resource. */
export interface AssetSpecification {
  readonly visualContext: AssetVisualContext
  readonly assets: readonly AssetRequirement[]
}
