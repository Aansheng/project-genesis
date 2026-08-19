import type { ImageGenerationRequest, ImageGenerationResult } from '@genesis/shared'

export type BrowserImageGatewayFailureReason = 'timeout' | 'transport_error' | 'gateway_error'

const DEFAULT_IMAGE_GATEWAY_TIMEOUT_MS = 125_000

export class BrowserImageGatewayError extends Error {
  constructor(readonly reason: BrowserImageGatewayFailureReason, message: string) {
    super(message)
    this.name = 'BrowserImageGatewayError'
  }
}

/** Browser-only image gateway client. It never receives provider credentials. */
export class BrowserImageGenerationClient {
  constructor(
    private readonly gatewayURL: string,
    private readonly fetcher: typeof fetch = globalThis.fetch.bind(globalThis),
  ) {}

  async generate(request: ImageGenerationRequest, timeoutMs = DEFAULT_IMAGE_GATEWAY_TIMEOUT_MS): Promise<ImageGenerationResult> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)
    try {
      let response: Response
      try {
        response = await this.fetcher(this.gatewayURL, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(request),
          signal: controller.signal,
        })
      } catch (error) {
        if (controller.signal.aborted) throw new BrowserImageGatewayError('timeout', 'Image gateway request timed out')
        throw new BrowserImageGatewayError('transport_error', error instanceof Error ? error.message : 'Image gateway transport failed')
      }
      let body: Partial<ImageGenerationResult>
      try {
        body = await response.json() as Partial<ImageGenerationResult>
      } catch {
        throw new BrowserImageGatewayError('gateway_error', 'Image gateway unavailable')
      }
      if (body.status !== 'success' && body.status !== 'failed') throw new BrowserImageGatewayError('gateway_error', 'Invalid image gateway response')
      if (body.status === 'failed') return body as ImageGenerationResult
      if (!response.ok) throw new BrowserImageGatewayError('gateway_error', 'Image gateway unavailable')
      if (body.status === 'success' && body.asset?.resource?.uri.startsWith('/api/generated-assets/')) {
        const resource = { uri: new URL(body.asset.resource.uri, this.gatewayURL).toString() }
        return { ...body, asset: { ...body.asset, resource }, operation: body.operation ? { ...body.operation, output: body.operation.output ? { ...body.operation.output, resource } : body.operation.output } : body.operation } as ImageGenerationResult
      }
      return body as ImageGenerationResult
    } catch (error) {
      if (error instanceof BrowserImageGatewayError) throw error
      if (controller.signal.aborted) throw new BrowserImageGatewayError('timeout', 'Image gateway request timed out')
      throw new BrowserImageGatewayError('transport_error', error instanceof Error ? error.message : 'Image gateway transport failed')
    } finally {
      clearTimeout(timeout)
    }
  }
}
