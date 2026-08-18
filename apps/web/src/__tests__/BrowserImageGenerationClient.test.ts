import { describe, expect, it, vi } from 'vitest'
import { BrowserImageGatewayError, BrowserImageGenerationClient } from '../ai/BrowserImageGenerationClient'

const request = { assetId: 'test-player', mode: 'text-to-image' as const, prompt: 'winter adventurer', visualContext: { artDirection: 'stylized-2d' as const, theme: { sourceTheme: 'snow', visualTheme: 'snow' }, palette: { temperature: 'cool' as const, contrast: 'standard' as const, mood: 'bright' as const } } }

describe('BrowserImageGenerationClient', () => {
  it('calls only the Genesis gateway and returns normalized results', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: 'success', assetId: 'test-player', mode: 'text-to-image', asset: { assetId: 'test-player', resource: { uri: 'https://example.test/image.png' }, metadata: {}, generationMode: 'text-to-image' } }), { status: 200 }))
    const result = await new BrowserImageGenerationClient('/api/image-generation', fetcher).generate(request)
    expect(fetcher).toHaveBeenCalledWith('/api/image-generation', expect.objectContaining({ method: 'POST', body: JSON.stringify(request) }))
    expect(result).toMatchObject({ status: 'success', assetId: 'test-player' })
  })

  it('resolves session-owned artifact routes against the image gateway origin', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: 'success', assetId: 'test-player', mode: 'text-to-image', asset: { assetId: 'test-player', resource: { uri: '/api/generated-assets/generated-1.png' }, metadata: {}, generationMode: 'text-to-image' } }), { status: 200 }))
    const result = await new BrowserImageGenerationClient('http://127.0.0.1:8787/api/image-generation', fetcher).generate(request)
    expect(result).toMatchObject({ asset: { resource: { uri: 'http://127.0.0.1:8787/api/generated-assets/generated-1.png' } } })
  })

  it('turns a bounded gateway timeout into a terminal typed failure', async () => {
    const fetcher = vi.fn().mockImplementation((_url: string, init?: RequestInit) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')), { once: true })
    }))
    await expect(new BrowserImageGenerationClient('/api/image-generation', fetcher).generate(request, 5)).rejects.toMatchObject({ reason: 'timeout' } satisfies Partial<BrowserImageGatewayError>)
  })

  it('preserves a structured timeout returned with an HTTP failure status', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      status: 'failed', assetId: 'test-player', mode: 'text-to-image',
      failure: { code: 'timeout', message: 'Codex CLI image generation timed out' },
      operation: { operationId: 'image-generation-1', assetId: 'test-player', mode: 'text-to-image', status: 'failed', artifactStatus: 'failed', input: { prompt: request.prompt, visualContext: request.visualContext } },
    }), { status: 502 }))
    await expect(new BrowserImageGenerationClient('/api/image-generation', fetcher).generate(request)).resolves.toMatchObject({ status: 'failed', failure: { code: 'timeout' }, operation: { status: 'failed' } })
  })
})
