import type { AssetManifest, AssetManifestEntry } from '@genesis/shared'
import { PassthroughAssetResourceLoader } from './AssetResourceLoader'
import type { AssetResourceLoader } from './AssetResourceLoader'
import type { ResolvedAssetResource } from './ResolvedAssetResource'

export type AssetResolutionFailureReason =
  | 'unknown_asset'
  | 'manifest_unresolved'
  | 'manifest_failed'
  | 'missing_resource'
  | 'unsupported_scheme'
  | 'load_failed'

export type AssetResolutionResult =
  | { readonly status: 'resolved'; readonly resource: ResolvedAssetResource }
  | { readonly status: 'unavailable'; readonly assetId: string; readonly reason: AssetResolutionFailureReason }
  | { readonly status: 'failed'; readonly assetId: string; readonly reason: AssetResolutionFailureReason }

export interface AssetResolver {
  resolve(assetId: string, manifest: AssetManifest): Promise<AssetResolutionResult>
}

function freeze<T extends object>(value: T): Readonly<T> {
  return Object.freeze(value)
}

export function isSupportedUri(uri: string): boolean {
  const value = uri.trim()
  if (!value || value.startsWith('asset://') || value.startsWith('file://') || value.startsWith('data:')) return false
  if (value.startsWith('/') || value.startsWith('./') || value.startsWith('../')) return true
  return value.startsWith('http://') || value.startsWith('https://')
}

function resolvedResource(entry: AssetManifestEntry, loaded: { readonly uri: string; readonly mimeType?: string; readonly width?: number; readonly height?: number }): ResolvedAssetResource {
  return freeze({
    assetId: entry.assetId,
    kind: entry.kind,
    target: entry.target,
    ...(entry.entityId ? { entityId: entry.entityId } : {}),
    uri: loaded.uri,
    ...(loaded.mimeType ? { mimeType: loaded.mimeType } : entry.metadata?.mimeType ? { mimeType: entry.metadata.mimeType } : {}),
    ...(loaded.width !== undefined ? { width: loaded.width } : entry.metadata?.width !== undefined ? { width: entry.metadata.width } : {}),
    ...(loaded.height !== undefined ? { height: loaded.height } : entry.metadata?.height !== undefined ? { height: entry.metadata.height } : {}),
  })
}

export class DefaultAssetResolver implements AssetResolver {
  constructor(private readonly loader: AssetResourceLoader = new PassthroughAssetResourceLoader()) {}

  resolve(assetId: string, manifest: AssetManifest): Promise<AssetResolutionResult> {
    const entry = manifest.entries.find(candidate => candidate.assetId === assetId)
    if (!entry) return Promise.resolve({ status: 'unavailable', assetId, reason: 'unknown_asset' })
    if (entry.status === 'unresolved') return Promise.resolve({ status: 'unavailable', assetId, reason: 'manifest_unresolved' })
    if (entry.status === 'failed') return Promise.resolve({ status: 'failed', assetId, reason: 'manifest_failed' })
    if (!entry.resource?.uri.trim()) return Promise.resolve({ status: 'unavailable', assetId, reason: 'missing_resource' })
    if (!isSupportedUri(entry.resource.uri)) return Promise.resolve({ status: 'failed', assetId, reason: 'unsupported_scheme' })

    return this.loader.load(entry.resource)
      .then(loaded => ({ status: 'resolved' as const, resource: resolvedResource(entry, loaded) }))
      .catch(() => ({ status: 'failed' as const, assetId, reason: 'load_failed' as const }))
  }
}
