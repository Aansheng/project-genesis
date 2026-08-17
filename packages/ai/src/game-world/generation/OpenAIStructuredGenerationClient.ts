import OpenAI from 'openai'
import type { AIConfiguration } from '../../config'
import type { GameWorldGenerationRequest } from './GameWorldGenerationRequest'
import type { StructuredGenerationClient } from './StructuredGenerationClient'

type OpenAIClient = Pick<OpenAI, 'responses'>

/** Official OpenAI adapter. It exposes only the structured-client boundary to callers. */
export class OpenAIStructuredGenerationClient implements StructuredGenerationClient {
  private readonly client: OpenAIClient
  private readonly config: AIConfiguration

  constructor(config: AIConfiguration, client?: OpenAIClient) {
    if (!config.apiKey) throw new Error('OpenAIStructuredGenerationClient requires an apiKey')
    this.config = config
    this.client = client ?? new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      ...(config.allowBrowser ? { dangerouslyAllowBrowser: true } : {}),
    })
  }

  async generateStructured(request: GameWorldGenerationRequest): Promise<unknown> {
    const response = await this.client.responses.create({
      model: this.config.model,
      input: JSON.stringify({
        instruction: 'Return only a JSON game-world candidate with worldType and entities[{id,category,name}].',
        request,
      }),
      temperature: this.config.temperature,
      max_output_tokens: this.config.maxOutputTokens ?? this.config.maxTokens,
      text: { format: { type: 'json_object' } },
    })

    if (!response.output_text || response.output_text.trim() === '') {
      throw new Error('Empty structured generation response')
    }
    return response.output_text
  }
}
