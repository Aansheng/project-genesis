import { describe, expect, it, vi } from 'vitest'
import { startAIServer, stopAIServer } from '../server'

describe('AI gateway runtime host', () => {
  it('starts, serves the gateway, rejects invalid input, and shuts down', async () => {
    const client = { generateStructured: vi.fn().mockResolvedValue({ worldType: 'sandbox', entities: [] }) }
    const service = await startAIServer(client, { port: 0 })
    try {
      const valid = await fetch(`http://${service.host}:${service.port}/api/world-generation`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ input: '创建 MarioWorld' }),
      })
      expect(valid.status).toBe(200)
      expect(await valid.json()).toEqual({ candidate: { worldType: 'sandbox', entities: [] } })
      expect(client.generateStructured).toHaveBeenCalledOnce()

      const invalid = await fetch(`http://${service.host}:${service.port}/api/world-generation`, {
        method: 'POST', body: JSON.stringify({ input: '' }),
      })
      expect(invalid.status).toBe(400)
      expect(await invalid.json()).toEqual({ error: 'Invalid generation request' })

      const missing = await fetch(`http://${service.host}:${service.port}/other`)
      expect(missing.status).toBe(404)
      expect(await missing.json()).toEqual({ error: 'Not found' })
    } finally { await stopAIServer(service) }
    expect(service.server.listening).toBe(false)
  })

  it('does not leak provider errors through the HTTP boundary', async () => {
    const service = await startAIServer({ generateStructured: vi.fn().mockRejectedValue(new Error('api-key stack trace')) }, { port: 0 })
    try {
      const response = await fetch(`http://${service.host}:${service.port}/api/world-generation`, {
        method: 'POST', body: JSON.stringify({ input: 'x' }),
      })
      expect(response.status).toBe(502)
      const body = await response.text()
      expect(body).toBe('{"error":"AI generation unavailable"}')
      expect(body).not.toContain('api-key')
      expect(body).not.toContain('stack')
    } finally { await stopAIServer(service.server) }
  })
})
