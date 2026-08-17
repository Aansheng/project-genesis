import type { PromptAssemblyDomainModel } from '../../observatory/domain'
import type { SemanticWorldGenerator } from '../SemanticWorldGenerator'
import { DefaultSemanticWorldGenerator } from '../DefaultSemanticWorldGenerator'
import type { GameWorldGenerationProvider } from './GameWorldGenerationProvider'
import type { GameWorldGenerationRequest } from './GameWorldGenerationRequest'

/** Async-compatible adapter around the existing deterministic generator. */
export class DeterministicGameWorldGenerationProvider implements GameWorldGenerationProvider {
  private readonly generator: SemanticWorldGenerator

  constructor(generator: SemanticWorldGenerator = new DefaultSemanticWorldGenerator()) {
    this.generator = generator
  }

  generate(request: GameWorldGenerationRequest) {
    const model = Object.freeze({
      overview: Object.freeze({
        title: request.input,
        traceCount: 0,
        timelineCount: 0,
        historyCount: 0,
      }),
    }) as unknown as PromptAssemblyDomainModel

    return Promise.resolve(this.generator.generate(model, request.intent))
  }
}
