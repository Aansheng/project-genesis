import type { Entity, World } from '@genesis/shared'
import {
  createVelocityComponent,
  isPositionComponent,
  isTargetDirectedMovementComponent,
  isVelocityComponent,
} from '@genesis/shared'
import type { RuntimeSystem } from '../system'

interface Position {
  readonly x: number
  readonly y: number
}

function positionOf(entity: Entity | undefined): Position | undefined {
  const component = entity?.components?.find(isPositionComponent)
  if (!component) return undefined
  const { x, y } = component.properties
  return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : undefined
}

function velocityOf(entity: Entity): { readonly x: number; readonly y: number } | undefined {
  const component = entity.components?.find(isVelocityComponent)
  if (!component) return undefined
  const { x, y } = component.properties
  return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : undefined
}

function withVelocity(entity: Entity, x: number, y: number): Entity {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return entity

  const current = velocityOf(entity)
  if (current?.x === x && current.y === y) return entity
  if (current === undefined && x === 0 && y === 0) return entity

  const components = [...(entity.components ?? [])]
  const velocityIndex = components.findIndex(isVelocityComponent)
  const nextVelocity = createVelocityComponent(x, y)
  if (velocityIndex >= 0) {
    components[velocityIndex] = nextVelocity
  } else {
    components.push(nextVelocity)
  }

  return Object.freeze({
    ...entity,
    components: Object.freeze(components),
  }) as unknown as Entity
}

function freezeCopy(world: World): World {
  return Object.freeze({
    entities: Object.freeze([...world.entities]),
  }) as unknown as World
}

/**
 * Computes deterministic direct movement toward each entity's Runtime target.
 *
 * This system only resolves declarative target identity and writes
 * VelocityComponent. Position integration remains the responsibility of
 * DefaultVelocityMotionSystem, so Runtime has one movement authority.
 */
export class DefaultTargetDirectedMovementSystem implements RuntimeSystem {
  readonly name = 'TargetDirectedMovementSystem'

  update(world: World): World {
    let changed = false
    const entities = world.entities.map((entity) => {
      const movement = entity.components?.find(isTargetDirectedMovementComponent)
      if (!movement) return entity

      const sourcePosition = positionOf(entity)
      const targetEntityId = typeof movement.properties.targetEntityId === 'string'
        ? movement.properties.targetEntityId
        : ''
      const speed = movement.properties.speed
      const targetPosition = targetEntityId
        ? positionOf(world.entities.find(candidate => candidate.id === targetEntityId))
        : undefined

      let x = 0
      let y = 0
      if (sourcePosition && targetPosition && Number.isFinite(speed) && speed > 0) {
        const dx = targetPosition.x - sourcePosition.x
        const dy = targetPosition.y - sourcePosition.y
        const distance = Math.hypot(dx, dy)
        if (Number.isFinite(distance) && distance > 0) {
          const step = Math.min(speed, distance)
          x = (dx / distance) * step
          y = (dy / distance) * step
        }
      }

      const updated = withVelocity(entity, x, y)
      changed = changed || updated !== entity
      return updated
    })

    return changed
      ? Object.freeze({ entities: Object.freeze(entities) }) as unknown as World
      : freezeCopy(world)
  }
}
