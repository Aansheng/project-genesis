import type {
  AssetKind,
  AssetView,
  AssetVisualContext,
} from '../asset-specification'
import type {
  AssetResourceMetadata,
  AssetResourceReference,
} from '../asset-manifest'

export type ImageGenerationMode =
  | 'text-to-image'
  | 'image-to-image'
  | 'edit'
  | 'reference-guided'

export type ImageGenerationFailureCode =
  | 'provider_unavailable'
  | 'unsupported_mode'
  | 'invalid_request'
  | 'generation_failed'
  | 'timeout'
  | 'invalid_output'

export interface ImageGenerationSource {
  readonly assetId: string
  readonly resource?: AssetResourceReference
}

export interface ImageGenerationConstraints {
  readonly transparentBackground?: boolean
  readonly view?: AssetView
  readonly assetKind?: AssetKind
  readonly preferredAspectRatio?: number
}

/** Vendor-independent input for one image-generation operation. */
export interface ImageGenerationRequest {
  readonly assetId: string
  readonly entityId?: string
  readonly mode: ImageGenerationMode
  readonly prompt: string
  readonly subject?: string
  readonly visualArchetype?: string
  readonly visualContext: AssetVisualContext
  readonly constraints?: ImageGenerationConstraints
  readonly sourceAsset?: ImageGenerationSource
  readonly referenceAssets?: readonly ImageGenerationSource[]
}

export interface ImageGenerationFailure {
  readonly code: ImageGenerationFailureCode
  readonly message: string
}

export interface GeneratedImageAsset {
  readonly assetId: string
  readonly resource: AssetResourceReference
  readonly metadata: AssetResourceMetadata
  readonly generationMode: ImageGenerationMode
}

export type ImageGenerationResult =
  | {
      readonly status: 'success'
      readonly assetId: string
      readonly mode: ImageGenerationMode
      readonly asset: GeneratedImageAsset
      readonly operation?: ImageGenerationOperation
    }
  | {
      readonly status: 'failed'
      readonly assetId: string
      readonly mode: ImageGenerationMode
      readonly failure: ImageGenerationFailure
      readonly operation?: ImageGenerationOperation
    }

export type ImageGenerationOperationStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled'

export type ImageGenerationActivityStage =
  | 'queued'
  | 'preparing'
  | 'generating'
  | 'applying'
  | 'ready'
  | 'fallback'
  | 'cancelled'

export type ImageGenerationOutcome =
  | 'generated_and_applied'
  | 'generated_but_not_applied'
  | 'generation_failed_fallback'

export type ImageGenerationManifestStatus = 'pending' | 'updated' | 'failed'
export type ImageGenerationAssetResolutionStatus = 'pending' | 'resolved' | 'failed'
export type ImageGenerationRendererStatus = 'pending' | 'applied' | 'failed'

export interface ImageGenerationOperation {
  readonly operationId: string
  readonly assetId: string
  readonly mode: ImageGenerationMode
  readonly status: ImageGenerationOperationStatus
  readonly stage?: ImageGenerationActivityStage
  readonly provider?: string
  readonly model?: string
  readonly entityId?: string
  readonly visualArchetype?: string
  /** Asset IDs sharing this generated visual; the first remains canonical. */
  readonly bindingAssetIds?: readonly string[]
  readonly bindingEntityIds?: readonly string[]
  readonly assetKind?: AssetKind
  readonly artifactStatus?: 'pending' | 'published' | 'failed'
  readonly manifestStatus?: ImageGenerationManifestStatus
  readonly assetResolutionStatus?: ImageGenerationAssetResolutionStatus
  readonly rendererStatus?: ImageGenerationRendererStatus
  readonly outcome?: ImageGenerationOutcome
  readonly input: {
    readonly subject?: string
    readonly prompt: string
    readonly visualContext: AssetVisualContext
  }
  readonly output?: {
    readonly resource?: AssetResourceReference
    readonly metadata?: AssetResourceMetadata
  }
  readonly failure?: ImageGenerationFailure
  readonly fallback?: 'static' | 'primitive'
  readonly startedAt?: string
  readonly completedAt?: string
  readonly durationMs?: number
}

export interface ImageGenerationProvider {
  supports(mode: ImageGenerationMode): boolean
  generate(request: ImageGenerationRequest): Promise<ImageGenerationResult>
}

const imageGenerationModes: readonly ImageGenerationMode[] = [
  'text-to-image',
  'image-to-image',
  'edit',
  'reference-guided',
]

export function validateImageGenerationRequest(
  request: ImageGenerationRequest,
): void {
  if (!request.assetId.trim()) {
    throw new Error('Image generation request requires a non-empty assetId')
  }
  if (!imageGenerationModes.includes(request.mode)) {
    throw new Error(`Unsupported image generation mode: ${String(request.mode)}`)
  }
  if (!request.prompt.trim()) {
    throw new Error('Image generation request requires a non-empty prompt')
  }
  if (request.mode === 'image-to-image' || request.mode === 'edit') {
    if (!request.sourceAsset?.assetId.trim()) {
      throw new Error(`${request.mode} requires a sourceAsset`)
    }
  }
  if (
    request.mode === 'reference-guided' &&
    (!request.referenceAssets || request.referenceAssets.length === 0)
  ) {
    throw new Error('reference-guided requires at least one referenceAsset')
  }
  if (
    request.constraints?.preferredAspectRatio !== undefined &&
    request.constraints.preferredAspectRatio <= 0
  ) {
    throw new Error('preferredAspectRatio must be greater than zero')
  }
}
