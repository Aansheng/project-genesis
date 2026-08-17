import type { GameWorldGenerationRequest, StructuredGenerationClient } from '@genesis/ai'

/** Browser-only transport adapter. It never receives or stores provider credentials. */
export class BrowserStructuredGenerationClient implements StructuredGenerationClient {
  constructor(private readonly gatewayURL: string, private readonly fetcher: typeof fetch = fetch) {}

  async generateStructured(request: GameWorldGenerationRequest): Promise<unknown> {
    const response = await this.fetcher(this.gatewayURL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(request),
    })
    if (!response.ok) throw new Error('AI gateway unavailable')
    const body = await response.json() as { candidate?: unknown }
    if (!Object.prototype.hasOwnProperty.call(body, 'candidate')) throw new Error('Invalid AI gateway response')
    return body.candidate
  }
}
