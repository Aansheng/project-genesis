import type { GameWorldGenerationRequest } from './GameWorldGenerationRequest'

/** Minimal model boundary; implementations may use any structured-output vendor. */
export interface StructuredGenerationClient {
  generateStructured(request: GameWorldGenerationRequest): Promise<unknown>
}
