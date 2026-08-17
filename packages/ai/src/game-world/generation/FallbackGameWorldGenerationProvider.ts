import type { GameWorldModel } from '@genesis/shared'
import type { GameWorldGenerationProvider } from './GameWorldGenerationProvider'
import type { GameWorldGenerationRequest } from './GameWorldGenerationRequest'

/** Uses the deterministic provider whenever the LLM path cannot produce a valid world. */
export class FallbackGameWorldGenerationProvider implements GameWorldGenerationProvider {
  constructor(
    private readonly primary: GameWorldGenerationProvider,
    private readonly fallback: GameWorldGenerationProvider,
  ) {}

  async generate(request: GameWorldGenerationRequest): Promise<GameWorldModel> {
    try {
      return await this.primary.generate(request)
    } catch {
      return this.fallback.generate(request)
    }
  }
}
