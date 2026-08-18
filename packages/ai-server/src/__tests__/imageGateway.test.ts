import { describe, expect, it, vi } from 'vitest'
import { createImageGenerationGatewayHandler } from '../image-generation/gateway'

const valid = {
  assetId: 'test-player',
  mode: 'text-to-image',
  prompt: 'winter adventurer',
  visualContext: {
    artDirection: 'stylized-2d',
    theme: { sourceTheme: 'snow', visualTheme: 'snow fantasy' },
    palette: { temperature: 'cool', contrast: 'standard', mood: 'bright' },
  },
}

describe('image generation gateway', () => {
  it('accepts a valid request and returns normalized provider data', async () => {
    const provider = { supports: () => true, generate: vi.fn().mockResolvedValue({ status: 'success', assetId: 'test-player', mode: 'text-to-image', asset: { assetId: 'test-player', resource: { uri: 'https://example.test/image.png' }, metadata: {}, generationMode: 'text-to-image' } }) }
    const response = await createImageGenerationGatewayHandler(provider)(new Request('http://localhost/api/image-generation', { method: 'POST', body: JSON.stringify(valid) }))
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ status: 'success', assetId: 'test-player' })
    expect(provider.generate).toHaveBeenCalledOnce()
  })

  it('rejects invalid requests and never exposes provider errors', async () => {
    const provider = { supports: () => true, generate: vi.fn().mockRejectedValue(new Error('secret api-key stack')) }
    const handler = createImageGenerationGatewayHandler(provider)
    const invalid = await handler(new Request('http://localhost/api/image-generation', { method: 'POST', body: JSON.stringify({ ...valid, assetId: '' }) }))
    expect(invalid.status).toBe(400)
    const failed = await handler(new Request('http://localhost/api/image-generation', { method: 'POST', body: JSON.stringify(valid) }))
    expect(failed.status).toBe(502)
    expect(await failed.text()).not.toContain('api-key')
  })
})
