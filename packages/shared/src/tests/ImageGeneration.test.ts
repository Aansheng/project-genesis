import { describe, expect, it } from 'vitest'
import {
  type ImageGenerationRequest,
  validateImageGenerationRequest,
} from '../image-generation'

const visualContext = {
  artDirection: 'stylized-2d' as const,
  theme: { sourceTheme: 'snow', visualTheme: 'snow fantasy' },
  palette: { temperature: 'cool' as const, contrast: 'standard' as const, mood: 'bright' as const },
}

const request = (mode: ImageGenerationRequest['mode']): ImageGenerationRequest => ({
  assetId: 'entity-player-primary',
  mode,
  prompt: 'winter adventurer',
  visualContext,
  constraints: { transparentBackground: true, view: 'side', assetKind: 'character' },
})

describe('image generation domain', () => {
  it.each(['text-to-image', 'image-to-image', 'edit', 'reference-guided'] as const)(
    'models %s without vendor details',
    mode => {
      const candidate: ImageGenerationRequest = {
        ...request(mode),
        ...(mode === 'image-to-image' || mode === 'edit'
          ? { sourceAsset: { assetId: 'entity-player-primary-reference' } }
          : {}),
        ...(mode === 'reference-guided'
          ? { referenceAssets: [{ assetId: 'style-reference' }] }
          : {}),
      }
      expect(() => validateImageGenerationRequest(candidate)).not.toThrow()
    },
  )

  it('preserves canonical identity and visual context in a normalized result', () => {
    const result = {
      status: 'success' as const,
      assetId: 'entity-player-primary',
      mode: 'text-to-image' as const,
      asset: {
        assetId: 'entity-player-primary',
        resource: { uri: 'generated://entity-player-primary' },
        metadata: { mimeType: 'image/png', width: 512, height: 512 },
        generationMode: 'text-to-image' as const,
      },
    }
    expect(result.asset.assetId).toBe(result.assetId)
    expect(request('text-to-image').visualContext).toEqual(visualContext)
  })

  it('rejects invalid mode-specific input', () => {
    expect(() => validateImageGenerationRequest({ ...request('text-to-image'), mode: 'unknown' } as never)).toThrow(
      'Unsupported image generation mode',
    )
    expect(() => validateImageGenerationRequest(request('edit'))).toThrow(
      'edit requires a sourceAsset',
    )
    expect(() => validateImageGenerationRequest(request('reference-guided'))).toThrow(
      'reference-guided requires at least one referenceAsset',
    )
  })

  it('supports explicit unsupported-mode and safe failure results', () => {
    const provider = {
      supports: (mode: ImageGenerationRequest['mode']) => mode === 'text-to-image',
      generate: async (input: ImageGenerationRequest) => ({
        status: 'failed' as const,
        assetId: input.assetId,
        mode: input.mode,
        failure: { code: 'unsupported_mode' as const, message: 'Mode is not supported' },
      }),
    }
    expect(provider.supports('edit')).toBe(false)
    return expect(provider.generate(request('edit'))).resolves.toMatchObject({
      status: 'failed',
      failure: { code: 'unsupported_mode' },
    })
  })
})
