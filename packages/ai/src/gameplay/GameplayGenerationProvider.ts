import type { GameplayRuleSet, GameplaySpecification } from '@genesis/shared'
import type { GameplayGenerationRequest } from './GameplayGenerationRequest'
import type { GameplaySpecificationBuilder } from './GameplaySpecificationBuilder'
import type { GameplaySpecificationValidator } from './GameplaySpecificationValidator'
import type { GameplayRuleBuilder } from './GameplayRuleBuilder'
import type { GameplayRuleValidator } from './GameplayRuleValidator'
import type { StructuredGenerationAttempt, StructuredGenerationClient, StructuredGenerationFailureReason, StructuredGenerationRequestOptions } from '../game-world/generation'
import { DefaultGameplayPromptBuilder, type GameplayPromptBuilder } from './GameplayPromptBuilder'
import { StructuredGenerationError } from '../game-world/generation/StructuredGenerationReliability'
import { DefaultGameplayRuleBuilder } from './GameplayRuleBuilder'
import { DefaultGameplayRuleValidator } from './GameplayRuleValidator'

export interface GameplayGenerationDiagnostics {
  readonly source: 'ai' | 'deterministic'
  readonly candidate?: unknown
  readonly validationStatus: 'valid' | 'invalid'
  readonly validationErrors: readonly string[]
  readonly validationWarnings?: readonly string[]
  readonly specification?: GameplaySpecification
  readonly fallbackReason?: string
  readonly failureReason?: StructuredGenerationFailureReason
  readonly provider?: string
  readonly model?: string
}

export interface GameplayGenerationResult {
  readonly specification: GameplaySpecification
  readonly ruleSet?: GameplayRuleSet
  readonly diagnostics: GameplayGenerationDiagnostics
}

export interface GameplayGenerationProvider {
  getProviderMetadata?(): { readonly provider: string; readonly model?: string } | undefined
  generate(request: GameplayGenerationRequest): Promise<GameplaySpecification>
  generateWithDiagnostics?(request: GameplayGenerationRequest): Promise<GameplayGenerationResult>
}

export interface GameplayGenerationCandidateProvider {
  getProviderMetadata?(): { readonly provider: string; readonly model?: string } | undefined
  getGenerationAttempts?(): readonly StructuredGenerationAttempt[]
  generate(request: GameplayGenerationRequest): Promise<unknown>
}

export class LLMGameplayGenerationCandidateProvider implements GameplayGenerationCandidateProvider {
  constructor(
    private readonly client: StructuredGenerationClient,
    private readonly promptBuilder: GameplayPromptBuilder = new DefaultGameplayPromptBuilder(),
    private readonly reliability: StructuredGenerationRequestOptions & { readonly maxAttempts?: number } = { maxOutputTokens: 4000, timeoutMs: 30_000, maxAttempts: 2 },
  ) {}

  private attempts: StructuredGenerationAttempt[] = []

  getProviderMetadata(): { readonly provider: string; readonly model?: string } | undefined {
    return this.client.getProviderMetadata?.()
  }

  getGenerationAttempts(): readonly StructuredGenerationAttempt[] {
    return Object.freeze([...this.attempts])
  }

  async generate(request: GameplayGenerationRequest): Promise<unknown> {
    this.attempts = []
    const prompt = this.promptBuilder.build(request)
    const maxAttempts = Math.max(1, Math.min(2, Math.trunc(this.reliability.maxAttempts ?? 2)))
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
    throw new StructuredGenerationError('provider_error', 'Gameplay structured generation failed', this.getGenerationAttempts())
  }
}

export class GameplayGenerationProviderAdapter implements GameplayGenerationProvider {
  constructor(
    private readonly candidateProvider: GameplayGenerationCandidateProvider,
    private readonly validator: GameplaySpecificationValidator,
    private readonly builder: GameplaySpecificationBuilder,
    private readonly ruleValidator: GameplayRuleValidator = new DefaultGameplayRuleValidator(),
    private readonly ruleBuilder: GameplayRuleBuilder = new DefaultGameplayRuleBuilder(),
  ) {}

  async generate(request: GameplayGenerationRequest): Promise<GameplaySpecification> {
    return (await this.generateWithDiagnostics(request)).specification
  }

  async generateWithDiagnostics(request: GameplayGenerationRequest): Promise<GameplayGenerationResult> {
    const candidate = await this.candidateProvider.generate(request)
    const result = this.validator.validate(candidate, {
      semanticWorld: {
        worldType: request.context.game.worldType,
        entities: request.context.semanticWorld.entities,
      },
      capabilities: request.context.capabilities,
    })
    if (!result.valid || !result.candidate) {
      throw new InvalidGameplaySpecificationCandidateError(candidate, result.errors)
    }
    const rawRules = isRecord(candidate) && candidate.rules !== undefined ? candidate.rules : undefined
    const ruleResult = this.ruleValidator.validate(rawRules, {
      semanticWorld: {
        worldType: request.context.game.worldType,
        entities: request.context.semanticWorld.entities,
      },
      capabilities: request.context.capabilities,
      gameplaySpecification: {
        mechanics: result.candidate.mechanics,
        ...(result.candidate.goals ? { goals: result.candidate.goals.map(goal => ({ id: goal.id })) } : {}),
      },
    })
    if (!ruleResult.valid || !ruleResult.candidate) {
      throw new InvalidGameplaySpecificationCandidateError(candidate, [...result.errors, ...ruleResult.errors])
    }
    const specification = this.builder.build({
      semanticWorld: {
        worldType: request.context.game.worldType,
        entities: request.context.semanticWorld.entities,
      },
      candidate: result.candidate,
      capabilities: request.context.capabilities,
      gameplayRevision: (request.context.gameplayRevision ?? 0) + 1,
      metadata: Object.freeze({
        source: 'ai' as const,
        warnings: result.warnings,
        ...(request.context.architectureVersion ? { architectureVersion: request.context.architectureVersion } : {}),
      }),
    })
    const ruleSet = this.ruleBuilder.build({
      semanticWorld: {
        worldType: request.context.game.worldType,
        entities: request.context.semanticWorld.entities,
      },
      gameplaySpecification: specification,
      capabilities: request.context.capabilities,
      ...(rawRules !== undefined ? { candidate: ruleResult.candidate } : {}),
      metadata: Object.freeze({
        source: 'ai' as const,
        warnings: Object.freeze([...result.warnings, ...ruleResult.warnings]),
        ...(request.context.architectureVersion ? { architectureVersion: request.context.architectureVersion } : {}),
      }),
    })
    return Object.freeze({
      specification,
      ruleSet,
      diagnostics: Object.freeze({
        source: 'ai' as const,
        candidate,
        validationStatus: 'valid' as const,
        validationErrors: Object.freeze([]),
        validationWarnings: Object.freeze([...result.warnings, ...ruleResult.warnings]),
        specification,
        ...(this.candidateProvider.getProviderMetadata?.() ?? {}),
      }),
    })
  }
}

export class InvalidGameplaySpecificationCandidateError extends Error {
  constructor(readonly candidate: unknown, readonly errors: readonly string[]) {
    super(`Invalid gameplay specification candidate: ${errors.join('; ')}`)
    this.name = 'InvalidGameplaySpecificationCandidateError'
  }

  readonly reason: StructuredGenerationFailureReason = 'candidate_invalid'
}

export class DeterministicGameplayGenerationProvider implements GameplayGenerationProvider {
  constructor(
    private readonly builder: GameplaySpecificationBuilder,
    private readonly ruleBuilder: GameplayRuleBuilder = new DefaultGameplayRuleBuilder(),
  ) {}

  async generate(request: GameplayGenerationRequest): Promise<GameplaySpecification> {
    return this.build(request)
  }

  async generateWithDiagnostics(request: GameplayGenerationRequest): Promise<GameplayGenerationResult> {
    const specification = this.build(request)
    const ruleSet = this.ruleBuilder.build({
      semanticWorld: {
        worldType: request.context.game.worldType,
        entities: request.context.semanticWorld.entities,
      },
      gameplaySpecification: specification,
      capabilities: request.context.capabilities,
      metadata: Object.freeze({
        source: 'deterministic' as const,
        ...(request.context.architectureVersion ? { architectureVersion: request.context.architectureVersion } : {}),
      }),
    })
    return Object.freeze({
      specification,
      ruleSet,
      diagnostics: Object.freeze({
        source: 'deterministic',
        validationStatus: 'valid',
        validationErrors: Object.freeze([]),
        specification,
      }),
    })
  }

  private build(request: GameplayGenerationRequest): GameplaySpecification {
    return this.builder.build({
      semanticWorld: {
        worldType: request.context.game.worldType,
        entities: request.context.semanticWorld.entities,
      },
      capabilities: request.context.capabilities,
      gameplayRevision: (request.context.gameplayRevision ?? 0) + 1,
      metadata: Object.freeze({
        source: 'deterministic',
        ...(request.context.architectureVersion ? { architectureVersion: request.context.architectureVersion } : {}),
      }),
    })
  }
}

export class FallbackGameplayGenerationProvider implements GameplayGenerationProvider {
  constructor(
    private readonly primary: GameplayGenerationProvider,
    private readonly fallback: GameplayGenerationProvider,
  ) {}

  async generate(request: GameplayGenerationRequest): Promise<GameplaySpecification> {
    return (await this.generateWithDiagnostics(request)).specification
  }

  async generateWithDiagnostics(request: GameplayGenerationRequest): Promise<GameplayGenerationResult> {
    try {
      if (this.primary.generateWithDiagnostics) return await this.primary.generateWithDiagnostics(request)
      const specification = await this.primary.generate(request)
      return { specification, diagnostics: { source: 'ai', validationStatus: 'valid', validationErrors: [], specification } }
    } catch (error) {
      const result = this.fallback.generateWithDiagnostics
        ? await this.fallback.generateWithDiagnostics(request)
        : { specification: await this.fallback.generate(request), diagnostics: undefined }
      const message = error instanceof Error ? error.message : 'Gameplay generation failed'
      return Object.freeze({
        specification: result.specification,
        ...('ruleSet' in result && result.ruleSet ? { ruleSet: result.ruleSet } : {}),
        diagnostics: Object.freeze({
          ...(result.diagnostics ?? { source: 'deterministic' as const, validationStatus: 'valid' as const, validationErrors: [] }),
          source: 'deterministic' as const,
          validationStatus: 'invalid' as const,
          validationErrors: Object.freeze([message]),
          fallbackReason: message,
          failureReason: failureReason(error),
          ...(error instanceof InvalidGameplaySpecificationCandidateError ? { candidate: error.candidate } : {}),
        }),
      })
    }
  }
}

function parseResponse(response: unknown): unknown {
  if (typeof response !== 'string') return response
  const text = response.trim()
  if (!text) throw new StructuredGenerationError('empty_response', 'Empty gameplay generation response')
  try {
    return JSON.parse(text) as unknown
  } catch {
    throw new StructuredGenerationError('malformed_response', 'Gameplay candidate parse failed: invalid structured JSON')
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function toStructuredGenerationError(error: unknown): StructuredGenerationError {
  if (error instanceof StructuredGenerationError) return error
  const message = error instanceof Error ? error.message : 'Gameplay AI provider error'
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

function failureReason(error: unknown): StructuredGenerationFailureReason {
  if (error instanceof InvalidGameplaySpecificationCandidateError) return error.reason
  if (error instanceof StructuredGenerationError) return error.reason
  return 'provider_error'
}
