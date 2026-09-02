import { describe, expect, it } from 'vitest'
import {
  createHealthComponent,
  createPositionComponent,
  type Entity,
  type World,
} from '@genesis/shared'
import type {
  GameplayActionExecutionResult,
  GameplayRuleExecutionResult,
} from '@genesis/runtime'
import { projectRuntimeGameplayOutcomeFeedback } from '../RuntimeGameplayOutcomeFeedback'

function entity(id: string, type: string, x: number, y: number, current = 100): Entity {
  return Object.freeze({
    id,
    type,
    components: Object.freeze([
      createPositionComponent(x, y),
      createHealthComponent(current, 100),
    ]),
  }) as unknown as Entity
}

function world(...entities: Entity[]): World {
  return Object.freeze({ entities: Object.freeze(entities) }) as unknown as World
}

function actionResult(
  actionType: GameplayActionExecutionResult['actionType'],
  mutation: NonNullable<GameplayActionExecutionResult['mutation']> | undefined,
  worldBefore: World,
  worldAfter: World,
  status: GameplayActionExecutionResult['status'] = 'executed',
): GameplayActionExecutionResult {
  return Object.freeze({
    ruleId: 'rule-1',
    eventId: 'event-1',
    actionType,
    status,
    targetEntityIds: Object.freeze(
      mutation && 'targetEntityId' in mutation && mutation.targetEntityId
        ? [mutation.targetEntityId]
        : [],
    ),
    worldBefore,
    worldAfter,
    ...(mutation ? { mutation: Object.freeze(mutation) } : {}),
  })
}

function rule(
  actionResults: readonly GameplayActionExecutionResult[],
  committed = true,
): GameplayRuleExecutionResult {
  return Object.freeze({
    eventId: 'event-1',
    ruleId: 'rule-1',
    matchedTrigger: 'ENTITY_ATTACK_REQUESTED',
    status: committed ? 'executed' : 'execution_failed',
    committed,
    actionResults: Object.freeze(actionResults),
    affectedEntityIds: Object.freeze([]),
  })
}

describe('Runtime gameplay outcome feedback projection', () => {
  it('projects committed authoritative damage with the target identity, position, and amount', () => {
    const enemy = entity('enemy-1', 'enemy', 120, 300, 100)
    const after = entity('enemy-1', 'enemy', 120, 300, 75)
    const result = projectRuntimeGameplayOutcomeFeedback([
      rule([
        actionResult('DAMAGE_ENTITY', {
          type: 'HEALTH_UPDATED',
          targetEntityId: 'enemy-1',
          health: { current: 75, max: 100 },
          damageAmount: 25,
        }, world(enemy), world(after)),
      ]),
    ])

    expect(result).toEqual([
      expect.objectContaining({
        kind: 'hit',
        entityId: 'enemy-1',
        position: { x: 120, y: 300 },
        damageAmount: 25,
        sourceEventId: 'event-1',
      }),
    ])
  })

  it('does not create successful feedback for an attack request without a committed mutation', () => {
    const enemy = entity('enemy-1', 'enemy', 120, 300)
    const failed = actionResult('DAMAGE_ENTITY', undefined, world(enemy), world(enemy), 'failed')

    expect(projectRuntimeGameplayOutcomeFeedback([rule([failed], false)])).toEqual([])
    expect(projectRuntimeGameplayOutcomeFeedback(undefined)).toEqual([])
  })

  it('projects an activated entity property mutation as interaction feedback', () => {
    const target = entity('npc-1', 'npc', 120, 300)
    const activated = Object.freeze({
      ...target,
      components: Object.freeze([
        ...(target.components ?? []),
        Object.freeze({ type: 'gameplay-state', properties: Object.freeze({ activated: true }) }),
      ]),
    }) as unknown as Entity

    const result = projectRuntimeGameplayOutcomeFeedback([
      rule([
        actionResult('SET_ENTITY_PROPERTY', {
          type: 'ENTITY_PROPERTY_UPDATED',
          targetEntityId: 'npc-1',
          property: 'activated',
          value: true,
        }, world(target), world(activated)),
      ]),
    ])

    expect(result).toEqual([
      expect.objectContaining({ kind: 'interaction', entityId: 'npc-1', position: { x: 120, y: 300 } }),
    ])
  })

  it('does not create interaction feedback for a no-op property action or another property', () => {
    const target = entity('npc-1', 'npc', 120, 300)
    const mutation = {
      type: 'ENTITY_PROPERTY_UPDATED' as const,
      targetEntityId: 'npc-1',
      property: 'activated' as const,
      value: true,
    }
    const noOp = actionResult('SET_ENTITY_PROPERTY', mutation, world(target), world(target), 'no_op')
    const otherProperty = actionResult('SET_ENTITY_PROPERTY', {
      type: 'ENTITY_PROPERTY_UPDATED',
      targetEntityId: 'npc-1',
      property: 'visible',
      value: true,
    }, world(target), world(target))

    expect(projectRuntimeGameplayOutcomeFeedback([rule([noOp]), rule([otherProperty])])).toEqual([])
  })

  it('uses the last authoritative position for lethal defeat after removal', () => {
    const enemy = entity('enemy-1', 'enemy', 120, 300, 0)
    const result = projectRuntimeGameplayOutcomeFeedback([
      rule([
        actionResult('REMOVE_ENTITY', {
          type: 'ENTITY_REMOVED',
          targetEntityId: 'enemy-1',
          health: 0,
        }, world(enemy), world()),
      ]),
    ])

    expect(result).toEqual([
      expect.objectContaining({
        kind: 'defeat',
        entityId: 'enemy-1',
        position: { x: 120, y: 300 },
      }),
    ])
  })

  it('does not label an ordinary non-lethal removal as defeat', () => {
    const enemy = entity('enemy-1', 'enemy', 120, 300, 100)
    expect(projectRuntimeGameplayOutcomeFeedback([
      rule([
        actionResult('REMOVE_ENTITY', {
          type: 'ENTITY_REMOVED',
          targetEntityId: 'enemy-1',
          health: 100,
        }, world(enemy), world()),
      ]),
    ])).toEqual([])
  })

  it('projects a committed Runtime addition at the replacement position', () => {
    const replacement = entity('enemy-runtime-1', 'enemy', 86, 300)
    const result = projectRuntimeGameplayOutcomeFeedback([
      rule([
        actionResult('SPAWN_ENTITY', {
          type: 'ENTITY_ADDED',
          targetEntityId: 'enemy-runtime-1',
        }, world(), world(replacement)),
      ]),
    ])

    expect(result).toEqual([
      expect.objectContaining({
        kind: 'spawn',
        entityId: 'enemy-runtime-1',
        position: { x: 86, y: 300 },
      }),
    ])
  })

  it('keeps feedback independent for entities that share a visual asset', () => {
    const first = entity('enemy-a', 'enemy', 100, 300, 100)
    const second = entity('enemy-b', 'enemy', 130, 300, 100)
    const firstAfter = entity('enemy-a', 'enemy', 100, 300, 75)
    const secondAfter = entity('enemy-b', 'enemy', 130, 300, 75)
    const results = projectRuntimeGameplayOutcomeFeedback([
      rule([
        actionResult('DAMAGE_ENTITY', {
          type: 'HEALTH_UPDATED', targetEntityId: 'enemy-a',
          health: { current: 75, max: 100 }, damageAmount: 25,
        }, world(first, second), world(firstAfter, second)),
        actionResult('DAMAGE_ENTITY', {
          type: 'HEALTH_UPDATED', targetEntityId: 'enemy-b',
          health: { current: 75, max: 100 }, damageAmount: 25,
        }, world(second), world(secondAfter)),
      ]),
    ])

    expect(results.map(item => item.entityId)).toEqual(['enemy-a', 'enemy-b'])
  })

  it('naturally supports legitimate damage feedback on the Player', () => {
    const player = entity('player-1', 'player', 80, 300, 100)
    const after = entity('player-1', 'player', 80, 300, 99)
    const result = projectRuntimeGameplayOutcomeFeedback([
      rule([
        actionResult('DAMAGE_ENTITY', {
          type: 'HEALTH_UPDATED', targetEntityId: 'player-1',
          health: { current: 99, max: 100 }, damageAmount: 1,
        }, world(player), world(after)),
      ]),
    ])

    expect(result[0]).toMatchObject({ kind: 'hit', entityId: 'player-1', damageAmount: 1 })
  })
})
