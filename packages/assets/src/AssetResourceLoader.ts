import type { AssetResourceReference } from '@genesis/shared'
import type { LoadedAssetResource } from './ResolvedAssetResource'

/** Injectable transport boundary. The core package never calls global fetch. */
export interface AssetResourceLoader {
  load(reference: AssetResourceReference): Promise<LoadedAssetResource>
}

/** Descriptor-only loader for static URI resolution before byte loading exists. */
export class PassthroughAssetResourceLoader implements AssetResourceLoader {
  load(reference: AssetResourceReference): Promise<LoadedAssetResource> {
    return Promise.resolve({ uri: reference.uri })
  }
}
