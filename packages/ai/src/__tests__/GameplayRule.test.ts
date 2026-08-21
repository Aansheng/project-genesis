import { describe, expect, it } from 'vitest'
import {
  DefaultGameplayRuleBuilder,
  DefaultGameplayRuleValidator,
  DefaultGameplaySpecificationBuilder,
  type GameplayRuleCandidate,
} from '../index'
import { DEFAULT_GAMEPLAY_CAPABILITY_CATALOG, DefaultGameplayGenerationContextBuilder } from '@genesis/shared'
import type { GameWorldModel } from '@genesis/shared'
import type { GameplayEntitySelector } from '@genesis/shared'

const world: GameWorldModel = Object.freeze({
  worldType: 'platformer',
  entities: Object.freeze([
    Object.freeze({ id: 'player', category: 'player', name: 'Player' }),
    Object.freeze({ id: 'coin-1', category: 'item', name: 'Coin' }),
    Object.freeze({ id: 'enemy-1', category: 'enemy', name: 'Enemy' }),
    Object.freeze({ id: 'goal', category: 'item', name: 'Goal' }),
    Object.freeze({ id: 'question-block', category: 'terrain', name: 'Question Block' }),
  ]),
})

function selector(kind: 'eventActor'): GameplayEntitySelector
function selector(kind: 'eventTarget'): GameplayEntitySelector
function selector(kind: 'exactEntityId', entityId: string): GameplayEntitySelector
function selector(kind: 'eventActor' | 'eventTarget' | 'exactEntityId', entityId?: string): GameplayEntitySelector {
  return entityId ? { kind: 'exactEntityId', entityId } : kind === 'eventActor' ? { kind } : { kind: 'eventTarget' }
}

function candidate(ruleId: string, actions: GameplayRuleCandidate['actions'], conditions: GameplayRuleCandidate['conditions']): GameplayRuleCandidate {
  return {
    ruleId,
    name: ruleId,
    trigger: { eventType: 'ENTITY_CONTACT_STARTED' },
    conditions,
    actions,
  }
}

describe('GameplayRule foundation', () => {
  it('represents coin, stomp, side damage, goal, and question-block rules with one schema', () => {
    const validator = new DefaultGameplayRuleValidator()
    const result = validator.validate([
      candidate('collect-coin', [
        { type: 'REMOVE_ENTITY', target: selector('eventTarget') },
        { type: 'CHANGE_NUMERIC_STATE', state: 'score', amount: 1 },
      ], [
        { type: 'ENTITY_CATEGORY_EQUALS', entity: selector('eventActor'), category: 'player' },
        { type: 'ENTITY_ARCHETYPE_EQUALS', entity: selector('eventTarget'), archetype: 'Coin' },
      ]),
      candidate('enemy-stomp', [
        { type: 'REMOVE_ENTITY', target: selector('eventTarget') },
        { type: 'APPLY_VELOCITY', target: selector('eventActor'), velocity: { y: -12, mode: 'set' } },
      ], [
        { type: 'ENTITY_CATEGORY_EQUALS', entity: selector('eventActor'), category: 'player' },
        { type: 'ENTITY_CATEGORY_EQUALS', entity: selector('eventTarget'), category: 'enemy' },
        { type: 'CONTACT_DIRECTION_EQUALS', direction: 'top' },
      ]),
      candidate('enemy-side-damage', [
        { type: 'DAMAGE_ENTITY', target: selector('eventActor'), amount: 1 },
      ], [
        { type: 'ENTITY_CATEGORY_EQUALS', entity: selector('eventActor'), category: 'player' },
        { type: 'ENTITY_CATEGORY_EQUALS', entity: selector('eventTarget'), category: 'enemy' },
        { type: 'CONTACT_DIRECTION_EQUALS', direction: 'top', negated: true },
      ]),
      candidate('reach-goal', [
        { type: 'COMPLETE_GOAL', goalId: 'goal' },
      ], [
        { type: 'ENTITY_CATEGORY_EQUALS', entity: selector('eventActor'), category: 'player' },
        { type: 'ENTITY_ID_EQUALS', entity: selector('eventTarget'), entityId: 'goal' },
      ]),
      candidate('question-block-reward', [
        { type: 'SPAWN_ENTITY', entity: { category: 'item', archetype: 'Reward' } },
        { type: 'SET_ENTITY_PROPERTY', target: selector('eventTarget'), property: 'activated', value: true },
      ], [
        { type: 'ENTITY_CATEGORY_EQUALS', entity: selector('eventActor'), category: 'player' },
        { type: 'ENTITY_ARCHETYPE_EQUALS', entity: selector('eventTarget'), archetype: 'Question Block' },
        { type: 'CONTACT_DIRECTION_EQUALS', direction: 'bottom' },
      ]),
    ], { semanticWorld: world, capabilities: DEFAULT_GAMEPLAY_CAPABILITY_CATALOG })

    expect(result.valid).toBe(true)
    const specification = new DefaultGameplaySpecificationBuilder().build({ semanticWorld: world })
    const ruleSet = new DefaultGameplayRuleBuilder().build({
      semanticWorld: world,
      gameplaySpecification: specification,
      candidate: result.candidate,
    })
    expect(ruleSet.rules).toHaveLength(5)
    expect(ruleSet.rules.map(rule => rule.ruleId)).toEqual([
      'collect-coin', 'enemy-stomp', 'enemy-side-damage', 'reach-goal', 'question-block-reward',
    ])
    expect(ruleSet.rules.find(rule => rule.ruleId === 'collect-coin')?.supportStatus).toBe('partially_supported')
    expect(ruleSet.rules.find(rule => rule.ruleId === 'enemy-stomp')?.supportStatus).toBe('supported')
    expect(ruleSet.rules.find(rule => rule.ruleId === 'enemy-side-damage')?.supportStatus).toBe('deferred')
    expect(ruleSet.rules.find(rule => rule.ruleId === 'reach-goal')?.supportStatus).toBe('deferred')
    expect(ruleSet.execution.status).toBe('active')
    expect(Object.isFrozen(ruleSet)).toBe(true)
    expect(Object.isFrozen(ruleSet.rules[0])).toBe(true)
    expect(world.entities).toHaveLength(5)

    const deterministicRuleSet = new DefaultGameplayRuleBuilder().build({
      semanticWorld: world,
      gameplaySpecification: specification,
    })
    expect(deterministicRuleSet.rules.find(rule => rule.ruleId === 'enemy-stomp')).toMatchObject({
      supportStatus: 'supported',
      actions: [
        { type: 'REMOVE_ENTITY' },
        { type: 'APPLY_VELOCITY', velocity: { y: -12, mode: 'set' } },
      ],
    })
  })

  it('normalizes IDs and rejects unknown events, actions, exact references, and code', () => {
    const validator = new DefaultGameplayRuleValidator()
    const invalid = validator.validate([
      {
        ruleId: 'Bad Rule Name',
        trigger: { eventType: 'TIMER_ELAPSED' },
        conditions: [{ type: 'ENTITY_ID_EQUALS', entity: { kind: 'eventTarget' }, entityId: 'missing' }],
        actions: [{ type: 'TELEPORT_DATABASE_AND_RUN_SCRIPT', code: 'alert(1)' }],
      },
    ], { semanticWorld: world, capabilities: DEFAULT_GAMEPLAY_CAPABILITY_CATALOG })

    expect(invalid.valid).toBe(false)
    expect(invalid.errors.join(' ')).toContain('observed GameplayEvent')
    expect(invalid.errors.join(' ')).toContain('existing semantic entity')
    expect(invalid.errors.join(' ')).toContain('whitelisted GameplayAction')
    expect(invalid.errors.join(' ')).toContain('executable code')
  })

  it('keeps the gameplay generation context bounded to rule vocabulary and excludes Runtime history', () => {
    const context = new DefaultGameplayGenerationContextBuilder().build({
      metadata: { worldId: 'world-1', gameplayRevision: 1 },
      semanticWorld: world,
      capabilities: DEFAULT_GAMEPLAY_CAPABILITY_CATALOG,
      instruction: 'design rules',
    })

    expect(context.ruleVocabulary.eventTypes).toContain('ENTITY_CONTACT_STARTED')
    expect(context.ruleVocabulary.conditionTypes).toContain('CONTACT_DIRECTION_EQUALS')
    expect(context.ruleVocabulary.actionTypes).toContain('DAMAGE_ENTITY')
    expect(DEFAULT_GAMEPLAY_CAPABILITY_CATALOG.supportedMechanicIds).toContain('enemy-stomp')
    expect(context.ruleVocabulary.primitiveCapabilities.find(item => item.id === 'condition-contact-direction-equals')?.status).toBe('supported')
    expect(context.ruleVocabulary.primitiveCapabilities.find(item => item.id === 'action-apply-velocity')?.status).toBe('supported')
    expect(context.ruleVocabulary.primitiveCapabilities.find(item => item.id === 'action-damage-entity')?.status).toBe('deferred')
    expect(context).not.toHaveProperty('runtimeHistory')
    expect(context).not.toHaveProperty('pixi')
  })
})
