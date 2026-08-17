import type { GameIntent } from '../../game-intent/GameIntent'

/** Input shared by deterministic and future AI world generators. */
export interface GameWorldGenerationRequest {
  readonly input: string
  readonly intent: GameIntent
}
