import type { GameWorldGenerationRequest } from './GameWorldGenerationRequest'
import type { GameDesignPrompt } from './GameDesignPromptBuilder'
import type { StructuredGenerationRequestOptions } from './StructuredGenerationReliability'
import type { WorldEvolutionStructuredGenerationRequest } from '../../world-evolution/WorldEvolutionStructuredGenerationRequest'
import type { GameplayGenerationRequest } from '../../gameplay/GameplayGenerationRequest'

export type StructuredGenerationRequest = GameWorldGenerationRequest | WorldEvolutionStructuredGenerationRequest | GameplayGenerationRequest

/** Minimal model boundary; implementations may use any structured-output vendor. */
export interface StructuredGenerationClient {
  getProviderMetadata?(): { readonly provider: string; readonly model?: string }
  generateStructured(request: StructuredGenerationRequest, prompt?: GameDesignPrompt, options?: StructuredGenerationRequestOptions): Promise<unknown>
}
