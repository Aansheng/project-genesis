import type { WorldEvolutionRequest } from '@genesis/shared'

/** Transport discriminator for the existing selectable structured-generation client. */
export interface WorldEvolutionStructuredGenerationRequest extends WorldEvolutionRequest {
  readonly kind: 'world-evolution'
}
