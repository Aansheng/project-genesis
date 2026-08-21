import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useGameStore } from '../stores/gameStore'
import { useObservatoryDataStore } from '../stores/observatoryData'

function gateway(): typeof fetch {
  return vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body ?? '{}')) as { kind?: string; input?: string; instruction?: string }
    if (body.kind === 'world-evolution') {
      if (body.instruction?.includes('删除')) {
        return Response.json({
          candidate: {
            kind: 'remove-entity',
            scope: 'archetype-group',
            target: body.instruction.includes('Boss')
              ? { semantic: 'boss', match: 'one' }
              : { semantic: 'sheep', match: 'all' },
          },
        })
      }
      if (body.instruction?.includes('增加')) {
        return Response.json({
          candidate: {
            kind: 'add-entity',
            semantic: { name: 'merchant', category: 'npc' },
            count: body.instruction.includes('三个') ? 3 : 1,
          },
        })
      }
      if (body.instruction?.includes('夜晚')) {
        return Response.json({
          candidate: {
            kind: 'update-world-property',
            scope: 'world',
            property: 'timeOfDay',
            value: 'night',
          },
        })
      }
      return Response.json({
        candidate: {
          kind: 'replace-entity-semantic',
          scope: 'archetype-group',
          target: { semantic: 'cow', match: 'all' },
          replacement: { name: 'sheep' },
          preserveIdentity: true,
        },
      })
    }
    if (body.input?.toLocaleLowerCase().includes('rpg')) {
      return Response.json({
        candidate: {
          title: 'RPG',
          genre: 'rpg',
          entities: [
            { id: 'player-1', category: 'player', name: 'Player' },
            { id: 'merchant-1', category: 'npc', name: 'Merchant' },
            { id: 'villager-1', category: 'npc', name: 'Villager' },
            { id: 'boss-1', category: 'enemy', name: 'Boss' },
          ],
        },
      })
    }
    return Response.json({
      candidate: {
        title: 'Farm',
        genre: 'farm',
        theme: { name: 'green fields' },
        entities: [
          { id: 'player-1', category: 'player', name: 'Player' },
          { id: 'cow-1', category: 'npc', name: 'Cow' },
          { id: 'cow-2', category: 'npc', name: 'Cow' },
          { id: 'cow-3', category: 'npc', name: 'Cow' },
          { id: 'crop-1', category: 'terrain', name: 'Crop' },
          { id: 'barn-1', category: 'building', name: 'Barn' },
        ],
      },
    })
  }) as typeof fetch
}

function gatewayWithImages(): { readonly fetcher: typeof fetch; readonly imageRequests: readonly { readonly assetId: string; readonly visualArchetype?: string }[] } {
  const imageRequests: { assetId: string; visualArchetype?: string }[] = []
  const fetcher = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body ?? '{}')) as { assetId?: string; visualArchetype?: string; kind?: string; input?: string; instruction?: string }
    if (body.assetId) {
      imageRequests.push({ assetId: body.assetId, ...(body.visualArchetype ? { visualArchetype: body.visualArchetype } : {}) })
      return Response.json({
        status: 'success',
        assetId: body.assetId,
        mode: 'text-to-image',
        asset: {
          assetId: body.assetId,
          resource: { uri: `/generated/${body.visualArchetype ?? body.assetId}.png` },
          metadata: { width: 64, height: 64 },
          generationMode: 'text-to-image',
        },
      })
    }
    return gateway()(_input, init)
  }) as typeof fetch
  return { fetcher, imageRequests }
}

describe('World Evolution Studio integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('fetch', gateway())
  })

  it('applies a targeted semantic delta to Runtime while assets remain unchanged', async () => {
    const game = useGameStore()
    const observatory = useObservatoryDataStore()
    await game.send('创建一个农场游戏，3头牛')
    const beforeRuntime = JSON.stringify(game.worldStore.getWorld())
    const beforeManifest = JSON.stringify(game.assetManifest)
    const beforeManifestReference = game.assetManifest
    const beforeImageOperationIds = Object.keys(game.visualGenerationOperations)
    const beforePlayerAsset = game.assetSpecification?.assets.find(asset => asset.entityId === 'player-1')

    const result = await game.send('把所有牛改成羊')

    expect(result.success).toBe(true)
    expect(result.evolutionPlan?.status).toBe('validated')
    expect(result.evolutionPlan?.operation.status).toBe('asset_execution_started')
    expect(game.semanticRevision).toBe(1)
    expect(game.semanticWorld?.entities.filter(entity => entity.id.startsWith('cow-')).map(entity => entity.name)).toEqual(['Sheep', 'Sheep', 'Sheep'])
    expect(JSON.stringify(game.worldStore.getWorld())).not.toBe(beforeRuntime)
    expect(JSON.stringify(game.assetManifest)).toBe(beforeManifest)
    expect(game.assetManifest).toBe(beforeManifestReference)
    expect(Object.keys(game.visualGenerationOperations)).toEqual(expect.arrayContaining(beforeImageOperationIds))
    expect(Object.keys(game.visualGenerationOperations).length).toBeGreaterThan(beforeImageOperationIds.length)
    expect(game.visualDesignSpecification?.entities.filter(entity => entity.entityId.startsWith('cow-')).map(entity => entity.visualArchetype)).toEqual(['Sheep', 'Sheep', 'Sheep'])
    expect(game.assetSpecification?.assets.filter(asset => asset.entityId?.startsWith('cow-')).map(asset => asset.visualArchetype)).toEqual(['Sheep', 'Sheep', 'Sheep'])
    expect(game.assetSpecification?.assets.find(asset => asset.entityId === 'player-1')).toBe(beforePlayerAsset)
    expect(game.worldStore.getWorld().entities.map(entity => entity.id)).toEqual(['player-1', 'cow-1', 'cow-2', 'cow-3', 'crop-1', 'barn-1'])
    expect(game.worldStore.getWorld().entities.filter(entity => entity.id.startsWith('cow-')).every(entity => entity.components?.find(component => component.type === 'semantic')?.properties.name === 'Sheep')).toBe(true)
    expect(observatory.viewModel.historyView).toHaveLength(1)
    expect(observatory.viewModel.historyView[0]?.prompt).toBe('把所有牛改成羊')
    expect(observatory.viewModel.historyView[0]?.result).toContain('Semantic change applied')
    expect(observatory.viewModel.historyView[0]?.result).toContain('Runtime synchronized')
    expect(observatory.viewModel.historyView[0]?.result).toContain('Visual delta planned')
    expect(observatory.viewModel.historyView[0]?.result).toContain('Asset execution pending')
    expect(observatory.viewModel.diffView[0]?.status).toBe('applied')
    expect(observatory.viewModel.diffView[0]?.runtimeSynchronization).toBe('synchronized')
    expect(observatory.viewModel.diffView[0]?.targetIds).toEqual(['cow-1', 'cow-2', 'cow-3'])
    expect(observatory.viewModel.diffView[0]?.changed.map(item => item.name)).toEqual(expect.arrayContaining([
      'cow-1: Cow → Sheep', 'cow-2: Cow → Sheep', 'cow-3: Cow → Sheep',
      'Visual: Cow → Sheep', 'Asset execution: 1 canonical visual requirement(s) pending',
    ]))
    expect(observatory.viewModel.timelineView[0]?.entries.map(entry => entry.strategy)).toEqual([
      'REQUEST_RECEIVED · success',
      'PROMPT_ASSEMBLY · success',
      'STRUCTURED_GENERATION · success',
      'CANDIDATE_PARSE · success',
      'TARGET_RESOLUTION · success',
      'DELTA_VALIDATION · success',
      'SEMANTIC_APPLICATION_STARTED · success',
      'SEMANTIC_APPLICATION_COMPLETED · success',
      'RUNTIME_SYNC_STARTED · success',
      'RUNTIME_SYNC_COMPLETED · success',
      'VISUAL_IMPACT_STARTED · success',
      'VISUAL_DELTA_PLANNED · success',
      'ASSET_EXECUTION_STARTED · success',
    ])
    expect(observatory.viewModel.traceView[0]?.metadata).toMatchObject({ status: 'asset_execution_started', worldId: 'world-1', semanticRevision: 1, runtimeSemanticRevision: 1, visualRevision: 1, visualPlanning: 'planned', visualGenerationRequired: 1, assetExecution: 'running' })
    expect(observatory.viewModel.eventStreamView.events.map(event => event.source)).toContain('world-evolution')
    expect(observatory.viewModel.eventStreamView.events.map(event => event.message)).toContain('Semantic world mutation applied; Runtime synchronization started')
    expect(observatory.viewModel.eventStreamView.events.map(event => event.message)).not.toContain('Semantic world mutation applied; Runtime synchronization pending')
    expect(observatory.viewModel.eventStreamView.events.map(event => event.message)).toContain('Visual delta planned; 1 canonical visual generation requirement(s) pending')

    const next = await game.send('删除所有羊')
    expect(next.success).toBe(true)
    expect(game.semanticWorld?.entities.some(entity => entity.name === 'Sheep')).toBe(false)
    expect(game.worldStore.getWorld().entities.map(entity => entity.id)).toEqual(['player-1', 'crop-1', 'barn-1'])
  })

  it('isolates World A evolution history when World B becomes current', async () => {
    const game = useGameStore()
    const observatory = useObservatoryDataStore()
    await game.send('创建 Farm A')
    await game.send('把所有牛改成羊')
    expect(observatory.viewModel.diffView).toHaveLength(1)

    await game.send('创建 Farm B')

    expect(game.currentWorldId).toBe('world-2')
    expect(observatory.viewModel.historyView).toHaveLength(0)
    expect(observatory.viewModel.diffView).toHaveLength(0)
    expect(observatory.viewModel.timelineView).toHaveLength(0)
    expect(observatory.viewModel.traceView).toHaveLength(0)
    expect(observatory.viewModel.runtimeView.worldId).toBe('world-2')
  })

  it('adds counted entities to Runtime and keeps world-property changes Runtime-neutral', async () => {
    const game = useGameStore()
    const observatory = useObservatoryDataStore()
    await game.send('创建一个农场游戏，3头牛')
    const beforeRuntime = JSON.stringify(game.worldStore.getWorld())
    const beforeManifest = JSON.stringify(game.assetManifest)

    const added = await game.send('增加三个商人')

    expect(added.success).toBe(true)
    expect(game.semanticWorld?.entities.filter(entity => entity.name === 'Merchant').map(entity => entity.id)).toEqual(['merchant-1', 'merchant-2', 'merchant-3'])
    expect(game.semanticRevision).toBe(1)
    const afterAddRuntime = JSON.stringify(game.worldStore.getWorld())
    expect(afterAddRuntime).not.toBe(beforeRuntime)
    expect(JSON.stringify(game.assetManifest)).toBe(beforeManifest)
    const addedPlan = added.evolutionPlan
    expect(addedPlan?.status).toBe('validated')
    expect(addedPlan?.operation.status).toBe('asset_execution_started')
    if (addedPlan?.status === 'validated') expect(addedPlan.visualPlan?.generationRequired).toHaveLength(1)
    expect(observatory.viewModel.diffView[0]?.added.map(item => item.name)).toEqual([
      'merchant-1: Merchant', 'merchant-2: Merchant', 'merchant-3: Merchant',
    ])

    const themed = await game.send('把整个世界改成夜晚')
    expect(themed.success).toBe(true)
    expect(game.semanticProperties.timeOfDay).toBe('night')
    expect(game.semanticRevision).toBe(2)
    expect(JSON.stringify(game.worldStore.getWorld())).toBe(afterAddRuntime)
    expect(observatory.viewModel.historyView.at(-1)?.result).toContain('Runtime no runtime impact')
    expect(observatory.viewModel.diffView.at(-1)?.runtimeSynchronization).toBe('no_runtime_impact')
    expect(observatory.viewModel.diffView.at(-1)?.visualPlanning).toBe('planned')
    expect(observatory.viewModel.diffView.at(-1)?.visualGenerationRequired).toBe(1)
  })

  it('removes the targeted Runtime entity without changing unrelated entities', async () => {
    const game = useGameStore()
    const observatory = useObservatoryDataStore()
    await game.send('创建一个 RPG')
    const beforeRuntime = JSON.stringify(game.worldStore.getWorld())

    const result = await game.send('删除 Boss')

    expect(result.success).toBe(true)
    expect(result.evolutionPlan?.operation.status).toBe('visual_sync_completed')
    expect(game.semanticWorld?.entities.some(entity => entity.id === 'boss-1')).toBe(false)
    expect(game.worldStore.getWorld().entities.some(entity => entity.id === 'boss-1')).toBe(false)
    expect(JSON.stringify(game.worldStore.getWorld())).not.toBe(beforeRuntime)
    expect(observatory.viewModel.diffView.at(-1)?.removed).toEqual([{ name: 'boss-1' }])
    expect(observatory.viewModel.diffView.at(-1)?.visualGenerationRequired).toBe(0)
  })

  it('executes one Sheep request, rebinds three assets, and completes after targeted renderer callbacks', async () => {
    const controlled = gatewayWithImages()
    vi.stubGlobal('fetch', controlled.fetcher)
    const game = useGameStore()
    const observatory = useObservatoryDataStore()
    await game.send('创建一个农场游戏，3头牛')

    const evolution = await game.send('把所有牛改成羊')
    expect(evolution.success).toBe(true)
    await vi.waitFor(() => expect(controlled.imageRequests.filter(request => request.visualArchetype === 'Sheep')).toHaveLength(1))
    await vi.waitFor(() => expect(game.assetManifest.entries.filter(entry => entry.entityId?.startsWith('cow-') && entry.origin === 'generated')).toHaveLength(3))

    expect(controlled.imageRequests.filter(request => request.visualArchetype === 'Sheep')).toHaveLength(1)
    expect(game.assetManifest.entries.filter(entry => entry.entityId?.startsWith('cow-')).map(entry => entry.resource?.uri)).toEqual([
      '/generated/Sheep.png', '/generated/Sheep.png', '/generated/Sheep.png',
    ])
    expect(game.worldStore.getWorld().entities.map(entity => entity.id)).toEqual(['player-1', 'cow-1', 'cow-2', 'cow-3', 'crop-1', 'barn-1'])

    const sheepOperation = Object.values(game.visualGenerationOperations).find(operation => operation.visualArchetype === 'Sheep' && operation.stage === 'applying')
    expect(sheepOperation).toBeDefined()
    for (const entityId of ['cow-1', 'cow-2', 'cow-3']) {
      game.reportAssetApplication({ assetId: `entity-${entityId}-primary`, entityId, status: 'applied' })
    }
    await vi.waitFor(() => expect(observatory.viewModel.historyView[0]?.result).toContain('Visual synchronized'))
    expect(observatory.viewModel.traceView[0]?.metadata).toMatchObject({ status: 'visual_sync_completed', assetExecution: 'completed', assetGenerated: 1, assetRebound: 3, assetRendererApplied: 3 })
    expect(observatory.viewModel.timelineView[0]?.entries.map(entry => entry.strategy)).toEqual(expect.arrayContaining([
      'ASSET_EXECUTION_STARTED · success',
      'ASSET_GENERATION_STARTED · success',
      'ASSET_GENERATED · success',
      'MANIFEST_REBOUND · success',
      'ASSET_RESOLVED · success',
      'RENDERER_APPLIED · success',
      'VISUAL_SYNC_COMPLETED · success',
    ]))
  })

  it('marks superseded create-world visual jobs as cancelled before evolution generation starts', async () => {
    let releaseInitialImage!: (response: Response) => void
    let delayed = true
    const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body ?? '{}')) as { assetId?: string; visualArchetype?: string }
      if (!body.assetId) return gateway()(input, init)
      if (delayed) {
        delayed = false
        return new Promise<Response>(resolve => { releaseInitialImage = resolve })
      }
      return Response.json({
        status: 'success',
        assetId: body.assetId,
        mode: 'text-to-image',
        asset: {
          assetId: body.assetId,
          resource: { uri: `/generated/${body.visualArchetype ?? body.assetId}.png` },
          generationMode: 'text-to-image',
        },
      })
    }) as typeof fetch
    vi.stubGlobal('fetch', fetcher)
    const game = useGameStore()
    await game.send('创建一个农场游戏，3头牛')
    const createWorldOperationIds = Object.keys(game.visualGenerationOperations)
    expect(createWorldOperationIds.length).toBeGreaterThan(1)

    await game.send('把所有牛改成羊')

    expect(createWorldOperationIds.map(id => game.visualGenerationOperations[id]?.stage)).toEqual(
      createWorldOperationIds.map(() => 'cancelled'),
    )
    releaseInitialImage(Response.json({ status: 'failed', failure: { code: 'stale_operation', message: 'superseded' } }))
  })
})
