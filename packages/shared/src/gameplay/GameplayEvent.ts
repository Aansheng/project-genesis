/**
 * Provider-independent facts emitted by the Runtime.
 *
 * These are observations only. They do not imply collection, damage,
 * progression, completion, or any other gameplay result.
 */

export type GameplayEventType =
  | 'ENTITY_CONTACT_STARTED'
  | 'ENTITY_LANDED'
  | 'ENTITY_JUMPED'
  | 'ENTITY_ADDED'
  | 'ENTITY_REMOVED'

export interface GameplayEventPosition {
  readonly x: number
  readonly y: number
}

export type GameplayEventPayloadValue = string | number | boolean
export type GameplayEventPayload = Readonly<Record<string, GameplayEventPayloadValue>>

export type GameplayEventDraft =
  | {
      readonly type: 'ENTITY_CONTACT_STARTED'
      readonly actorEntityId: string
      readonly targetEntityId: string
      readonly position?: GameplayEventPosition
      readonly payload?: GameplayEventPayload
    }
  | {
      readonly type: 'ENTITY_LANDED'
      readonly actorEntityId: string
      readonly targetEntityId?: string
      readonly position?: GameplayEventPosition
      readonly payload?: GameplayEventPayload
    }
  | {
      readonly type: 'ENTITY_JUMPED'
      readonly actorEntityId: string
      readonly position?: GameplayEventPosition
      readonly payload?: GameplayEventPayload
    }
  | {
      readonly type: 'ENTITY_ADDED' | 'ENTITY_REMOVED'
      readonly targetEntityId: string
      readonly position?: GameplayEventPosition
      readonly payload?: GameplayEventPayload
    }

export interface GameplayEventMetadata {
  /** Deterministic identity within the Runtime event session. */
  readonly eventId: string
  /** Optional Runtime-owned world/session namespace. */
  readonly worldId?: string
  /** Monotonic Runtime tick; mutation events use the latest completed tick. */
  readonly tick: number
  /** Deterministic emission order within a tick. */
  readonly sequence: number
}

export type GameplayEvent = GameplayEventMetadata & GameplayEventDraft

export interface GameplayEventSink {
  emit(event: GameplayEventDraft): void
}

/** Read-only bridge from Runtime batches to an external projection. */
export interface GameplayEventObserver {
  observe(events: readonly GameplayEvent[]): void
}
