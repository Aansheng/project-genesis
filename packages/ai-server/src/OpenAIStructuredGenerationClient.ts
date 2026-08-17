import OpenAI from 'openai'
import type { AIConfiguration, GameDesignPrompt, GameWorldGenerationRequest, StructuredGenerationClient } from '@genesis/ai'

type OpenAIClient = Pick<OpenAI, 'chat'>

/** Server-only vendor adapter. This module must never be imported by the web app. */
export class OpenAIStructuredGenerationClient implements StructuredGenerationClient {
  private readonly client: OpenAIClient

  constructor(private readonly config: AIConfiguration, client?: OpenAIClient) {
    if (!config.apiKey) throw new Error('AI_API_KEY is required')
    this.client = client ?? new OpenAI({ apiKey: config.apiKey, baseURL: config.baseURL })
  }

  async generateStructured(request: GameWorldGenerationRequest, prompt?: GameDesignPrompt): Promise<unknown> {
    const response = await this.client.chat.completions.create({
      model: this.config.model,
      messages: prompt
        ? [{ role: 'system', content: prompt.system }, { role: 'user', content: prompt.user }]
        : [{ role: 'user', content: JSON.stringify({ request }) }],
      temperature: this.config.temperature,
      max_tokens: this.config.maxOutputTokens ?? this.config.maxTokens,
      response_format: { type: 'json_object' },
    })
    const content = response.choices[0]?.message.content
    if (!content?.trim()) throw new Error('Empty structured generation response')
    return content
  }
}
