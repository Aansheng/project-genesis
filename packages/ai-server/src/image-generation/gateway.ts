import type {
  ImageGenerationProvider,
  ImageGenerationRequest,
  ImageGenerationResult,
} from '@genesis/shared'
import { validateImageGenerationRequest } from '@genesis/shared'

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
export function createImageGenerationGatewayHandler(provider: ImageGenerationProvider) {
  return async (request: Request): Promise<Response> => {
    if (request.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 })
    try {
      const input = validateRequest(await request.json())
      const result: ImageGenerationResult = await provider.generate(input)
      return Response.json(result, { status: result.status === 'success' ? 200 : 502 })
    } catch (error) {
      const message = error instanceof Error && error.message.startsWith('Invalid')
        ? 'Invalid image generation request'
        : 'Image generation unavailable'
      return Response.json({ error: message }, { status: message.startsWith('Invalid') ? 400 : 502 })
    }
  }
}
