import type { GeneratedImageAsset, AssetResourceMetadata, AssetResourceReference } from '@genesis/shared'

export interface PublishedGeneratedAsset {
  readonly artifactId: string
  readonly assetId: string
  readonly resource: AssetResourceReference
  readonly metadata: AssetResourceMetadata
}

export interface GeneratedAssetPublisher {
  publish(asset: GeneratedImageAsset): Promise<PublishedGeneratedAsset>
  serve(artifactId: string): Response
}

interface StoredArtifact {
  readonly bytes: Uint8Array
  readonly mimeType: string
  readonly metadata: AssetResourceMetadata
}

const MAX_ARTIFACT_BYTES = 10 * 1024 * 1024

function isImageMimeType(value: string | undefined): value is string {
  return value === 'image/png' || value === 'image/jpeg' || value === 'image/webp'
}

function imageExtension(mimeType: string): string {
  return mimeType === 'image/jpeg' ? 'jpg' : mimeType === 'image/webp' ? 'webp' : 'png'
}

function dataUri(value: string): { bytes: Uint8Array; mimeType: string } | undefined {
  const match = value.match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=\s]+)$/u)
  if (!match?.[1] || !match[2]) return undefined
  return { bytes: Uint8Array.from(Buffer.from(match[2].replace(/\s/gu, ''), 'base64')), mimeType: match[1] }
}

/** Session-owned publication bridge; artifacts disappear when the server stops. */
export class InMemoryGeneratedAssetPublisher implements GeneratedAssetPublisher {
  private readonly artifacts = new Map<string, StoredArtifact>()
  private artifactNumber = 0

  constructor(private readonly fetcher: typeof fetch = globalThis.fetch.bind(globalThis)) {}

  async publish(asset: GeneratedImageAsset): Promise<PublishedGeneratedAsset> {
    const inline = dataUri(asset.resource.uri)
    const response = inline
      ? { bytes: inline.bytes, mimeType: inline.mimeType }
      : await this.download(asset.resource.uri)
    if (response.bytes.byteLength === 0 || response.bytes.byteLength > MAX_ARTIFACT_BYTES) throw new Error('Generated artifact exceeds the session limit')
    const artifactId = `generated-${++this.artifactNumber}`
    const metadata = { ...asset.metadata, mimeType: response.mimeType }
    this.artifacts.set(artifactId, { bytes: response.bytes, mimeType: response.mimeType, metadata })
    return { artifactId, assetId: asset.assetId, resource: { uri: `/api/generated-assets/${artifactId}.${imageExtension(response.mimeType)}` }, metadata }
  }

  serve(artifactId: string): Response {
    const artifact = this.artifacts.get(artifactId)
    if (!artifact) return new Response('Not found', { status: 404 })
    return new Response(Buffer.from(artifact.bytes), {
      status: 200,
      headers: {
        'content-type': artifact.mimeType,
        'cache-control': 'private, max-age=3600',
      },
    })
  }

  private async download(uri: string): Promise<{ bytes: Uint8Array; mimeType: string }> {
    if (!/^https?:\/\//u.test(uri)) throw new Error('Generated artifact resource is not publishable')
    const response = await this.fetcher(uri)
    if (!response.ok) throw new Error('Generated artifact download failed')
    const mimeType = response.headers.get('content-type')?.split(';')[0]?.trim()
    if (!isImageMimeType(mimeType)) throw new Error('Generated artifact is not a supported image')
    const bytes = new Uint8Array(await response.arrayBuffer())
    return { bytes, mimeType }
  }
}
