import { describe, expect, it, vi } from 'vitest'
import { DashScopeImageGenerationProvider } from '../DashScopeImageGenerationProvider'
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

const config = { model: 'qwen-image-3.0-pro', apiKey: 'server-only', timeoutMs: 100, maxAttempts: 2 }

describe('DashScopeImageGenerationProvider', () => {
  it('uses the native endpoint and normalizes the synchronous Qwen response', async () => {
    const generate = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ output: { choices: [{ message: { content: [{ image: 'https://dashscope.test/result.png' }] } }] }, usage: { output_width: 1792, output_height: 2400 } }),
    })
    const provider = new DashScopeImageGenerationProvider(config, { generate })
    const result = await provider.generate(request)

    expect(generate).toHaveBeenCalledWith('https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation', expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer server-only' }),
      body: expect.stringContaining('stylized-2d'),
    }))
    expect(result).toMatchObject({ status: 'success', asset: { resource: { uri: 'https://dashscope.test/result.png' }, metadata: { mimeType: 'image/png', width: 1792, height: 2400 } }, operation: { status: 'succeeded' } })
  })

  it('does not claim transparent output and rejects unsupported modes', async () => {
    const generate = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ output: { choices: [{ message: { content: [{ image: 'https://dashscope.test/result.png' }] } }] } }) })
    const provider = new DashScopeImageGenerationProvider(config, { generate })
    const result = await provider.generate({ ...request, mode: 'edit', sourceAsset: { assetId: 'old' } })
    expect(result).toMatchObject({ status: 'failed', failure: { code: 'unsupported_mode' } })
    expect(generate).not.toHaveBeenCalled()
  })

  it('bounds transient retries', async () => {
    const generate = vi.fn().mockResolvedValue({ ok: false, status: 503, json: async () => ({}) })
    const provider = new DashScopeImageGenerationProvider(config, { generate })
    const result = await provider.generate(request)
    expect(result).toMatchObject({ status: 'failed', failure: { code: 'provider_unavailable' } })
    expect(generate).toHaveBeenCalledTimes(2)
  })
})
