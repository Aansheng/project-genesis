import type { SemanticWorldGenerator } from '../SemanticWorldGenerator'
import { DefaultSemanticWorldGenerator } from '../DefaultSemanticWorldGenerator'
import type { GameWorldGenerationProvider } from './GameWorldGenerationProvider'
import type { GameWorldGenerationRequest } from './GameWorldGenerationRequest'
import { DefaultGameWorldValidator } from './DefaultGameWorldValidator'
import { GameWorldGenerationProviderAdapter } from './GameWorldGenerationProviderAdapter'
import { DeterministicGameWorldGenerationCandidateProvider } from './DeterministicGameWorldGenerationCandidateProvider'

/** Async-compatible adapter around the existing deterministic generator. */
export class DeterministicGameWorldGenerationProvider implements GameWorldGenerationProvider {
  private readonly adapter: GameWorldGenerationProviderAdapter

  constructor(generator: SemanticWorldGenerator = new DefaultSemanticWorldGenerator()) {
    this.adapter = new GameWorldGenerationProviderAdapter(
      new DeterministicGameWorldGenerationCandidateProvider(generator),
      new DefaultGameWorldValidator(),
    )
  }

  generate(request: GameWorldGenerationRequest) {
    return this.adapter.generate(request)
  }
}
