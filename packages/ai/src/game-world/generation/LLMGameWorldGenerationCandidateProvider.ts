import type { GameWorldGenerationCandidateProvider } from './GameWorldGenerationCandidateProvider'
import type { GameWorldGenerationRequest } from './GameWorldGenerationRequest'
import type { StructuredGenerationClient } from './StructuredGenerationClient'
import { DefaultGameDesignPromptBuilder, type GameDesignPromptBuilder } from './GameDesignPromptBuilder'
import {
  DEFAULT_STRUCTURED_GENERATION_RELIABILITY,
  StructuredGenerationError,
  type StructuredGenerationAttempt,
  type StructuredGenerationFailureReason,
  type StructuredGenerationReliabilityConfig,
} from './StructuredGenerationReliability'

/** Converts an untrusted model response into an unknown candidate-shaped value. */
export class LLMGameWorldGenerationCandidateProvider implements GameWorldGenerationCandidateProvider {
  constructor(
    private readonly client: StructuredGenerationClient,
    private readonly promptBuilder: GameDesignPromptBuilder = new DefaultGameDesignPromptBuilder(),
    private readonly reliability: StructuredGenerationReliabilityConfig = DEFAULT_STRUCTURED_GENERATION_RELIABILITY,
  ) {}

  private attempts: StructuredGenerationAttempt[] = []

  getGenerationAttempts(): readonly StructuredGenerationAttempt[] {
    return Object.freeze([...this.attempts])
  }

  async generate(request: GameWorldGenerationRequest): Promise<unknown> {
    this.attempts = []
    const prompt = this.promptBuilder.build(request)
    const maxAttempts = Math.max(1, Math.min(2, Math.trunc(this.reliability.maxAttempts)))
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await this.client.generateStructured(request, prompt, {
          maxOutputTokens: this.reliability.maxOutputTokens,
          timeoutMs: this.reliability.timeoutMs,
        })
        const candidate = parseResponse(response)
        this.attempts.push({ attempt, status: 'success' })
        return candidate
      } catch (error) {
        const failure = toStructuredGenerationError(error)
        this.attempts.push({ attempt, status: 'failed', failureReason: failure.reason })
        if (!isRetryable(failure.reason) || attempt === maxAttempts) {
          throw new StructuredGenerationError(failure.reason, failure.message, this.getGenerationAttempts())
        }
      }
    }
    throw new StructuredGenerationError('provider_error', 'Structured generation failed', this.getGenerationAttempts())
  }
}

function parseResponse(response: unknown): unknown {
  if (typeof response !== 'string') return response
  const text = response.trim()
  if (!text) throw new StructuredGenerationError('empty_response', 'Empty structured generation response')
  try {
    return JSON.parse(text) as unknown
  } catch {
    const truncated = looksTruncated(text)
    throw new StructuredGenerationError(
      truncated ? 'output_truncated' : 'malformed_response',
      truncated ? 'Structured generation output was truncated' : 'Candidate parse failed: invalid structured JSON',
    )
  }
}

function looksTruncated(text: string): boolean {
  if (!/^[{[]/u.test(text)) return false
  let braces = 0
  let brackets = 0
  let quoted = false
  for (let index = 0; index < text.length; index++) {
    const character = text[index]
    if (character === '"' && text[index - 1] !== '\\') quoted = !quoted
    if (quoted) continue
    if (character === '{') braces++
    if (character === '}') braces--
    if (character === '[') brackets++
    if (character === ']') brackets--
  }
  return quoted || braces > 0 || brackets > 0 || ['{', '[', ':', ','].some((suffix) => text.endsWith(suffix))
}

function toStructuredGenerationError(error: unknown): StructuredGenerationError {
  if (error instanceof StructuredGenerationError) return error
  const message = error instanceof Error ? error.message : 'AI provider error'
  const lower = message.toLowerCase()
  const reason: StructuredGenerationFailureReason = lower.includes('timeout') || lower.includes('aborted')
    ? 'timeout'
    : lower.includes('network') || lower.includes('fetch')
      ? 'transport_error'
      : 'provider_error'
  return new StructuredGenerationError(reason, message)
}

function isRetryable(reason: StructuredGenerationFailureReason): boolean {
  return reason === 'timeout' || reason === 'transport_error' || reason === 'provider_error' || reason === 'output_truncated'
}
