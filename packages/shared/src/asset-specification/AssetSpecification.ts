import type {
  ArtDirection,
  VisualPaletteSemantics,
  VisualTheme,
} from '../visual-design'
import type { WorldSpatialMode } from '../game-world'

export type AssetKind = 'character' | 'terrain' | 'background' | 'prop' | 'icon'
export type AssetTarget = 'entity' | 'environment'
export type AssetView = 'side' | 'front' | 'top'
export type AssetVisualState = 'idle' | 'run' | 'jump'

/**
 * Bounded current render usages. This is request/manifest metadata, not a
 * universal visual taxonomy or a source of Runtime geometry.
 */
export type AssetRenderUsage =
  | 'entity-sprite'
  | 'background-cover'
  | 'ground-repeat-x'
  | 'arena-fill'

export interface AssetTechnicalProfile {
  readonly transparentBackground: boolean
  readonly view: AssetView
}

export interface AssetVisualContext {
  readonly artDirection: ArtDirection
  /** Bounded spatial composition used by image prompts and Renderer roles. */
  readonly worldSpatialMode?: WorldSpatialMode
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
  /** Optional bounded visual state; it is selected from Runtime truth only. */
  readonly presentationState?: AssetVisualState
  /** Optional bounded frame index for the Player run presentation proof. */
  readonly presentationFrame?: number
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
