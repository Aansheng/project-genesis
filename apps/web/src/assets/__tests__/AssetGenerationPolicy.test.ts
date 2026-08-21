import { describe, expect, it } from 'vitest'
import { DefaultImageGenerationContextBuilder } from '@genesis/shared'
import { buildImageGenerationRequest, groupAiGenerationRequirements, isAiGenerationEligible, selectAiGenerationRequirement } from '../AssetGenerationPolicy'
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
  it('selects player, enemy, and boss characters', () => {
    expect(isAiGenerationEligible(specification.assets[0])).toBe(true)
    expect(isAiGenerationEligible(specification.assets[1])).toBe(true)
    expect(selectAiGenerationRequirement(specification)?.id).toBe('player')
  })

  it('preserves canonical identity and semantic constraints', () => {
    expect(buildImageGenerationRequest(specification, specification.assets[0])).toMatchObject({
      assetId: 'player', mode: 'text-to-image', subject: 'forest hero',
      visualContext: specification.visualContext,
      constraints: { assetKind: 'character', view: 'side', transparentBackground: true },
    })
  })

  it('assembles deterministic provider-neutral sections from a bounded context', () => {
    const requirement = specification.assets[0]
    const context = new DefaultImageGenerationContextBuilder().build({
      metadata: { worldId: 'world-a', semanticRevision: 2, visualRevision: 1 },
      semanticWorld: { worldType: 'farm', entities: [{ id: 'player', category: 'player', name: 'Player' }] },
      properties: { theme: 'forest', timeOfDay: 'day' },
      visualDesign: {
        artDirection: specification.visualContext.artDirection,
        theme: specification.visualContext.theme,
        palette: specification.visualContext.palette,
        environment: { terrain: 'grass', background: 'forest', atmosphere: 'clear' },
      },
      assetSpecification: specification,
      requirement,
    })
    const request = buildImageGenerationRequest(specification, requirement, context)

    expect(request.prompt).toContain('GAME CONTEXT')
    expect(request.prompt).toContain('VISUAL CONTEXT')
    expect(request.prompt).toContain('TARGET ASSET')
    expect(request.prompt).toContain('CONSTRAINTS')
    expect(request.prompt).toContain('forest hero')
    expect(request.prompt).not.toContain('worldId')
    expect(request.prompt).not.toContain('assetIds')
    expect(request.generationContext).toBe(context)
  })

  it('generates meaningful semantic assets and keeps technical markers static-only', () => {
    const assets = [
      { ...specification.assets[0], id: 'cow-1', entityId: 'cow-1', subject: 'Cow', visualArchetype: 'Cow' },
      { ...specification.assets[0], id: 'cow-2', entityId: 'cow-2', subject: 'Cow', visualArchetype: 'Cow' },
      { ...specification.assets[0], id: 'merchant', entityId: 'merchant', kind: 'character' as const, subject: 'Merchant', visualArchetype: 'Merchant' },
      { ...specification.assets[0], id: 'checkpoint', kind: 'prop' as const, visualRole: 'checkpoint marker', subject: 'Checkpoint' },
    ]
    const next = { ...specification, assets }
    expect(assets.slice(0, 3).every(isAiGenerationEligible)).toBe(true)
    expect(isAiGenerationEligible(assets[3])).toBe(false)
    expect(groupAiGenerationRequirements(next)).toHaveLength(2)
    expect(groupAiGenerationRequirements(next)[0][1]).toHaveLength(2)
  })

  it('keeps distinct semantic archetypes separate', () => {
    const assets = specification.assets.map((asset, index) => ({
      ...asset, id: `entity-${index}`, entityId: `entity-${index}`,
      subject: index === 0 ? 'Slime' : 'Skeleton',
      visualArchetype: index === 0 ? 'Slime' : 'Skeleton',
    }))
    expect(groupAiGenerationRequirements({ ...specification, assets })).toHaveLength(2)
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
