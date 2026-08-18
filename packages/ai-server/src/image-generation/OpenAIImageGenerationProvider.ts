import OpenAI from 'openai'
import type {
  GeneratedImageAsset,
  ImageGenerationFailure,
  ImageGenerationMode,
  ImageGenerationOperation,
  ImageGenerationProvider,
  ImageGenerationRequest,
  ImageGenerationResult,
} from '@genesis/shared'

export interface ImageGenerationProviderConfig {
  readonly model: string
  readonly apiKey: string
  readonly baseURL?: string
  readonly timeoutMs: number
  readonly maxAttempts: number
}

interface ImageRequest {
  readonly model: string
  readonly prompt: string
  readonly background?: 'transparent'
}

interface ImageResponseItem {
  readonly url?: string
  readonly b64_json?: string
  readonly mime_type?: string
  readonly width?: number
  readonly height?: number
}

interface ImageResponse {
  readonly data?: readonly ImageResponseItem[]
}

export interface ImageGenerationTransport {
  images: {
    generate(request: ImageRequest, options?: { signal?: AbortSignal }): Promise<ImageResponse>
  }
}

const supportedModes: readonly ImageGenerationMode[] = ['text-to-image']

function promptFor(request: ImageGenerationRequest): string {
  const { artDirection } = request.visualContext
  const { sourceTheme, visualTheme } = request.visualContext.theme
  const { temperature, contrast, mood } = request.visualContext.palette
  const constraints = request.constraints
  return [
    request.prompt.trim(),
    request.subject?.trim(),
    `art direction: ${artDirection}`,
    `theme: ${sourceTheme}; visual theme: ${visualTheme}`,
    `palette: ${temperature}, ${contrast}, ${mood}`,
    constraints?.assetKind ? `asset kind: ${constraints.assetKind}` : undefined,
    constraints?.view ? `view: ${constraints.view}` : undefined,
    constraints?.transparentBackground ? 'isolated subject, transparent background' : undefined,
    'no text, no logos',
  ].filter((value): value is string => Boolean(value)).join('; ')
}

function failure(code: ImageGenerationFailure['code'], message: string): ImageGenerationFailure {
  return { code, message }
}

function operation(
  request: ImageGenerationRequest,
  operationId: string,
  status: ImageGenerationOperation['status'],
  output?: ImageGenerationOperation['output'],
  error?: ImageGenerationFailure,
): ImageGenerationOperation {
  return {
    operationId,
    assetId: request.assetId,
    mode: request.mode,
    status,
    input: {
      ...(request.subject ? { subject: request.subject } : {}),
      prompt: request.prompt,
      visualContext: request.visualContext,
    },
    ...(output ? { output } : {}),
    ...(error ? { failure: error } : {}),
  }
}

function errorStatus(error: unknown): number | undefined {
  return typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number'
    ? error.status
    : undefined
}

function isTransient(error: unknown): boolean {
  const status = errorStatus(error)
  return status === 408 || status === 409 || status === 429 || status === undefined || status >= 500
}

function normalizeImage(item: ImageResponseItem, request: ImageGenerationRequest): GeneratedImageAsset | undefined {
  const resource = item.url?.trim() || (item.b64_json ? `data:${item.mime_type || 'image/png'};base64,${item.b64_json}` : undefined)
  if (!resource) return undefined
  return {
    assetId: request.assetId,
    resource: { uri: resource },
    metadata: {
      ...(item.mime_type ? { mimeType: item.mime_type } : {}),
      ...(item.width ? { width: item.width } : {}),
      ...(item.height ? { height: item.height } : {}),
    },
    generationMode: request.mode,
  }
}

/** Server-only OpenAI/OpenAI-compatible text-to-image transport adapter. */
export class OpenAIImageGenerationProvider implements ImageGenerationProvider {
  private operationNumber = 0
  private readonly client: ImageGenerationTransport

  constructor(
    private readonly config: ImageGenerationProviderConfig,
    client?: ImageGenerationTransport,
  ) {
    if (!config.apiKey) throw new Error('IMAGE_AI_API_KEY is required')
    this.client = client ?? new OpenAI({ apiKey: config.apiKey, baseURL: config.baseURL }) as unknown as ImageGenerationTransport
  }

  supports(mode: ImageGenerationMode): boolean {
    return supportedModes.includes(mode)
  }

  async generate(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    const operationId = `image-generation-${++this.operationNumber}`
    if (!this.supports(request.mode)) {
      const error = failure('unsupported_mode', `Image generation mode is not supported: ${request.mode}`)
      return { status: 'failed', assetId: request.assetId, mode: request.mode, failure: error, operation: operation(request, operationId, 'failed', undefined, error) }
    }

    const attempts = Math.max(1, Math.min(2, Math.trunc(this.config.maxAttempts)))
    for (let attempt = 1; attempt <= attempts; attempt++) {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs)
      try {
        const response = await this.client.images.generate({
          model: this.config.model,
          prompt: promptFor(request),
          ...(request.constraints?.transparentBackground ? { background: 'transparent' as const } : {}),
        }, { signal: controller.signal })
        const asset = normalizeImage(response.data?.[0] ?? {}, request)
        if (!asset) {
          const error = failure('invalid_output', 'Image provider returned no usable image resource')
          return { status: 'failed', assetId: request.assetId, mode: request.mode, failure: error, operation: operation(request, operationId, 'failed', undefined, error) }
        }
        return {
          status: 'success', assetId: request.assetId, mode: request.mode, asset,
          operation: operation(request, operationId, 'succeeded', { resource: asset.resource, metadata: asset.metadata }),
        }
      } catch (error) {
        const mapped = controller.signal.aborted
          ? failure('timeout', 'Image generation timed out')
          : errorStatus(error) === 400
            ? failure('invalid_request', 'Image generation request was rejected')
            : failure(isTransient(error) && attempt === attempts ? 'provider_unavailable' : 'generation_failed', 'Image generation provider failed')
        if (isTransient(error) && attempt < attempts) continue
        return { status: 'failed', assetId: request.assetId, mode: request.mode, failure: mapped, operation: operation(request, operationId, 'failed', undefined, mapped) }
      } finally {
        clearTimeout(timeout)
      }
    }
    throw new Error('Image generation attempt policy exhausted')
  }
}
