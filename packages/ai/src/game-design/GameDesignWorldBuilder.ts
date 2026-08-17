import type { GameDesignSpecification, GameWorldModel } from '@genesis/shared'

export interface GameDesignWorldBuilder {
  build(specification: GameDesignSpecification): GameWorldModel
}

export class DefaultGameDesignWorldBuilder implements GameDesignWorldBuilder {
  build(specification: GameDesignSpecification): GameWorldModel {
    return Object.freeze({
      worldType: specification.genre,
      // Unsupported design semantics stay above GameWorldModel for now.
      entities: Object.freeze(specification.entities.map(({ id, category, name }) =>
        Object.freeze({ id, category, name }),
      )),
    })
  }
}
