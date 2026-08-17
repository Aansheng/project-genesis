import { describe, expect, it, vi } from 'vitest'
import { BrowserStructuredGenerationClient } from '../ai/BrowserStructuredGenerationClient'

describe('BrowserStructuredGenerationClient', () => {
  it('sends a request and returns the candidate', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ candidate: { worldType: 'sandbox' } }), { status: 200 }))
    const client = new BrowserStructuredGenerationClient('/api/ai/generate', fetcher)
    await expect(client.generateStructured({ input: '创建世界', intent: { genre: 'sandbox', title: '创建世界' } })).resolves.toEqual({ worldType: 'sandbox' })
    expect(fetcher).toHaveBeenCalledWith('/api/ai/generate', expect.objectContaining({ method: 'POST' }))
  })

  it('turns HTTP and malformed responses into safe errors', async () => {
    const failed = new BrowserStructuredGenerationClient('/gateway', vi.fn().mockResolvedValue(new Response('{}', { status: 503 })))
    await expect(failed.generateStructured({ input: 'x', intent: { genre: 'sandbox', title: 'x' } })).rejects.toThrow('AI gateway unavailable')
    const malformed = new BrowserStructuredGenerationClient('/gateway', vi.fn().mockResolvedValue(new Response('{}', { status: 200 })))
    await expect(malformed.generateStructured({ input: 'x', intent: { genre: 'sandbox', title: 'x' } })).rejects.toThrow('Invalid AI gateway response')
  })
})
