import type { GameplayGenerationContext } from '@genesis/shared'

/** Transport discriminator for gameplay generation over the existing gateway. */
export interface GameplayGenerationRequest {
  readonly kind: 'gameplay-generation'
  readonly input: string
  readonly context: GameplayGenerationContext
}
