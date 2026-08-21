import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { GameplayEvent } from '@genesis/shared'
import { useObservatoryDataStore } from '../stores/observatoryData'
import ObservatoryEventStream from '../components/observatory/events/ObservatoryEventStream.vue'
import { mount } from '@vue/test-utils'

function jumpedEvent(index: number): GameplayEvent {
  return Object.freeze({
    eventId: `runtime:1:${index}`,
    type: 'ENTITY_JUMPED' as const,
    actorEntityId: 'player',
    tick: 1,
    sequence: index,
  })
}

describe('WO-S15-002 Runtime gameplay event Observatory projection', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('shows normalized Runtime facts with tick time and Gameplay source', () => {
    const store = useObservatoryDataStore()
    store.recordRuntimeGameplayEvents([jumpedEvent(0)])

    const event = store.viewModel.eventStreamView.events[0]
    expect(event).toMatchObject({
      id: 'runtime:1:0',
      timestamp: 'tick 1',
      source: 'Gameplay',
      type: 'ENTITY_JUMPED',
      message: 'ENTITY_JUMPED · player',
    })
    expect(mount(ObservatoryEventStream).text()).toContain('ENTITY_JUMPED · player')
  })

  it('keeps only the latest bounded Runtime/UI history', () => {
    const store = useObservatoryDataStore()
    store.recordRuntimeGameplayEvents(Array.from({ length: 120 }, (_, index) => jumpedEvent(index)))

    expect(store.viewModel.eventStreamView.events).toHaveLength(100)
    expect(store.viewModel.eventStreamView.events[0].id).toBe('runtime:1:119')
    expect(store.viewModel.eventStreamView.events.at(-1)?.id).toBe('runtime:1:20')
  })
})
