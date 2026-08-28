import type { Entity, World } from '@genesis/shared'
import {
  createPositionComponent,
  isPositionComponent,
  isVelocityComponent,
} from '@genesis/shared'
import type { RuntimeSystem } from '../system'

function updateEntity(entity: Entity): Entity {
  const position = entity.components?.find(isPositionComponent)
  const velocity = entity.components?.find(isVelocityComponent)
  if (!position || !velocity) return entity

  const nextX = position.properties.x + velocity.properties.x
  const nextY = position.properties.y + velocity.properties.y
  if (!Number.isFinite(nextX) || !Number.isFinite(nextY)) return entity
  if (nextX === position.properties.x && nextY === position.properties.y) return entity

  const components = Object.freeze(entity.components!.map((component) =>
    isPositionComponent(component) ? createPositionComponent(nextX, nextY) : component,
  ))
  return Object.freeze({
    ...entity,
    x: nextX,
    y: nextY,
    components,
  }) as unknown as Entity
}

/** Integrates Runtime VelocityComponent into PositionComponent for any entity. */
export class DefaultVelocityMotionSystem implements RuntimeSystem {
  readonly name = 'VelocityMotionSystem'

  update(world: World): World {
    const entities = world.entities.map(updateEntity)
    return Object.freeze({ entities: Object.freeze(entities) }) as unknown as World
  }
}
