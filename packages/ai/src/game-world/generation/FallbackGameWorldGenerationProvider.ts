import type { GameWorldModel } from '@genesis/shared'
import type { GameWorldGenerationProvider } from './GameWorldGenerationProvider'
import type { GameWorldGenerationRequest } from './GameWorldGenerationRequest'
import type { GameWorldGenerationResult } from './GameWorldGenerationDiagnostics'

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
        }),
      })
    }
  }
}
