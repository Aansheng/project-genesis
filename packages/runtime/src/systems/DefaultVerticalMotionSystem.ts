import type { Entity, World } from '@genesis/shared'
import {
  createPositionComponent,
  isPositionComponent,
  isVelocityComponent,
} from '@genesis/shared'
import type { VerticalMotionSystem } from './VerticalMotionSystem'

/** Applies the current vertical velocity, then preserves that velocity. */
export class DefaultVerticalMotionSystem implements VerticalMotionSystem {
  readonly name = 'VerticalMotionSystem'

  update(world: World): World {
    const entities = world.entities.map((entity) => {
      if (entity.type !== 'player' || !entity.components) return entity
      const position = entity.components.find(isPositionComponent)
      const velocity = entity.components.find(isVelocityComponent)
      if (!position || !velocity) return entity

      const x = position.properties.x + velocity.properties.x
      const y = position.properties.y + velocity.properties.y
      const components = Object.freeze(entity.components.map((component) =>
        isPositionComponent(component) ? createPositionComponent(x, y) : component,
      ))
      return Object.freeze({
        ...entity,
        x,
        y,
        components,
      }) as unknown as Entity
    })

    return Object.freeze({ entities: Object.freeze(entities) }) as unknown as World
  }
}
