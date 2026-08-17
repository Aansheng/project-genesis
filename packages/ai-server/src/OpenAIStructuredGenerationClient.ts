import OpenAI from 'openai'
import type { AIConfiguration, GameDesignPrompt, GameWorldGenerationRequest, StructuredGenerationClient } from '@genesis/ai'

type OpenAIClient = Pick<OpenAI, 'responses'>

/** Server-only vendor adapter. This module must never be imported by the web app. */
export class OpenAIStructuredGenerationClient implements StructuredGenerationClient {
  private readonly client: OpenAIClient

  constructor(private readonly config: AIConfiguration, client?: OpenAIClient) {
    if (!config.apiKey) throw new Error('AI_API_KEY is required')
    this.client = client ?? new OpenAI({ apiKey: config.apiKey, baseURL: config.baseURL })
  }

  async generateStructured(request: GameWorldGenerationRequest, prompt?: GameDesignPrompt): Promise<unknown> {
    const response = await this.client.responses.create({
      model: this.config.model,
      input: prompt ? [{ role: 'system', content: prompt.system }, { role: 'user', content: prompt.user }] : JSON.stringify({ request }),
      temperature: this.config.temperature,
      max_output_tokens: this.config.maxOutputTokens ?? this.config.maxTokens,
      text: { format: { type: 'json_object' } },
    })
    if (!response.output_text?.trim()) throw new Error('Empty structured generation response')
    return response.output_text
  }
}
