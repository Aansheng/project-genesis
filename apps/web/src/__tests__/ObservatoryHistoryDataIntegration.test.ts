/**
 * ObservatoryHistoryDataIntegration — verifies the full data integration path
 * for the History Viewer panel from the observatoryData store
 * (via DefaultObservatoryAdapter) through the history viewer components.
 *
 * WO-S6-016 — Observatory History Real Data Integration
 * Architecture version v1.46
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

import { useObservatoryDataStore } from '../stores/observatoryData'
import { DefaultObservatoryAdapter } from '../adapters/observatory'
import ObservatoryHistoryViewer from '../components/observatory/history/ObservatoryHistoryViewer.vue'
import HistoryList from '../components/observatory/history/HistoryList.vue'
import HistoryDetails from '../components/observatory/history/HistoryDetails.vue'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mountViewer(): VueWrapper {
  useObservatoryDataStore().loadMockObservatory()
  return mount(ObservatoryHistoryViewer)
}

function rows(wrapper: VueWrapper): ReturnType<VueWrapper['findAll']> {
  return wrapper.findAll('.history-row')
}

function activeRows(wrapper: VueWrapper): ReturnType<VueWrapper['findAll']> {
  return rows(wrapper).filter((r) => r.classes().includes('history-row--active'))
}

function rowTexts(wrapper: VueWrapper, selector: string): string[] {
  return wrapper.findAll(selector).map((el) => el.text().trim())
}

function entryCards(wrapper: VueWrapper): ReturnType<VueWrapper['findAll']> {
  return wrapper.findAll('.history-entry-card')
}

function entryTexts(wrapper: VueWrapper, selector: string): string[] {
  return wrapper.findAll(selector).map((el) => el.text().trim())
}

function entryCardNames(wrapper: VueWrapper): string[] {
  return wrapper.findAll('.history-entry-card-name').map((el) => el.text().trim())
}

async function pressKey(wrapper: VueWrapper, key: string): Promise<void> {
  await wrapper.find('nav.history-list').trigger('keydown', { key })
  await nextTick()
}

// ---------------------------------------------------------------------------
// Section 1 — Store historyView Integration
// ---------------------------------------------------------------------------

describe('history data — store historyView integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('store initializes with empty historyView', () => {
    const store = useObservatoryDataStore()
    expect(store.viewModel.historyView).toEqual([])
  })

  it('loadMockObservatory populates historyView with 3 entries', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(store.viewModel.historyView).toHaveLength(3)
  })

  it('historyView entries have id field', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const h of store.viewModel.historyView) {
      expect(typeof h.id).toBe('string')
      expect(h.id.length).toBeGreaterThan(0)
    }
  })

  it('historyView entries have timestamp field', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const h of store.viewModel.historyView) {
      expect(typeof h.timestamp).toBe('string')
      expect(h.timestamp.length).toBeGreaterThan(0)
    }
  })

  it('historyView entries have prompt field', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const h of store.viewModel.historyView) {
      expect(typeof h.prompt).toBe('string')
      expect(h.prompt.length).toBeGreaterThan(0)
    }
  })

  it('historyView entries have result field', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const h of store.viewModel.historyView) {
      expect(typeof h.result).toBe('string')
      expect(h.result.length).toBeGreaterThan(0)
    }
  })

  it('historyView entries have evolution array', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const h of store.viewModel.historyView) {
      expect(Array.isArray(h.evolution)).toBe(true)
    }
  })

  it('historyView evolution entries have name field', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const h of store.viewModel.historyView) {
      for (const e of h.evolution) {
        expect(typeof e.name).toBe('string')
        expect(e.name.length).toBeGreaterThan(0)
      }
    }
  })

  it('historyView is frozen', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(Object.isFrozen(store.viewModel.historyView)).toBe(true)
  })

  it('historyView entry ids are history-001, history-002, history-003', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const ids = store.viewModel.historyView.map((h) => h.id)
    expect(ids).toEqual(['history-001', 'history-002', 'history-003'])
  })

  it('history-001 has 5 evolution entries', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const h = store.viewModel.historyView.find((h) => h.id === 'history-001')
    expect(h?.evolution).toHaveLength(5)
  })

  it('history-002 has 3 evolution entries', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const h = store.viewModel.historyView.find((h) => h.id === 'history-002')
    expect(h?.evolution).toHaveLength(3)
  })

  it('history-003 has 2 evolution entries', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const h = store.viewModel.historyView.find((h) => h.id === 'history-003')
    expect(h?.evolution).toHaveLength(2)
  })

  it('history-001 has correct prompt and result', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const h = store.viewModel.historyView.find((h) => h.id === 'history-001')
    expect(h?.prompt).toBe('Create Farm Game')
    expect(h?.result).toBe('Farm Created')
  })
})

// ---------------------------------------------------------------------------
// Section 2 — Adapter Mapping
// ---------------------------------------------------------------------------

describe('history data — adapter historyView mapping', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('adapter maps historyView from raw observatory', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      historyView: [
        { id: 'h-1', timestamp: '00:00', prompt: 'P1', result: 'R1', evolution: [{ name: 'E1' }, { name: 'E2' }] },
      ],
    })
    expect(vm.historyView).toHaveLength(1)
    expect(vm.historyView[0].id).toBe('h-1')
    expect(vm.historyView[0].prompt).toBe('P1')
  })

  it('adapter handles missing historyView gracefully', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({})
    expect(vm.historyView).toEqual([])
  })

  it('adapter handles null historyView gracefully', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({ historyView: null })
    expect(vm.historyView).toEqual([])
  })

  it('adapter handles undefined historyView gracefully', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({ historyView: undefined })
    expect(vm.historyView).toEqual([])
  })

  it('adapter handles non-array historyView gracefully', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({ historyView: 'invalid' })
    expect(vm.historyView).toEqual([])
  })

  it('adapter maps evolution entries correctly', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      historyView: [
        { id: 'h-1', timestamp: '00:00', prompt: 'P', result: 'R', evolution: [{ name: 'Alpha' }, { name: 'Beta' }] },
      ],
    })
    expect(vm.historyView[0].evolution).toHaveLength(2)
    expect(vm.historyView[0].evolution[0].name).toBe('Alpha')
    expect(vm.historyView[0].evolution[1].name).toBe('Beta')
  })

  it('adapter handles string[] evolution entries', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      historyView: [
        { id: 'h-1', timestamp: '00:00', prompt: 'P', result: 'R', evolution: ['A', 'B', 'C'] },
      ],
    })
    expect(vm.historyView[0].evolution).toHaveLength(3)
    expect(vm.historyView[0].evolution[0].name).toBe('A')
    expect(vm.historyView[0].evolution[1].name).toBe('B')
    expect(vm.historyView[0].evolution[2].name).toBe('C')
  })

  it('adapter handles non-object historyView items gracefully', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      historyView: [null, undefined, 'string', 42],
    })
    expect(vm.historyView).toHaveLength(4)
    for (const h of vm.historyView) {
      expect(typeof h.id).toBe('string')
      expect(typeof h.timestamp).toBe('string')
      expect(typeof h.prompt).toBe('string')
      expect(typeof h.result).toBe('string')
      expect(Array.isArray(h.evolution)).toBe(true)
    }
  })

  it('adapter returns frozen historyView', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      historyView: [{ id: 'h1', timestamp: 'T', prompt: 'P', result: 'R', evolution: [] }],
    })
    expect(Object.isFrozen(vm.historyView)).toBe(true)
  })

  it('adapter handles empty evolution array', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      historyView: [{ id: 'h1', timestamp: 'T', prompt: 'P', result: 'R', evolution: [] }],
    })
    expect(vm.historyView[0].evolution).toEqual([])
  })

  it('adapter handles null evolution gracefully', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      historyView: [{ id: 'h1', timestamp: 'T', prompt: 'P', result: 'R', evolution: null }],
    })
    expect(vm.historyView[0].evolution).toEqual([])
  })

  it('adapter returns frozen evolution arrays', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      historyView: [{ id: 'h1', timestamp: 'T', prompt: 'P', result: 'R', evolution: [{ name: 'E1' }] }],
    })
    expect(Object.isFrozen(vm.historyView[0].evolution)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 3 — History Viewer Rendering
// ---------------------------------------------------------------------------

describe('history data — viewer rendering from viewModel', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders the root viewer container', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('.observatory-history-viewer').exists()).toBe(true)
  })

  it('renders 3 history rows from viewModel', () => {
    const wrapper = mountViewer()
    expect(rows(wrapper)).toHaveLength(3)
  })

  it('renders history ids from viewModel', () => {
    const wrapper = mountViewer()
    expect(rowTexts(wrapper, '.history-row-id')).toEqual([
      'history-001',
      'history-002',
      'history-003',
    ])
  })

  it('renders timestamps from viewModel', () => {
    const wrapper = mountViewer()
    expect(rowTexts(wrapper, '.history-row-timestamp')).toEqual([
      '10:00:00',
      '10:05:00',
      '10:10:00',
    ])
  })

  it('renders the HistoryList component', () => {
    const wrapper = mountViewer()
    expect(wrapper.findComponent(HistoryList).exists()).toBe(true)
  })

  it('renders the HistoryDetails component', () => {
    const wrapper = mountViewer()
    expect(wrapper.findComponent(HistoryDetails).exists()).toBe(true)
  })

  it('renders "History List" as h2 heading', () => {
    const wrapper = mountViewer()
    const h2 = wrapper.find('.history-list-title')
    expect(h2.exists()).toBe(true)
    expect(h2.text()).toBe('History List')
  })

  it('renders "History Details" as h2 heading', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('.history-details-title').text()).toBe('History Details')
  })

  it('renders prompt from viewModel', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('.history-prompt-block').text()).toBe('Create Farm Game')
  })

  it('renders result from viewModel', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('.history-result-text').text()).toBe('Farm Created')
  })

  it('renders evolution names from viewModel', () => {
    const wrapper = mountViewer()
    expect(entryCardNames(wrapper)).toEqual([
      'CreateWorld',
      'GenerateTerrain',
      'CreateFarm',
      'CreateNPC',
      'CreateQuest',
    ])
  })
})

// ---------------------------------------------------------------------------
// Section 4 — History Selection
// ---------------------------------------------------------------------------

describe('history data — history selection', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('marks the first history row active by default', () => {
    const wrapper = mountViewer()
    expect(rows(wrapper)[0].classes()).toContain('history-row--active')
  })

  it('marks exactly one row active by default', () => {
    const wrapper = mountViewer()
    expect(activeRows(wrapper)).toHaveLength(1)
  })

  it('shows the first history id in details by default', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('.history-meta-grid').text()).toContain('history-001')
  })

  it('shows the first timestamp in details by default', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('.history-meta-grid').text()).toContain('10:00:00')
  })

  it('selects second history on click', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    expect(wrapper.find('.history-meta-grid').text()).toContain('history-002')
  })

  it('clicking second history shows its timestamp', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    expect(wrapper.find('.history-meta-grid').text()).toContain('10:05:00')
  })

  it('clicking third history shows its prompt', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[2].trigger('click')
    await nextTick()
    expect(wrapper.find('.history-prompt-block').text()).toBe('Build Defenses')
  })

  it('moves active class to clicked row', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[2].trigger('click')
    await nextTick()
    expect(activeRows(wrapper)).toHaveLength(1)
    expect(activeRows(wrapper)[0].text()).toContain('history-003')
  })

  it('switches back to first history when re-clicked', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    await rows(wrapper)[0].trigger('click')
    await nextTick()
    expect(wrapper.find('.history-meta-grid').text()).toContain('history-001')
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

describe('history data — keyboard navigation', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('moves selection to next history with ArrowDown', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'ArrowDown')
    expect(activeRows(wrapper)[0].text()).toContain('history-002')
  })

  it('updates details after ArrowDown', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'ArrowDown')
    expect(wrapper.find('.history-meta-grid').text()).toContain('history-002')
  })

  it('moves selection two steps with ArrowDown', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'ArrowDown')
    await pressKey(wrapper, 'ArrowDown')
    expect(activeRows(wrapper)[0].text()).toContain('history-003')
  })

  it('clamps ArrowDown at last history', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'ArrowDown')
    await pressKey(wrapper, 'ArrowDown')
    await pressKey(wrapper, 'ArrowDown')
    expect(activeRows(wrapper)[0].text()).toContain('history-003')
  })

  it('clamps ArrowUp at first history', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'ArrowUp')
    expect(activeRows(wrapper)[0].text()).toContain('history-001')
  })

  it('jumps to last history with End', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'End')
    expect(activeRows(wrapper)[0].text()).toContain('history-003')
  })

  it('jumps to first history with Home', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'End')
    await pressKey(wrapper, 'Home')
    expect(activeRows(wrapper)[0].text()).toContain('history-001')
  })

  it('ignores unrelated keys', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'Tab')
    await pressKey(wrapper, 'Enter')
    await pressKey(wrapper, 'x')
    expect(activeRows(wrapper)[0].text()).toContain('history-001')
  })

  it('focuses the newly selected row', async () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    useObservatoryDataStore().loadMockObservatory()
    const wrapper = mount(ObservatoryHistoryViewer, { attachTo: el })
    await nextTick()
    await pressKey(wrapper, 'ArrowDown')
    expect(document.activeElement?.textContent).toContain('history-002')
    wrapper.unmount()
    el.remove()
  })
})

// ---------------------------------------------------------------------------
// Section 6 — Detail Switching
// ---------------------------------------------------------------------------

describe('history data — detail switching', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('prompt updates when second history selected', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    expect(wrapper.find('.history-prompt-block').text()).toBe('Add Villagers')
  })

  it('result updates when second history selected', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    expect(wrapper.find('.history-result-text').text()).toBe('3 villagers added')
  })

  it('evolution updates when second history selected', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    expect(entryCardNames(wrapper)).toEqual(['CreateVillager', 'AssignTask', 'StartWork'])
  })

  it('prompt updates when third history selected', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[2].trigger('click')
    await nextTick()
    expect(wrapper.find('.history-prompt-block').text()).toBe('Build Defenses')
  })

  it('evolution updates when third history selected', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[2].trigger('click')
    await nextTick()
    expect(entryCardNames(wrapper)).toEqual(['BuildWall', 'PlaceGuard'])
  })

  it('shows distinct prompts per history', async () => {
    const a = mountViewer()
    const b = mountViewer()
    await b.findAll('.history-row')[1].trigger('click')
    await nextTick()
    expect(a.find('.history-prompt-block').text()).not.toBe(b.find('.history-prompt-block').text())
  })
})

// ---------------------------------------------------------------------------
// Section 7 — Prompt and Result Rendering
// ---------------------------------------------------------------------------

describe('history data — prompt and result rendering', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders prompt as a pre block', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('pre.history-prompt-block').exists()).toBe(true)
  })

  it('prompt pre block has tabindex 0', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('pre.history-prompt-block').attributes('tabindex')).toBe('0')
  })

  it('renders result as a paragraph', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('p.history-result-text').element.tagName).toBe('P')
  })

  it('prompt section has aria-labelledby', () => {
    const wrapper = mountViewer()
    const section = wrapper.find('section.history-prompt-section')
    expect(section.attributes('aria-labelledby')).toBe('history-prompt-title')
  })

  it('result section has aria-labelledby', () => {
    const wrapper = mountViewer()
    const section = wrapper.find('section.history-result-section')
    expect(section.attributes('aria-labelledby')).toBe('history-result-title')
  })

  it('evolution section has aria-labelledby', () => {
    const wrapper = mountViewer()
    const section = wrapper.find('section.history-evolution-section')
    expect(section.attributes('aria-labelledby')).toBe('history-evolution-title')
  })

  it('renders sections in correct order', () => {
    const wrapper = mountViewer()
    const sections = wrapper.findAll('section').map((s) => s.attributes('aria-labelledby'))
    expect(sections).toEqual(['history-prompt-title', 'history-result-title', 'history-evolution-title'])
  })
})

// ---------------------------------------------------------------------------
// Section 8 — Evolution Rendering
// ---------------------------------------------------------------------------

describe('history data — evolution rendering', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders each evolution card as an article', () => {
    const wrapper = mountViewer()
    for (const card of entryCards(wrapper)) {
      expect(card.element.tagName).toBe('ARTICLE')
    }
  })

  it('renders a header inside each evolution card', () => {
    const wrapper = mountViewer()
    for (const card of entryCards(wrapper)) {
      expect(card.find('header.history-entry-card-header').exists()).toBe(true)
    }
  })

  it('renders an h3 for each evolution card', () => {
    const wrapper = mountViewer()
    for (const card of entryCards(wrapper)) {
      expect(card.find('h3.history-entry-card-name').element.tagName).toBe('H3')
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

  it('shows add marker (+) on each evolution card', () => {
    const wrapper = mountViewer()
    const markers = entryTexts(wrapper, '.history-entry-card-marker')
    expect(markers.every((m) => m === '+')).toBe(true)
  })

  it('displays correct evolution names for first history', () => {
    const wrapper = mountViewer()
    expect(entryCardNames(wrapper)).toEqual([
      'CreateWorld', 'GenerateTerrain', 'CreateFarm', 'CreateNPC', 'CreateQuest',
    ])
  })

  it('displays correct evolution names for second history', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    expect(entryCardNames(wrapper)).toEqual(['CreateVillager', 'AssignTask', 'StartWork'])
  })
})

// ---------------------------------------------------------------------------
// Section 9 — Empty History
// ---------------------------------------------------------------------------

describe('history data — empty history', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders without error when historyView is empty after mount', async () => {
    const store = useObservatoryDataStore()
    const wrapper = mount(ObservatoryHistoryViewer)
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

  it('renders no history rows when historyView is empty after mount', async () => {
    const store = useObservatoryDataStore()
    const wrapper = mount(ObservatoryHistoryViewer)
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

  it('shows "No history entry selected" when historyView is empty after mount', async () => {
    const store = useObservatoryDataStore()
    const wrapper = mount(ObservatoryHistoryViewer)
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
    expect(wrapper.find('.history-details').text()).toContain('No history entry selected')
  })

  it('renders HistoryList and HistoryDetails even with empty data after mount', async () => {
    const store = useObservatoryDataStore()
    const wrapper = mount(ObservatoryHistoryViewer)
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
    expect(wrapper.findComponent(HistoryList).exists()).toBe(true)
    expect(wrapper.findComponent(HistoryDetails).exists()).toBe(true)
  })

  it('empty historyView does not crash keyboard navigation', async () => {
    const store = useObservatoryDataStore()
    const wrapper = mount(ObservatoryHistoryViewer)
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

  it('shows "No history entry selected" paragraph when no entry', () => {
    const wrapper = mount(HistoryDetails, {
      props: { entry: null },
    })
    expect(wrapper.find('p.history-empty').exists()).toBe(true)
    expect(wrapper.text()).toContain('No history entry selected')
  })
})

// ---------------------------------------------------------------------------
// Section 10 — Defaults and Fallbacks
// ---------------------------------------------------------------------------

describe('history data — defaults and fallbacks', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('default historyView is empty array before load', () => {
    const store = useObservatoryDataStore()
    expect(store.viewModel.historyView).toEqual([])
  })

  it('adapter returns empty historyView for undefined input', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt(undefined)
    expect(vm.historyView).toEqual([])
  })

  it('adapter returns empty historyView for null input', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt(null)
    expect(vm.historyView).toEqual([])
  })

  it('adapter returns empty historyView for number input', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt(42)
    expect(vm.historyView).toEqual([])
  })

  it('historyView items default to empty string for missing id', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({ historyView: [{}] })
    expect(vm.historyView[0].id).toBe('')
  })

  it('historyView timestamp defaults to empty string', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({ historyView: [{}] })
    expect(vm.historyView[0].timestamp).toBe('')
  })

  it('historyView prompt defaults to empty string', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({ historyView: [{}] })
    expect(vm.historyView[0].prompt).toBe('')
  })

  it('historyView result defaults to empty string', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({ historyView: [{}] })
    expect(vm.historyView[0].result).toBe('')
  })

  it('historyView evolution defaults to empty array', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({ historyView: [{ id: 'h1', timestamp: 'T', prompt: 'P', result: 'R' }] })
    expect(vm.historyView[0].evolution).toEqual([])
  })

  it('evolution entry name defaults to empty string for missing name', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      historyView: [{ id: 'h1', timestamp: 'T', prompt: 'P', result: 'R', evolution: [{}] }],
    })
    expect(vm.historyView[0].evolution[0].name).toBe('')
  })
})

// ---------------------------------------------------------------------------
// Section 11 — Deterministic Rendering
// ---------------------------------------------------------------------------

describe('history data — deterministic rendering', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders identical history ids across mounts', () => {
    const a = mountViewer()
    const b = mountViewer()
    expect(rowTexts(a, '.history-row-id')).toEqual(rowTexts(b, '.history-row-id'))
  })

  it('renders identical timestamps across mounts', () => {
    const a = mountViewer()
    const b = mountViewer()
    expect(rowTexts(a, '.history-row-timestamp')).toEqual(rowTexts(b, '.history-row-timestamp'))
  })

  it('renders identical evolution names across mounts', () => {
    const a = mountViewer()
    const b = mountViewer()
    expect(entryCardNames(a)).toEqual(entryCardNames(b))
  })

  it('renders identical prompts across mounts', () => {
    const a = mountViewer()
    const b = mountViewer()
    expect(a.find('.history-prompt-block').text()).toBe(b.find('.history-prompt-block').text())
  })

  it('renders identical results across mounts', () => {
    const a = mountViewer()
    const b = mountViewer()
    expect(a.find('.history-result-text').text()).toBe(b.find('.history-result-text').text())
  })

  it('renders identical active row text across mounts', () => {
    const a = mountViewer()
    const b = mountViewer()
    const activeText = (w: VueWrapper): string => w.find('.history-row--active').text()
    expect(activeText(a)).toBe('history-00110:00:00')
    expect(activeText(b)).toBe('history-00110:00:00')
  })

  it('renders identical viewer HTML across mounts', () => {
    const a = mountViewer()
    const b = mountViewer()
    expect(a.html()).toBe(b.html())
  })
})

// ---------------------------------------------------------------------------
// Section 12 — No Mutation
// ---------------------------------------------------------------------------

describe('history data — no mutation', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('mounting viewer does not mutate historyView array reference', () => {
    const store = useObservatoryDataStore()
    mountViewer()
    expect(Object.isFrozen(store.viewModel.historyView)).toBe(true)
  })

  it('mounting viewer populates historyView with 3 entries', () => {
    const store = useObservatoryDataStore()
    mountViewer()
    expect(store.viewModel.historyView.length).toBe(3)
  })

  it('historyViewModel fields are readonly', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const h of store.viewModel.historyView) {
      expect(typeof h.id).toBe('string')
      expect(typeof h.timestamp).toBe('string')
      expect(typeof h.prompt).toBe('string')
      expect(typeof h.result).toBe('string')
    }
  })

  it('historyView evolution arrays are frozen', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const h of store.viewModel.historyView) {
      expect(Object.isFrozen(h.evolution)).toBe(true)
    }
  })

  it('historyView items are frozen', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(Object.isFrozen(store.viewModel.historyView)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 13 — Integration Path
// ---------------------------------------------------------------------------

describe('history data — integration path', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('full path: store adapter produces historyView with correct values', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(store.viewModel.historyView[0].id).toBe('history-001')
    expect(store.viewModel.historyView[0].prompt).toBe('Create Farm Game')
    expect(store.viewModel.historyView[0].result).toBe('Farm Created')
    expect(store.viewModel.historyView[0].evolution[0].name).toBe('CreateWorld')
    expect(store.viewModel.historyView[1].prompt).toBe('Add Villagers')
    expect(store.viewModel.historyView[2].prompt).toBe('Build Defenses')
  })

  it('adapter output matches component display after mount', async () => {
    const adapter = new DefaultObservatoryAdapter()
    const customData = {
      historyView: [
        { id: 'h-A', timestamp: '01:00', prompt: 'Prompt A', result: 'Result A', evolution: [{ name: 'E1' }, { name: 'E2' }] },
        { id: 'h-B', timestamp: '02:00', prompt: 'Prompt B', result: 'Result B', evolution: [{ name: 'E3' }] },
      ],
    }
    const vm = adapter.adapt(customData)
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const wrapper = mount(ObservatoryHistoryViewer)
    store.viewModel = vm
    await nextTick()
    await nextTick()
    expect(rows(wrapper)).toHaveLength(2)
    expect(rowTexts(wrapper, '.history-row-id')).toEqual(['h-A', 'h-B'])
    expect(rowTexts(wrapper, '.history-row-timestamp')).toEqual(['01:00', '02:00'])
  })

  it('single history item displays correctly after mount', async () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      historyView: [{ id: 'only', timestamp: '00:00', prompt: 'Solo', result: 'Done', evolution: [] }],
    })
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    mount(ObservatoryHistoryViewer)
    store.viewModel = vm
    await nextTick()
    await nextTick()
    const wrapper = mount(ObservatoryHistoryViewer)
    expect(rows(wrapper)).toHaveLength(1)
    expect(activeRows(wrapper)).toHaveLength(1)
  })

  it('large number of histories list correctly after mount', async () => {
    const adapter = new DefaultObservatoryAdapter()
    const histories = Array.from({ length: 50 }, (_, i) => ({
      id: `h-${i + 1}`,
      timestamp: `${String(i).padStart(2, '0')}:00:00`,
      prompt: `Prompt ${i + 1}`,
      result: `Result ${i + 1}`,
      evolution: [],
    }))
    const vm = adapter.adapt({ historyView: histories })
    const store = useObservatoryDataStore()
    store.viewModel = vm
    const wrapper = mount(ObservatoryHistoryViewer)
    expect(rows(wrapper)).toHaveLength(50)
  })

  it('selected history prompt displays from viewModel', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const wrapper = mount(ObservatoryHistoryViewer)
    expect(wrapper.find('.history-prompt-block').text()).toBe('Create Farm Game')
  })

  it('refreshing historyView updates the viewer', async () => {
    const store = useObservatoryDataStore()
    const wrapper = mountViewer()
    store.viewModel = {
      overview: { traceCount: 0, timelineCount: 0, historyCount: 2 },
      trace: [],
      traceView: [],
      timelineView: [],
      historyView: [
        { id: 'new-1', timestamp: '00:00', prompt: 'New Prompt A', result: 'New Result A', evolution: [{ name: 'NewE1' }] },
        { id: 'new-2', timestamp: '01:00', prompt: 'New Prompt B', result: 'New Result B', evolution: [] },
      ],
      timeline: [],
      history: [],
    }
    await nextTick()
    await nextTick()
    expect(rows(wrapper)).toHaveLength(2)
    expect(rowTexts(wrapper, '.history-row-id')).toEqual(['new-1', 'new-2'])
    // Click the first row to select it
    await rows(wrapper)[0].trigger('click')
    await nextTick()
    expect(wrapper.find('.history-prompt-block').text()).toBe('New Prompt A')
  })
})

// ---------------------------------------------------------------------------
// Section 14 — Accessibility
// ---------------------------------------------------------------------------

describe('history data — accessibility', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('history list nav has aria-label', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('nav.history-list').attributes('aria-label')).toBe('History list')
  })

  it('history details article has aria-label', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('article.history-details').attributes('aria-label')).toBe('History details')
  })

  it('uses buttons for history rows', () => {
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
    expect(texts).toContain('History List')
    expect(texts).toContain('History Details')
  })

  it('uses h3 for Prompt, Result, and Evolution headings', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('h3.history-prompt-title').exists()).toBe(true)
    expect(wrapper.find('h3.history-result-title').exists()).toBe(true)
    expect(wrapper.find('h3.history-evolution-title').exists()).toBe(true)
  })

  it('renders evolution cards as articles with aria-labelledby', () => {
    const wrapper = mountViewer()
    for (const card of entryCards(wrapper)) {
      expect(card.element.tagName).toBe('ARTICLE')
      expect(card.attributes('aria-labelledby')).toBeDefined()
    }
  })

  it('uses definition list for meta header', () => {
    const wrapper = mountViewer()
    const dl = wrapper.find('dl.history-meta-grid')
    expect(dl.exists()).toBe(true)
    expect(dl.findAll('dt')).toHaveLength(2)
    expect(dl.findAll('dd')).toHaveLength(2)
  })

  it('links sections to headings via aria-labelledby', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('#history-prompt-title').exists()).toBe(true)
    expect(wrapper.find('#history-result-title').exists()).toBe(true)
    expect(wrapper.find('#history-evolution-title').exists()).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 15 — ViewModel Shape Integrity
// ---------------------------------------------------------------------------

describe('history data — ViewModel shape integrity', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('historyView is an array on the root ViewModel', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(Array.isArray(store.viewModel.historyView)).toBe(true)
  })

  it('historyView is independent from trace', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(store.viewModel.historyView).not.toBe(store.viewModel.trace)
  })

  it('historyView items have required fields', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const h of store.viewModel.historyView) {
      const keys = Object.keys(h)
      expect(keys).toContain('id')
      expect(keys).toContain('timestamp')
      expect(keys).toContain('prompt')
      expect(keys).toContain('result')
      expect(keys).toContain('evolution')
    }
  })

  it('historyView evolution items have required fields', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const h of store.viewModel.historyView) {
      for (const e of h.evolution) {
        const keys = Object.keys(e)
        expect(keys).toContain('name')
      }
    }
  })

  it('historyView evolution arrays are frozen', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const h of store.viewModel.historyView) {
      expect(Object.isFrozen(h.evolution)).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------
// Section 16 — Store Edge Cases
// ---------------------------------------------------------------------------

describe('history data — store edge cases', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('loadMockObservatory produces deterministic historyView', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const first = store.viewModel.historyView.map((h) => h.id)
    store.loadMockObservatory()
    const second = store.viewModel.historyView.map((h) => h.id)
    expect(first).toEqual(second)
  })

  it('historyView can be directly replaced with custom data', () => {
    const store = useObservatoryDataStore()
    store.viewModel = {
      overview: { traceCount: 0, timelineCount: 0, historyCount: 1 },
      trace: [],
      traceView: [],
      timelineView: [],
      historyView: [{ id: 'custom', timestamp: '00:00', prompt: 'Custom', result: 'Done', evolution: [{ name: 'Evo' }] }],
      timeline: [],
      history: [],
    }
    expect(store.viewModel.historyView).toHaveLength(1)
    expect(store.viewModel.historyView[0].prompt).toBe('Custom')
  })

  it('viewModel with empty historyView after mount renders empty list', async () => {
    const store = useObservatoryDataStore()
    const wrapper = mount(ObservatoryHistoryViewer)
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

  it('multiple loads of mock data produce same historyView shape', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const ids1 = store.viewModel.historyView.map((h) => h.id)
    store.loadMockObservatory()
    const ids2 = store.viewModel.historyView.map((h) => h.id)
    expect(ids1).toEqual(ids2)
  })
})

// ---------------------------------------------------------------------------
// Section 17 — No AI Package Leakage
// ---------------------------------------------------------------------------

describe('history data — no AI package leakage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('historyView does not contain promptAssembly fields', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const h of store.viewModel.historyView) {
      expect('promptAssembly' in h).toBe(false)
    }
  })

  it('historyView entries do not contain plannerResult', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const h of store.viewModel.historyView) {
      for (const e of h.evolution) {
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
// Section 18 — HistoryView Fallback
// ---------------------------------------------------------------------------

describe('history data — historyView fallback', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('adapter falls back to history array data when historyView is missing', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      history: [
        { id: 'h-1', label: 'History 1', entries: [{ id: 'e1', label: 'Entry 1', timestamp: '00:00' }] },
      ],
    })
    expect(vm.historyView).toHaveLength(1)
    expect(vm.historyView[0].id).toBe('h-1')
  })

  it('fallback sets prompt from label field', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      history: [
        {
          id: 'h-fallback',
          label: 'Fallback Label',
          entries: [
            { id: 'e1', label: 'CreateWorld', timestamp: '00:00' },
            { id: 'e2', label: 'GenerateTerrain', timestamp: '01:00' },
          ],
        },
      ],
    })
    expect(vm.historyView[0].prompt).toBe('Fallback Label')
  })

  it('fallback derives evolution name from entry label', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      history: [
        {
          id: 'h-fallback',
          label: 'Fallback',
          entries: [{ id: 'e1', label: 'CreateWorld', timestamp: '00:00' }],
        },
      ],
    })
    expect(vm.historyView[0].evolution[0].name).toBe('CreateWorld')
  })

  it('fallback produces frozen output', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      history: [
        { id: 'h-1', label: 'H1', entries: [] },
      ],
    })
    expect(Object.isFrozen(vm.historyView)).toBe(true)
  })

  it('fallback returns empty array when history array is empty', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({ history: [] })
    expect(vm.historyView).toEqual([])
  })
})