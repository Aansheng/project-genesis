import type { AssetManifest } from '@genesis/shared'
import type { AssetResolutionResult, AssetResolver } from './AssetResolver'
import type { ResolvedAssetResource } from './ResolvedAssetResource'

export interface AssetStore {
  get(assetId: string): ResolvedAssetResource | undefined
  has(assetId: string): boolean
  resolve(assetId: string, manifest: AssetManifest): Promise<AssetResolutionResult>
  invalidate(assetId: string): void
  clear(): void
}

export class DefaultAssetStore implements AssetStore {
  private readonly cache = new Map<string, ResolvedAssetResource>()
  private readonly inFlight = new Map<string, Promise<AssetResolutionResult>>()
  private readonly generations = new Map<string, number>()

  constructor(private readonly resolver: AssetResolver) {}

  get(assetId: string): ResolvedAssetResource | undefined {
    return this.cache.get(assetId)
  }

  has(assetId: string): boolean {
    return this.cache.has(assetId)
  }

  resolve(assetId: string, manifest: AssetManifest): Promise<AssetResolutionResult> {
    const cached = this.cache.get(assetId)
    if (cached) return Promise.resolve({ status: 'resolved', resource: cached })

    const pending = this.inFlight.get(assetId)
    if (pending) return pending

    const generation = this.generations.get(assetId) ?? 0
    const operation = this.resolver.resolve(assetId, manifest).then(result => {
      if (result.status === 'resolved' && generation === (this.generations.get(assetId) ?? 0)) this.cache.set(assetId, result.resource)
      return result
    }).finally(() => {
      if (this.inFlight.get(assetId) === operation) this.inFlight.delete(assetId)
    })

    this.inFlight.set(assetId, operation)
    return operation
  }

  invalidate(assetId: string): void {
    this.cache.delete(assetId)
    this.generations.set(assetId, (this.generations.get(assetId) ?? 0) + 1)
    this.inFlight.delete(assetId)
  }

  clear(): void {
    this.cache.clear()
  }
}
