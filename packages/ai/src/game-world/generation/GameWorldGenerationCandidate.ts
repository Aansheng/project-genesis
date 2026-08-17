import type { EntityCategory, WorldType } from '@genesis/shared'

/** Serializable semantic output accepted from an AI world provider. */
export interface GameWorldGenerationCandidateEntity {
  readonly id: string
  readonly category: EntityCategory
  readonly name: string
}

/** Candidate deliberately stops at the semantic world boundary. */
export interface GameWorldGenerationCandidate {
  readonly worldType: WorldType
  readonly entities: readonly GameWorldGenerationCandidateEntity[]
}
