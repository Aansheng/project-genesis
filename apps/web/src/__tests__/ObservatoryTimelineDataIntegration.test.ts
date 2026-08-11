/**
 * ObservatoryTimelineDataIntegration — verifies the full data integration path
 * for the Timeline Viewer panel from the observatoryData store
 * (via DefaultObservatoryAdapter) through the timeline viewer components.
 *
 * WO-S6-015 — Observatory Timeline Real Data Integration
 * Architecture version v1.45
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

import { useObservatoryDataStore } from '../stores/observatoryData'
import { DefaultObservatoryAdapter } from '../adapters/observatory'
import ObservatoryTimelineViewer from '../components/observatory/timeline/ObservatoryTimelineViewer.vue'
import TimelineList from '../components/observatory/timeline/TimelineList.vue'
import TimelineDetails from '../components/observatory/timeline/TimelineDetails.vue'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mountViewer(): VueWrapper {
  useObservatoryDataStore().loadMockObservatory()
  return mount(ObservatoryTimelineViewer)
}

function rows(wrapper: VueWrapper): ReturnType<VueWrapper['findAll']> {
  return wrapper.findAll('.timeline-row')
}

function activeRows(wrapper: VueWrapper): ReturnType<VueWrapper['findAll']> {
  return rows(wrapper).filter((r) => r.classes().includes('timeline-row--active'))
}

function rowTexts(wrapper: VueWrapper, selector: string): string[] {
  return wrapper.findAll(selector).map((el) => el.text().trim())
}

function entryCards(wrapper: VueWrapper): ReturnType<VueWrapper['findAll']> {
  return wrapper.findAll('.timeline-entry-card')
}

function entryTexts(wrapper: VueWrapper, selector: string): string[] {
  return wrapper.findAll(selector).map((el) => el.text().trim())
}

function entryCardTitles(wrapper: VueWrapper): string[] {
  return wrapper.findAll('.timeline-entry-card-title').map((el) => el.text().trim())
}

async function pressKey(wrapper: VueWrapper, key: string): Promise<void> {
  await wrapper.find('nav.timeline-list').trigger('keydown', { key })
  await nextTick()
}

// ---------------------------------------------------------------------------
// Section 1 — Store timelineView Integration
// ---------------------------------------------------------------------------

describe('timeline data — store timelineView integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('store initializes with empty timelineView', () => {
    const store = useObservatoryDataStore()
    expect(store.viewModel.timelineView).toEqual([])
  })

  it('loadMockObservatory populates timelineView with 3 entries', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(store.viewModel.timelineView).toHaveLength(3)
  })

  it('timelineView entries have id field', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const t of store.viewModel.timelineView) {
      expect(typeof t.id).toBe('string')
      expect(t.id.length).toBeGreaterThan(0)
    }
  })

  it('timelineView entries have entryCount field', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const t of store.viewModel.timelineView) {
      expect(typeof t.entryCount).toBe('number')
      expect(t.entryCount).toBeGreaterThan(0)
    }
  })

  it('timelineView entries have entries array', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const t of store.viewModel.timelineView) {
      expect(Array.isArray(t.entries)).toBe(true)
    }
  })

  it('timelineView entryCount matches entries.length', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const t of store.viewModel.timelineView) {
      expect(t.entryCount).toBe(t.entries.length)
    }
  })

  it('timelineView entries have index field', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const t of store.viewModel.timelineView) {
      for (const e of t.entries) {
        expect(typeof e.index).toBe('number')
      }
    }
  })

  it('timelineView entries have strategy field', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const t of store.viewModel.timelineView) {
      for (const e of t.entries) {
        expect(typeof e.strategy).toBe('string')
        expect(e.strategy.length).toBeGreaterThan(0)
      }
    }
  })

  it('timelineView is frozen', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(Object.isFrozen(store.viewModel.timelineView)).toBe(true)
  })

  it('timelineView entry ids are timeline-001, timeline-002, timeline-003', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const ids = store.viewModel.timelineView.map((t) => t.id)
    expect(ids).toEqual(['timeline-001', 'timeline-002', 'timeline-003'])
  })

  it('timeline-001 has 5 entries', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const tl = store.viewModel.timelineView.find((t) => t.id === 'timeline-001')
    expect(tl?.entryCount).toBe(5)
    expect(tl?.entries).toHaveLength(5)
  })

  it('timeline-002 has 3 entries', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const tl = store.viewModel.timelineView.find((t) => t.id === 'timeline-002')
    expect(tl?.entryCount).toBe(3)
  })

  it('timeline-003 has 4 entries', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const tl = store.viewModel.timelineView.find((t) => t.id === 'timeline-003')
    expect(tl?.entryCount).toBe(4)
  })
})

// ---------------------------------------------------------------------------
// Section 2 — Adapter Mapping
// ---------------------------------------------------------------------------

describe('timeline data — adapter timelineView mapping', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('adapter maps timelineView from raw observatory', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      timelineView: [
        { id: 'tl-1', entries: [{ index: 0, strategy: 'Create' }, { index: 1, strategy: 'Move' }] },
      ],
    })
    expect(vm.timelineView).toHaveLength(1)
    expect(vm.timelineView[0].id).toBe('tl-1')
    expect(vm.timelineView[0].entryCount).toBe(2)
  })

  it('adapter handles missing timelineView gracefully', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({})
    expect(vm.timelineView).toEqual([])
  })

  it('adapter handles null timelineView gracefully', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({ timelineView: null })
    expect(vm.timelineView).toEqual([])
  })

  it('adapter handles undefined timelineView gracefully', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({ timelineView: undefined })
    expect(vm.timelineView).toEqual([])
  })

  it('adapter handles non-array timelineView gracefully', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({ timelineView: 'invalid' })
    expect(vm.timelineView).toEqual([])
  })

  it('adapter maps entry count correctly', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      timelineView: [
        { id: 'tl-1', entries: [{ index: 0, strategy: 'A' }, { index: 1, strategy: 'B' }, { index: 2, strategy: 'C' }] },
      ],
    })
    expect(vm.timelineView[0].entryCount).toBe(3)
  })

  it('adapter maps entry index values', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      timelineView: [
        { id: 'tl-1', entries: [{ index: 5, strategy: 'X' }, { index: 10, strategy: 'Y' }] },
      ],
    })
    expect(vm.timelineView[0].entries[0].index).toBe(5)
    expect(vm.timelineView[0].entries[1].index).toBe(10)
  })

  it('adapter maps entry strategy values', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      timelineView: [
        { id: 'tl-1', entries: [{ index: 0, strategy: 'CreateWorld' }, { index: 1, strategy: 'DestroyEntity' }] },
      ],
    })
    expect(vm.timelineView[0].entries[0].strategy).toBe('CreateWorld')
    expect(vm.timelineView[0].entries[1].strategy).toBe('DestroyEntity')
  })

  it('adapter handles non-object timelineView items gracefully', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      timelineView: [null, undefined, 'string', 42],
    })
    expect(vm.timelineView).toHaveLength(4)
    for (const t of vm.timelineView) {
      expect(typeof t.id).toBe('string')
      expect(typeof t.entryCount).toBe('number')
      expect(Array.isArray(t.entries)).toBe(true)
    }
  })

  it('adapter returns frozen timelineView', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      timelineView: [{ id: 't1', entries: [{ index: 0, strategy: 'S' }] }],
    })
    expect(Object.isFrozen(vm.timelineView)).toBe(true)
  })

  it('adapter handles empty entries array', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      timelineView: [{ id: 't1', entries: [] }],
    })
    expect(vm.timelineView[0].entryCount).toBe(0)
    expect(vm.timelineView[0].entries).toEqual([])
  })

  it('adapter returns frozen entries arrays', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      timelineView: [{ id: 't1', entries: [{ index: 0, strategy: 'S' }] }],
    })
    expect(Object.isFrozen(vm.timelineView[0].entries)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 3 — Timeline Viewer Rendering
// ---------------------------------------------------------------------------

describe('timeline data — viewer rendering from viewModel', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders the root viewer container', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('.observatory-timeline-viewer').exists()).toBe(true)
  })

  it('renders 3 timeline rows from viewModel', () => {
    const wrapper = mountViewer()
    expect(rows(wrapper)).toHaveLength(3)
  })

  it('renders timeline ids from viewModel', () => {
    const wrapper = mountViewer()
    expect(rowTexts(wrapper, '.timeline-row-id')).toEqual([
      'timeline-001',
      'timeline-002',
      'timeline-003',
    ])
  })

  it('renders entry counts from viewModel', () => {
    const wrapper = mountViewer()
    expect(rowTexts(wrapper, '.timeline-row-count')).toEqual([
      '5 entries',
      '3 entries',
      '4 entries',
    ])
  })

  it('renders the TimelineList component', () => {
    const wrapper = mountViewer()
    expect(wrapper.findComponent(TimelineList).exists()).toBe(true)
  })

  it('renders the TimelineDetails component', () => {
    const wrapper = mountViewer()
    expect(wrapper.findComponent(TimelineDetails).exists()).toBe(true)
  })

  it('renders "Timeline List" as h2 heading', () => {
    const wrapper = mountViewer()
    const h2 = wrapper.find('.timeline-list-title')
    expect(h2.exists()).toBe(true)
    expect(h2.text()).toBe('Timeline List')
  })

  it('renders "Timeline Details" as h2 heading', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('.timeline-details-title').text()).toBe('Timeline Details')
  })

  it('renders "Timeline Entries" as h3 heading', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('.timeline-entries-title').text()).toBe('Timeline Entries')
  })

  it('renders entry cards for default timeline', () => {
    const wrapper = mountViewer()
    expect(entryCards(wrapper)).toHaveLength(5)
  })

  it('renders entry strategies from viewModel', () => {
    const wrapper = mountViewer()
    expect(entryTexts(wrapper, '.timeline-entry-card-strategy')).toEqual([
      'CreateWorld',
      'GenerateTerrain',
      'CreateFarm',
      'CreateNPC',
      'CreateQuest',
    ])
  })
})

// ---------------------------------------------------------------------------
// Section 4 — Timeline Selection
// ---------------------------------------------------------------------------

describe('timeline data — timeline selection', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('marks the first timeline row active by default', () => {
    const wrapper = mountViewer()
    expect(rows(wrapper)[0].classes()).toContain('timeline-row--active')
  })

  it('marks exactly one row active by default', () => {
    const wrapper = mountViewer()
    expect(activeRows(wrapper)).toHaveLength(1)
  })

  it('shows the first timeline id in details by default', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('.timeline-meta-grid').text()).toContain('timeline-001')
  })

  it('shows the first entry count in details by default', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('.timeline-meta-grid').text()).toContain('5')
  })

  it('selects second timeline on click', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    expect(wrapper.find('.timeline-meta-grid').text()).toContain('timeline-002')
  })

  it('clicking second timeline shows its entry count', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    expect(wrapper.find('.timeline-meta-grid').text()).toContain('3')
  })

  it('clicking third timeline shows its entry count', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[2].trigger('click')
    await nextTick()
    expect(wrapper.find('.timeline-meta-grid').text()).toContain('timeline-003')
  })

  it('moves active class to clicked row', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[2].trigger('click')
    await nextTick()
    expect(activeRows(wrapper)).toHaveLength(1)
    expect(activeRows(wrapper)[0].text()).toContain('timeline-003')
  })

  it('switches back to first timeline when re-clicked', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    await rows(wrapper)[0].trigger('click')
    await nextTick()
    expect(wrapper.find('.timeline-meta-grid').text()).toContain('timeline-001')
  })

  it('clicking active row keeps selection', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[0].trigger('click')
    await nextTick()
    expect(activeRows(wrapper)).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// Section 5 — Keyboard Navigation
// ---------------------------------------------------------------------------

describe('timeline data — keyboard navigation', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('moves selection to next timeline with ArrowDown', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'ArrowDown')
    expect(activeRows(wrapper)[0].text()).toContain('timeline-002')
  })

  it('updates details after ArrowDown', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'ArrowDown')
    expect(wrapper.find('.timeline-meta-grid').text()).toContain('timeline-002')
  })

  it('moves selection two steps with ArrowDown', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'ArrowDown')
    await pressKey(wrapper, 'ArrowDown')
    expect(activeRows(wrapper)[0].text()).toContain('timeline-003')
  })

  it('clamps ArrowDown at last timeline', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'ArrowDown')
    await pressKey(wrapper, 'ArrowDown')
    await pressKey(wrapper, 'ArrowDown')
    expect(activeRows(wrapper)[0].text()).toContain('timeline-003')
  })

  it('clamps ArrowUp at first timeline', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'ArrowUp')
    expect(activeRows(wrapper)[0].text()).toContain('timeline-001')
  })

  it('jumps to last timeline with End', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'End')
    expect(activeRows(wrapper)[0].text()).toContain('timeline-003')
  })

  it('jumps to first timeline with Home', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'End')
    await pressKey(wrapper, 'Home')
    expect(activeRows(wrapper)[0].text()).toContain('timeline-001')
  })

  it('ignores unrelated keys', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'Tab')
    await pressKey(wrapper, 'Enter')
    await pressKey(wrapper, 'x')
    expect(activeRows(wrapper)[0].text()).toContain('timeline-001')
  })

  it('focuses the newly selected row', async () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    useObservatoryDataStore().loadMockObservatory()
    const wrapper = mount(ObservatoryTimelineViewer, { attachTo: el })
    await nextTick()
    await pressKey(wrapper, 'ArrowDown')
    expect(document.activeElement?.textContent).toContain('timeline-002')
    wrapper.unmount()
    el.remove()
  })
})

// ---------------------------------------------------------------------------
// Section 6 — Detail Switching
// ---------------------------------------------------------------------------

describe('timeline data — detail switching', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('details update when second timeline selected', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    expect(wrapper.find('.timeline-meta-grid').text()).toContain('timeline-002')
  })

  it('entry count updates when second timeline selected', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    expect(wrapper.find('.timeline-meta-grid').text()).toContain('3')
  })

  it('entry count updates when third timeline selected', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[2].trigger('click')
    await nextTick()
    expect(wrapper.find('.timeline-meta-grid').text()).toContain('4')
  })

  it('shows distinct entries per timeline', async () => {
    const a = mountViewer()
    const b = mountViewer()
    await b.findAll('.timeline-row')[1].trigger('click')
    await nextTick()
    const strategiesA = entryTexts(a, '.timeline-entry-card-strategy')
    const strategiesB = entryTexts(b, '.timeline-entry-card-strategy')
    expect(strategiesA).not.toEqual(strategiesB)
  })

  it('entries update when second timeline selected', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    const strategies = entryTexts(wrapper, '.timeline-entry-card-strategy')
    expect(strategies).toEqual(['MoveEntity', 'QueryWorld', 'UpdateEntity'])
  })

  it('entries update when third timeline selected', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[2].trigger('click')
    await nextTick()
    const strategies = entryTexts(wrapper, '.timeline-entry-card-strategy')
    expect(strategies).toEqual(['DestroyEntity', 'CreateEntity', 'QueryWorld', 'MoveEntity'])
  })
})

// ---------------------------------------------------------------------------
// Section 7 — Entry Rendering
// ---------------------------------------------------------------------------

describe('timeline data — entry rendering', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders each entry as an article', () => {
    const wrapper = mountViewer()
    for (const card of entryCards(wrapper)) {
      expect(card.element.tagName).toBe('ARTICLE')
    }
  })

  it('renders a header inside each entry card', () => {
    const wrapper = mountViewer()
    for (const card of entryCards(wrapper)) {
      expect(card.find('header.timeline-entry-card-header').exists()).toBe(true)
    }
  })

  it('renders an h3 inside each entry card', () => {
    const wrapper = mountViewer()
    for (const card of entryCards(wrapper)) {
      expect(card.find('h3.timeline-entry-card-title').element.tagName).toBe('H3')
    }
  })

  it('links each article aria-labelledby to its h3 id', () => {
    const wrapper = mountViewer()
    for (const card of entryCards(wrapper)) {
      const labelledby = card.attributes('aria-labelledby')
      expect(labelledby).toBeDefined()
      expect(card.find('h3').attributes('id')).toBe(labelledby)
    }
  })

  it('uses entry index for the card heading id', () => {
    const wrapper = mountViewer()
    const first = entryCards(wrapper)[0]
    expect(first.find('h3').attributes('id')).toBe('timeline-entry-0')
  })

  it('displays correct strategies for timeline-001 entries', () => {
    const wrapper = mountViewer()
    const strategies = entryTexts(wrapper, '.timeline-entry-card-strategy')
    expect(strategies).toEqual(['CreateWorld', 'GenerateTerrain', 'CreateFarm', 'CreateNPC', 'CreateQuest'])
  })

  it('displays correct entry indices for timeline-001', () => {
    const wrapper = mountViewer()
    const titles = entryCardTitles(wrapper)
    expect(titles).toEqual(['#0', '#1', '#2', '#3', '#4'])
  })

  it('entry indices align with strategy order', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[2].trigger('click')
    await nextTick()
    const titles = entryCardTitles(wrapper)
    const strategies = entryTexts(wrapper, '.timeline-entry-card-strategy')
    expect(titles).toHaveLength(strategies.length)
    expect(titles).toEqual(['#0', '#1', '#2', '#3'])
  })
})

// ---------------------------------------------------------------------------
// Section 8 — Empty Timelines
// ---------------------------------------------------------------------------

describe('timeline data — empty timelines', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders without error when timelineView is empty after mount', async () => {
    const store = useObservatoryDataStore()
    const wrapper = mount(ObservatoryTimelineViewer)
    store.viewModel = {
      overview: { traceCount: 0, timelineCount: 0, historyCount: 0 },
      trace: [],
      traceView: [],
      timelineView: [],
      historyView: [],
      timeline: [],
      history: [],
    }
    await nextTick()
    expect(wrapper.exists()).toBe(true)
  })

  it('renders no timeline rows when timelineView is empty after mount', async () => {
    const store = useObservatoryDataStore()
    const wrapper = mount(ObservatoryTimelineViewer)
    store.viewModel = {
      overview: { traceCount: 0, timelineCount: 0, historyCount: 0 },
      trace: [],
      traceView: [],
      timelineView: [],
      historyView: [],
      timeline: [],
      history: [],
    }
    await nextTick()
    expect(rows(wrapper)).toHaveLength(0)
  })

  it('shows "No timeline selected" when timelineView is empty after mount', async () => {
    const store = useObservatoryDataStore()
    const wrapper = mount(ObservatoryTimelineViewer)
    store.viewModel = {
      overview: { traceCount: 0, timelineCount: 0, historyCount: 0 },
      trace: [],
      traceView: [],
      timelineView: [],
      historyView: [],
      timeline: [],
      history: [],
    }
    await nextTick()
    expect(wrapper.find('.timeline-details').text()).toContain('No timeline selected')
  })

  it('renders TimelineList and TimelineDetails even with empty data after mount', async () => {
    const store = useObservatoryDataStore()
    const wrapper = mount(ObservatoryTimelineViewer)
    store.viewModel = {
      overview: { traceCount: 0, timelineCount: 0, historyCount: 0 },
      trace: [],
      traceView: [],
      timelineView: [],
      historyView: [],
      timeline: [],
      history: [],
    }
    await nextTick()
    expect(wrapper.findComponent(TimelineList).exists()).toBe(true)
    expect(wrapper.findComponent(TimelineDetails).exists()).toBe(true)
  })

  it('empty timelineView does not crash keyboard navigation', async () => {
    const store = useObservatoryDataStore()
    const wrapper = mount(ObservatoryTimelineViewer)
    store.viewModel = {
      overview: { traceCount: 0, timelineCount: 0, historyCount: 0 },
      trace: [],
      traceView: [],
      timelineView: [],
      historyView: [],
      timeline: [],
      history: [],
    }
    await nextTick()
    await pressKey(wrapper, 'ArrowDown')
    await pressKey(wrapper, 'ArrowUp')
    await pressKey(wrapper, 'End')
    await pressKey(wrapper, 'Home')
    expect(wrapper.exists()).toBe(true)
  })

  it('shows "No timeline selected" paragraph when no timeline', () => {
    const wrapper = mount(TimelineDetails, {
      props: { timeline: null },
    })
    expect(wrapper.find('p.timeline-empty').exists()).toBe(true)
    expect(wrapper.text()).toContain('No timeline selected')
  })
})

// ---------------------------------------------------------------------------
// Section 9 — Defaults and Fallbacks
// ---------------------------------------------------------------------------

describe('timeline data — defaults and fallbacks', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('default timelineView is empty array before load', () => {
    const store = useObservatoryDataStore()
    expect(store.viewModel.timelineView).toEqual([])
  })

  it('adapter returns empty timelineView for undefined input', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt(undefined)
    expect(vm.timelineView).toEqual([])
  })

  it('adapter returns empty timelineView for null input', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt(null)
    expect(vm.timelineView).toEqual([])
  })

  it('adapter returns empty timelineView for number input', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt(42)
    expect(vm.timelineView).toEqual([])
  })

  it('timelineView items default to empty string for missing id', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({ timelineView: [{}] })
    expect(vm.timelineView[0].id).toBe('')
  })

  it('timelineView entryCount defaults to 0 for missing entries', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({ timelineView: [{}] })
    expect(vm.timelineView[0].entryCount).toBe(0)
  })

  it('timelineView entries default to empty array for missing entries', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({ timelineView: [{ id: 't1' }] })
    expect(vm.timelineView[0].entries).toEqual([])
  })

  it('entry index defaults to 0 for missing index', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      timelineView: [{ id: 't1', entries: [{}] }],
    })
    expect(vm.timelineView[0].entries[0].index).toBe(0)
  })

  it('entry strategy defaults to empty string for missing strategy', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      timelineView: [{ id: 't1', entries: [{ index: 0 }] }],
    })
    expect(vm.timelineView[0].entries[0].strategy).toBe('')
  })
})

// ---------------------------------------------------------------------------
// Section 10 — Deterministic Rendering
// ---------------------------------------------------------------------------

describe('timeline data — deterministic rendering', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders identical timeline ids across mounts', () => {
    const a = mountViewer()
    const b = mountViewer()
    expect(rowTexts(a, '.timeline-row-id')).toEqual(rowTexts(b, '.timeline-row-id'))
  })

  it('renders identical entry counts across mounts', () => {
    const a = mountViewer()
    const b = mountViewer()
    expect(rowTexts(a, '.timeline-row-count')).toEqual(rowTexts(b, '.timeline-row-count'))
  })

  it('renders identical entry strategies across mounts', () => {
    const a = mountViewer()
    const b = mountViewer()
    expect(entryTexts(a, '.timeline-entry-card-strategy')).toEqual(entryTexts(b, '.timeline-entry-card-strategy'))
  })

  it('renders identical entry titles across mounts', () => {
    const a = mountViewer()
    const b = mountViewer()
    expect(entryCardTitles(a)).toEqual(entryCardTitles(b))
  })

  it('renders identical active row text across mounts', () => {
    const a = mountViewer()
    const b = mountViewer()
    const activeText = (w: VueWrapper): string => w.find('.timeline-row--active').text()
    expect(activeText(a)).toBe('timeline-0015 entries')
    expect(activeText(b)).toBe('timeline-0015 entries')
  })

  it('renders identical viewer HTML across mounts', () => {
    const a = mountViewer()
    const b = mountViewer()
    expect(a.html()).toBe(b.html())
  })

  it('renders identical entry count order across mounts', () => {
    const a = mountViewer()
    const b = mountViewer()
    const cta = entryTexts(a, '.timeline-entry-card-strategy')
    const ctb = entryTexts(b, '.timeline-entry-card-strategy')
    expect(cta.length).toBe(ctb.length)
    expect(cta).toEqual(ctb)
  })
})

// ---------------------------------------------------------------------------
// Section 11 — No Mutation
// ---------------------------------------------------------------------------

describe('timeline data — no mutation', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('mounting viewer does not mutate timelineView array reference', () => {
    const store = useObservatoryDataStore()
    mountViewer()
    expect(Object.isFrozen(store.viewModel.timelineView)).toBe(true)
  })

  it('mounting viewer populates timelineView with 3 entries', () => {
    const store = useObservatoryDataStore()
    mountViewer()
    expect(store.viewModel.timelineView.length).toBe(3)
  })

  it('timelineViewModel fields are readonly', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const t of store.viewModel.timelineView) {
      expect(typeof t.id).toBe('string')
      expect(typeof t.entryCount).toBe('number')
    }
  })

  it('timelineView entry arrays are frozen', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const t of store.viewModel.timelineView) {
      expect(Object.isFrozen(t.entries)).toBe(true)
    }
  })

  it('timelineView entries are frozen', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(Object.isFrozen(store.viewModel.timelineView)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 12 — Integration Path
// ---------------------------------------------------------------------------

describe('timeline data — integration path', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('full path: store adapter produces timelineView with correct values', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(store.viewModel.timelineView[0].id).toBe('timeline-001')
    expect(store.viewModel.timelineView[0].entryCount).toBe(5)
    expect(store.viewModel.timelineView[0].entries[0].strategy).toBe('CreateWorld')
    expect(store.viewModel.timelineView[1].entries[0].strategy).toBe('MoveEntity')
    expect(store.viewModel.timelineView[2].entries[0].strategy).toBe('DestroyEntity')
  })

  it('adapter output matches component display after mount', async () => {
    const adapter = new DefaultObservatoryAdapter()
    const customData = {
      timelineView: [
        { id: 'tl-A', entries: [{ index: 0, strategy: 'Alpha' }, { index: 1, strategy: 'Beta' }] },
        { id: 'tl-B', entries: [{ index: 0, strategy: 'Gamma' }] },
      ],
    }
    const vm = adapter.adapt(customData)
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const wrapper = mount(ObservatoryTimelineViewer)
    store.viewModel = vm
    await nextTick()
    await nextTick()
    expect(rows(wrapper)).toHaveLength(2)
    expect(rowTexts(wrapper, '.timeline-row-id')).toEqual(['tl-A', 'tl-B'])
    expect(rowTexts(wrapper, '.timeline-row-count')).toEqual(['2 entries', '1 entries'])
  })

  it('single timeline item displays correctly after mount', async () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      timelineView: [{ id: 'only', entries: [{ index: 0, strategy: 'Solo' }] }],
    })
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    mount(ObservatoryTimelineViewer)
    store.viewModel = vm
    await nextTick()
    await nextTick()
    const wrapper = mount(ObservatoryTimelineViewer)
    expect(rows(wrapper)).toHaveLength(1)
    expect(activeRows(wrapper)).toHaveLength(1)
  })

  it('large number of timelines list correctly after mount', async () => {
    const adapter = new DefaultObservatoryAdapter()
    const timelines = Array.from({ length: 50 }, (_, i) => ({
      id: `tl-${i + 1}`,
      entries: [{ index: 0, strategy: `S${i + 1}` }],
    }))
    const vm = adapter.adapt({ timelineView: timelines })
    const store = useObservatoryDataStore()
    store.viewModel = vm
    const wrapper = mount(ObservatoryTimelineViewer)
    expect(rows(wrapper)).toHaveLength(50)
  })

  it('selected timeline entries display from viewModel', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const wrapper = mount(ObservatoryTimelineViewer)
    const strategies = entryTexts(wrapper, '.timeline-entry-card-strategy')
    expect(strategies).toContain('CreateWorld')
    expect(strategies).toContain('GenerateTerrain')
    expect(strategies).toContain('CreateFarm')
    expect(strategies).toContain('CreateNPC')
    expect(strategies).toContain('CreateQuest')
  })

  it('refreshing timelineView updates the viewer', async () => {
    const store = useObservatoryDataStore()
    const wrapper = mountViewer()
    store.viewModel = {
      overview: { traceCount: 0, timelineCount: 2, historyCount: 0 },
      trace: [],
      traceView: [],
      timelineView: [
        { id: 'new-1', entryCount: 2, entries: [{ index: 0, strategy: 'NewA' }, { index: 1, strategy: 'NewB' }] },
        { id: 'new-2', entryCount: 1, entries: [{ index: 0, strategy: 'NewC' }] },
      ],
      historyView: [],
      timeline: [],
      history: [],
    }
    await nextTick()
    expect(rows(wrapper)).toHaveLength(2)
    expect(rowTexts(wrapper, '.timeline-row-id')).toEqual(['new-1', 'new-2'])
    expect(rowTexts(wrapper, '.timeline-row-count')).toEqual(['2 entries', '1 entries'])
  })
})

// ---------------------------------------------------------------------------
// Section 13 — Accessibility
// ---------------------------------------------------------------------------

describe('timeline data — accessibility', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('timeline list nav has aria-label', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('nav.timeline-list').attributes('aria-label')).toBe('Timeline list')
  })

  it('timeline details article has aria-label', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('article.timeline-details').attributes('aria-label')).toBe('Timeline details')
  })

  it('uses buttons for timeline rows', () => {
    const wrapper = mountViewer()
    for (const row of rows(wrapper)) {
      expect(row.element.tagName).toBe('BUTTON')
      expect(row.attributes('type')).toBe('button')
    }
  })

  it('marks active row with aria-current', () => {
    const wrapper = mountViewer()
    const active = activeRows(wrapper)
    expect(active).toHaveLength(1)
    expect(active[0].attributes('aria-current')).toBe('true')
  })

  it('renders h2 for list and details headings', () => {
    const wrapper = mountViewer()
    const texts = wrapper.findAll('h2').map((h) => h.text().trim())
    expect(texts).toContain('Timeline List')
    expect(texts).toContain('Timeline Details')
  })

  it('uses h3 for entries section heading', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('h3.timeline-entries-title').exists()).toBe(true)
  })

  it('renders entry cards as articles with aria-labelledby', () => {
    const wrapper = mountViewer()
    for (const card of entryCards(wrapper)) {
      expect(card.element.tagName).toBe('ARTICLE')
      expect(card.attributes('aria-labelledby')).toBeDefined()
    }
  })

  it('uses definition list for meta header', () => {
    const wrapper = mountViewer()
    const dl = wrapper.find('dl.timeline-meta-grid')
    expect(dl.exists()).toBe(true)
    expect(dl.findAll('dt')).toHaveLength(2)
    expect(dl.findAll('dd')).toHaveLength(2)
  })

  it('links entries section to heading via aria-labelledby', () => {
    const wrapper = mountViewer()
    const section = wrapper.find('section.timeline-entries-section')
    expect(section.attributes('aria-labelledby')).toBe('timeline-entries-title')
    expect(wrapper.find('#timeline-entries-title').exists()).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 14 — ViewModel Shape Integrity
// ---------------------------------------------------------------------------

describe('timeline data — ViewModel shape integrity', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('timelineView is an array on the root ViewModel', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(Array.isArray(store.viewModel.timelineView)).toBe(true)
  })

  it('timelineView is independent from trace', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(store.viewModel.timelineView).not.toBe(store.viewModel.trace)
  })

  it('timelineView items have required fields', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const t of store.viewModel.timelineView) {
      const keys = Object.keys(t)
      expect(keys).toContain('id')
      expect(keys).toContain('entryCount')
      expect(keys).toContain('entries')
    }
  })

  it('timelineView entry items have required fields', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const t of store.viewModel.timelineView) {
      for (const e of t.entries) {
        const keys = Object.keys(e)
        expect(keys).toContain('index')
        expect(keys).toContain('strategy')
      }
    }
  })

  it('timelineView entry arrays are frozen', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const t of store.viewModel.timelineView) {
      expect(Object.isFrozen(t.entries)).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------
// Section 15 — Store Edge Cases
// ---------------------------------------------------------------------------

describe('timeline data — store edge cases', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('loadMockObservatory produces deterministic timelineView', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const first = store.viewModel.timelineView.map((t) => t.id)
    store.loadMockObservatory()
    const second = store.viewModel.timelineView.map((t) => t.id)
    expect(first).toEqual(second)
  })

  it('timelineView can be directly replaced with custom data', () => {
    const store = useObservatoryDataStore()
    store.viewModel = {
      overview: { traceCount: 0, timelineCount: 1, historyCount: 0 },
      trace: [],
      traceView: [],
      timelineView: [{ id: 'custom', entryCount: 1, entries: [{ index: 0, strategy: 'Custom' }] }],
      historyView: [],
      timeline: [],
      history: [],
    }
    expect(store.viewModel.timelineView).toHaveLength(1)
    expect(store.viewModel.timelineView[0].entries[0].strategy).toBe('Custom')
  })

  it('viewModel with empty timelineView after mount renders empty list', async () => {
    const store = useObservatoryDataStore()
    const wrapper = mount(ObservatoryTimelineViewer)
    store.viewModel = {
      overview: { traceCount: 0, timelineCount: 0, historyCount: 0 },
      trace: [],
      traceView: [],
      timelineView: [],
      historyView: [],
      timeline: [],
      history: [],
    }
    await nextTick()
    expect(rows(wrapper)).toHaveLength(0)
  })

  it('multiple loads of mock data produce same timelineView shape', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const ids1 = store.viewModel.timelineView.map((t) => t.id)
    store.loadMockObservatory()
    const ids2 = store.viewModel.timelineView.map((t) => t.id)
    expect(ids1).toEqual(ids2)
  })
})

// ---------------------------------------------------------------------------
// Section 16 — No AI Package Leakage
// ---------------------------------------------------------------------------

describe('timeline data — no AI package leakage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('timelineView does not contain promptAssembly fields', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const t of store.viewModel.timelineView) {
      expect('promptAssembly' in t).toBe(false)
    }
  })

  it('timelineView entries do not contain plannerResult', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const t of store.viewModel.timelineView) {
      for (const e of t.entries) {
        expect('plannerResult' in e).toBe(false)
      }
    }
  })

  it('viewModel does not contain AI-specific root properties', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect('promptAssembly' in store.viewModel).toBe(false)
    expect('plannerResult' in store.viewModel).toBe(false)
    expect('strategy' in store.viewModel).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Section 17 — TimelineView Fallback
// ---------------------------------------------------------------------------

describe('timeline data — timelineView fallback', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('adapter falls back to timeline array data when timelineView is missing', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      timeline: [
        { id: 'tl-1', label: 'Timeline 1', entries: [{ id: 'e1', label: 'Entry 1', timestamp: '00:00' }] },
      ],
    })
    expect(vm.timelineView).toHaveLength(1)
    expect(vm.timelineView[0].id).toBe('tl-1')
  })

  it('fallback sets entryCount from entries length', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      timeline: [
        {
          id: 'tl-fallback',
          label: 'Fallback',
          entries: [
            { id: 'e1', label: 'Entry 1', timestamp: '00:00' },
            { id: 'e2', label: 'Entry 2', timestamp: '01:00' },
          ],
        },
      ],
    })
    expect(vm.timelineView[0].entryCount).toBe(2)
  })

  it('fallback derives strategy from label field', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      timeline: [
        {
          id: 'tl-fallback',
          label: 'Fallback',
          entries: [{ id: 'e1', label: 'CreateWorld', timestamp: '00:00' }],
        },
      ],
    })
    expect(vm.timelineView[0].entries[0].strategy).toBe('CreateWorld')
    expect(vm.timelineView[0].entries[0].index).toBe(0)
  })

  it('fallback produces frozen output', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      timeline: [
        { id: 'tl-1', label: 'T1', entries: [] },
      ],
    })
    expect(Object.isFrozen(vm.timelineView)).toBe(true)
  })
})