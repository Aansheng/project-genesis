import type {
  GeneratedImageAsset,
  ImageGenerationFailure,
  ImageGenerationMode,
  ImageGenerationOperation,
  ImageGenerationProvider,
  ImageGenerationRequest,
  ImageGenerationResult,
} from '@genesis/shared'

export interface DashScopeImageGenerationProviderConfig {
  readonly model: string
  readonly apiKey: string
  readonly baseURL?: string
  readonly timeoutMs: number
  readonly maxAttempts: number
}

interface DashScopeResponse {
  readonly output?: {
    readonly choices?: readonly {
      readonly message?: { readonly content?: readonly { readonly image?: string }[] }
    }[]
  }
  readonly usage?: { readonly output_width?: number; readonly output_height?: number }
  readonly code?: string
  readonly message?: string
}

export interface DashScopeImageGenerationTransport {
  generate(
    url: string,
    init: { readonly headers: Record<string, string>; readonly body: string; readonly signal: AbortSignal },
  ): Promise<{ readonly ok: boolean; readonly status: number; json(): Promise<DashScopeResponse> }>
}

const endpointSuffix = '/api/v1/services/aigc/multimodal-generation/generation'
const supportedModes: readonly ImageGenerationMode[] = ['text-to-image']

function promptFor(request: ImageGenerationRequest): string {
  const { artDirection, theme, palette } = request.visualContext
  const constraints = request.constraints
  return [
    request.prompt.trim(),
    request.subject?.trim(),
    `art direction: ${artDirection}`,
    `theme: ${theme.sourceTheme}; visual theme: ${theme.visualTheme}`,
    `palette: ${palette.temperature}, ${palette.contrast}, ${palette.mood}`,
    constraints?.assetKind ? `asset kind: ${constraints.assetKind}` : undefined,
    constraints?.view ? `view: ${constraints.view}` : undefined,
    constraints?.transparentBackground ? 'isolated subject, transparent background requested' : undefined,
    'sprite-oriented composition, no text, no logos',
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

function normalizeImage(response: DashScopeResponse, request: ImageGenerationRequest): GeneratedImageAsset | undefined {
  const uri = response.output?.choices?.[0]?.message?.content?.find((item) => item.image?.trim())?.image?.trim()
  if (!uri) return undefined
  return {
    assetId: request.assetId,
    resource: { uri },
    metadata: {
      mimeType: 'image/png',
      ...(response.usage?.output_width ? { width: response.usage.output_width } : {}),
      ...(response.usage?.output_height ? { height: response.usage.output_height } : {}),
    },
    generationMode: request.mode,
  }
}

function transientStatus(status: number): boolean {
  return status === 408 || status === 409 || status === 429 || status >= 500
}

/** Server-only native DashScope text-to-image adapter. Returned URLs expire after 24 hours. */
export class DashScopeImageGenerationProvider implements ImageGenerationProvider {
  private operationNumber = 0
  private readonly transport: DashScopeImageGenerationTransport

  constructor(
    private readonly config: DashScopeImageGenerationProviderConfig,
    transport: DashScopeImageGenerationTransport = { generate: (url, init) => fetch(url, { method: 'POST', ...init }) },
  ) {
    if (!config.apiKey) throw new Error('IMAGE_AI_API_KEY is required')
    this.transport = transport
  }

  supports(mode: ImageGenerationMode): boolean { return supportedModes.includes(mode) }

  async generate(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    const operationId = `image-generation-${++this.operationNumber}`
    if (!this.supports(request.mode)) {
      const error = failure('unsupported_mode', `Image generation mode is not supported: ${request.mode}`)
      return { status: 'failed', assetId: request.assetId, mode: request.mode, failure: error, operation: operation(request, operationId, 'failed', undefined, error) }
    }

    const attempts = Math.max(1, Math.min(2, Math.trunc(this.config.maxAttempts)))
    const baseURL = (this.config.baseURL || 'https://dashscope.aliyuncs.com').replace(/\/$/u, '')
    for (let attempt = 1; attempt <= attempts; attempt++) {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs)
      try {
        const response = await this.transport.generate(`${baseURL}${endpointSuffix}`, {
          headers: { Authorization: `Bearer ${this.config.apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: this.config.model, input: { messages: [{ role: 'user', content: [{ text: promptFor(request) }] }] }, parameters: { prompt_extend: true, n: 1 } }),
          signal: controller.signal,
        })
        const payload = await response.json()
        if (!response.ok) {
          const error = failure(response.status === 400 ? 'invalid_request' : transientStatus(response.status) && attempt === attempts ? 'provider_unavailable' : 'generation_failed', 'DashScope image generation failed')
          if (transientStatus(response.status) && attempt < attempts) continue
          return { status: 'failed', assetId: request.assetId, mode: request.mode, failure: error, operation: operation(request, operationId, 'failed', undefined, error) }
        }
        const asset = normalizeImage(payload, request)
        if (!asset) {
          const error = failure('invalid_output', 'DashScope returned no usable image resource')
          return { status: 'failed', assetId: request.assetId, mode: request.mode, failure: error, operation: operation(request, operationId, 'failed', undefined, error) }
        }
        return { status: 'success', assetId: request.assetId, mode: request.mode, asset, operation: operation(request, operationId, 'succeeded', { resource: asset.resource, metadata: asset.metadata }) }
      } catch {
        const error = failure(controller.signal.aborted ? 'timeout' : attempt === attempts ? 'provider_unavailable' : 'generation_failed', controller.signal.aborted ? 'Image generation timed out' : 'DashScope image generation failed')
        if (!controller.signal.aborted && attempt < attempts) continue
        return { status: 'failed', assetId: request.assetId, mode: request.mode, failure: error, operation: operation(request, operationId, 'failed', undefined, error) }
      } finally {
        clearTimeout(timeout)
      }
    }
    throw new Error('Image generation attempt policy exhausted')
  }
}
