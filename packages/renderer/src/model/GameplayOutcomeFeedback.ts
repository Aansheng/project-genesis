/**
 * A transient, non-authoritative presentation outcome projected from Runtime
 * gameplay truth.
 *
 * The entity ID is the binding key. Visual assets are deliberately absent so
 * multiple Runtime entities can share one canonical visual without sharing
 * feedback state.
 */

export type GameplayOutcomeFeedbackKind = 'hit' | 'defeat' | 'spawn'

export interface GameplayOutcomeFeedbackPosition {
  readonly x: number
  readonly y: number
}

export interface GameplayOutcomeFeedback {
  /** Unique identity for one committed Runtime outcome. */
  readonly feedbackId: string
  /** Runtime event that caused the committed action result. */
  readonly sourceEventId: string
  readonly kind: GameplayOutcomeFeedbackKind
  /** Runtime entity identity, never an asset or Pixi identity. */
  readonly entityId: string
  /** World-space position captured from the authoritative Runtime snapshot. */
  readonly position: GameplayOutcomeFeedbackPosition
  /** Present only when Runtime exposed the committed damage amount. */
  readonly damageAmount?: number
}
