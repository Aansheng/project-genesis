import { describe, expect, it, vi } from 'vitest'
import { OpenAIStructuredGenerationClient } from '../OpenAIStructuredGenerationClient'
import { DefaultGameDesignPromptBuilder } from '@genesis/ai'

describe('server OpenAIStructuredGenerationClient', () => {
  it('calls the provider without exposing it to browser code', async () => {
    const create = vi.fn().mockResolvedValue({ choices: [{ message: { content: '{"worldType":"sandbox","entities":[]}' } }] })
    const client = new OpenAIStructuredGenerationClient(
      { enabled: true, provider: 'openai', model: 'gpt-test', temperature: 0, maxTokens: 100, apiKey: 'server-only' },
      { chat: { completions: { create } } } as never,
    )
    await expect(client.generateStructured({ input: '创建世界', intent: { genre: 'sandbox', title: '创建世界' } })).resolves.toBe('{"worldType":"sandbox","entities":[]}')
    expect(create).toHaveBeenCalledOnce()
  })

  it('passes the assembled semantic prompt to the vendor transport', async () => {
    const create = vi.fn().mockResolvedValue({ choices: [{ message: { content: '{"genre":"platformer","entities":[]}' } }] })
    const client = new OpenAIStructuredGenerationClient(
      { enabled: true, provider: 'openai', model: 'gpt-test', temperature: 0, maxTokens: 100, apiKey: 'server-only' },
      { chat: { completions: { create } } } as never,
    )
    const request = { input: '创建 MarioWorld', intent: { genre: 'platformer' as const, title: 'MarioWorld' } }
    await client.generateStructured(request, new DefaultGameDesignPromptBuilder().build(request))
    const messages = (create.mock.calls[0][0] as { messages: unknown }).messages
    expect(messages).toEqual(expect.arrayContaining([
      expect.objectContaining({ role: 'system' }),
      expect.objectContaining({ role: 'user' }),
    ]))
  })
})
