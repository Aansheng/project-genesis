import type { EntityCategory, WorldType } from '../game-world'

export type GameDifficulty = 'easy' | 'medium' | 'hard'

export interface GameTheme {
  readonly name: string
}

export type GameObjectiveType = 'reach-goal' | 'defeat-boss' | 'collect-item' | 'survive'

export interface GameObjective {
  readonly type: GameObjectiveType
  readonly target?: string
}

export interface GameDesignEntity {
  readonly id: string
  readonly category: EntityCategory
  readonly name: string
  readonly role?: string
}

/** Vendor-independent semantic description of what kind of game should exist. */
export interface GameDesignSpecification {
  readonly title: string
  readonly genre: WorldType
  readonly theme?: GameTheme
  readonly difficulty?: GameDifficulty
  readonly objectives: readonly GameObjective[]
  readonly entities: readonly GameDesignEntity[]
}
