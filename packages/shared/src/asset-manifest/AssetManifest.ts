import type { AssetKind, AssetRenderUsage, AssetTarget, AssetSpecification } from '../asset-specification'

export type AssetResolutionStatus = 'unresolved' | 'resolved' | 'failed'
export type AssetOrigin = 'static' | 'generated' | 'uploaded' | 'fallback'

/** Opaque, platform-neutral location of a resolved asset. */
export interface AssetResourceReference {
  readonly uri: string
}

export interface AssetResourceMetadata {
  readonly mimeType?: string
  readonly width?: number
  readonly height?: number
}

export interface AssetManifestEntry {
  /** Canonical identity reused from AssetRequirement.id. */
  readonly assetId: string
  readonly kind: AssetKind
  readonly target: AssetTarget
  readonly entityId?: string
  readonly renderUsage?: AssetRenderUsage
  readonly status: AssetResolutionStatus
  readonly origin?: AssetOrigin
  readonly resource?: AssetResourceReference
  readonly metadata?: AssetResourceMetadata
}

/** Immutable inventory of required assets and their current resolution state. */
export interface AssetManifest {
  readonly entries: readonly AssetManifestEntry[]
}

export interface AssetResolutionInput {
  readonly status?: Exclude<AssetResolutionStatus, 'unresolved'>
  readonly origin?: AssetOrigin
  readonly resource?: AssetResourceReference
  readonly metadata?: AssetResourceMetadata
}

export interface AssetManifestBuilder {
  build(
    specification: AssetSpecification,
    resolutions?: Readonly<Record<string, AssetResolutionInput>>,
  ): AssetManifest
}
