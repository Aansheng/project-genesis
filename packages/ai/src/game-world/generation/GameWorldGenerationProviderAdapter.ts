import type { GameWorldModel } from '@genesis/shared'
import type { GameWorldGenerationCandidateProvider } from './GameWorldGenerationCandidateProvider'
import type { GameWorldGenerationProvider } from './GameWorldGenerationProvider'
import type { GameWorldGenerationRequest } from './GameWorldGenerationRequest'
import type { GameWorldValidator } from './GameWorldValidator'

/** Converts raw structured provider output into a validated semantic world. */
export class GameWorldGenerationProviderAdapter implements GameWorldGenerationProvider {
  constructor(
    private readonly candidateProvider: GameWorldGenerationCandidateProvider,
    private readonly validator: GameWorldValidator,
  ) {}

  async generate(request: GameWorldGenerationRequest): Promise<GameWorldModel> {
    const result = this.validator.validate(await this.candidateProvider.generate(request))
    if (!result.valid || result.world === undefined || result.specification === undefined) {
      throw new Error(`Invalid game world candidate: ${result.errors.join('; ')}`)
    }
    return result.world
  }
}
