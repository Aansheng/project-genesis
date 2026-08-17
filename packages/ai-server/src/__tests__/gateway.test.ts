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

  it('hides provider failures and rejects malformed payloads', async () => {
    const failing = createAIGatewayHandler({ generateStructured: vi.fn().mockRejectedValue(new Error('secret')) })
    const failed = await failing(new Request('http://gateway', { method: 'POST', body: JSON.stringify({ input: 'x' }) }))
    expect(failed.status).toBe(502)
    expect(await failed.json()).toEqual({ error: 'AI generation unavailable' })
    const invalid = await failing(new Request('http://gateway', { method: 'POST', body: JSON.stringify({ input: '' }) }))
    expect(invalid.status).toBe(400)
  })
})
