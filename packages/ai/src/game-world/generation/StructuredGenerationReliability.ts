export type StructuredGenerationFailureReason =
  | 'transport_error'
  | 'timeout'
  | 'empty_response'
  | 'malformed_response'
  | 'output_truncated'
  | 'candidate_invalid'
  | 'provider_error'
  | 'unsupported_provider'

export interface StructuredGenerationReliabilityConfig {
  readonly maxOutputTokens: number
  readonly timeoutMs: number
  readonly maxAttempts: number
}

export interface StructuredGenerationRequestOptions {
  readonly maxOutputTokens: number
  readonly timeoutMs: number
}

export interface StructuredGenerationAttempt {
  readonly attempt: number
  readonly status: 'success' | 'failed'
  readonly failureReason?: StructuredGenerationFailureReason
}

export class StructuredGenerationError extends Error {
  constructor(
    readonly reason: StructuredGenerationFailureReason,
    message: string,
    readonly attempts: readonly StructuredGenerationAttempt[] = [],
  ) {
    super(message)
    this.name = 'StructuredGenerationError'
  }
}

export const DEFAULT_STRUCTURED_GENERATION_RELIABILITY: StructuredGenerationReliabilityConfig = Object.freeze({
  maxOutputTokens: 4000,
  timeoutMs: 30_000,
  maxAttempts: 2,
})
