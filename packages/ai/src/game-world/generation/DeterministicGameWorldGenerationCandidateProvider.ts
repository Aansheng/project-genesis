import type { PromptAssemblyDomainModel } from '../../observatory/domain'
import type { SemanticWorldGenerator } from '../SemanticWorldGenerator'
import { DefaultSemanticWorldGenerator } from '../DefaultSemanticWorldGenerator'
import type { GameWorldGenerationCandidateProvider } from './GameWorldGenerationCandidateProvider'
import type { GameWorldGenerationRequest } from './GameWorldGenerationRequest'

/** Deterministic candidate source used until a real provider is introduced. */
export class DeterministicGameWorldGenerationCandidateProvider implements GameWorldGenerationCandidateProvider {
  constructor(private readonly generator: SemanticWorldGenerator = new DefaultSemanticWorldGenerator()) {}

  async generate(request: GameWorldGenerationRequest) {
    const model = Object.freeze({
      overview: Object.freeze({ title: request.input, traceCount: 0, timelineCount: 0, historyCount: 0 }),
    }) as unknown as PromptAssemblyDomainModel
    return this.generator.generate(model, request.intent)
  }
}
