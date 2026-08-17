import type { EntityCategory, GameDifficulty, GameObjective, GameTheme, WorldType } from '@genesis/shared'
import type { GameGenre } from '../../game-intent/GameIntent'

/** Serializable semantic output accepted from an AI world provider. */
export interface GameWorldGenerationCandidateEntity {
  readonly id: string
  readonly category: EntityCategory
  readonly name: string
  readonly role?: string
}

/** Candidate deliberately stops at the semantic world boundary. */
export interface GameWorldGenerationCandidate {
  /** Legacy field retained for providers from S12-002; genre is preferred. */
  readonly worldType?: WorldType
  readonly title?: string
  readonly genre?: GameGenre
  readonly theme?: GameTheme
  readonly difficulty?: GameDifficulty
  readonly objectives?: readonly GameObjective[]
  readonly entities: readonly GameWorldGenerationCandidateEntity[]
}
