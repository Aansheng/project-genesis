import { describe, expect, it, vi } from 'vitest'
import { OpenAIStructuredGenerationClient } from '../game-world/generation/OpenAIStructuredGenerationClient'

describe('OpenAIStructuredGenerationClient', () => {
  const request = {
    input: '创建 MarioWorld',
    intent: { genre: 'platformer', worldType: 'mario' } as never,
  }

  it('returns the vendor structured response through the boundary', async () => {
    const create = vi.fn().mockResolvedValue({ output_text: '{"worldType":"platformer","entities":[]}' })
    const client = new OpenAIStructuredGenerationClient(
      { enabled: true, provider: 'openai', model: 'gpt-test', temperature: 0, maxTokens: 100, apiKey: 'test' },
      { responses: { create } } as never,
    )

    await expect(client.generateStructured(request)).resolves.toBe('{"worldType":"platformer","entities":[]}')
    expect(create).toHaveBeenCalledOnce()
  })

  it('rejects empty model responses', async () => {
    const client = new OpenAIStructuredGenerationClient(
      { enabled: true, provider: 'openai', model: 'gpt-test', temperature: 0, maxTokens: 100, apiKey: 'test' },
      { responses: { create: vi.fn().mockResolvedValue({ output_text: ' ' }) } } as never,
    )

    await expect(client.generateStructured(request)).rejects.toThrow('Empty structured generation response')
  })
})
