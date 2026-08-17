import type { GameWorldGenerationRequest } from './GameWorldGenerationRequest'
import type { GameDesignPrompt } from './GameDesignPromptBuilder'

/** Minimal model boundary; implementations may use any structured-output vendor. */
export interface StructuredGenerationClient {
  generateStructured(request: GameWorldGenerationRequest, prompt?: GameDesignPrompt): Promise<unknown>
}
