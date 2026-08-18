import { describe, expect, it } from 'vitest'
import { buildImageGenerationRequest } from '../AssetGenerationPolicy'
import { createPendingImageGenerationOperation, finishImageGenerationOperation } from '../GeneratedAssetOrchestrator'
import type { AssetSpecification } from '@genesis/shared'

const specification: AssetSpecification = {
  visualContext: {
    artDirection: 'stylized-2d',
    theme: { sourceTheme: 'forest', visualTheme: 'forest fantasy' },
    palette: { temperature: 'warm', contrast: 'standard', mood: 'bright' },
  },
  assets: [{
    id: 'player', kind: 'character', target: 'entity', entityId: 'player',
    visualRole: 'player character', subject: 'forest hero', requiredStates: ['idle'],
    technicalProfile: { transparentBackground: true, view: 'side' },
  }],
}

describe('visual generation activity lifecycle', () => {
  it('keeps one correlation id while moving from generation to renderer-ready', () => {
    const request = buildImageGenerationRequest(specification, specification.assets[0])
    const pending = createPendingImageGenerationOperation(request)
    const applying = finishImageGenerationOperation(pending, {
      status: 'running',
      stage: 'applying',
      artifactStatus: 'published',
      manifestStatus: 'updated',
      assetResolutionStatus: 'pending',
      rendererStatus: 'pending',
    })
    const ready = finishImageGenerationOperation(applying, {
      status: 'succeeded',
      stage: 'ready',
      assetResolutionStatus: 'resolved',
      rendererStatus: 'applied',
      outcome: 'generated_and_applied',
    })

    expect(pending.stage).toBe('preparing')
    expect(applying.stage).toBe('applying')
    expect(ready.stage).toBe('ready')
    expect(ready.operationId).toBe(pending.operationId)
    expect(ready.outcome).toBe('generated_and_applied')
    expect(ready.durationMs).toBeGreaterThanOrEqual(0)
  })

  it('describes a provider failure as fallback without changing game readiness', () => {
    const request = buildImageGenerationRequest(specification, specification.assets[0])
    const fallback = finishImageGenerationOperation(createPendingImageGenerationOperation(request), {
      status: 'failed',
      stage: 'fallback',
      artifactStatus: 'failed',
      outcome: 'generation_failed_fallback',
      fallback: 'static',
      failure: { code: 'provider_unavailable', message: 'provider unavailable' },
    })

    expect(fallback.stage).toBe('fallback')
    expect(fallback.fallback).toBe('static')
    expect(fallback.outcome).toBe('generation_failed_fallback')
    expect(fallback.failure?.message).toBe('provider unavailable')
  })
})
