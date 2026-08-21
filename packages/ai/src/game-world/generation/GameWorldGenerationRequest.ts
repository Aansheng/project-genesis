import type { GameIntent } from '../../game-intent/GameIntent'
import type { GameDesignGenerationContext } from '@genesis/shared'

/** Input shared by deterministic and future AI world generators. */
export interface GameWorldGenerationRequest {
  readonly input: string
  readonly intent: GameIntent
  /** Optional immutable capability snapshot for prompt/provider assembly. */
  readonly generationContext?: GameDesignGenerationContext
}
