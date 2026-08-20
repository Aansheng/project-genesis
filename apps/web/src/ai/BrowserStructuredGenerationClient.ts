import type { GameDesignPrompt, StructuredGenerationClient, StructuredGenerationRequest, StructuredGenerationRequestOptions } from '@genesis/ai'

export type BrowserGatewayFailureReason = 'timeout' | 'transport_error' | 'gateway_error'

export class BrowserGatewayError extends Error {
  constructor(
    readonly reason: BrowserGatewayFailureReason,
    message: string,
  ) {
    super(message)
    this.name = 'BrowserGatewayError'
  }
}

/** Browser-only transport adapter. It never receives or stores provider credentials. */
export class BrowserStructuredGenerationClient implements StructuredGenerationClient {
  constructor(
    private readonly gatewayURL: string,
    private readonly fetcher: typeof fetch = globalThis.fetch.bind(globalThis),
  ) {}

  async generateStructured(
    request: StructuredGenerationRequest,
    _prompt?: GameDesignPrompt,
    options?: StructuredGenerationRequestOptions,
  ): Promise<unknown> {
    const timeoutMs = options?.timeoutMs ?? 30_000
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
        if (controller.signal.aborted) throw new BrowserGatewayError('timeout', 'AI gateway request timed out')
        throw new BrowserGatewayError('transport_error', error instanceof Error ? error.message : 'AI gateway transport failed')
      }
      if (!response.ok) throw new BrowserGatewayError('gateway_error', 'AI gateway unavailable')
      const body = await response.json() as { candidate?: unknown }
      if (!Object.prototype.hasOwnProperty.call(body, 'candidate')) throw new BrowserGatewayError('gateway_error', 'Invalid AI gateway response')
      return body.candidate
    } catch (error) {
      if (error instanceof BrowserGatewayError) throw error
      if (controller.signal.aborted) throw new BrowserGatewayError('timeout', 'AI gateway request timed out')
      throw new BrowserGatewayError('transport_error', error instanceof Error ? error.message : 'AI gateway transport failed')
    } finally {
      clearTimeout(timeout)
    }
  }
}
