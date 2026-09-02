import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { DefaultRuntimeWorldStore } from '@genesis/runtime'
import { createCommandExecutor } from '../stores/gameStore'
import { useGameStore } from '../stores/gameStore'

const worldCandidate = {
  worldType: 'platformer',
  title: 'Gateway Platformer',
  entities: [
    { id: 'player', name: 'Player', category: 'player' },
    { id: 'terrain', name: 'Terrain', category: 'terrain' },
    { id: 'platform', name: 'Platform', category: 'terrain' },
    { id: 'enemy', name: 'Enemy', category: 'enemy' },
    { id: 'collectible', name: 'Coin', category: 'item' },
    { id: 'goal', name: 'Goal', category: 'item' },
  ],
}

const gameplayCandidate = {
  gameLoop: {
    objective: 'Reach the goal',
    repeatableActions: ['move', 'jump'],
    challengeSources: ['terrain'],
    rewardSources: ['progress'],
    progressionModes: ['none'],
    completionMode: 'goal',
    success: 'Reach the goal',
    failure: 'Player death',
  },
  playerMechanics: ['player-move', 'player-jump'],
  mechanics: [
    { id: 'player-move', kind: 'movement', subject: 'player', description: 'Move', supportStatus: 'supported' },
    { id: 'player-jump', kind: 'movement', subject: 'player', description: 'Jump', supportStatus: 'supported' },
    { id: 'collect-coin', kind: 'collection', subject: 'player', description: 'Collect', supportStatus: 'supported' },
  ],
  goals: [{ id: 'reach-goal', kind: 'reach-goal', description: 'Reach the goal', targetEntityId: 'goal' }],
}

describe('Gameplay generation web integration', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: 'unavailable' }), { status: 502 })))
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('uses the gateway for both world and gameplay generation and preserves truthful statuses', async () => {
    const requests: unknown[] = []
    const fetcher = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const request = JSON.parse(String(init?.body)) as { kind?: string }
      requests.push(request)
      return new Response(JSON.stringify({ candidate: request.kind === 'gameplay-generation' ? gameplayCandidate : worldCandidate }), { status: 200 })
    })
    const { executor, useAsync } = createCommandExecutor(
      new DefaultRuntimeWorldStore(),
      { VITE_AI_GATEWAY_URL: 'http://gateway.test/world-generation' },
      fetcher,
    )

    expect(useAsync).toBe(true)
    const result = await executor.executeAsync!('create a platformer')

    expect(result.success).toBe(true)
    expect(requests).toHaveLength(2)
    expect((requests[1] as { kind?: string }).kind).toBe('gameplay-generation')
    expect(result.gameplaySpecification?.metadata.source).toBe('ai')
    expect(result.gameplaySpecification?.mechanics.find(item => item.id === 'collect-coin')?.supportStatus).toBe('deferred')
    expect(result.gameplayDiagnostics?.validationStatus).toBe('valid')
    expect(result.generationDiagnostics?.candidateDisposition).toBe('accepted')
    expect(result.generationDiagnostics?.selectionOutcome).toBe('provider_accepted')
    expect(result.gameplayRuleSet?.bindingStatus).toBe('current')
    expect(result.gameplayRuleSet?.execution.status).toBe('active')
  })

  it('keeps world creation successful when gameplay generation is unavailable', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ error: 'unavailable' }), { status: 502 }))
    const store = new DefaultRuntimeWorldStore()
    const { executor } = createCommandExecutor(
      store,
      { VITE_AI_GATEWAY_URL: 'http://gateway.test/world-generation' },
      fetcher,
    )

    const result = await executor.executeAsync!('create a farm')

    expect(result.success).toBe(true)
    expect(store.getWorld().entities.length).toBeGreaterThan(0)
    expect(result.gameplaySpecification?.gameLoop.completionMode).toBe('open-ended')
    expect(result.gameplayDiagnostics?.source).toBe('deterministic')
    expect(result.gameplayDiagnostics?.validationStatus).toBe('invalid')
    expect(result.gameplayRuleSet?.metadata.source).toBe('deterministic')
  })

  it('preserves the Chinese Farm archetype through deterministic CreateWorld fallback', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ error: 'unavailable' }), { status: 502 }))
    const store = new DefaultRuntimeWorldStore()
    const { executor } = createCommandExecutor(
      store,
      { VITE_AI_GATEWAY_URL: 'http://gateway.test/world-generation' },
      fetcher,
    )

    const result = await executor.executeAsync!('做一个农场游戏')

    expect(result.success).toBe(true)
    expect(result.semanticWorld?.worldType).toBe('farm')
    expect(result.semanticWorld?.entities).toHaveLength(8)
    expect(store.getWorld().entities).toHaveLength(8)
    expect(result.generationDiagnostics?.source).toBe('deterministic')
    expect(result.generationDiagnostics?.selectionOutcome).toBe('deterministic_fallback')
    expect(result.generationDiagnostics?.candidateDisposition).toBe('provider_failed')
    expect(result.gameplaySpecification?.mechanics.find(item => item.id === 'player-move')?.supportStatus).toBe('supported')
    expect(result.gameplaySpecification?.mechanics.find(item => item.id === 'farm-interact')?.supportStatus).toBe('deferred')
  })

  it('replaces the gameplay authority together with the active world', async () => {
    const store = useGameStore()

    await store.send('create mario')
    const firstWorldId = store.currentWorldId
    const firstSpecification = store.gameplaySpecification
    const firstRuleSet = store.gameplayRuleSet

    await store.send('create a new farm game')

    expect(store.currentWorldId).not.toBe(firstWorldId)
    expect(store.gameplaySpecification).not.toBe(firstSpecification)
    expect(store.gameplayRuleSet).not.toBe(firstRuleSet)
    expect(store.gameplayRuleSet?.rules.some(rule => rule.ruleId === 'enemy-stomp')).toBe(false)
    expect(store.gameplaySpecification?.gameLoop.completionMode).toBe('open-ended')
    expect(store.gameplaySpecification?.mechanics.some(item => item.id === 'enemy-stomp')).toBe(false)
    expect(store.worldStore.getWorld().entities.some(entity => entity.id.includes('farm'))).toBe(true)
  })
})
