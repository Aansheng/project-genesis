import OpenAI from 'openai'
import { StructuredGenerationError, type AIConfiguration, type GameDesignPrompt, type GameWorldGenerationRequest, type StructuredGenerationClient, type StructuredGenerationRequestOptions } from '@genesis/ai'

type OpenAIClient = Pick<OpenAI, 'chat'>

/** Server-only vendor adapter. This module must never be imported by the web app. */
export class OpenAIStructuredGenerationClient implements StructuredGenerationClient {
  private readonly client: OpenAIClient

  constructor(private readonly config: AIConfiguration, client?: OpenAIClient) {
    if (!config.apiKey) throw new Error('AI_API_KEY is required')
    this.client = client ?? new OpenAI({ apiKey: config.apiKey, baseURL: config.baseURL })
  }

  async generateStructured(request: GameWorldGenerationRequest, prompt?: GameDesignPrompt, options?: StructuredGenerationRequestOptions): Promise<unknown> {
    const maxAttempts = Math.max(1, Math.min(2, Math.trunc(this.config.maxAttempts ?? 1)))
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await this.generateOnce(request, prompt, options)
      } catch (error) {
        const failure = error instanceof StructuredGenerationError ? error : new StructuredGenerationError('provider_error', 'Structured generation provider error')
        if (!['timeout', 'transport_error', 'provider_error', 'output_truncated'].includes(failure.reason) || attempt === maxAttempts) throw failure
      }
    }
    throw new StructuredGenerationError('provider_error', 'Structured generation provider error')
  }

  private async generateOnce(request: GameWorldGenerationRequest, prompt?: GameDesignPrompt, options?: StructuredGenerationRequestOptions): Promise<unknown> {
    const timeoutMs = options?.timeoutMs ?? this.config.timeoutMs ?? 30000
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const response = await Promise.race([
        this.client.chat.completions.create({
          model: this.config.model,
          messages: prompt
            ? [{ role: 'system', content: prompt.system }, { role: 'user', content: prompt.user }]
            : [{ role: 'user', content: JSON.stringify({ request }) }],
          temperature: this.config.temperature,
          max_tokens: options?.maxOutputTokens ?? this.config.maxOutputTokens ?? this.config.maxTokens,
          response_format: { type: 'json_object' },
        }, { signal: controller.signal }) as unknown as Promise<{ choices?: readonly [{ finish_reason?: string; message?: { content?: string | null } }] }>,
        new Promise<never>((_, reject) => setTimeout(() => reject(new StructuredGenerationError('timeout', 'Structured generation timed out')), timeoutMs)),
      ])
      const choice = response.choices?.[0]
      if (choice?.finish_reason === 'length') throw new StructuredGenerationError('output_truncated', 'Structured generation output was truncated')
      const content = choice?.message?.content
      if (!content?.trim()) throw new StructuredGenerationError('empty_response', 'Empty structured generation response')
      return content
    } catch (error) {
      if (error instanceof StructuredGenerationError) throw error
      if (controller.signal.aborted) throw new StructuredGenerationError('timeout', 'Structured generation timed out')
      throw new StructuredGenerationError('provider_error', 'Structured generation provider error')
    } finally {
      clearTimeout(timeout)
    }
  }
}
