import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useGameStore } from '../stores/gameStore'
import { useObservatoryDataStore } from '../stores/observatoryData'

function gateway(): typeof fetch {
  return vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body ?? '{}')) as { kind?: string }
    if (body.kind === 'world-evolution') {
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

describe('World Evolution Studio integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('fetch', gateway())
  })

  it('plans a real semantic delta while Runtime and assets remain unchanged', async () => {
    const game = useGameStore()
    const observatory = useObservatoryDataStore()
    await game.send('创建一个农场游戏，3头牛')
    const beforeRuntime = JSON.stringify(game.worldStore.getWorld())
    const beforeManifest = JSON.stringify(game.assetManifest)

    const result = await game.send('把所有牛改成羊')

    expect(result.success).toBe(true)
    expect(result.evolutionPlan?.status).toBe('validated')
    expect(JSON.stringify(game.worldStore.getWorld())).toBe(beforeRuntime)
    expect(JSON.stringify(game.assetManifest)).toBe(beforeManifest)
    expect(game.worldStore.getWorld().entities.map(entity => entity.id)).toEqual(['player-1', 'cow-1', 'cow-2', 'cow-3', 'crop-1', 'barn-1'])
    expect(observatory.viewModel.historyView).toHaveLength(1)
    expect(observatory.viewModel.historyView[0]?.prompt).toBe('把所有牛改成羊')
    expect(observatory.viewModel.historyView[0]?.result).toContain('Runtime unchanged')
    expect(observatory.viewModel.diffView[0]?.status).toBe('planned')
    expect(observatory.viewModel.diffView[0]?.targetIds).toEqual(['cow-1', 'cow-2', 'cow-3'])
    expect(observatory.viewModel.diffView[0]?.changed.map(item => item.name)).toEqual([
      'cow-1: Cow → Sheep', 'cow-2: Cow → Sheep', 'cow-3: Cow → Sheep',
    ])
    expect(observatory.viewModel.timelineView[0]?.entries.map(entry => entry.strategy)).toEqual([
      'REQUEST_RECEIVED · success',
      'PROMPT_ASSEMBLY · success',
      'STRUCTURED_GENERATION · success',
      'CANDIDATE_PARSE · success',
      'TARGET_RESOLUTION · success',
      'DELTA_VALIDATION · success',
    ])
    expect(observatory.viewModel.traceView[0]?.metadata).toMatchObject({ status: 'validated', worldId: 'world-1' })
    expect(observatory.viewModel.eventStreamView.events.map(event => event.source)).toContain('world-evolution')
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
})
