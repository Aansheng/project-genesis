import type {
  Entity,
  GameplayEvent,
  GameplayEventDraft,
  GameplayEventPosition,
  GameplayEventSink,
  World,
} from '@genesis/shared'

const MAX_EVENTS_PER_BATCH = 100

export interface RuntimeGameplayEventCollector extends GameplayEventSink {
  setWorldId(worldId?: string): void
  beginTick(tick: number): void
  endTick(): readonly GameplayEvent[]
  observeWorldMutation(previousWorld: World, nextWorld: World): void
  /** Mark a Runtime removal committed by a gameplay rule before WorldStore publishes it. */
  markGameplayEntityRemoval?(entityId: string, health?: number): void
}

function positionOf(entity: Entity): GameplayEventPosition | undefined {
  const component = entity.components?.find((item) => item.type === 'position')
  if (!component) return undefined
  const { x, y } = component.properties
  return typeof x === 'number' && typeof y === 'number'
    ? Object.freeze({ x, y })
    : undefined
}

function entityById(world: World): ReadonlyMap<string, Entity> {
  return new Map(world.entities.map((entity) => [entity.id, entity]))
}

function semanticNameOf(entity: Entity): string | undefined {
  const value = entity.components?.find(component => component.type === 'semantic')?.properties.name
  return typeof value === 'string' && value.trim() ? value : undefined
}

function healthOf(entity: Entity): number | undefined {
  const value = entity.components?.find(component => component.type === 'health')?.properties.current
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

/**
 * Ephemeral Runtime event batch collector.
 *
 * It owns only the current tick and a small pending mutation batch. It is not
 * a history store and intentionally drops events after the bounded limit.
 */
export class DefaultRuntimeGameplayEventCollector implements RuntimeGameplayEventCollector {
  private worldId: string | undefined
  private currentTick = 0
  private sequence = 0
  private active = false
  private pendingEvents: GameplayEvent[] = []
  private currentEvents: GameplayEvent[] = []
  private pendingGameplayRemovalHealth = new Map<string, number | undefined>()

  constructor(worldId?: string) {
    this.worldId = worldId
  }

  setWorldId(worldId?: string): void {
    this.worldId = worldId
  }

  beginTick(tick: number): void {
    this.currentTick = Number.isFinite(tick) ? Math.max(0, Math.floor(tick)) : 0
    this.sequence = 0
    this.currentEvents = this.pendingEvents
    this.pendingEvents = []
    this.active = true
  }

  endTick(): readonly GameplayEvent[] {
    const events = Object.freeze([...this.currentEvents])
    this.currentEvents = []
    this.active = false
    return events
  }

  emit(draft: GameplayEventDraft): void {
    const target = this.active ? this.currentEvents : this.pendingEvents
    if (target.length >= MAX_EVENTS_PER_BATCH) return

    const event = Object.freeze({
      ...draft,
      eventId: `${this.worldId ?? 'runtime'}:${this.currentTick}:${this.sequence}`,
      ...(this.worldId ? { worldId: this.worldId } : {}),
      tick: this.currentTick,
      sequence: this.sequence,
      ...(draft.position ? { position: Object.freeze({ ...draft.position }) } : {}),
      ...(draft.payload ? { payload: Object.freeze({ ...draft.payload }) } : {}),
    }) as GameplayEvent

    target.push(event)
    this.sequence += 1
  }

  markGameplayEntityRemoval(entityId: string, health?: number): void {
    this.pendingGameplayRemovalHealth.set(entityId, health)
  }

  /** Emit add/remove facts after the WorldStore has committed a new snapshot. */
  observeWorldMutation(previousWorld: World, nextWorld: World): void {
    const previous = entityById(previousWorld)
    const next = entityById(nextWorld)

    for (const entity of nextWorld.entities) {
      if (previous.has(entity.id)) continue
      this.emit({
        type: 'ENTITY_ADDED',
        targetEntityId: entity.id,
        position: positionOf(entity),
        payload: {
          entityType: entity.type,
          ...(semanticNameOf(entity) ? { entityName: semanticNameOf(entity)! } : {}),
          ...(healthOf(entity) !== undefined ? { health: healthOf(entity)! } : {}),
        },
      })
    }

    for (const entity of previousWorld.entities) {
      if (next.has(entity.id)) continue
      const gameplayHealth = this.pendingGameplayRemovalHealth.get(entity.id)
      this.pendingGameplayRemovalHealth.delete(entity.id)
      this.emit({
        type: 'ENTITY_REMOVED',
        targetEntityId: entity.id,
        payload: {
          entityType: entity.type,
          ...(semanticNameOf(entity) ? { entityName: semanticNameOf(entity)! } : {}),
          ...(gameplayHealth !== undefined
            ? { health: gameplayHealth }
            : healthOf(entity) !== undefined ? { health: healthOf(entity)! } : {}),
        },
      })
    }
  }
}
