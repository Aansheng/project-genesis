import type { GameWorldModel } from '@genesis/shared'
import type { GameWorldGenerationCandidateProvider } from './GameWorldGenerationCandidateProvider'
import type { GameWorldGenerationProvider } from './GameWorldGenerationProvider'
import type { GameWorldGenerationRequest } from './GameWorldGenerationRequest'
import type { GameWorldValidator } from './GameWorldValidator'
import type { GameWorldGenerationResult } from './GameWorldGenerationDiagnostics'

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
      throw new Error(`Invalid game world candidate: ${result.errors.join('; ')}`)
    }
    return Object.freeze({
      world: result.world,
      diagnostics: Object.freeze({
        source: 'ai' as const,
        candidate,
        validationStatus: 'valid' as const,
        validationErrors: Object.freeze([]),
        specification: result.specification,
        worldEntityIds: Object.freeze(result.world.entities.map(entity => entity.id)),
      }),
    })
  }
}
