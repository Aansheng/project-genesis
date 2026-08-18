import type {
  ImageGenerationProvider,
  ImageGenerationRequest,
  ImageGenerationResult,
} from '@genesis/shared'
import { validateImageGenerationRequest } from '@genesis/shared'
import type { GeneratedAssetPublisher } from './GeneratedAssetPublisher'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

function validateRequest(value: unknown): ImageGenerationRequest {
  if (!isRecord(value) || typeof value.assetId !== 'string' || typeof value.mode !== 'string' || typeof value.prompt !== 'string' || !isRecord(value.visualContext)) {
    throw new Error('Invalid image generation request')
  }
  const request = value as unknown as ImageGenerationRequest
  try {
    validateImageGenerationRequest(request)
  } catch {
    throw new Error('Invalid image generation request')
  }
  return request
}

/** Server-only image generation gateway; it returns normalized domain data only. */
export function createImageGenerationGatewayHandler(
  provider: ImageGenerationProvider,
  publisher?: GeneratedAssetPublisher,
  providerName?: string,
  modelName?: string,
) {
  return async (request: Request): Promise<Response> => {
    if (request.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 })
    try {
      const input = validateRequest(await request.json())
      const result: ImageGenerationResult = await provider.generate(input)
      const operation = {
        ...(result.operation ?? {
          operationId: `image-generation-${input.assetId}`,
          assetId: input.assetId,
          mode: input.mode,
          status: result.status === 'success' ? 'succeeded' as const : 'failed' as const,
          input: { ...(input.subject ? { subject: input.subject } : {}), prompt: input.prompt, visualContext: input.visualContext },
        }),
        ...(providerName ? { provider: providerName } : {}),
        ...(modelName ? { model: modelName } : {}),
        ...(result.status === 'failed' ? { artifactStatus: 'failed' as const } : {}),
      }
      if (result.status !== 'success' || !publisher) {
        return Response.json({ ...result, ...(operation ? { operation } : {}) }, { status: result.status === 'success' ? 200 : 502 })
      }
      try {
        const published = await publisher.publish(result.asset)
        return Response.json({
          ...result,
          asset: { ...result.asset, resource: published.resource, metadata: published.metadata },
          ...(operation ? { operation: { ...operation, artifactStatus: 'published', output: { ...operation.output, resource: published.resource, metadata: published.metadata } } } : {}),
        }, { status: 200 })
      } catch {
        const failure = { code: 'generation_failed' as const, message: 'Generated artifact publication failed' }
        return Response.json({ status: 'failed', assetId: input.assetId, mode: input.mode, failure, operation: { ...(operation ?? { operationId: `image-generation-publication-${input.assetId}`, assetId: input.assetId, mode: input.mode, status: 'failed' as const, input: { prompt: input.prompt, visualContext: input.visualContext } }), status: 'failed' as const, artifactStatus: 'failed' as const, failure } }, { status: 502 })
      }
    } catch (error) {
      const message = error instanceof Error && error.message.startsWith('Invalid')
        ? 'Invalid image generation request'
        : 'Image generation unavailable'
      return Response.json({ error: message }, { status: message.startsWith('Invalid') ? 400 : 502 })
    }
  }
}
