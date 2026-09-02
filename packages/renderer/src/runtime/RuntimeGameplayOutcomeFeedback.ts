/**
 * Projects committed Runtime gameplay mutations into transient presentation
 * outcomes. This module contains no Pixi or UI code.
 */

import type { GameplayRuleExecutionResult } from '@genesis/runtime'
import type { Entity, World } from '@genesis/shared'
import { isPositionComponent } from '@genesis/shared'
import type {
  GameplayOutcomeFeedback,
  GameplayOutcomeFeedbackPosition,
} from '../model'

function entityById(world: World, entityId: string): Entity | undefined {
  return world.entities.find(entity => entity.id === entityId)
}

function positionOf(world: World, entityId: string): GameplayOutcomeFeedbackPosition | undefined {
  const entity = entityById(world, entityId)
  const position = entity?.components?.find(isPositionComponent)?.properties
  if (!position || !Number.isFinite(position.x) || !Number.isFinite(position.y)) return undefined
  return Object.freeze({ x: position.x, y: position.y })
}

/**
 * Convert only committed, executed Runtime action mutations into feedback.
 *
 * - HEALTH_UPDATED is a real hit/damage outcome.
 * - ENTITY_REMOVED is a defeat only when the authoritative removal snapshot
 *   records Health == 0.
 * - ENTITY_ADDED is a committed Runtime spawn outcome.
 * - ENTITY_PROPERTY_UPDATED is an interaction outcome only for `activated`.
 *
 * Attack-request events, failed actions, rolled-back actions, and ordinary
 * removals intentionally produce no positive feedback.
 */
export function projectRuntimeGameplayOutcomeFeedback(
  results: readonly GameplayRuleExecutionResult[] | undefined,
): readonly GameplayOutcomeFeedback[] {
  if (!results || results.length === 0) return Object.freeze([])

  const outcomes: GameplayOutcomeFeedback[] = []

  results.forEach((result, resultIndex) => {
    if (!result.committed) return

    result.actionResults.forEach((actionResult, actionIndex) => {
      if (actionResult.status !== 'executed' || !actionResult.mutation) return

      const mutation = actionResult.mutation
      let entityId: string | undefined
      let kind: GameplayOutcomeFeedback['kind'] | undefined
      let position: GameplayOutcomeFeedbackPosition | undefined
      let damageAmount: number | undefined

      if (mutation.type === 'HEALTH_UPDATED') {
        entityId = mutation.targetEntityId
        kind = 'hit'
        position = positionOf(actionResult.worldAfter, entityId)
          ?? positionOf(actionResult.worldBefore, entityId)
        damageAmount = Number.isFinite(mutation.damageAmount) && mutation.damageAmount > 0
          ? mutation.damageAmount
          : undefined
      } else if (mutation.type === 'ENTITY_REMOVED' && mutation.health === 0) {
        entityId = mutation.targetEntityId
        kind = 'defeat'
        // The removed entity no longer exists in worldAfter. Its last
        // authoritative position is retained in worldBefore for presentation.
        position = positionOf(actionResult.worldBefore, entityId)
      } else if (mutation.type === 'ENTITY_ADDED') {
        entityId = mutation.targetEntityId
        kind = 'spawn'
        position = positionOf(actionResult.worldAfter, entityId)
      } else if (mutation.type === 'ENTITY_PROPERTY_UPDATED' && mutation.property === 'activated') {
        entityId = mutation.targetEntityId
        kind = 'interaction'
        position = positionOf(actionResult.worldAfter, entityId)
          ?? positionOf(actionResult.worldBefore, entityId)
      }

      if (!kind || !entityId || !position) return

      outcomes.push(Object.freeze({
        feedbackId: `${result.eventId}:${resultIndex}:${actionIndex}:${kind}`,
        sourceEventId: result.eventId,
        kind,
        entityId,
        position,
        ...(damageAmount !== undefined ? { damageAmount } : {}),
      }))
    })
  })

  return Object.freeze(outcomes)
}
