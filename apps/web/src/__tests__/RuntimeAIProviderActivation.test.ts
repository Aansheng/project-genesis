import { describe, expect, it } from 'vitest'
import { DefaultRuntimeWorldStore } from '@genesis/runtime'
import { createCommandExecutor } from '../stores/gameStore'

const candidate = {
  worldType: 'platformer',
  title: 'Snow Platformer',
  theme: { name: 'snow and ice' },
  difficulty: 'medium',
  objectives: [{ type: 'reach-goal', target: 'boss' }],
  entities: [
    { id: 'player', name: 'Player', category: 'player' },
    { id: 'terrain', name: 'Terrain', category: 'terrain' },
    { id: 'platform', name: 'Platform', category: 'terrain' },
    { id: 'enemy-1', name: 'Patrol Enemy 1', category: 'enemy', role: 'patrol' },
    { id: 'boss', name: 'Boss', category: 'enemy', role: 'boss' },
    { id: 'collectible', name: 'Coin', category: 'item' },
    { id: 'goal', name: 'Goal', category: 'item' },
  ],
}

describe('runtime AI provider activation', () => {
  it('uses the gateway even when VITE_AI_ENABLED is false', async () => {
    const fetcher = async (): Promise<Response> => new Response(JSON.stringify({ candidate }), { status: 200 })
    const { executor, useAsync } = createCommandExecutor(
      new DefaultRuntimeWorldStore(),
      { VITE_AI_ENABLED: 'false', VITE_AI_GATEWAY_URL: 'http://gateway.test/world-generation' },
      fetcher,
    )

    expect(useAsync).toBe(true)
    const result = await executor.executeAsync!('创建一个冰雪主题的平台游戏')

    expect(result.success).toBe(true)
    expect(result.generationDiagnostics?.source).toBe('ai')
    expect(result.generationDiagnostics?.trace?.status).toBe('success')
    expect(result.generationDiagnostics?.specification?.theme?.name).toBe('snow and ice')
  })

  it('falls back first, then uses a provider configured after Web initialization', async () => {
    let configured = false
    const fetcher = async (): Promise<Response> => configured
      ? new Response(JSON.stringify({ candidate }), { status: 200 })
      : new Response(JSON.stringify({ error: 'AI generation unavailable' }), { status: 502 })
    const { executor } = createCommandExecutor(
      new DefaultRuntimeWorldStore(),
      { VITE_AI_ENABLED: 'false', VITE_AI_GATEWAY_URL: 'http://gateway.test/world-generation' },
      fetcher,
    )

    const fallback = await executor.executeAsync!('创建 MarioWorld')
    expect(fallback.success).toBe(true)
    expect(fallback.generationDiagnostics?.source).toBe('deterministic')
    expect(fallback.generationDiagnostics?.trace?.status).toBe('fallback')

    configured = true
    const ai = await executor.executeAsync!('创建一个冰雪主题的平台游戏')
    expect(ai.success).toBe(true)
    expect(ai.generationDiagnostics?.source).toBe('ai')
    expect(ai.generationDiagnostics?.trace?.status).toBe('success')
  })
})
