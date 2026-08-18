import { describe, expect, it, vi } from 'vitest'
import { BrowserImageGenerationClient } from '../ai/BrowserImageGenerationClient'

const request = { assetId: 'test-player', mode: 'text-to-image' as const, prompt: 'winter adventurer', visualContext: { artDirection: 'stylized-2d' as const, theme: { sourceTheme: 'snow', visualTheme: 'snow' }, palette: { temperature: 'cool' as const, contrast: 'standard' as const, mood: 'bright' as const } } }

describe('BrowserImageGenerationClient', () => {
  it('calls only the Genesis gateway and returns normalized results', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: 'success', assetId: 'test-player', mode: 'text-to-image', asset: { assetId: 'test-player', resource: { uri: 'https://example.test/image.png' }, metadata: {}, generationMode: 'text-to-image' } }), { status: 200 }))
    const result = await new BrowserImageGenerationClient('/api/image-generation', fetcher).generate(request)
    expect(fetcher).toHaveBeenCalledWith('/api/image-generation', expect.objectContaining({ method: 'POST', body: JSON.stringify(request) }))
    expect(result).toMatchObject({ status: 'success', assetId: 'test-player' })
  })
})
