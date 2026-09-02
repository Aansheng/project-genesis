/**
 * Generic Player-directed entity interaction request system.
 *
 * This system owns only the input edge and deterministic reachability query.
 * Domain meaning and World mutation remain in the GameplayRule phase.
 */
import type {
  Entity,
  EntityCategory,
  GameplayEventSink,
  World,
} from '@genesis/shared'
import { isPositionComponent } from '@genesis/shared'
import type { InputKey, InputProvider } from '../input'
import type { RuntimeSystem } from '../system'

/** Default finite radius for one explicit Player-directed interaction. */
export const DEFAULT_PLAYER_INTERACTION_RANGE = 48

export interface PlayerInteractionRequestOptions {
  /** Input edge that requests the interaction; Enter is the Studio mapping. */
  readonly inputKey?: InputKey
  /** Runtime entity categories eligible to receive the request. */
  readonly targetCategories?: readonly EntityCategory[]
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
 * Emits one truthful interaction request for a Player input edge.
 *
 * A target must be explicitly whitelisted by Runtime entity category and have
 * a finite Position within range. The nearest target wins; equal distances use
 * stable Runtime entity ID order. No target means no event and no mutation.
 */
export class DefaultPlayerInteractionRequestSystem implements RuntimeSystem {
  readonly name = 'PlayerInteractionRequestSystem'

  private readonly inputProvider: InputProvider
  private readonly inputKey: InputKey
  private readonly targetCategories: ReadonlySet<EntityCategory>
  private readonly range: number
  private previousInputPressed = false
  private eventSink: GameplayEventSink | undefined

  constructor(
    inputProvider: InputProvider,
    options: PlayerInteractionRequestOptions = {},
  ) {
    this.inputProvider = inputProvider
    this.inputKey = options.inputKey ?? 'Enter'
    this.targetCategories = new Set(options.targetCategories ?? [])
    this.range = Number.isFinite(options.range) && (options.range ?? 0) > 0
      ? options.range!
      : DEFAULT_PLAYER_INTERACTION_RANGE
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
    if (!player || this.targetCategories.size === 0) return freezeCopy(world)

    const target = world.entities
      .map((entity): TargetCandidate | undefined => {
        if (entity.id === player.entity.id || !this.targetCategories.has(entity.type as EntityCategory)) {
          return undefined
        }
        const positioned = positionOf(entity)
        if (!positioned) return undefined
        const distance = Math.hypot(positioned.x - player.x, positioned.y - player.y)
        if (!Number.isFinite(distance) || distance > this.range) return undefined
        return { ...positioned, distance }
      })
      .filter((item): item is TargetCandidate => item !== undefined)
      .sort((first, second) => first.distance - second.distance || compareStableIds(first.entity.id, second.entity.id))[0]
    if (!target) return freezeCopy(world)

    this.eventSink?.emit({
      type: 'ENTITY_INTERACTION_REQUESTED',
      actorEntityId: player.entity.id,
      targetEntityId: target.entity.id,
      position: { x: player.x, y: player.y },
      payload: {
        inputKey: this.inputKey,
        targetCategory: target.entity.type,
        distance: target.distance,
        range: this.range,
      },
    })

    return freezeCopy(world)
  }
}
