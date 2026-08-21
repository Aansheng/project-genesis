import { describe, expect, it, vi } from 'vitest'
import { createAIGatewayHandler } from '../gateway'

describe('AI gateway', () => {
  it('validates, forwards, and returns a candidate', async () => {
    const client = { generateStructured: vi.fn().mockResolvedValue({ worldType: 'sandbox', entities: [] }) }
    const response = await createAIGatewayHandler(client)(new Request('http://gateway', {
      method: 'POST',
      body: JSON.stringify({ input: '创建世界' }),
      headers: { 'content-type': 'application/json' },
    }))
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ candidate: { worldType: 'sandbox', entities: [] } })
    expect(client.generateStructured).toHaveBeenCalledWith(
      { input: '创建世界', intent: { genre: 'sandbox', title: '创建世界' } },
      expect.objectContaining({
        system: expect.stringContaining('semantic game design candidate'),
        user: expect.stringContaining('创建世界'),
      }),
    )
  })

  it('forwards world-evolution requests through the same structured client boundary', async () => {
    const candidate = {
      kind: 'replace-entity-semantic',
      selector: { semantic: 'cow', match: 'all' },
      replacement: { semantic: 'sheep' },
    }
    const client = { generateStructured: vi.fn().mockResolvedValue(candidate) }
    const request = {
      kind: 'world-evolution',
      operationId: 'evolution-1',
      instruction: '把所有牛改成羊',
      context: {
        worldId: 'world-a',
        semanticWorld: {
          worldType: 'sandbox',
          entities: [{ id: 'cow-1', name: 'Cow', category: 'npc', semantic: 'cow' }],
        },
      },
    }

    const response = await createAIGatewayHandler(client)(new Request('http://gateway', {
      method: 'POST',
      body: JSON.stringify(request),
      headers: { 'content-type': 'application/json' },
    }))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ candidate })
    expect(client.generateStructured).toHaveBeenCalledWith(
      request,
      expect.objectContaining({
        system: expect.stringContaining('world evolution'),
        user: expect.stringContaining('把所有牛改成羊'),
      }),
    )
  })

  it('forwards gameplay-generation requests through the same structured client boundary', async () => {
    const candidate = {
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
      playerMechanics: ['player-move'],
      mechanics: [{ id: 'player-move', kind: 'movement', description: 'Move', supportStatus: 'supported' }],
    }
    const client = { generateStructured: vi.fn().mockResolvedValue(candidate) }
    const request = {
      kind: 'gameplay-generation',
      input: 'create a platformer',
      context: {
        scope: 'gameplay-generation',
        game: { worldType: 'platformer' },
        semanticWorld: { entities: [{ id: 'player', category: 'player', name: 'Player' }] },
        capabilities: { version: 'v1', capabilities: [], supportedMechanicIds: ['player-move'] },
        instruction: 'create a platformer',
      },
    }

    const response = await createAIGatewayHandler(client)(new Request('http://gateway', {
      method: 'POST',
      body: JSON.stringify(request),
      headers: { 'content-type': 'application/json' },
    }))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ candidate })
    expect(client.generateStructured).toHaveBeenCalledWith(
      request,
      expect.objectContaining({
        system: expect.stringContaining('gameplay design planner'),
        user: expect.stringContaining('player-move'),
      }),
    )
  })

  it('rejects gameplay requests without a capability boundary', async () => {
    const client = { generateStructured: vi.fn() }
    const response = await createAIGatewayHandler(client)(new Request('http://gateway', {
      method: 'POST',
      body: JSON.stringify({
        kind: 'gameplay-generation',
        input: 'create a platformer',
        context: {
          scope: 'gameplay-generation',
          game: { worldType: 'platformer' },
          semanticWorld: { entities: [] },
          instruction: 'create a platformer',
        },
      }),
      headers: { 'content-type': 'application/json' },
    }))

    expect(response.status).toBe(400)
    expect(client.generateStructured).not.toHaveBeenCalled()
  })

  it('hides provider failures and rejects malformed payloads', async () => {
    const failing = createAIGatewayHandler({ generateStructured: vi.fn().mockRejectedValue(new Error('secret')) })
    const failed = await failing(new Request('http://gateway', { method: 'POST', body: JSON.stringify({ input: 'x' }) }))
    expect(failed.status).toBe(502)
    expect(await failed.json()).toEqual({ error: 'AI generation unavailable' })
    const invalid = await failing(new Request('http://gateway', { method: 'POST', body: JSON.stringify({ input: '' }) }))
    expect(invalid.status).toBe(400)
  })
})
