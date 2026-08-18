import type { GameWorldModel } from '@genesis/shared'
import type { GameWorldGenerationProvider } from './GameWorldGenerationProvider'
import type { GameWorldGenerationRequest } from './GameWorldGenerationRequest'
import type { GameWorldGenerationResult } from './GameWorldGenerationDiagnostics'
import type { GameGenerationTraceStage } from './GameWorldGenerationDiagnostics'
import { InvalidGameWorldCandidateError } from './GameWorldGenerationProviderAdapter'
import { StructuredGenerationError, type StructuredGenerationFailureReason } from './StructuredGenerationReliability'

let traceSequence = 0

/** Uses the deterministic provider whenever the LLM path cannot produce a valid world. */
export class FallbackGameWorldGenerationProvider implements GameWorldGenerationProvider {
  constructor(
    private readonly primary: GameWorldGenerationProvider,
    private readonly fallback: GameWorldGenerationProvider,
  ) {}

  async generate(request: GameWorldGenerationRequest): Promise<GameWorldModel> {
    return (await this.generateWithDiagnostics(request)).world
  }

  async generateWithDiagnostics(request: GameWorldGenerationRequest): Promise<GameWorldGenerationResult> {
    try {
      if (this.primary.generateWithDiagnostics) return await this.primary.generateWithDiagnostics(request)
      const world = await this.primary.generate(request)
      return { world, diagnostics: { source: 'ai', validationStatus: 'valid', validationErrors: [], worldEntityIds: world.entities.map(entity => entity.id) } }
    } catch (error) {
      const fallback = this.fallback.generateWithDiagnostics
        ? await this.fallback.generateWithDiagnostics(request)
        : { world: await this.fallback.generate(request), diagnostics: undefined }
      const diagnostics = fallback.diagnostics ?? {
        source: 'deterministic' as const,
        validationStatus: 'valid' as const,
        validationErrors: Object.freeze([]),
        worldEntityIds: Object.freeze(fallback.world.entities.map(entity => entity.id)),
      }
      return Object.freeze({
        world: fallback.world,
        diagnostics: Object.freeze({
          ...diagnostics,
          source: 'deterministic' as const,
          validationStatus: 'invalid' as const,
          validationErrors: Object.freeze([error instanceof Error ? error.message : 'AI generation failed']),
          fallbackReason: error instanceof Error ? error.message : 'AI generation failed',
          failureReason: failureReason(error),
          ...(error instanceof InvalidGameWorldCandidateError ? { candidate: error.candidate } : {}),
          trace: Object.freeze({
            id: `generation-fallback-${++traceSequence}`,
            source: 'deterministic' as const,
            status: 'fallback' as const,
            ...(this.primary.getProviderMetadata?.() ?? {}),
            stages: Object.freeze(fallbackStages(error, fallback.diagnostics)),
            ...(error instanceof StructuredGenerationError ? { failureReason: error.reason } : {}),
            ...(error instanceof StructuredGenerationError ? { attempts: error.attempts } : {}),
          }),
        }),
      })
    }
  }
}

function failureReason(error: unknown): StructuredGenerationFailureReason {
  if (error instanceof InvalidGameWorldCandidateError) return error.reason
  if (error instanceof StructuredGenerationError) return error.reason
  return 'provider_error'
}

function fallbackStages(error: unknown, diagnostics: GameWorldGenerationResult['diagnostics'] | undefined): readonly GameGenerationTraceStage[] {
  const invalid = error instanceof InvalidGameWorldCandidateError
  const message = error instanceof Error ? error.message : 'AI generation failed'
  const parseFailed = error instanceof StructuredGenerationError && (
    error.reason === 'empty_response' || error.reason === 'malformed_response' || error.reason === 'output_truncated'
  )
  const modelFailed = !invalid && !parseFailed
  return [
    { name: 'REQUEST' as const, status: 'success' as const },
    { name: 'PROMPT_ASSEMBLY' as const, status: 'success' as const },
    { name: 'MODEL_GENERATION' as const, status: modelFailed ? 'failed' as const : 'success' as const, ...(modelFailed ? { error: message } : {}) },
    { name: 'CANDIDATE_PARSE' as const, status: invalid ? 'success' as const : modelFailed ? 'not-applicable' as const : 'failed' as const, ...(!invalid && !modelFailed ? { error: message } : {}) },
    { name: 'VALIDATION' as const, status: invalid ? 'failed' as const : 'not-applicable' as const, ...(invalid ? { error: error.errors.join('; ') } : {}) },
    { name: 'DESIGN_SPECIFICATION' as const, status: diagnostics?.specification ? 'success' as const : 'not-applicable' as const },
    { name: 'WORLD_COMPILATION' as const, status: 'success' as const },
    { name: 'RUNTIME_INJECTION' as const, status: 'pending' as const },
  ]
}
