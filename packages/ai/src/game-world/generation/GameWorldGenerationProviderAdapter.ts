import type { GameWorldModel } from '@genesis/shared'
import type { GameWorldGenerationCandidateProvider } from './GameWorldGenerationCandidateProvider'
import type { GameWorldGenerationProvider } from './GameWorldGenerationProvider'
import type { GameWorldGenerationRequest } from './GameWorldGenerationRequest'
import type { GameWorldValidator } from './GameWorldValidator'
import type { GameGenerationTrace } from './GameWorldGenerationDiagnostics'
import type { GameWorldGenerationResult } from './GameWorldGenerationDiagnostics'
import type { StructuredGenerationFailureReason } from './StructuredGenerationReliability'

let traceSequence = 0
const nextTraceId = (): string => `generation-${++traceSequence}`

export class InvalidGameWorldCandidateError extends Error {
  constructor(
    readonly candidate: unknown,
    readonly errors: readonly string[],
  ) {
    super(`Invalid game world candidate: ${errors.join('; ')}`)
    this.name = 'InvalidGameWorldCandidateError'
  }

  readonly reason: StructuredGenerationFailureReason = 'candidate_invalid'
}

/** Converts raw structured provider output into a validated semantic world. */
export class GameWorldGenerationProviderAdapter implements GameWorldGenerationProvider {
  constructor(
    private readonly candidateProvider: GameWorldGenerationCandidateProvider,
    private readonly validator: GameWorldValidator,
  ) {}

  async generate(request: GameWorldGenerationRequest): Promise<GameWorldModel> {
    return (await this.generateWithDiagnostics(request)).world
  }

  async generateWithDiagnostics(request: GameWorldGenerationRequest): Promise<GameWorldGenerationResult> {
    const candidate = await this.candidateProvider.generate(request)
    const result = this.validator.validate(candidate)
    if (!result.valid || result.world === undefined || result.specification === undefined) {
      throw new InvalidGameWorldCandidateError(candidate, result.errors)
    }
    const trace: GameGenerationTrace = Object.freeze({
      id: nextTraceId(),
      source: 'ai',
      status: 'success',
      ...(this.candidateProvider.getProviderMetadata?.() ?? {}),
      stages: Object.freeze([
        { name: 'REQUEST' as const, status: 'success' as const },
        { name: 'PROMPT_ASSEMBLY' as const, status: 'success' as const },
        { name: 'MODEL_GENERATION' as const, status: 'success' as const },
        { name: 'CANDIDATE_PARSE' as const, status: 'success' as const },
        { name: 'VALIDATION' as const, status: 'success' as const },
        { name: 'DESIGN_SPECIFICATION' as const, status: 'success' as const },
        { name: 'WORLD_COMPILATION' as const, status: 'success' as const },
        { name: 'RUNTIME_INJECTION' as const, status: 'pending' as const },
      ]),
      ...(this.candidateProvider.getGenerationAttempts ? { attempts: this.candidateProvider.getGenerationAttempts() } : {}),
    })
    return Object.freeze({
      world: result.world,
      diagnostics: Object.freeze({
        source: 'ai' as const,
        candidate,
        validationStatus: 'valid' as const,
        validationErrors: Object.freeze([]),
        specification: result.specification,
        worldEntityIds: Object.freeze(result.world.entities.map(entity => entity.id)),
        trace,
      }),
    })
  }
}
