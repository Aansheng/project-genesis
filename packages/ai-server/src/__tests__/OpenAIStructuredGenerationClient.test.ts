import { describe, expect, it, vi } from 'vitest'
import { OpenAIStructuredGenerationClient } from '../OpenAIStructuredGenerationClient'
import { DefaultGameDesignPromptBuilder } from '@genesis/ai'

describe('server OpenAIStructuredGenerationClient', () => {
  it('calls the provider without exposing it to browser code', async () => {
    const create = vi.fn().mockResolvedValue({ output_text: '{"worldType":"sandbox","entities":[]}' })
    const client = new OpenAIStructuredGenerationClient(
      { enabled: true, provider: 'openai', model: 'gpt-test', temperature: 0, maxTokens: 100, apiKey: 'server-only' },
      { responses: { create } } as never,
    )
    await expect(client.generateStructured({ input: '创建世界', intent: { genre: 'sandbox', title: '创建世界' } })).resolves.toBe('{"worldType":"sandbox","entities":[]}')
    expect(create).toHaveBeenCalledOnce()
  })

  it('passes the assembled semantic prompt to the vendor transport', async () => {
    const create = vi.fn().mockResolvedValue({ output_text: '{"genre":"platformer","entities":[]}' })
    const client = new OpenAIStructuredGenerationClient(
      { enabled: true, provider: 'openai', model: 'gpt-test', temperature: 0, maxTokens: 100, apiKey: 'server-only' },
      { responses: { create } } as never,
    )
    const request = { input: '创建 MarioWorld', intent: { genre: 'platformer' as const, title: 'MarioWorld' } }
    await client.generateStructured(request, new DefaultGameDesignPromptBuilder().build(request))
    const input = (create.mock.calls[0][0] as { input: unknown }).input
    expect(input).toEqual(expect.arrayContaining([
      expect.objectContaining({ role: 'system' }),
      expect.objectContaining({ role: 'user' }),
    ]))
  })
})
