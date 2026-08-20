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

  it('hides provider failures and rejects malformed payloads', async () => {
    const failing = createAIGatewayHandler({ generateStructured: vi.fn().mockRejectedValue(new Error('secret')) })
    const failed = await failing(new Request('http://gateway', { method: 'POST', body: JSON.stringify({ input: 'x' }) }))
    expect(failed.status).toBe(502)
    expect(await failed.json()).toEqual({ error: 'AI generation unavailable' })
    const invalid = await failing(new Request('http://gateway', { method: 'POST', body: JSON.stringify({ input: '' }) }))
    expect(invalid.status).toBe(400)
  })
})
