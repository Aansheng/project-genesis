import { describe, expect, it } from 'vitest'
import {
  DefaultGameplayRuleBuilder,
  DefaultGameplayRuleReconciler,
  DefaultGameplaySpecificationBuilder,
} from '../index'
import {
  DEFAULT_GAMEPLAY_CAPABILITY_CATALOG,
  DefaultSemanticWorldDeltaApplier,
  type GameWorldModel,
  type WorldSemanticDelta,
} from '@genesis/shared'
import type { GameplayRuleCandidate } from '../gameplay/GameplayRuleCandidate'

const applier = new DefaultSemanticWorldDeltaApplier()

function world(entities: readonly { id: string; category: 'player' | 'npc' | 'enemy' | 'item'; name: string }[]): GameWorldModel {
  return Object.freeze({
    worldType: 'platformer',
    entities: Object.freeze(entities.map(entity => Object.freeze(entity))),
  })
}

function mutation(before: GameWorldModel, operations: WorldSemanticDelta['operations']): ReturnType<typeof applier.apply> {
  return applier.apply(before, Object.freeze({
    operationId: 'evolution-1',
    worldId: 'world-1',
    semanticRevision: 0,
    operations: Object.freeze(operations),
    summary: 'test evolution',
  }), { worldId: 'world-1', semanticRevision: 0 })
}

function currentRuleSet(before: GameWorldModel, candidate?: readonly GameplayRuleCandidate[]) {
  const specification = new DefaultGameplaySpecificationBuilder().build({ semanticWorld: before })
  const ruleSet = new DefaultGameplayRuleBuilder().build({
    semanticWorld: before,
    gameplaySpecification: specification,
    capabilities: DEFAULT_GAMEPLAY_CAPABILITY_CATALOG,
    ...(candidate ? { candidate } : {}),
    worldId: 'world-1',
    semanticRevision: 0,
  })
  return { specification, ruleSet }
}

describe('Gameplay Rule reconciliation', () => {
  it('preserves unrelated executable rules and only advances the semantic binding', () => {
    const before = world([
      { id: 'player', category: 'player', name: 'Player' },
      { id: 'cow-1', category: 'npc', name: 'Cow' },
      { id: 'enemy-1', category: 'enemy', name: 'Enemy' },
      { id: 'goal', category: 'item', name: 'Goal' },
    ])
    const { specification, ruleSet } = currentRuleSet(before)
    const changed = mutation(before, [{
      kind: 'replace-entity-semantic',
      scope: 'entity',
      targetIds: ['cow-1'],
      from: [{ name: 'Cow', category: 'npc' }],
      replacement: { name: 'Sheep', category: 'npc' },
      preserveIdentity: true,
    }])
    expect(changed.status).toBe('applied')

    const result = new DefaultGameplayRuleReconciler().reconcile({
      semanticWorld: changed.updatedWorld,
      gameplaySpecification: specification,
      currentRuleSet: ruleSet,
      semanticMutation: changed,
    })

    expect(result.status).toBe('reconciled')
    expect(result.ruleSet?.bindingStatus).toBe('current')
    expect(result.ruleSet?.semanticRevision).toBe(1)
    expect(result.ruleSet?.rules.find(rule => rule.ruleId === 'enemy-stomp')).toBe(ruleSet.rules.find(rule => rule.ruleId === 'enemy-stomp'))
    expect(result.ruleSet?.rules.find(rule => rule.ruleId === 'reach-goal')).toBe(ruleSet.rules.find(rule => rule.ruleId === 'reach-goal'))
    expect(result.rebuiltRuleIds).toEqual([])
    expect(result.removedRuleIds).toEqual([])
    expect(Object.isFrozen(result.ruleSet)).toBe(true)
  })

  it('removes rules that lose their semantic dependency and rebuilds newly resolvable rules', () => {
    const before = world([
      { id: 'player', category: 'player', name: 'Player' },
      { id: 'enemy-1', category: 'enemy', name: 'Enemy' },
      { id: 'goal', category: 'item', name: 'Goal' },
    ])
    const { specification, ruleSet } = currentRuleSet(before)
    const removed = mutation(before, [{ kind: 'remove-entity', scope: 'entity', targetIds: ['enemy-1'] }])
    const removedResult = new DefaultGameplayRuleReconciler().reconcile({
      semanticWorld: removed.updatedWorld,
      gameplaySpecification: specification,
      currentRuleSet: ruleSet,
      semanticMutation: removed,
    })

    expect(removedResult.ruleSet?.rules.map(rule => rule.ruleId)).toEqual(['reach-goal'])
    expect(removedResult.removedRuleIds).toEqual(['enemy-stomp', 'enemy-contact-damage'])
    expect(removedResult.ruleSet?.rules[0]).toBe(ruleSet.rules.find(rule => rule.ruleId === 'reach-goal'))

    const noItem = world([
      { id: 'player', category: 'player', name: 'Player' },
      { id: 'goal', category: 'item', name: 'Goal' },
    ])
    const noItemState = currentRuleSet(noItem)
    const added = mutation(noItem, [{
      kind: 'add-entity',
      scope: 'entity',
      semantic: { name: 'Coin', category: 'item' },
      count: 1,
    }])
    const addedResult = new DefaultGameplayRuleReconciler().reconcile({
      semanticWorld: added.updatedWorld,
      gameplaySpecification: noItemState.specification,
      currentRuleSet: noItemState.ruleSet,
      semanticMutation: added,
    })

    expect(addedResult.ruleSet?.rules.map(rule => rule.ruleId)).toContain('collect-reward')
    expect(addedResult.rebuiltRuleIds).toContain('collect-reward')
  })

  it('removes an exact-reference rule when its target disappears', () => {
    const before = world([
      { id: 'player', category: 'player', name: 'Player' },
      { id: 'coin-1', category: 'item', name: 'Coin' },
    ])
    const customRule: GameplayRuleCandidate = {
      ruleId: 'exact-coin',
      name: 'Exact coin',
      trigger: { eventType: 'ENTITY_CONTACT_STARTED' },
      conditions: [{ type: 'ENTITY_ID_EQUALS', entity: { kind: 'eventTarget' }, entityId: 'coin-1' }],
      actions: [{ type: 'REMOVE_ENTITY', target: { kind: 'eventTarget' } }],
    }
    const { specification, ruleSet } = currentRuleSet(before, [customRule])
    const changed = mutation(before, [{ kind: 'remove-entity', scope: 'entity', targetIds: ['coin-1'] }])
    const result = new DefaultGameplayRuleReconciler().reconcile({
      semanticWorld: changed.updatedWorld,
      gameplaySpecification: specification,
      currentRuleSet: ruleSet,
      semanticMutation: changed,
    })

    expect(result.ruleSet?.rules).toHaveLength(0)
    expect(result.removedRuleIds).toEqual(['exact-coin'])
    expect(result.facts[0]).toMatchObject({ ruleId: 'exact-coin', action: 'removed' })
  })
})
