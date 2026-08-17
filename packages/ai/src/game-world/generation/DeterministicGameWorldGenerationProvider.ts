import type { SemanticWorldGenerator } from '../SemanticWorldGenerator'
import { DefaultSemanticWorldGenerator } from '../DefaultSemanticWorldGenerator'
import type { GameWorldGenerationProvider } from './GameWorldGenerationProvider'
import type { GameWorldGenerationRequest } from './GameWorldGenerationRequest'
import { DefaultGameWorldValidator } from './DefaultGameWorldValidator'
import { GameWorldGenerationProviderAdapter } from './GameWorldGenerationProviderAdapter'
import { DeterministicGameWorldGenerationCandidateProvider } from './DeterministicGameWorldGenerationCandidateProvider'
import type { GameWorldGenerationResult } from './GameWorldGenerationDiagnostics'

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

  async generateWithDiagnostics(request: GameWorldGenerationRequest): Promise<GameWorldGenerationResult> {
    const result = await this.adapter.generateWithDiagnostics(request)
    return Object.freeze({
      world: result.world,
      diagnostics: Object.freeze({
        ...result.diagnostics,
        source: 'deterministic' as const,
        trace: result.diagnostics.trace
          ? Object.freeze({ ...result.diagnostics.trace, source: 'deterministic' as const })
          : undefined,
      }),
    })
  }
}
