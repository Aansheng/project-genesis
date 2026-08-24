import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import type { GameplayEvent, World } from '@genesis/shared'
import type { GameplayActionExecutionResult, GameplayRuleExecutionResult, RuntimeGameplayProgressionState, RuntimeGameplaySessionState } from '@genesis/runtime'
import ObservatoryEventStream from '../components/observatory/events/ObservatoryEventStream.vue'
import { useObservatoryDataStore } from '../stores/observatoryData'

const emptyWorld = Object.freeze({ entities: Object.freeze([]) }) as unknown as World

function contactEvent(): GameplayEvent {
  return Object.freeze({
    eventId: 'world-1:12:0',
    worldId: 'world-1',
    tick: 12,
    sequence: 0,
    type: 'ENTITY_CONTACT_STARTED' as const,
    actorEntityId: 'player',
    targetEntityId: 'enemy',
    direction: 'top' as const,
  })
}

function actionResult(
  actionType: GameplayActionExecutionResult['actionType'],
  targetEntityId: string,
): GameplayActionExecutionResult {
  return Object.freeze({
    ruleId: 'enemy-stomp',
    eventId: 'world-1:12:0',
    actionType,
    status: 'executed' as const,
    targetEntityIds: Object.freeze([targetEntityId]),
    worldBefore: emptyWorld,
    worldAfter: emptyWorld,
  })
}

describe('Gameplay Observatory projection', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('shows Runtime contact direction and trusted damage execution separately from deferred state', () => {
    const store = useObservatoryDataStore()
    store.recordRuntimeGameplayEvents([contactEvent()])
    const stompResult: GameplayRuleExecutionResult = Object.freeze({
      eventId: 'world-1:12:0',
      ruleId: 'enemy-stomp',
      matchedTrigger: 'ENTITY_CONTACT_STARTED',
      status: 'executed',
      committed: true,
      actionResults: Object.freeze([
        actionResult('REMOVE_ENTITY', 'enemy'),
        actionResult('APPLY_VELOCITY', 'player'),
      ]),
      affectedEntityIds: Object.freeze(['enemy', 'player']),
    })
    const damageResult: GameplayRuleExecutionResult = Object.freeze({
      eventId: 'world-1:13:0',
      ruleId: 'enemy-contact-damage',
      matchedTrigger: 'ENTITY_CONTACT_STARTED',
      status: 'executed',
      committed: true,
      actionResults: Object.freeze([actionResult('DAMAGE_ENTITY', 'player')]),
      affectedEntityIds: Object.freeze(['player']),
    })
    const deferredScore: GameplayRuleExecutionResult = Object.freeze({
      eventId: 'world-1:14:0',
      ruleId: 'score-reward',
      matchedTrigger: 'ENTITY_CONTACT_STARTED',
      status: 'unsupported',
      committed: false,
      actionResults: Object.freeze([]),
      affectedEntityIds: Object.freeze([]),
      reason: 'rule_deferred',
    })
    store.recordRuntimeGameplayRuleResults([stompResult, damageResult, deferredScore])

    const text = mount(ObservatoryEventStream).text()
    expect(text).toContain('direction=top')
    expect(text).toContain('enemy-stomp')
    expect(text).toContain('REMOVE_ENTITY:executed')
    expect(text).toContain('APPLY_VELOCITY:executed')
    expect(text).toContain('enemy-contact-damage')
    expect(text).toContain('DAMAGE_ENTITY:executed')
    expect(text).toContain('score-reward')
    expect(text).toContain('unsupported')
    expect(text).not.toContain('CHANGE_NUMERIC_STATE:executed')
  })

  it('projects committed Runtime session completion without owning the state', () => {
    const store = useObservatoryDataStore()
    const completed: RuntimeGameplaySessionState = Object.freeze({
      status: 'completed',
      completedByGoalId: 'goal',
      completedAtTick: 7,
    })

    store.recordRuntimeGameplaySessionState(completed)

    expect(store.viewModel.runtimeView.gameplaySession).toEqual(completed)
  })

  it('projects committed Runtime numeric progression without owning the state', () => {
    const store = useObservatoryDataStore()
    const progression: RuntimeGameplayProgressionState = Object.freeze({
      values: Object.freeze({ experience: 6 }),
    })

    store.recordRuntimeGameplayProgressionState(progression)

    expect(store.viewModel.runtimeView.gameplayProgression).toEqual({ values: { experience: 6 } })
  })
})
