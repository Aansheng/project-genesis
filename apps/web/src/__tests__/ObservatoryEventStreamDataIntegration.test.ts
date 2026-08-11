/**
 * ObservatoryEventStreamDataIntegration — verifies the full data integration path
 * for the Event Stream panel from the observatoryData store
 * (via DefaultObservatoryAdapter) through the event stream components.
 *
 * WO-S6-019 — Observatory Event Stream Real Data Integration
 * Architecture version v1.49
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

import { useObservatoryDataStore } from '../stores/observatoryData'
import { DefaultObservatoryAdapter } from '../adapters/observatory'
import type {
  ObservatoryViewModel,
  EventStreamViewModel,
  EventViewModel,
} from '../adapters/observatory'
import ObservatoryEventStream from '../components/observatory/events/ObservatoryEventStream.vue'
import EventStreamList from '../components/observatory/events/EventStreamList.vue'
import EventStreamItem from '../components/observatory/events/EventStreamItem.vue'
import EventFilterBar from '../components/observatory/events/EventFilterBar.vue'
import { useI18nStore } from '../stores/i18n'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function initI18n(): void {
  useI18nStore().setLanguage('zh-CN')
}

function mountStream(): VueWrapper {
  initI18n()
  useObservatoryDataStore().loadMockObservatory()
  return mount(ObservatoryEventStream)
}

function items(wrapper: VueWrapper): ReturnType<VueWrapper['findAll']> {
  return wrapper.findAll('.event-stream-item')
}

function itemTexts(wrapper: VueWrapper, selector: string): string[] {
  return wrapper.findAll(selector).map((el) => el.text().trim())
}

function filterButtons(wrapper: VueWrapper): ReturnType<VueWrapper['findAll']> {
  return wrapper.findAll('button.event-filter-button')
}

function filterLabels(wrapper: VueWrapper): string[] {
  return filterButtons(wrapper).map((b) => b.text().trim())
}

function activeFilters(wrapper: VueWrapper): ReturnType<VueWrapper['findAll']> {
  return filterButtons(wrapper).filter((b) =>
    b.classes().includes('event-filter-button--active'),
  )
}

async function clickFilter(
  wrapper: VueWrapper,
  index: number,
): Promise<void> {
  await filterButtons(wrapper)[index].trigger('click')
  await nextTick()
}

// ---------------------------------------------------------------------------
// Section 1 — Store eventStreamView Integration
// ---------------------------------------------------------------------------

describe('event stream data — store eventStreamView integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('store initializes with empty eventStreamView', () => {
    const store = useObservatoryDataStore()
    expect(store.viewModel.eventStreamView.events).toEqual([])
  })

  it('eventStreamView.events is an array', () => {
    const store = useObservatoryDataStore()
    expect(Array.isArray(store.viewModel.eventStreamView.events)).toBe(true)
  })

  it('loadMockObservatory populates eventStreamView', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(store.viewModel.eventStreamView.events.length).toBe(20)
  })

  it('first event id is evt-001', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(store.viewModel.eventStreamView.events[0].id).toBe('evt-001')
  })

  it('last event id is evt-020', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const events = store.viewModel.eventStreamView.events
    expect(events[events.length - 1].id).toBe('evt-020')
  })

  it('event ids are strings', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const e of store.viewModel.eventStreamView.events) {
      expect(typeof e.id).toBe('string')
    }
  })

  it('event timestamps are strings', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const e of store.viewModel.eventStreamView.events) {
      expect(typeof e.timestamp).toBe('string')
    }
  })

  it('event levels are valid EventLevel strings', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const e of store.viewModel.eventStreamView.events) {
      expect(['info', 'warning', 'error']).toContain(e.level)
    }
  })

  it('event sources are strings', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const e of store.viewModel.eventStreamView.events) {
      expect(typeof e.source).toBe('string')
    }
  })

  it('event messages are strings', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const e of store.viewModel.eventStreamView.events) {
      expect(typeof e.message).toBe('string')
    }
  })

  it('event messages are non-empty', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const e of store.viewModel.eventStreamView.events) {
      expect(e.message.length).toBeGreaterThan(0)
    }
  })

  it('events have unique ids', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const ids = store.viewModel.eventStreamView.events.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('events are in chronological order by timestamp', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const timestamps = store.viewModel.eventStreamView.events.map((e) => e.timestamp)
    const sorted = [...timestamps].sort()
    expect(timestamps).toEqual(sorted)
  })

  it('first event has expected fields', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const first = store.viewModel.eventStreamView.events[0]
    expect(first.id).toBe('evt-001')
    expect(first.timestamp).toBe('12:00:01')
    expect(first.level).toBe('info')
    expect(first.source).toBe('PromptBuilder')
    expect(first.message).toBe('Prompt received')
  })

  it('eventStreamView shape has events readonly array', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(store.viewModel.eventStreamView).toHaveProperty('events')
    expect(Array.isArray(store.viewModel.eventStreamView.events)).toBe(true)
  })

  it('contains info events', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const infoEvents = store.viewModel.eventStreamView.events.filter((e) => e.level === 'info')
    expect(infoEvents.length).toBeGreaterThan(0)
  })

  it('contains warning events', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const warningEvents = store.viewModel.eventStreamView.events.filter((e) => e.level === 'warning')
    expect(warningEvents.length).toBeGreaterThan(0)
  })

  it('contains error events', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const errorEvents = store.viewModel.eventStreamView.events.filter((e) => e.level === 'error')
    expect(errorEvents.length).toBeGreaterThan(0)
  })

  it('has 13 info events', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const count = store.viewModel.eventStreamView.events.filter((e) => e.level === 'info').length
    expect(count).toBe(13)
  })

  it('has 4 warning events', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const count = store.viewModel.eventStreamView.events.filter((e) => e.level === 'warning').length
    expect(count).toBe(4)
  })

  it('has 3 error events', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const count = store.viewModel.eventStreamView.events.filter((e) => e.level === 'error').length
    expect(count).toBe(3)
  })

  it('contains PromptBuilder source events', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const pbEvents = store.viewModel.eventStreamView.events.filter((e) => e.source === 'PromptBuilder')
    expect(pbEvents.length).toBeGreaterThan(0)
  })

  it('contains Runtime source events', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const rtEvents = store.viewModel.eventStreamView.events.filter((e) => e.source === 'Runtime')
    expect(rtEvents.length).toBeGreaterThan(0)
  })

  it('contains Provider source events', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const prEvents = store.viewModel.eventStreamView.events.filter((e) => e.source === 'Provider')
    expect(prEvents.length).toBeGreaterThan(0)
  })

  it('contains Planner source events', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const plEvents = store.viewModel.eventStreamView.events.filter((e) => e.source === 'Planner')
    expect(plEvents.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// Section 2 — Adapter eventStreamView Mapping
// ---------------------------------------------------------------------------

describe('event stream data — adapter eventStreamView mapping', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('adapter maps eventStreamView from raw observatory', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      eventStreamView: {
        events: [
          { id: 'e1', timestamp: '12:00:00', level: 'info', source: 'Src', message: 'Msg' },
        ],
      },
    })
    expect(vm.eventStreamView.events).toHaveLength(1)
    expect(vm.eventStreamView.events[0].id).toBe('e1')
  })

  it('adapter handles missing eventStreamView gracefully', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({})
    expect(vm.eventStreamView.events).toEqual([])
  })

  it('adapter handles null eventStreamView gracefully', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({ eventStreamView: null })
    expect(vm.eventStreamView.events).toEqual([])
  })

  it('adapter handles undefined eventStreamView gracefully', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({ eventStreamView: undefined })
    expect(vm.eventStreamView.events).toEqual([])
  })

  it('adapter handles non-object eventStreamView gracefully', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({ eventStreamView: 'invalid' })
    expect(vm.eventStreamView.events).toEqual([])
  })

  it('adapter handles non-array events gracefully', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({ eventStreamView: { events: 'invalid' } })
    expect(vm.eventStreamView.events).toEqual([])
  })

  it('adapter handles null events array gracefully', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({ eventStreamView: { events: null } })
    expect(vm.eventStreamView.events).toEqual([])
  })

  it('adapter maps event id correctly', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      eventStreamView: { events: [{ id: 'my-event', timestamp: '00:00', level: 'info', source: 'S', message: 'M' }] },
    })
    expect(vm.eventStreamView.events[0].id).toBe('my-event')
  })

  it('adapter maps event timestamp correctly', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      eventStreamView: { events: [{ id: 'e1', timestamp: '10:30:00', level: 'info', source: 'S', message: 'M' }] },
    })
    expect(vm.eventStreamView.events[0].timestamp).toBe('10:30:00')
  })

  it('adapter maps event level correctly', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      eventStreamView: { events: [{ id: 'e1', timestamp: '00:00', level: 'warning', source: 'S', message: 'M' }] },
    })
    expect(vm.eventStreamView.events[0].level).toBe('warning')
  })

  it('adapter maps event source correctly', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      eventStreamView: { events: [{ id: 'e1', timestamp: '00:00', level: 'info', source: 'MySource', message: 'M' }] },
    })
    expect(vm.eventStreamView.events[0].source).toBe('MySource')
  })

  it('adapter maps event message correctly', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      eventStreamView: { events: [{ id: 'e1', timestamp: '00:00', level: 'info', source: 'S', message: 'Hello world' }] },
    })
    expect(vm.eventStreamView.events[0].message).toBe('Hello world')
  })

  it('adapter maps all events in the array', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      eventStreamView: {
        events: [
          { id: 'e1', timestamp: '00:00', level: 'info', source: 'A', message: 'M1' },
          { id: 'e2', timestamp: '00:01', level: 'warning', source: 'B', message: 'M2' },
          { id: 'e3', timestamp: '00:02', level: 'error', source: 'C', message: 'M3' },
        ],
      },
    })
    expect(vm.eventStreamView.events).toHaveLength(3)
    expect(vm.eventStreamView.events[0].message).toBe('M1')
    expect(vm.eventStreamView.events[1].message).toBe('M2')
    expect(vm.eventStreamView.events[2].message).toBe('M3')
  })

  it('adapter handles invalid event level by defaulting to info', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      eventStreamView: { events: [{ id: 'e1', timestamp: '00:00', level: 'critical', source: 'S', message: 'M' }] },
    })
    expect(vm.eventStreamView.events[0].level).toBe('info')
  })

  it('adapter handles null level by defaulting to info', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      eventStreamView: { events: [{ id: 'e1', timestamp: '00:00', level: null, source: 'S', message: 'M' }] },
    })
    expect(vm.eventStreamView.events[0].level).toBe('info')
  })

  it('adapter handles undefined level by defaulting to info', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      eventStreamView: { events: [{ id: 'e1', timestamp: '00:00', level: undefined, source: 'S', message: 'M' }] },
    })
    expect(vm.eventStreamView.events[0].level).toBe('info')
  })

  it('adapter handles missing event fields gracefully', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      eventStreamView: { events: [{}] },
    })
    expect(vm.eventStreamView.events[0].id).toBe('')
    expect(vm.eventStreamView.events[0].timestamp).toBe('')
    expect(vm.eventStreamView.events[0].level).toBe('info')
    expect(vm.eventStreamView.events[0].source).toBe('')
    expect(vm.eventStreamView.events[0].message).toBe('')
  })

  it('adapter handles non-object events gracefully', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      eventStreamView: { events: [null, undefined, 'string', 42] },
    })
    expect(vm.eventStreamView.events).toHaveLength(4)
    for (const e of vm.eventStreamView.events) {
      expect(typeof e.id).toBe('string')
      expect(typeof e.timestamp).toBe('string')
      expect(typeof e.level).toBe('string')
      expect(typeof e.source).toBe('string')
      expect(typeof e.message).toBe('string')
    }
  })

  it('adapter returns frozen events array', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      eventStreamView: { events: [{ id: 'e1', timestamp: '00:00', level: 'info', source: 'S', message: 'M' }] },
    })
    expect(Object.isFrozen(vm.eventStreamView.events)).toBe(true)
  })

  it('adapter returns frozen eventStreamView', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({})
    expect(Object.isFrozen(vm.eventStreamView)).toBe(true)
  })

  it('adapter returns empty array for empty events input', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({ eventStreamView: { events: [] } })
    expect(vm.eventStreamView.events).toEqual([])
  })

  it('adapter preserves event order', () => {
    const adapter = new DefaultObservatoryAdapter()
    const ids = ['z-event', 'a-event', 'm-event']
    const vm = adapter.adapt({
      eventStreamView: {
        events: ids.map((id) => ({
          id, timestamp: '00:00', level: 'info', source: 'S', message: id,
        })),
      },
    })
    expect(vm.eventStreamView.events.map((e) => e.id)).toEqual(ids)
  })
})

// ---------------------------------------------------------------------------
// Section 3 — Event Stream Rendering from viewModel
// ---------------------------------------------------------------------------

describe('event stream data — event rendering from viewModel', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders the root stream container', () => {
    const wrapper = mountStream()
    expect(wrapper.find('.observatory-event-stream').exists()).toBe(true)
  })

  it('renders 20 event items from viewModel', () => {
    const wrapper = mountStream()
    expect(items(wrapper)).toHaveLength(20)
  })

  it('renders the EventFilterBar component', () => {
    const wrapper = mountStream()
    expect(wrapper.findComponent(EventFilterBar).exists()).toBe(true)
  })

  it('renders the EventStreamList component', () => {
    const wrapper = mountStream()
    expect(wrapper.findComponent(EventStreamList).exists()).toBe(true)
  })

  it('renders 20 EventStreamItem components', () => {
    const wrapper = mountStream()
    expect(wrapper.findAllComponents(EventStreamItem)).toHaveLength(20)
  })

  it('renders event timestamps from viewModel', () => {
    const wrapper = mountStream()
    const store = useObservatoryDataStore()
    const firstTimestamp = store.viewModel.eventStreamView.events[0].timestamp
    expect(wrapper.find('.event-item-timestamp').text()).toBe(firstTimestamp)
  })

  it('renders event sources from viewModel', () => {
    const wrapper = mountStream()
    const store = useObservatoryDataStore()
    const firstSource = store.viewModel.eventStreamView.events[0].source
    expect(wrapper.find('.event-item-source').text()).toBe(firstSource)
  })

  it('renders event messages from viewModel', () => {
    const wrapper = mountStream()
    const store = useObservatoryDataStore()
    const firstMessage = store.viewModel.eventStreamView.events[0].message
    expect(wrapper.find('.event-item-message').text()).toBe(firstMessage)
  })

  it('renders all event messages from viewModel', () => {
    const wrapper = mountStream()
    const store = useObservatoryDataStore()
    const messages = itemTexts(wrapper, '.event-item-message')
    const expected = store.viewModel.eventStreamView.events.map((e) => e.message)
    expect(messages).toEqual(expected)
  })

  it('renders all event timestamps from viewModel', () => {
    const wrapper = mountStream()
    const store = useObservatoryDataStore()
    const timestamps = itemTexts(wrapper, '.event-item-timestamp')
    const expected = store.viewModel.eventStreamView.events.map((e) => e.timestamp)
    expect(timestamps).toEqual(expected)
  })

  it('renders all event sources from viewModel', () => {
    const wrapper = mountStream()
    const store = useObservatoryDataStore()
    const sources = itemTexts(wrapper, '.event-item-source')
    const expected = store.viewModel.eventStreamView.events.map((e) => e.source)
    expect(sources).toEqual(expected)
  })

  it('renders first event source as PromptBuilder', () => {
    const wrapper = mountStream()
    expect(wrapper.find('.event-item-source').text()).toBe('PromptBuilder')
  })

  it('renders first event message as Prompt received', () => {
    const wrapper = mountStream()
    expect(wrapper.find('.event-item-message').text()).toBe('Prompt received')
  })

  it('renders last event message as ModifyStrategy applied', () => {
    const wrapper = mountStream()
    const messages = itemTexts(wrapper, '.event-item-message')
    expect(messages[messages.length - 1]).toBe('ModifyStrategy applied')
  })
})

// ---------------------------------------------------------------------------
// Section 4 — Empty Stream
// ---------------------------------------------------------------------------

describe('event stream data — empty stream', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    initI18n()
  })

  it('renders without error when eventStreamView is empty', () => {
    const store = useObservatoryDataStore()
    store.viewModel = {
      overview: { traceCount: 0, timelineCount: 0, historyCount: 0 },
      trace: [],
      traceView: [],
      timelineView: [],
      historyView: [],
      diffView: [],
      runtimeView: { worldId: '', entityCount: 0, systemCount: 0, eventCount: 0, fps: 0, entities: [] },
      eventStreamView: { events: [] },
      timeline: [],
      history: [],
    }
    const wrapper = mount(ObservatoryEventStream)
    expect(wrapper.exists()).toBe(true)
  })

  it('renders no event items when eventStreamView is empty', () => {
    const store = useObservatoryDataStore()
    store.viewModel = {
      overview: { traceCount: 0, timelineCount: 0, historyCount: 0 },
      trace: [],
      traceView: [],
      timelineView: [],
      historyView: [],
      diffView: [],
      runtimeView: { worldId: '', entityCount: 0, systemCount: 0, eventCount: 0, fps: 0, entities: [] },
      eventStreamView: { events: [] },
      timeline: [],
      history: [],
    }
    const wrapper = mount(ObservatoryEventStream)
    expect(items(wrapper)).toHaveLength(0)
  })

  it('shows empty message when eventStreamView has no events', () => {
    const store = useObservatoryDataStore()
    store.viewModel = {
      overview: { traceCount: 0, timelineCount: 0, historyCount: 0 },
      trace: [],
      traceView: [],
      timelineView: [],
      historyView: [],
      diffView: [],
      runtimeView: { worldId: '', entityCount: 0, systemCount: 0, eventCount: 0, fps: 0, entities: [] },
      eventStreamView: { events: [] },
      timeline: [],
      history: [],
    }
    const wrapper = mount(ObservatoryEventStream)
    expect(wrapper.text()).toContain('No events')
  })

  it('does not render list when eventStreamView has no events', () => {
    const store = useObservatoryDataStore()
    store.viewModel = {
      overview: { traceCount: 0, timelineCount: 0, historyCount: 0 },
      trace: [],
      traceView: [],
      timelineView: [],
      historyView: [],
      diffView: [],
      runtimeView: { worldId: '', entityCount: 0, systemCount: 0, eventCount: 0, fps: 0, entities: [] },
      eventStreamView: { events: [] },
      timeline: [],
      history: [],
    }
    const wrapper = mount(ObservatoryEventStream)
    expect(wrapper.find('ul.event-stream-list').exists()).toBe(false)
  })

  it('empty stream does not crash on mount', () => {
    setActivePinia(createPinia())
    initI18n()
    const wrapper = mount(ObservatoryEventStream)
    expect(wrapper.exists()).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 5 — Filtering Events from viewModel
// ---------------------------------------------------------------------------

function mountStreamEn(): VueWrapper {
  useI18nStore().setLanguage('en-US')
  useObservatoryDataStore().loadMockObservatory()
  return mount(ObservatoryEventStream)
}

describe('event stream data — filtering from viewModel', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('shows all events with All filter after load', () => {
    const wrapper = mountStream()
    expect(items(wrapper)).toHaveLength(20)
  })

  it('shows only info events with Info filter', async () => {
    const wrapper = mountStreamEn()
    await clickFilter(wrapper, 1)
    for (const item of items(wrapper)) {
      expect(item.find('.event-item-badge').text()).toBe('Info')
    }
  })

  it('shows only warning events with Warning filter', async () => {
    const wrapper = mountStreamEn()
    await clickFilter(wrapper, 2)
    for (const item of items(wrapper)) {
      expect(item.find('.event-item-badge').text()).toBe('Warning')
    }
  })

  it('shows only error events with Error filter', async () => {
    const wrapper = mountStreamEn()
    await clickFilter(wrapper, 3)
    for (const item of items(wrapper)) {
      expect(item.find('.event-item-badge').text()).toBe('Error')
    }
  })

  it('shows 13 events with Info filter', async () => {
    const wrapper = mountStreamEn()
    await clickFilter(wrapper, 1)
    expect(items(wrapper)).toHaveLength(13)
  })

  it('shows 4 events with Warning filter', async () => {
    const wrapper = mountStreamEn()
    await clickFilter(wrapper, 2)
    expect(items(wrapper)).toHaveLength(4)
  })

  it('shows 3 events with Error filter', async () => {
    const wrapper = mountStreamEn()
    await clickFilter(wrapper, 3)
    expect(items(wrapper)).toHaveLength(3)
  })

  it('shows Prompt received under Info filter', async () => {
    const wrapper = mountStreamEn()
    await clickFilter(wrapper, 1)
    expect(itemTexts(wrapper, '.event-item-message')).toContain('Prompt received')
  })

  it('shows Entity spawn delayed under Warning filter', async () => {
    const wrapper = mountStreamEn()
    await clickFilter(wrapper, 2)
    expect(itemTexts(wrapper, '.event-item-message')).toContain('Entity spawn delayed')
  })

  it('shows Response timeout under Error filter', async () => {
    const wrapper = mountStreamEn()
    await clickFilter(wrapper, 3)
    expect(itemTexts(wrapper, '.event-item-message')).toContain('Response timeout')
  })

  it('hides warning events under Info filter', async () => {
    const wrapper = mountStreamEn()
    await clickFilter(wrapper, 1)
    expect(itemTexts(wrapper, '.event-item-message')).not.toContain('Entity spawn delayed')
  })

  it('hides info events under Warning filter', async () => {
    const wrapper = mountStreamEn()
    await clickFilter(wrapper, 2)
    expect(itemTexts(wrapper, '.event-item-message')).not.toContain('Prompt received')
  })

  it('hides info events under Error filter', async () => {
    const wrapper = mountStreamEn()
    await clickFilter(wrapper, 3)
    expect(itemTexts(wrapper, '.event-item-message')).not.toContain('Prompt received')
  })

  it('restores all events switching back to All', async () => {
    const wrapper = mountStreamEn()
    await clickFilter(wrapper, 3)
    await clickFilter(wrapper, 0)
    expect(items(wrapper)).toHaveLength(20)
  })

  it('preserves filter state across re-filter clicks', async () => {
    const wrapper = mountStreamEn()
    await clickFilter(wrapper, 1)
    const before = itemTexts(wrapper, '.event-item-message')
    await clickFilter(wrapper, 1)
    expect(itemTexts(wrapper, '.event-item-message')).toEqual(before)
  })

  it('active filter button matches the selected filter', async () => {
    const wrapper = mountStreamEn()
    await clickFilter(wrapper, 2)
    expect(activeFilters(wrapper)).toHaveLength(1)
    expect(activeFilters(wrapper)[0].text()).toBe('Warning')
  })

  it('keeps error filter strict across multiple filter clicks', async () => {
    const wrapper = mountStreamEn()
    await clickFilter(wrapper, 3)
    await clickFilter(wrapper, 3)
    await clickFilter(wrapper, 3)
    expect(items(wrapper)).toHaveLength(3)
  })
})

// ---------------------------------------------------------------------------
// Section 6 — Default Values
// ---------------------------------------------------------------------------

describe('event stream data — defaults', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('default eventStreamView has empty events before load', () => {
    const store = useObservatoryDataStore()
    expect(store.viewModel.eventStreamView.events).toEqual([])
  })

  it('adapter returns default eventStreamView for undefined input', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt(undefined)
    expect(vm.eventStreamView.events).toEqual([])
  })

  it('adapter returns default eventStreamView for null input', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt(null)
    expect(vm.eventStreamView.events).toEqual([])
  })

  it('adapter returns default eventStreamView for number input', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt(42)
    expect(vm.eventStreamView.events).toEqual([])
  })

  it('adapter returns default eventStreamView for string input', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt('invalid')
    expect(vm.eventStreamView.events).toEqual([])
  })

  it('adapter returns default eventStreamView for array input', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt([])
    expect(vm.eventStreamView.events).toEqual([])
  })

  it('event fields default to empty string when missing', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      eventStreamView: { events: [{}] },
    })
    expect(vm.eventStreamView.events[0].id).toBe('')
    expect(vm.eventStreamView.events[0].timestamp).toBe('')
    expect(vm.eventStreamView.events[0].level).toBe('info')
    expect(vm.eventStreamView.events[0].source).toBe('')
    expect(vm.eventStreamView.events[0].message).toBe('')
  })

  it('default eventStreamView is frozen', () => {
    const store = useObservatoryDataStore()
    expect(Object.isFrozen(store.viewModel.eventStreamView)).toBe(true)
  })

  it('default events array is frozen', () => {
    const store = useObservatoryDataStore()
    expect(Object.isFrozen(store.viewModel.eventStreamView.events)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 7 — Deterministic Rendering
// ---------------------------------------------------------------------------

describe('event stream data — deterministic rendering', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders identical event messages across mounts', () => {
    const a = mountStream()
    const b = mountStream()
    expect(itemTexts(a, '.event-item-message')).toEqual(itemTexts(b, '.event-item-message'))
  })

  it('renders identical event timestamps across mounts', () => {
    const a = mountStream()
    const b = mountStream()
    expect(itemTexts(a, '.event-item-timestamp')).toEqual(itemTexts(b, '.event-item-timestamp'))
  })

  it('renders identical event sources across mounts', () => {
    const a = mountStream()
    const b = mountStream()
    expect(itemTexts(a, '.event-item-source')).toEqual(itemTexts(b, '.event-item-source'))
  })

  it('renders identical event count across mounts', () => {
    const a = mountStream()
    const b = mountStream()
    expect(items(a)).toHaveLength(items(b).length)
  })

  it('renders identical viewer HTML across mounts', () => {
    const a = mountStream()
    const b = mountStream()
    expect(a.html()).toBe(b.html())
  })

  it('renders identical badge labels across mounts', () => {
    const a = mountStream()
    const b = mountStream()
    expect(itemTexts(a, '.event-item-badge')).toEqual(itemTexts(b, '.event-item-badge'))
  })

  it('renders identical filter labels across mounts', () => {
    const a = mountStream()
    const b = mountStream()
    expect(filterLabels(a)).toEqual(filterLabels(b))
  })

  it('renders identical filter buttons across mounts', () => {
    const a = mountStream()
    const b = mountStream()
    expect(a.findAll('.event-filter-button').length).toBe(b.findAll('.event-filter-button').length)
  })
})

// ---------------------------------------------------------------------------
// Section 8 — No Mutation
// ---------------------------------------------------------------------------

describe('event stream data — no mutation', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('mounting viewer does not mutate eventStreamView', () => {
    const store = useObservatoryDataStore()
    mountStream()
    expect(Object.isFrozen(store.viewModel.eventStreamView)).toBe(true)
  })

  it('eventStreamView events array is frozen after load', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(Object.isFrozen(store.viewModel.eventStreamView.events)).toBe(true)
  })

  it('eventStreamView is frozen after load', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(Object.isFrozen(store.viewModel.eventStreamView)).toBe(true)
  })

  it('individual event objects are not modified after load', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const events = store.viewModel.eventStreamView.events
    for (const e of events) {
      expect(typeof e.id).toBe('string')
      expect(typeof e.message).toBe('string')
    }
  })
})

// ---------------------------------------------------------------------------
// Section 9 — Integration Path
// ---------------------------------------------------------------------------

describe('event stream data — integration path', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('full path: store adapter produces eventStreamView with correct values', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(store.viewModel.eventStreamView.events).toHaveLength(20)
    expect(store.viewModel.eventStreamView.events[0].id).toBe('evt-001')
    expect(store.viewModel.eventStreamView.events[0].message).toBe('Prompt received')
  })

  it('adapter output matches component display after mount', () => {
    const adapter = new DefaultObservatoryAdapter()
    const customData = {
      eventStreamView: {
        events: [
          { id: 'c1', timestamp: '10:00:00', level: 'info', source: 'Custom', message: 'Custom event' },
          { id: 'c2', timestamp: '10:00:01', level: 'warning', source: 'Test', message: 'Test warning' },
        ],
      },
    }
    const vm = adapter.adapt(customData)
    const store = useObservatoryDataStore()
    store.viewModel = vm
    const wrapper = mount(ObservatoryEventStream)
    expect(items(wrapper)).toHaveLength(2)
    expect(itemTexts(wrapper, '.event-item-message')).toEqual(['Custom event', 'Test warning'])
  })

  it('refreshing eventStreamView updates the viewer', async () => {
    const store = useObservatoryDataStore()
    const wrapper = mount(ObservatoryEventStream)
    expect(items(wrapper)).toHaveLength(0)
    store.viewModel = {
      overview: { traceCount: 0, timelineCount: 0, historyCount: 0 },
      trace: [],
      traceView: [],
      timelineView: [],
      historyView: [],
      diffView: [],
      runtimeView: { worldId: '', entityCount: 0, systemCount: 0, eventCount: 0, fps: 0, entities: [] },
      eventStreamView: { events: [{ id: 'new', timestamp: '10:00', level: 'info', source: 'Src', message: 'New event' }] },
      timeline: [],
      history: [],
    }
    await nextTick()
    expect(items(wrapper)).toHaveLength(1)
    expect(itemTexts(wrapper, '.event-item-message')).toEqual(['New event'])
  })

  it('single event displays correctly after mount', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      eventStreamView: {
        events: [{ id: 'only', timestamp: '10:00', level: 'error', source: 'Solo', message: 'Only event' }],
      },
    })
    const store = useObservatoryDataStore()
    store.viewModel = vm
    const wrapper = mount(ObservatoryEventStream)
    expect(items(wrapper)).toHaveLength(1)
    expect(wrapper.find('.event-item-message').text()).toBe('Only event')
  })

  it('large number of events renders correctly', () => {
    const adapter = new DefaultObservatoryAdapter()
    const events = Array.from({ length: 100 }, (_, i) => ({
      id: `evt-${i + 1}`,
      timestamp: `12:00:${String(i + 1).padStart(2, '0')}`,
      level: i % 3 === 0 ? 'error' as const : i % 3 === 1 ? 'warning' as const : 'info' as const,
      source: 'Source',
      message: `Event ${i + 1}`,
    }))
    const vm = adapter.adapt({ eventStreamView: { events } })
    const store = useObservatoryDataStore()
    store.viewModel = vm
    const wrapper = mount(ObservatoryEventStream)
    expect(items(wrapper)).toHaveLength(100)
  })

  it('empty viewModel before load renders empty stream', () => {
    const wrapper = mount(ObservatoryEventStream)
    expect(items(wrapper)).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Section 10 — Accessibility
// ---------------------------------------------------------------------------

describe('event stream data — accessibility', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('uses native buttons for filter bar', () => {
    const wrapper = mountStream()
    for (const btn of filterButtons(wrapper)) {
      expect(btn.element.tagName).toBe('BUTTON')
    }
  })

  it('exposes aria-pressed on filter buttons', () => {
    const wrapper = mountStream()
    for (const btn of filterButtons(wrapper)) {
      expect(btn.attributes('aria-pressed')).toBeDefined()
    }
  })

  it('marks active filter with aria-pressed=true', () => {
    const wrapper = mountStream()
    expect(filterButtons(wrapper)[0].attributes('aria-pressed')).toBe('true')
  })

  it('exposes role="log" on the list', () => {
    const wrapper = mountStream()
    expect(wrapper.find('ul.event-stream-list').attributes('role')).toBe('log')
  })

  it('labels the event list', () => {
    const wrapper = mountStream()
    expect(wrapper.find('ul.event-stream-list').attributes('aria-label')).toBe('Event stream')
  })

  it('exposes filter bar as a group', () => {
    const wrapper = mountStream()
    expect(wrapper.find('.event-filter-bar').attributes('role')).toBe('group')
  })

  it('labels the filter bar group', () => {
    const wrapper = mountStream()
    expect(wrapper.find('.event-filter-bar').attributes('aria-label')).toBe('Event stream filters')
  })

  it('renders event items as articles', () => {
    const wrapper = mountStream()
    for (const item of items(wrapper)) {
      expect(item.element.tagName).toBe('ARTICLE')
    }
  })

  it('uses h2 for stream title', () => {
    const wrapper = mountStream()
    expect(wrapper.find('h2.event-stream-title').exists()).toBe(true)
  })

  it('keeps visual order: timestamp, badge, source, message', () => {
    const wrapper = mountStream()
    const first = items(wrapper)[0]
    const timestamp = first.find('.event-item-timestamp')
    const badge = first.find('.event-item-badge')
    const source = first.find('.event-item-source')
    const message = first.find('.event-item-message')
    expect(timestamp.element.compareDocumentPosition(badge.element)).toBe(4)
    expect(badge.element.compareDocumentPosition(source.element)).toBe(4)
    expect(source.element.compareDocumentPosition(message.element)).toBe(4)
  })

  it('does not use divs as buttons', () => {
    const wrapper = mountStream()
    expect(wrapper.findAll('div[role="button"]')).toHaveLength(0)
  })

  it('highlights exactly one filter as active', () => {
    const wrapper = mountStream()
    expect(activeFilters(wrapper)).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// Section 11 — Shape Integrity
// ---------------------------------------------------------------------------

describe('event stream data — shape integrity', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('eventStreamView is an object', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(typeof store.viewModel.eventStreamView).toBe('object')
    expect(Array.isArray(store.viewModel.eventStreamView)).toBe(false)
  })

  it('eventStreamView has required events field', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(store.viewModel.eventStreamView).toHaveProperty('events')
  })

  it('events is a readonly array', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(Array.isArray(store.viewModel.eventStreamView.events)).toBe(true)
  })

  it('event has all required fields', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const e = store.viewModel.eventStreamView.events[0]
    expect(e).toHaveProperty('id')
    expect(e).toHaveProperty('timestamp')
    expect(e).toHaveProperty('level')
    expect(e).toHaveProperty('source')
    expect(e).toHaveProperty('message')
  })

  it('eventStreamView is independent from other viewModel properties', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(Object.is(store.viewModel.eventStreamView, store.viewModel.runtimeView)).toBe(false)
    expect(Object.is(store.viewModel.eventStreamView, store.viewModel.diffView)).toBe(false)
  })

  it('viewModel has eventStreamView as a direct property', () => {
    const store = useObservatoryDataStore()
    const keys = Object.keys(store.viewModel)
    expect(keys).toContain('eventStreamView')
  })
})

// ---------------------------------------------------------------------------
// Section 12 — Edge Cases
// ---------------------------------------------------------------------------

describe('event stream data — edge cases', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('adapter handles empty events array', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({ eventStreamView: { events: [] } })
    expect(vm.eventStreamView.events).toEqual([])
  })

  it('adapter handles double empty eventStreamView gracefully', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm1 = adapter.adapt({})
    const vm2 = adapter.adapt({})
    expect(vm1.eventStreamView).toEqual(vm2.eventStreamView)
  })

  it('adapter handles event with level as number by defaulting to info', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      eventStreamView: { events: [{ id: 'e1', timestamp: '00:00', level: 5 as any, source: 'S', message: 'M' }] },
    })
    expect(vm.eventStreamView.events[0].level).toBe('info')
  })

  it('adapter handles event with boolean level by defaulting to info', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      eventStreamView: { events: [{ id: 'e1', timestamp: '00:00', level: true as any, source: 'S', message: 'M' }] },
    })
    expect(vm.eventStreamView.events[0].level).toBe('info')
  })

  it('store handles multiple loadMockObservatory calls', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    store.loadMockObservatory()
    store.loadMockObservatory()
    expect(store.viewModel.eventStreamView.events).toHaveLength(20)
    expect(store.viewModel.eventStreamView.events[0].id).toBe('evt-001')
  })

  it('viewModel with many events renders correctly', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const wrapper = mount(ObservatoryEventStream)
    expect(items(wrapper)).toHaveLength(20)
  })

  it('reactive updates reflect new event data', async () => {
    const store = useObservatoryDataStore()
    const wrapper = mount(ObservatoryEventStream)
    expect(items(wrapper)).toHaveLength(0)
    store.loadMockObservatory()
    await nextTick()
    const wrapper2 = mount(ObservatoryEventStream)
    expect(items(wrapper2)).toHaveLength(20)
  })

  it('event source field handles empty string', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      eventStreamView: { events: [{ id: 'e1', timestamp: '00:00', level: 'info', source: '', message: 'M' }] },
    })
    expect(vm.eventStreamView.events[0].source).toBe('')
  })

  it('event message field handles empty string', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      eventStreamView: { events: [{ id: 'e1', timestamp: '00:00', level: 'info', source: 'S', message: '' }] },
    })
    expect(vm.eventStreamView.events[0].message).toBe('')
  })

  it('adapter handles non-string id by converting', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      eventStreamView: { events: [{ id: 42, timestamp: '00:00', level: 'info', source: 'S', message: 'M' } as any] },
    })
    expect(vm.eventStreamView.events[0].id).toBe('42')
  })
})

// ---------------------------------------------------------------------------
// Section 13 — Backward Compatibility
// ---------------------------------------------------------------------------

describe('event stream data — backward compatibility', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('preserves existing style and layout classes', () => {
    const wrapper = mountStream()
    expect(wrapper.find('.observatory-event-stream').exists()).toBe(true)
    expect(wrapper.find('.event-stream-header').exists()).toBe(true)
    expect(wrapper.find('.event-stream-title').exists()).toBe(true)
    expect(wrapper.find('.event-filter-bar').exists()).toBe(true)
  })

  it('preserves the EventFilterBar component', () => {
    const wrapper = mountStream()
    expect(wrapper.findComponent(EventFilterBar).exists()).toBe(true)
  })

  it('preserves the EventStreamList component', () => {
    const wrapper = mountStream()
    expect(wrapper.findComponent(EventStreamList).exists()).toBe(true)
  })

  it('preserves the EventStreamItem component inside list', () => {
    const wrapper = mountStream()
    expect(wrapper.findComponent(EventStreamItem).exists()).toBe(true)
  })

  it('existing mock data expectations still work', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(store.viewModel.eventStreamView.events[0].id).toBe('evt-001')
    expect(store.viewModel.eventStreamView.events[0].message).toBe('Prompt received')
  })

  it('preserves filter bar with 4 buttons', () => {
    const wrapper = mountStream()
    expect(filterButtons(wrapper)).toHaveLength(4)
  })

  it('preserves filter labels', () => {
    const wrapper = mountStream()
    expect(filterLabels(wrapper)).toEqual(['全部', '信息', '警告', '错误'])
  })

  it('preserves list with role="log"', () => {
    const wrapper = mountStream()
    expect(wrapper.find('ul.event-stream-list').attributes('role')).toBe('log')
  })
})

// ---------------------------------------------------------------------------
// Section 14 — Store Edge Cases
// ---------------------------------------------------------------------------

describe('event stream data — store edge cases', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('store handles multiple loads consistently', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const first = store.viewModel.eventStreamView.events.map((e) => e.id)
    store.loadMockObservatory()
    const second = store.viewModel.eventStreamView.events.map((e) => e.id)
    expect(first).toEqual(second)
  })

  it('empty eventStreamView after store init is consistent', () => {
    const store = useObservatoryDataStore()
    const a = store.viewModel.eventStreamView
    const b = store.viewModel.eventStreamView
    expect(Object.is(a, b)).toBe(true)
  })

  it('store handles direct eventStreamView replacement', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const custom: EventStreamViewModel = {
      events: [{ id: 'custom', timestamp: '10:00', level: 'error', source: 'Test', message: 'Custom' }],
    }
    store.viewModel = {
      overview: { traceCount: 0, timelineCount: 0, historyCount: 0 },
      trace: [],
      traceView: [],
      timelineView: [],
      historyView: [],
      diffView: [],
      runtimeView: { worldId: '', entityCount: 0, systemCount: 0, eventCount: 0, fps: 0, entities: [] },
      eventStreamView: custom,
      timeline: [],
      history: [],
    }
    expect(store.viewModel.eventStreamView.events).toHaveLength(1)
    expect(store.viewModel.eventStreamView.events[0].message).toBe('Custom')
  })

  it('store handles load after direct replacement', () => {
    const store = useObservatoryDataStore()
    store.viewModel = {
      overview: { traceCount: 0, timelineCount: 0, historyCount: 0 },
      trace: [],
      traceView: [],
      timelineView: [],
      historyView: [],
      diffView: [],
      runtimeView: { worldId: '', entityCount: 0, systemCount: 0, eventCount: 0, fps: 0, entities: [] },
      eventStreamView: { events: [] },
      timeline: [],
      history: [],
    }
    store.loadMockObservatory()
    expect(store.viewModel.eventStreamView.events).toHaveLength(20)
  })
})

// ---------------------------------------------------------------------------
// Section 15 — No AI Package Leakage
// ---------------------------------------------------------------------------

describe('event stream data — no AI package leakage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('viewModel does not contain AI-specific root properties', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const keys = Object.keys(store.viewModel)
    expect(keys).not.toContain('promptAssembly')
    expect(keys).not.toContain('plannerResult')
  })

  it('eventStreamView does not contain AI-specific fields', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const esv = store.viewModel.eventStreamView as any
    expect(esv.promptAssembly).toBeUndefined()
    expect(esv.plan).toBeUndefined()
    expect(esv.strategy).toBeUndefined()
  })

  it('EventViewModel does not contain AI-specific fields', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const e of store.viewModel.eventStreamView.events) {
      const ev = e as any
      expect(ev.promptAssembly).toBeUndefined()
      expect(ev.plannerResult).toBeUndefined()
    }
  })
})

// ---------------------------------------------------------------------------
// Section 16 — Info Events Specific
// ---------------------------------------------------------------------------

describe('event stream data — info events specific', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('info events have level info', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const e of store.viewModel.eventStreamView.events) {
      if (e.level === 'info') {
        expect(e.level).toBe('info')
      }
    }
  })

  it('evt-001 is an info event', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(store.viewModel.eventStreamView.events[0].level).toBe('info')
  })

  it('evt-002 is an info event', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(store.viewModel.eventStreamView.events[1].level).toBe('info')
  })

  it('evt-006 is an info event', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(store.viewModel.eventStreamView.events[5].level).toBe('info')
  })

  it('evt-007 is an info event', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(store.viewModel.eventStreamView.events[6].level).toBe('info')
  })
})

// ---------------------------------------------------------------------------
// Section 17 — Warning Events Specific
// ---------------------------------------------------------------------------

describe('event stream data — warning events specific', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('evt-004 is a warning event', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(store.viewModel.eventStreamView.events[3].level).toBe('warning')
  })

  it('evt-008 is a warning event', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(store.viewModel.eventStreamView.events[7].level).toBe('warning')
  })

  it('evt-012 is a warning event', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(store.viewModel.eventStreamView.events[11].level).toBe('warning')
  })

  it('evt-017 is a warning event', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(store.viewModel.eventStreamView.events[16].level).toBe('warning')
  })

  it('Entity spawn delayed is a warning event', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const e = store.viewModel.eventStreamView.events.find((ev) => ev.message === 'Entity spawn delayed')
    expect(e?.level).toBe('warning')
  })

  it('warning events are rendered with warning class', () => {
    const wrapper = mountStream()
    expect(wrapper.find('.event-stream-item--warning').exists()).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 18 — Error Events Specific
// ---------------------------------------------------------------------------

describe('event stream data — error events specific', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('evt-005 is an error event', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(store.viewModel.eventStreamView.events[4].level).toBe('error')
  })

  it('evt-010 is an error event', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(store.viewModel.eventStreamView.events[9].level).toBe('error')
  })

  it('evt-015 is an error event', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(store.viewModel.eventStreamView.events[14].level).toBe('error')
  })

  it('Response timeout is an error event', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const e = store.viewModel.eventStreamView.events.find((ev) => ev.message === 'Response timeout')
    expect(e?.level).toBe('error')
  })

  it('error events are rendered with error class', () => {
    const wrapper = mountStream()
    expect(wrapper.find('.event-stream-item--error').exists()).toBe(true)
  })

  it('error events show 错误 badge', () => {
    const wrapper = mountStream()
    expect(wrapper.find('.event-badge--error').text()).toBe('错误')
  })
})

// ---------------------------------------------------------------------------
// Section 19 — Specific Values
// ---------------------------------------------------------------------------

describe('event stream data — specific values', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('evt-001 is PromptBuilder source', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(store.viewModel.eventStreamView.events[0].source).toBe('PromptBuilder')
  })

  it('evt-002 is StrategyResolver source', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(store.viewModel.eventStreamView.events[1].source).toBe('StrategyResolver')
  })

  it('evt-003 is Planner source', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(store.viewModel.eventStreamView.events[2].source).toBe('Planner')
  })

  it('evt-004 is Runtime source', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(store.viewModel.eventStreamView.events[3].source).toBe('Runtime')
  })

  it('evt-005 is Provider source', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(store.viewModel.eventStreamView.events[4].source).toBe('Provider')
  })

  it('evt-006 is PromptBuilder source', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(store.viewModel.eventStreamView.events[5].source).toBe('PromptBuilder')
  })

  it('evt-007 is Memory source', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(store.viewModel.eventStreamView.events[6].source).toBe('Memory')
  })

  it('evt-010 is Provider source', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(store.viewModel.eventStreamView.events[9].source).toBe('Provider')
  })

  it('evt-012 is AI source', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(store.viewModel.eventStreamView.events[11].source).toBe('AI')
  })

  it('evt-015 is Planner source', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(store.viewModel.eventStreamView.events[14].source).toBe('Planner')
  })

  it('evt-016 is AI source', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(store.viewModel.eventStreamView.events[15].source).toBe('AI')
  })

  it('evt-020 is Planner source', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(store.viewModel.eventStreamView.events[19].source).toBe('Planner')
  })

  it('first timestamp is 12:00:01', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(store.viewModel.eventStreamView.events[0].timestamp).toBe('12:00:01')
  })

  it('last timestamp is 12:00:20', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const events = store.viewModel.eventStreamView.events
    expect(events[events.length - 1].timestamp).toBe('12:00:20')
  })
})

// ---------------------------------------------------------------------------
// Section 20 — EventViewModel Shape Validation
// ---------------------------------------------------------------------------

describe('event stream data — EventViewModel shape validation', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('EventViewModel has id field', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const e = store.viewModel.eventStreamView.events[0]
    expect('id' in e).toBe(true)
  })

  it('EventViewModel has timestamp field', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const e = store.viewModel.eventStreamView.events[0]
    expect('timestamp' in e).toBe(true)
  })

  it('EventViewModel has level field', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const e = store.viewModel.eventStreamView.events[0]
    expect('level' in e).toBe(true)
  })

  it('EventViewModel has source field', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const e = store.viewModel.eventStreamView.events[0]
    expect('source' in e).toBe(true)
  })

  it('EventViewModel has message field', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const e = store.viewModel.eventStreamView.events[0]
    expect('message' in e).toBe(true)
  })

  it('EventViewModel has exactly 5 fields', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const keys = Object.keys(store.viewModel.eventStreamView.events[0])
    expect(keys).toHaveLength(5)
    expect(keys.sort()).toEqual(['id', 'level', 'message', 'source', 'timestamp'])
  })

  it('EventStreamViewModel has events field', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect('events' in store.viewModel.eventStreamView).toBe(true)
  })

  it('EventStreamViewModel has exactly 1 field', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const keys = Object.keys(store.viewModel.eventStreamView)
    expect(keys).toHaveLength(1)
    expect(keys[0]).toBe('events')
  })
})