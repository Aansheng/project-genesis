import type {
  Entity,
  EntityCategory,
  GameplayEventSink,
  World,
} from '@genesis/shared'
import {
  isHealthComponent,
  isPositionComponent,
} from '@genesis/shared'
import type { InputKey, InputProvider } from '../input'
import type { RuntimeSystem } from '../system'

/** Default finite interaction radius for one explicit player-directed input. */
export const DEFAULT_PLAYER_ATTACK_RANGE = 48

export interface PlayerAttackRequestOptions {
  /** Input edge that requests the interaction; Space is the default. */
  readonly inputKey?: InputKey
  /** Runtime entity category eligible to receive the request. */
  readonly targetCategory?: EntityCategory
  /** Maximum Euclidean distance from the Player's current Runtime Position. */
  readonly range?: number
}

interface PositionedEntity {
  readonly entity: Entity
  readonly x: number
  readonly y: number
}

interface TargetCandidate extends PositionedEntity {
  readonly distance: number
}

function compareStableIds(first: string, second: string): number {
  if (first < second) return -1
  if (first > second) return 1
  return 0
}

function positionOf(entity: Entity): PositionedEntity | undefined {
  const position = entity.components?.find(isPositionComponent)
  if (!position) return undefined
  const { x, y } = position.properties
  if (!Number.isFinite(x) || !Number.isFinite(y)) return undefined
  return { entity, x, y }
}

function freezeCopy(world: World): World {
  return Object.freeze({
    entities: Object.freeze([...world.entities]),
  }) as unknown as World
}

/**
 * Emits one generic, provider-independent target-directed offense request for
 * a Player input edge. It does not mutate Health or interpret the request.
 * The following Gameplay Rule phase owns damage, defeat, and progression.
 */
export class DefaultPlayerAttackRequestSystem implements RuntimeSystem {
  readonly name = 'PlayerAttackRequestSystem'

  private readonly inputProvider: InputProvider
  private readonly inputKey: InputKey
  private readonly targetCategory: EntityCategory
  private readonly range: number
  private previousInputPressed = false
  private eventSink: GameplayEventSink | undefined

  constructor(
    inputProvider: InputProvider,
    options: PlayerAttackRequestOptions = {},
  ) {
    this.inputProvider = inputProvider
    this.inputKey = options.inputKey ?? 'Space'
    this.targetCategory = options.targetCategory ?? 'enemy'
    this.range = Number.isFinite(options.range) && (options.range ?? 0) > 0
      ? options.range!
      : DEFAULT_PLAYER_ATTACK_RANGE
  }

  setGameplayEventSink(sink: GameplayEventSink): void {
    this.eventSink = sink
  }

  reset(): void {
    this.previousInputPressed = false
  }

  update(world: World): World {
    const inputPressed = this.inputProvider.getState().isPressed(this.inputKey)
    const pressedEdge = inputPressed && !this.previousInputPressed
    this.previousInputPressed = inputPressed
    if (!pressedEdge) return freezeCopy(world)

    const player = world.entities
      .map(positionOf)
      .filter((item): item is PositionedEntity => item !== undefined && item.entity.type === 'player')
      .sort((first, second) => compareStableIds(first.entity.id, second.entity.id))[0]
    if (!player) return freezeCopy(world)

    const target = world.entities
      .map((entity): TargetCandidate | undefined => {
        if (entity.type !== this.targetCategory || entity.id === player.entity.id) return undefined
        const positioned = positionOf(entity)
        const health = entity.components?.find(isHealthComponent)
        if (!positioned || !health || !Number.isFinite(health.properties.current) || health.properties.current <= 0) {
          return undefined
        }
        const distance = Math.hypot(positioned.x - player.x, positioned.y - player.y)
        if (!Number.isFinite(distance) || distance > this.range) return undefined
        return { ...positioned, distance }
      })
      .filter((item): item is TargetCandidate => item !== undefined)
      .sort((first, second) => first.distance - second.distance || compareStableIds(first.entity.id, second.entity.id))[0]
    if (!target) return freezeCopy(world)

    this.eventSink?.emit({
      type: 'ENTITY_ATTACK_REQUESTED',
      actorEntityId: player.entity.id,
      targetEntityId: target.entity.id,
      position: { x: player.x, y: player.y },
      payload: {
        inputKey: this.inputKey,
        distance: target.distance,
        range: this.range,
      },
    })

    return freezeCopy(world)
  }
}
