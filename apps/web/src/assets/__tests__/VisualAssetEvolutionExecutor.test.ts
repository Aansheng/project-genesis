import { describe, expect, it, vi } from 'vitest'
import { DefaultAssetResolver, DefaultAssetStore } from '@genesis/assets'
import { DefaultAssetSpecificationBuilder, DefaultVisualDesignSpecificationBuilder } from '@genesis/ai'
import {
  DefaultAssetManifestBuilder,
  type AssetManifest,
  type AssetRequirement,
  type AssetSpecification,
  type GameDesignSpecification,
  type ImageGenerationRequest,
  type ImageGenerationResult,
  type VisualEvolutionPlan,
} from '@genesis/shared'
import { groupAiGenerationRequirements } from '../AssetGenerationPolicy'
import { VisualAssetGenerationScheduler } from '../VisualAssetGenerationScheduler'
import { VisualAssetEvolutionExecutor, buildTargetedAssetManifest } from '../VisualAssetEvolutionExecutor'

function specification(names: readonly { id: string; category: 'player' | 'npc'; name: string }[]): AssetSpecification {
  const design: GameDesignSpecification = {
    title: 'executor test',
    genre: 'farm',
    theme: { name: 'green fields' },
    objectives: [],
    entities: names,
  }
  return new DefaultAssetSpecificationBuilder().build(new DefaultVisualDesignSpecificationBuilder().build(design))
}

function plan(
  updatedAssetSpecification: AssetSpecification,
  generationRequired: readonly AssetRequirement[],
  operationId = 'evolution-executor-test',
  status: VisualEvolutionPlan['status'] = 'planned',
): VisualEvolutionPlan {
  return {
    status,
    operationId,
    worldId: 'world-test',
    semanticRevision: 1,
    runtimeRevision: 1,
    previousVisualRevision: 0,
    updatedVisualRevision: 1,
    affectedEntityIds: Object.freeze([]),
    oldArchetypes: Object.freeze([]),
    newArchetypes: Object.freeze([]),
    addedVisualRequirements: Object.freeze([]),
    removedVisualRequirements: Object.freeze([]),
    replacedVisualRequirements: Object.freeze([]),
    bindingOnlyChanges: Object.freeze([]),
    worldLevelVisualImpact: Object.freeze([]),
    unaffectedAssetIds: Object.freeze([]),
    unaffectedArchetypes: Object.freeze([]),
    generationRequired: Object.freeze([...generationRequired]),
    previousVisualDesign: {} as VisualEvolutionPlan['previousVisualDesign'],
    updatedVisualDesign: {} as VisualEvolutionPlan['updatedVisualDesign'],
    previousAssetSpecification: updatedAssetSpecification,
    updatedAssetSpecification,
    assetImpactPlan: {
      status: generationRequired.length > 0 ? 'planned' : 'no_visual_impact',
      entries: Object.freeze([]),
      generationRequired: Object.freeze([...generationRequired]),
      orphanedAssetIds: Object.freeze([]),
      unaffectedAssetIds: Object.freeze([]),
      unaffectedArchetypes: Object.freeze([]),
    },
  }
}

function resolvedManifest(specification: AssetSpecification, uri: string): AssetManifest {
  return new DefaultAssetManifestBuilder().build(specification, Object.fromEntries(
    specification.assets.map(asset => [asset.id, { status: 'resolved' as const, origin: 'generated' as const, resource: { uri }, metadata: { width: 64, height: 64 } }]),
  ))
}

function success(request: ImageGenerationRequest, uri: string): ImageGenerationResult {
  return {
    status: 'success',
    assetId: request.assetId,
    mode: request.mode,
    asset: {
      assetId: request.assetId,
      resource: { uri },
      metadata: { width: 64, height: 64 },
      generationMode: request.mode,
    },
  }
}

describe('VisualAssetEvolutionExecutor', () => {
  it('generates once and rebinds all shared bindings while preserving unrelated entries', async () => {
    const before = specification([
      { id: 'player-1', category: 'player', name: 'Player' },
      { id: 'cow-1', category: 'npc', name: 'Cow' },
      { id: 'cow-2', category: 'npc', name: 'Cow' },
      { id: 'cow-3', category: 'npc', name: 'Cow' },
    ])
    const updated = specification([
      { id: 'player-1', category: 'player', name: 'Player' },
      { id: 'cow-1', category: 'npc', name: 'Sheep' },
      { id: 'cow-2', category: 'npc', name: 'Sheep' },
      { id: 'cow-3', category: 'npc', name: 'Sheep' },
    ])
    const sheepGroup = groupAiGenerationRequirements(updated).find(([, requirements]) => requirements[0]?.visualArchetype === 'Sheep')!
    const canonical = sheepGroup[0]
    const bindings = sheepGroup[1]
    const current = resolvedManifest(before, '/generated/cow.png')
    const playerBefore = current.entries.find(entry => entry.entityId === 'player-1')!
    const generated = vi.fn(async (request: ImageGenerationRequest) => success(request, '/generated/sheep.png'))
    const committed: AssetManifest[] = []
    const executor = new VisualAssetEvolutionExecutor({
      imageClient: { generate: generated },
      scheduler: new VisualAssetGenerationScheduler(1),
      assetStore: new DefaultAssetStore(new DefaultAssetResolver()),
      onManifestCommitted: ({ manifest }) => committed.push(manifest),
    })

    const result = await executor.execute(plan(updated, [canonical]), current, {
      worldId: 'world-test', semanticRevision: 1, visualRevision: 1, manifestRevision: 0, token: 1,
    })

    expect(generated).toHaveBeenCalledTimes(1)
    expect(result.status).toBe('manifest_rebound')
    expect(result.generatedCanonicalAssetIds).toEqual([canonical.id])
    expect(result.reboundAssetIds).toEqual(bindings.map(binding => binding.id))
    expect(committed).toHaveLength(1)
    const next = committed[0]!
    expect(next.entries.filter(entry => entry.entityId?.startsWith('cow-')).map(entry => entry.resource?.uri)).toEqual([
      '/generated/sheep.png', '/generated/sheep.png', '/generated/sheep.png',
    ])
    expect(next.entries.find(entry => entry.entityId === 'player-1')).toBe(playerBefore)
  })

  it('applies remove-only changes without starting a generation request', async () => {
    const before = specification([
      { id: 'cow-1', category: 'npc', name: 'Cow' },
      { id: 'cow-2', category: 'npc', name: 'Cow' },
    ])
    const updated = specification([{ id: 'cow-2', category: 'npc', name: 'Cow' }])
    const current = resolvedManifest(before, '/generated/cow.png')
    const remainingBefore = current.entries.find(entry => entry.entityId === 'cow-2')!
    const stages: string[] = []
    const generated = vi.fn(async (request: ImageGenerationRequest) => success(request, '/generated/never.png'))
    const executor = new VisualAssetEvolutionExecutor({
      imageClient: { generate: generated },
      scheduler: new VisualAssetGenerationScheduler(1),
      assetStore: new DefaultAssetStore(new DefaultAssetResolver()),
      onProgress: progress => stages.push(progress.stage),
    })

    const result = await executor.execute(plan(updated, [], 'remove-only', 'no_visual_impact'), current, {
      worldId: 'world-test', semanticRevision: 1, visualRevision: 1, manifestRevision: 3, token: 1,
    })

    expect(generated).not.toHaveBeenCalled()
    expect(result.status).toBe('completed')
    expect(result.removedAssetIds).toHaveLength(1)
    expect(stages).toEqual(['ASSET_EXECUTION_STARTED', 'MANIFEST_REBOUND', 'VISUAL_SYNC_COMPLETED'])
    expect(buildTargetedAssetManifest(updated, current).entries.find(entry => entry.entityId === 'cow-2')).toBe(remainingBefore)
  })

  it('preserves presentation state and render usage in targeted manifest bindings', () => {
    const playerSpecification = specification([{ id: 'player-1', category: 'player', name: 'Player' }])
    const current = new DefaultAssetManifestBuilder().build(playerSpecification)
    const run = playerSpecification.assets.find(asset => asset.presentationState === 'run')!

    const next = buildTargetedAssetManifest(playerSpecification, current, new Map([
      [run.id, { resource: { uri: '/generated/player-run.png' } }],
    ]))

    expect(next.entries.find(entry => entry.assetId === run.id)).toMatchObject({
      presentationState: 'run',
      presentationFrame: 0,
      renderUsage: 'entity-sprite',
      status: 'resolved',
      resource: { uri: '/generated/player-run.png' },
    })
  })

  it('rejects a late result after the execution token becomes stale and is idempotent', async () => {
    const updated = specification([{ id: 'cow-1', category: 'npc', name: 'Sheep' }])
    const canonical = groupAiGenerationRequirements(updated).find(([, requirements]) => requirements[0]?.visualArchetype === 'Sheep')![0]
    const current = resolvedManifest(specification([{ id: 'cow-1', category: 'npc', name: 'Cow' }]), '/generated/cow.png')
    let currentToken = 1
    let release!: (result: ImageGenerationResult) => void
    const generated = vi.fn((_request: ImageGenerationRequest) => new Promise<ImageGenerationResult>(resolve => { release = resolve }))
    const committed: AssetManifest[] = []
    const executor = new VisualAssetEvolutionExecutor({
      imageClient: { generate: generated },
      scheduler: new VisualAssetGenerationScheduler(1),
      assetStore: new DefaultAssetStore(new DefaultAssetResolver()),
      isCurrent: context => context.token === currentToken,
      onManifestCommitted: ({ manifest }) => committed.push(manifest),
    })
    const context = { worldId: 'world-test', semanticRevision: 1, visualRevision: 1, manifestRevision: 0, token: 1 }
    const running = executor.execute(plan(updated, [canonical], 'stale-test'), current, context)
    await vi.waitFor(() => expect(generated).toHaveBeenCalledTimes(1))
    currentToken = 2
    release(success(await generated.mock.calls[0]![0], '/generated/late.png'))
    const result = await running
    const repeated = await executor.execute(plan(updated, [canonical], 'stale-test'), current, context)

    expect(result.status).toBe('stale')
    expect(repeated).toBe(result)
    expect(committed).toHaveLength(0)
    expect(current.entries[0]?.resource?.uri).toBe('/generated/cow.png')
  })

  it('retains the previous resolved resources when targeted resolution fails', async () => {
    const before = specification([{ id: 'cow-1', category: 'npc', name: 'Cow' }])
    const updated = specification([{ id: 'cow-1', category: 'npc', name: 'Sheep' }])
    const canonical = groupAiGenerationRequirements(updated).find(([, requirements]) => requirements[0]?.visualArchetype === 'Sheep')![0]
    const current = resolvedManifest(before, '/generated/cow.png')
    const loader = {
      load: vi.fn(async (resource: { readonly uri: string }) => {
        if (resource.uri === '/generated/sheep.png') throw new Error('texture unavailable')
        return { uri: resource.uri, width: 64, height: 64 }
      }),
    }
    const assetStore = new DefaultAssetStore(new DefaultAssetResolver(loader))
    await assetStore.resolve(canonical.id, current)
    const committed: AssetManifest[] = []
    const executor = new VisualAssetEvolutionExecutor({
      imageClient: { generate: async request => success(request, '/generated/sheep.png') },
      scheduler: new VisualAssetGenerationScheduler(1),
      assetStore,
      onManifestCommitted: ({ manifest }) => committed.push(manifest),
    })

    const result = await executor.execute(plan(updated, [canonical], 'resolution-failure'), current, {
      worldId: 'world-test', semanticRevision: 1, visualRevision: 1, manifestRevision: 0, token: 1,
    })

    expect(result.status).toBe('failed')
    expect(result.previousVisualRetained).toBe(true)
    expect(committed).toHaveLength(0)
    expect(assetStore.get(canonical.id)?.uri).toBe('/generated/cow.png')
  })

  it('retains the current resolved resource when candidate generation fails before activation', async () => {
    const before = specification([{ id: 'cow-1', category: 'npc', name: 'Cow' }])
    const updated = specification([{ id: 'cow-1', category: 'npc', name: 'Sheep' }])
    const canonical = groupAiGenerationRequirements(updated).find(([, requirements]) => requirements[0]?.visualArchetype === 'Sheep')![0]
    const current = resolvedManifest(before, '/generated/cow.png')
    const assetStore = new DefaultAssetStore(new DefaultAssetResolver())
    await assetStore.resolve(canonical.id, current)
    const committed: AssetManifest[] = []
    const executor = new VisualAssetEvolutionExecutor({
      imageClient: { generate: async request => ({ status: 'failed', assetId: request.assetId, mode: request.mode, failure: { code: 'provider_unavailable', message: 'provider unavailable' } }) },
      scheduler: new VisualAssetGenerationScheduler(1),
      assetStore,
      onManifestCommitted: ({ manifest }) => committed.push(manifest),
    })

    const result = await executor.execute(plan(updated, [canonical], 'generation-failure'), current, {
      worldId: 'world-test', semanticRevision: 1, visualRevision: 1, manifestRevision: 0, token: 1,
    })

    expect(result.status).toBe('failed')
    expect(result.previousVisualRetained).toBe(true)
    expect(committed).toHaveLength(0)
    expect(assetStore.get(canonical.id)?.uri).toBe('/generated/cow.png')
  })
})
