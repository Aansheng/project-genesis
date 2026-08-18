import type { AssetKind, AssetTarget } from '@genesis/shared'

/** Neutral runtime descriptor; it contains no decoded bytes or renderer object. */
export interface ResolvedAssetResource {
  readonly assetId: string
  readonly kind: AssetKind
  readonly target: AssetTarget
  readonly entityId?: string
  readonly uri: string
  readonly mimeType?: string
  readonly width?: number
  readonly height?: number
}

export interface LoadedAssetResource {
  readonly uri: string
  readonly mimeType?: string
  readonly width?: number
  readonly height?: number
}
