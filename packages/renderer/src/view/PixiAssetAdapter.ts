import { Assets, type Texture } from 'pixi.js'
import type { ResolvedAssetResource } from '@genesis/assets'

export interface PixiAssetAdapter {
  load(resource: ResolvedAssetResource): Promise<Texture>
  invalidate?(assetId: string): void
  clear(): void
}

export class DefaultPixiAssetAdapter implements PixiAssetAdapter {
  private readonly textures = new Map<string, Promise<Texture>>()

  load(resource: ResolvedAssetResource): Promise<Texture> {
    const cached = this.textures.get(resource.assetId)
    if (cached) return cached
    const pending = Assets.load(resource.uri).then((texture: Texture) => texture)
    this.textures.set(resource.assetId, pending)
    pending.catch(() => this.textures.delete(resource.assetId))
    return pending
  }

  clear(): void {
    this.textures.clear()
  }

  invalidate(assetId: string): void {
    this.textures.delete(assetId)
  }
}
