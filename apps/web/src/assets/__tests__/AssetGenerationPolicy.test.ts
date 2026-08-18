import { describe, expect, it } from 'vitest'
import { buildImageGenerationRequest, isAiGenerationEligible, selectAiGenerationRequirement } from '../AssetGenerationPolicy'
import { buildGeneratedAssetManifest } from '../GeneratedAssetOrchestrator'
import type { AssetSpecification, ImageGenerationResult } from '@genesis/shared'

const specification: AssetSpecification = {
  visualContext: {
    artDirection: 'stylized-2d',
    theme: { sourceTheme: 'forest', visualTheme: 'forest fantasy' },
    palette: { temperature: 'warm', contrast: 'standard', mood: 'bright' },
  },
  assets: [
    { id: 'player', kind: 'character', target: 'entity', entityId: 'player', visualRole: 'player character', subject: 'forest hero', requiredStates: ['idle'], technicalProfile: { transparentBackground: true, view: 'side' } },
    { id: 'enemy', kind: 'character', target: 'entity', entityId: 'enemy', visualRole: 'enemy creature', subject: 'forest enemy', requiredStates: ['idle'], technicalProfile: { transparentBackground: true, view: 'side' } },
  ],
}

describe('AI asset generation policy', () => {
  it('selects only the player character', () => {
    expect(isAiGenerationEligible(specification.assets[0])).toBe(true)
    expect(isAiGenerationEligible(specification.assets[1])).toBe(false)
    expect(selectAiGenerationRequirement(specification)?.id).toBe('player')
  })

  it('preserves canonical identity and semantic constraints', () => {
    expect(buildImageGenerationRequest(specification, specification.assets[0])).toMatchObject({
      assetId: 'player', mode: 'text-to-image', subject: 'forest hero',
      visualContext: specification.visualContext,
      constraints: { assetKind: 'character', view: 'side', transparentBackground: true },
    })
  })

  it('creates a new immutable manifest snapshot for a generated resource', () => {
    const current = { entries: specification.assets.map((asset) => ({ assetId: asset.id, kind: asset.kind, target: asset.target, entityId: asset.entityId, status: 'unresolved' as const })) }
    const result: Extract<ImageGenerationResult, { status: 'success' }> = {
      status: 'success', assetId: 'player', mode: 'text-to-image',
      asset: { assetId: 'player', resource: { uri: '/api/generated-assets/generated-1.png' }, metadata: { mimeType: 'image/png' }, generationMode: 'text-to-image' },
    }
    const next = buildGeneratedAssetManifest(specification, current, result)
    expect(next).not.toBe(current)
    expect(next.entries.find((entry) => entry.assetId === 'player')).toMatchObject({ status: 'resolved', origin: 'generated', resource: { uri: '/api/generated-assets/generated-1.png' } })
    expect(next.entries.find((entry) => entry.assetId === 'enemy')).toMatchObject({ status: 'unresolved' })
  })
})
