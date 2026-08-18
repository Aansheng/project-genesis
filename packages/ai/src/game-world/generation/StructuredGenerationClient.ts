import type { GameWorldGenerationRequest } from './GameWorldGenerationRequest'
import type { GameDesignPrompt } from './GameDesignPromptBuilder'
import type { StructuredGenerationRequestOptions } from './StructuredGenerationReliability'

/** Minimal model boundary; implementations may use any structured-output vendor. */
export interface StructuredGenerationClient {
  getProviderMetadata?(): { readonly provider: string; readonly model?: string }
  generateStructured(request: GameWorldGenerationRequest, prompt?: GameDesignPrompt, options?: StructuredGenerationRequestOptions): Promise<unknown>
}
