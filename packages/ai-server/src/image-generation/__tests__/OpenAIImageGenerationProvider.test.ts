import { describe, expect, it, vi } from 'vitest'
import { OpenAIImageGenerationProvider } from '../OpenAIImageGenerationProvider'
import type { ImageGenerationRequest } from '@genesis/shared'

const request: ImageGenerationRequest = {
  assetId: 'entity-player-primary',
  mode: 'text-to-image',
  prompt: 'winter adventurer',
  visualContext: {
    artDirection: 'stylized-2d',
    theme: { sourceTheme: 'snow', visualTheme: 'snow fantasy' },
    palette: { temperature: 'cool', contrast: 'standard', mood: 'bright' },
  },
  constraints: { assetKind: 'character', view: 'side', transparentBackground: true },
}

const config = { model: 'gpt-image-test', apiKey: 'server-only', timeoutMs: 100, maxAttempts: 2 }

describe('OpenAIImageGenerationProvider', () => {
  it('maps semantic text-to-image input and normalizes a base64 result', async () => {
    const generate = vi.fn().mockResolvedValue({ data: [{ b64_json: 'abc', mime_type: 'image/png', width: 512, height: 512 }] })
    const provider = new OpenAIImageGenerationProvider(config, { images: { generate } })
    const result = await provider.generate(request)

    expect(generate).toHaveBeenCalledWith(expect.objectContaining({
      model: 'gpt-image-test',
      background: 'transparent',
      prompt: expect.stringContaining('stylized-2d'),
    }), expect.anything())
    expect(result).toMatchObject({
      status: 'success',
      assetId: 'entity-player-primary',
      asset: { resource: { uri: 'data:image/png;base64,abc' }, metadata: { width: 512, height: 512 } },
      operation: { status: 'succeeded', assetId: 'entity-player-primary', mode: 'text-to-image' },
    })
  })

  it('normalizes a provider URL and explicitly rejects unsupported modes', async () => {
    const generate = vi.fn().mockResolvedValue({ data: [{ url: 'https://provider.test/image.png' }] })
    const provider = new OpenAIImageGenerationProvider(config, { images: { generate } })
    const urlResult = await provider.generate(request)
    expect(urlResult).toMatchObject({ status: 'success', asset: { resource: { uri: 'https://provider.test/image.png' } } })

    const unsupported = await provider.generate({ ...request, mode: 'edit', sourceAsset: { assetId: 'old' } })
    expect(unsupported).toMatchObject({ status: 'failed', failure: { code: 'unsupported_mode' }, operation: { status: 'failed' } })
    expect(generate).toHaveBeenCalledOnce()
  })

  it('maps timeout and bounds transient retries', async () => {
    const generate = vi.fn().mockRejectedValue(Object.assign(new Error('busy'), { status: 503 }))
    const provider = new OpenAIImageGenerationProvider({ ...config, maxAttempts: 2 }, { images: { generate } })
    const result = await provider.generate(request)
    expect(result).toMatchObject({ status: 'failed', failure: { code: 'provider_unavailable' } })
    expect(generate).toHaveBeenCalledTimes(2)
  })
})
