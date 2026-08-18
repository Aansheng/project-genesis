import type {
  ImageGenerationMode,
  ImageGenerationProvider,
  ImageGenerationRequest,
  ImageGenerationResult,
} from '@genesis/shared'

export class UnavailableImageGenerationProvider implements ImageGenerationProvider {
  supports(_mode: ImageGenerationMode): boolean { return false }

  async generate(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    return {
      status: 'failed',
      assetId: request.assetId,
      mode: request.mode,
      failure: { code: 'provider_unavailable', message: 'Image generation provider is not configured' },
    }
  }
}
