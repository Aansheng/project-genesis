import type { GameplayContactDirection, GameplayEventSink, World, Entity } from '@genesis/shared'
import {
  isCollisionBoundsComponent,
  isPositionComponent,
} from '@genesis/shared'
import type { RuntimeSystem } from '../system'

interface Bounds {
  readonly left: number
  readonly right: number
  readonly top: number
  readonly bottom: number
}

function boundsOf(entity: Entity): Bounds | undefined {
  const position = entity.components?.find(isPositionComponent)
  const collider = entity.components?.find(isCollisionBoundsComponent)
  if (!position || !collider) return undefined

  const { width, height, offsetX, offsetY } = collider.properties
  if (![width, height, offsetX, offsetY].every(Number.isFinite) || width <= 0 || height <= 0) {
    return undefined
  }

  const x = position.properties.x + offsetX
  const y = position.properties.y + offsetY
  return {
    left: x - width / 2,
    right: x + width / 2,
    top: y - height / 2,
    bottom: y + height / 2,
  }
}

function overlaps(first: Bounds, second: Bounds): boolean {
  return first.left < second.right
    && first.right > second.left
    && first.top < second.bottom
    && first.bottom > second.top
}

function crossedDirection(
  previousActor: Bounds | undefined,
  previousTarget: Bounds | undefined,
  actor: Bounds,
  target: Bounds,
): GameplayContactDirection | undefined {
  if (!previousActor || !previousTarget) return undefined

  if (previousActor.bottom <= previousTarget.top && actor.bottom > target.top) return 'top'
  if (previousActor.top >= previousTarget.bottom && actor.top < target.bottom) return 'bottom'
  if (previousActor.right <= previousTarget.left && actor.right > target.left) return 'left'
  if (previousActor.left >= previousTarget.right && actor.left < target.right) return 'right'
  return undefined
}

function overlapDirection(actor: Bounds, target: Bounds): GameplayContactDirection {
  const horizontalPenetration = Math.min(actor.right, target.right) - Math.max(actor.left, target.left)
  const verticalPenetration = Math.min(actor.bottom, target.bottom) - Math.max(actor.top, target.top)
  const actorCenterX = (actor.left + actor.right) / 2
  const targetCenterX = (target.left + target.right) / 2
  const actorCenterY = (actor.top + actor.bottom) / 2
  const targetCenterY = (target.top + target.bottom) / 2

  if (verticalPenetration <= horizontalPenetration) return actorCenterY <= targetCenterY ? 'top' : 'bottom'
  return actorCenterX <= targetCenterX ? 'left' : 'right'
}

function contactDirection(
  previousActor: Bounds | undefined,
  previousTarget: Bounds | undefined,
  actor: Bounds,
  target: Bounds,
): GameplayContactDirection {
  return crossedDirection(previousActor, previousTarget, actor, target)
    ?? overlapDirection(actor, target)
}

function actorAndTarget(first: Entity, second: Entity): readonly [Entity, Entity] {
  if (first.type === 'player') return [first, second]
  if (second.type === 'player') return [second, first]
  return [first, second]
}

/**
 * Observes new AABB overlaps. It never mutates the World and emits no
 * gameplay result such as collection or damage.
 */
export class DefaultEntityContactSystem implements RuntimeSystem {
  readonly name = 'EntityContactSystem'

  private eventSink: GameplayEventSink | undefined
  private previousContacts = new Set<string>()
  private previousBounds = new Map<string, Bounds>()

  setGameplayEventSink(sink: GameplayEventSink): void {
    this.eventSink = sink
  }

  reset(): void {
    this.previousContacts.clear()
    this.previousBounds.clear()
  }

  update(world: World): World {
    const currentContacts = new Set<string>()
    const currentBounds = new Map<string, Bounds>()

    for (const entity of world.entities) {
      const bounds = boundsOf(entity)
      if (bounds) currentBounds.set(entity.id, bounds)
    }

    for (let firstIndex = 0; firstIndex < world.entities.length; firstIndex += 1) {
      const first = world.entities[firstIndex]
      const firstBounds = currentBounds.get(first.id)
      if (!firstBounds) continue

      for (let secondIndex = firstIndex + 1; secondIndex < world.entities.length; secondIndex += 1) {
        const second = world.entities[secondIndex]
        const secondBounds = currentBounds.get(second.id)
        if (!secondBounds || !overlaps(firstBounds, secondBounds)) continue

        const [actor, target] = actorAndTarget(first, second)
        const actorBounds = actor.id === first.id ? firstBounds : secondBounds
        const targetBounds = target.id === first.id ? firstBounds : secondBounds
        const contactKey = `${actor.id}\u0000${target.id}`
        currentContacts.add(contactKey)
        if (this.previousContacts.has(contactKey)) continue

        const position = actor.components?.find(isPositionComponent)
        this.eventSink?.emit({
          type: 'ENTITY_CONTACT_STARTED',
          actorEntityId: actor.id,
          targetEntityId: target.id,
          direction: contactDirection(
            this.previousBounds.get(actor.id),
            this.previousBounds.get(target.id),
            actorBounds,
            targetBounds,
          ),
          ...(position ? { position: position.properties } : {}),
          payload: {
            phase: 'started',
            actorType: actor.type,
            targetType: target.type,
          },
        })
      }
    }

    this.previousContacts = currentContacts
    this.previousBounds = currentBounds
    return Object.freeze({
      entities: Object.freeze([...world.entities]),
    }) as unknown as World
  }
}
