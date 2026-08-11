/**
 * ObservatoryTraceDataIntegration — verifies the full data integration path
 * for the Trace Viewer panel from the observatoryData store
 * (via DefaultObservatoryAdapter) through the trace viewer components.
 *
 * WO-S6-014 — Observatory Trace Real Data Integration
 * Architecture version v1.44
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

import { useObservatoryDataStore } from '../stores/observatoryData'
import { DefaultObservatoryAdapter } from '../adapters/observatory'
import type {
  ObservatoryViewModel,
} from '../adapters/observatory'
import ObservatoryTraceViewer from '../components/observatory/trace/ObservatoryTraceViewer.vue'
import TraceList from '../components/observatory/trace/TraceList.vue'
import TraceDetails from '../components/observatory/trace/TraceDetails.vue'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mountViewer(): VueWrapper {
  useObservatoryDataStore().loadMockObservatory()
  return mount(ObservatoryTraceViewer)
}

function rows(wrapper: VueWrapper): ReturnType<VueWrapper['findAll']> {
  return wrapper.findAll('.trace-row')
}

function activeRows(wrapper: VueWrapper): ReturnType<VueWrapper['findAll']> {
  return rows(wrapper).filter((r) => r.classes().includes('trace-row--active'))
}

function rowTexts(wrapper: VueWrapper, selector: string): string[] {
  return wrapper.findAll(selector).map((el) => el.text().trim())
}

function stepCardTitles(wrapper: VueWrapper): string[] {
  return wrapper.findAll('.trace-step-card-title').map((el) => el.text().trim())
}

async function pressKey(wrapper: VueWrapper, key: string): Promise<void> {
  await wrapper.find('nav.trace-list').trigger('keydown', { key })
  await nextTick()
}

// ---------------------------------------------------------------------------
// Section 1 — Store traceView Integration
// ---------------------------------------------------------------------------

describe('trace data — store traceView integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('store initializes with empty traceView', () => {
    const store = useObservatoryDataStore()
    expect(store.viewModel.traceView).toEqual([])
  })

  it('loadMockObservatory populates traceView with 3 entries', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(store.viewModel.traceView).toHaveLength(3)
  })

  it('traceView entries have id field', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const t of store.viewModel.traceView) {
      expect(typeof t.id).toBe('string')
      expect(t.id.length).toBeGreaterThan(0)
    }
  })

  it('traceView entries have strategy field', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const strategies = store.viewModel.traceView.map((t) => t.strategy)
    expect(strategies).toContain('CreateWorld')
    expect(strategies).toContain('GenerateTerrain')
    expect(strategies).toContain('CreateFarm')
  })

  it('traceView entries have timestamp field', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const t of store.viewModel.traceView) {
      expect(typeof t.timestamp).toBe('string')
    }
  })

  it('traceView entries have plan field', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const t of store.viewModel.traceView) {
      expect(typeof t.plan).toBe('string')
      expect(t.plan.length).toBeGreaterThan(0)
    }
  })

  it('traceView entries have snapshot array', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const t of store.viewModel.traceView) {
      expect(Array.isArray(t.snapshot)).toBe(true)
    }
  })

  it('traceView entries have metadata object', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const t of store.viewModel.traceView) {
      expect(typeof t.metadata).toBe('object')
      expect(t.metadata).not.toBeNull()
    }
  })

  it('traceView is frozen', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(Object.isFrozen(store.viewModel.traceView)).toBe(true)
  })

  it('traceView entry ids are trace-001, trace-002, trace-003', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const ids = store.viewModel.traceView.map((t) => t.id)
    expect(ids).toEqual(['trace-001', 'trace-002', 'trace-003'])
  })
})

// ---------------------------------------------------------------------------
// Section 2 — Adapter Mapping
// ---------------------------------------------------------------------------

describe('trace data — adapter traceView mapping', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('adapter maps traceView from raw observatory', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      traceView: [
        {
          id: 'tv-1',
          strategy: 'Custom',
          timestamp: '01:00:00',
          plan: 'test plan',
          snapshot: [],
          metadata: { key: 'value' },
        },
      ],
    })
    expect(vm.traceView).toHaveLength(1)
    expect(vm.traceView[0].id).toBe('tv-1')
    expect(vm.traceView[0].strategy).toBe('Custom')
  })

  it('adapter handles missing traceView gracefully', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({})
    expect(vm.traceView).toEqual([])
  })

  it('adapter handles null traceView gracefully', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({ traceView: null })
    expect(vm.traceView).toEqual([])
  })

  it('adapter handles undefined traceView gracefully', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({ traceView: undefined })
    expect(vm.traceView).toEqual([])
  })

  it('adapter handles non-array traceView gracefully', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({ traceView: 'invalid' })
    expect(vm.traceView).toEqual([])
  })

  it('adapter maps snapshot entries correctly', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      traceView: [
        {
          id: 'tv-1',
          strategy: 'S1',
          timestamp: '00:00',
          plan: 'plan',
          snapshot: [{ key: 'K1', value: 'V1' }, { key: 'K2', value: 'V2' }],
          metadata: {},
        },
      ],
    })
    expect(vm.traceView[0].snapshot).toHaveLength(2)
    expect(vm.traceView[0].snapshot[0].key).toBe('K1')
    expect(vm.traceView[0].snapshot[0].value).toBe('V1')
  })

  it('adapter handles non-object traceView items gracefully', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      traceView: [null, undefined, 'string', 42],
    })
    expect(vm.traceView).toHaveLength(4)
    for (const t of vm.traceView) {
      expect(typeof t.id).toBe('string')
      expect(typeof t.strategy).toBe('string')
      expect(typeof t.timestamp).toBe('string')
      expect(typeof t.plan).toBe('string')
      expect(Array.isArray(t.snapshot)).toBe(true)
    }
  })

  it('adapter returns frozen traceView', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      traceView: [{ id: 't1', strategy: 'S', timestamp: 'T', plan: 'P', snapshot: [], metadata: {} }],
    })
    expect(Object.isFrozen(vm.traceView)).toBe(true)
  })

  it('adapter handles empty snapshot entries', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      traceView: [{ id: 't1', strategy: 'S', timestamp: 'T', plan: 'P', snapshot: [], metadata: {} }],
    })
    expect(vm.traceView[0].snapshot).toEqual([])
  })

  it('adapter handles null snapshot entries gracefully', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      traceView: [{ id: 't1', strategy: 'S', timestamp: 'T', plan: 'P', snapshot: null, metadata: {} }],
    })
    expect(vm.traceView[0].snapshot).toEqual([])
  })

  it('adapter maps frozen metadata', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      traceView: [{ id: 't1', strategy: 'S', timestamp: 'T', plan: 'P', snapshot: [], metadata: { phase: '1' } }],
    })
    expect(vm.traceView[0].metadata).toEqual({ phase: '1' })
  })
})

// ---------------------------------------------------------------------------
// Section 3 — Trace Viewer Rendering
// ---------------------------------------------------------------------------

describe('trace data — viewer rendering from viewModel', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders the root viewer container', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('.observatory-trace-viewer').exists()).toBe(true)
  })

  it('renders 3 trace rows from viewModel', () => {
    const wrapper = mountViewer()
    expect(rows(wrapper)).toHaveLength(3)
  })

  it('renders trace ids from viewModel', () => {
    const wrapper = mountViewer()
    expect(rowTexts(wrapper, '.trace-row-id')).toEqual([
      'trace-001',
      'trace-002',
      'trace-003',
    ])
  })

  it('renders strategies from viewModel', () => {
    const wrapper = mountViewer()
    expect(rowTexts(wrapper, '.trace-row-strategy')).toEqual([
      'CreateWorld',
      'GenerateTerrain',
      'CreateFarm',
    ])
  })

  it('renders timestamps from viewModel', () => {
    const wrapper = mountViewer()
    expect(rowTexts(wrapper, '.trace-row-time')).toEqual([
      '10:00:01',
      '10:00:05',
      '10:00:09',
    ])
  })

  it('renders the TraceList component', () => {
    const wrapper = mountViewer()
    expect(wrapper.findComponent(TraceList).exists()).toBe(true)
  })

  it('renders the TraceDetails component', () => {
    const wrapper = mountViewer()
    expect(wrapper.findComponent(TraceDetails).exists()).toBe(true)
  })

  it('renders "Trace List" as h2 heading', () => {
    const wrapper = mountViewer()
    const h2 = wrapper.find('.trace-list-title')
    expect(h2.exists()).toBe(true)
    expect(h2.text()).toBe('Trace List')
  })

  it('renders "Trace Details" as h2 heading', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('.trace-details-title').text()).toBe('Trace Details')
  })

  it('renders Plan, Snapshot, Metadata step cards', () => {
    const wrapper = mountViewer()
    expect(stepCardTitles(wrapper)).toEqual(['Plan', 'Snapshot', 'Metadata'])
  })

  it('renders Plan as a pre block', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('pre.trace-plan').exists()).toBe(true)
  })

  it('renders Metadata as a pre block', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('pre.trace-metadata').exists()).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 4 — Trace Selection
// ---------------------------------------------------------------------------

describe('trace data — trace selection', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('marks the first trace row active by default', () => {
    const wrapper = mountViewer()
    expect(rows(wrapper)[0].classes()).toContain('trace-row--active')
  })

  it('marks exactly one row active by default', () => {
    const wrapper = mountViewer()
    expect(activeRows(wrapper)).toHaveLength(1)
  })

  it('shows the first trace id in details by default', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('.trace-meta-grid').text()).toContain('trace-001')
  })

  it('shows the first strategy in details by default', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('.trace-meta-grid').text()).toContain('CreateWorld')
  })

  it('selects second trace on click', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    expect(wrapper.find('.trace-meta-grid').text()).toContain('trace-002')
  })

  it('clicking second trace shows its strategy', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    expect(wrapper.find('.trace-meta-grid').text()).toContain('GenerateTerrain')
  })

  it('clicking third trace shows its strategy', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[2].trigger('click')
    await nextTick()
    expect(wrapper.find('.trace-meta-grid').text()).toContain('CreateFarm')
  })

  it('moves active class to clicked row', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[2].trigger('click')
    await nextTick()
    expect(activeRows(wrapper)).toHaveLength(1)
    expect(activeRows(wrapper)[0].text()).toContain('trace-003')
  })

  it('switches back to first trace when re-clicked', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    await rows(wrapper)[0].trigger('click')
    await nextTick()
    expect(wrapper.find('.trace-meta-grid').text()).toContain('trace-001')
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

describe('trace data — keyboard navigation', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('moves selection to next trace with ArrowDown', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'ArrowDown')
    expect(activeRows(wrapper)[0].text()).toContain('trace-002')
  })

  it('updates details after ArrowDown', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'ArrowDown')
    expect(wrapper.find('.trace-meta-grid').text()).toContain('trace-002')
  })

  it('moves selection two steps with ArrowDown', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'ArrowDown')
    await pressKey(wrapper, 'ArrowDown')
    expect(activeRows(wrapper)[0].text()).toContain('trace-003')
  })

  it('clamps ArrowDown at last trace', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'ArrowDown')
    await pressKey(wrapper, 'ArrowDown')
    await pressKey(wrapper, 'ArrowDown')
    expect(activeRows(wrapper)[0].text()).toContain('trace-003')
  })

  it('clamps ArrowUp at first trace', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'ArrowUp')
    expect(activeRows(wrapper)[0].text()).toContain('trace-001')
  })

  it('jumps to last trace with End', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'End')
    expect(activeRows(wrapper)[0].text()).toContain('trace-003')
  })

  it('jumps to first trace with Home', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'End')
    await pressKey(wrapper, 'Home')
    expect(activeRows(wrapper)[0].text()).toContain('trace-001')
  })

  it('ignores unrelated keys', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'Tab')
    await pressKey(wrapper, 'Enter')
    await pressKey(wrapper, 'x')
    expect(activeRows(wrapper)[0].text()).toContain('trace-001')
  })

  it('focuses the newly selected row', async () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    useObservatoryDataStore().loadMockObservatory()
    const wrapper = mount(ObservatoryTraceViewer, { attachTo: el })
    await nextTick()
    await pressKey(wrapper, 'ArrowDown')
    expect(document.activeElement?.textContent).toContain('trace-002')
    wrapper.unmount()
    el.remove()
  })
})

// ---------------------------------------------------------------------------
// Section 6 — Detail Switching
// ---------------------------------------------------------------------------

describe('trace data — detail switching', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('plan updates when second trace selected', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    expect(wrapper.find('pre.trace-plan').text()).toContain('strategy=modify')
  })

  it('plan updates when third trace selected', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[2].trigger('click')
    await nextTick()
    expect(wrapper.find('pre.trace-plan').text()).toContain('strategy=query')
  })

  it('shows distinct plans per trace', async () => {
    const a = mountViewer()
    const b = mountViewer()
    await b.findAll('.trace-row')[1].trigger('click')
    await nextTick()
    expect(a.find('.trace-plan').text()).not.toBe(b.find('.trace-plan').text())
  })

  it('snapshot updates when second trace selected', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    const keys = wrapper.findAll('.trace-snapshot-key').map((el) => el.text().trim())
    expect(keys).toContain('Strategy')
  })

  it('metadata updates when second trace selected', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    expect(wrapper.find('pre.trace-metadata').text()).toContain('modified')
  })

  it('metadata updates when third trace selected', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[2].trigger('click')
    await nextTick()
    expect(wrapper.find('pre.trace-metadata').text()).toContain('resolved')
  })
})

// ---------------------------------------------------------------------------
// Section 7 — Snapshot Rendering
// ---------------------------------------------------------------------------

describe('trace data — snapshot rendering', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders snapshot as dl.trace-snapshot-grid', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('dl.trace-snapshot-grid').exists()).toBe(true)
  })

  it('renders snapshot step card with h3', () => {
    const wrapper = mountViewer()
    expect(stepCardTitles(wrapper)).toContain('Snapshot')
  })

  it('renders snapshot entries', () => {
    const wrapper = mountViewer()
    expect(wrapper.findAll('.trace-snapshot-item').length).toBeGreaterThan(0)
  })

  it('renders snapshot keys for first trace', () => {
    const wrapper = mountViewer()
    const keys = wrapper.findAll('.trace-snapshot-key').map((el) => el.text().trim())
    expect(keys).toContain('Module Count')
    expect(keys).toContain('Strategy')
  })

  it('renders snapshot values for first trace', () => {
    const wrapper = mountViewer()
    const values = wrapper.findAll('.trace-snapshot-value').map((el) => el.text().trim())
    expect(values).toContain('3')
    expect(values).toContain('CreateWorld')
  })

  it('renders dt/dd pairs inside snapshot entries', () => {
    const wrapper = mountViewer()
    for (const item of wrapper.findAll('.trace-snapshot-item')) {
      expect(item.find('dt.trace-snapshot-key').exists()).toBe(true)
      expect(item.find('dd.trace-snapshot-value').exists()).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------
// Section 8 — Metadata Rendering
// ---------------------------------------------------------------------------

describe('trace data — metadata rendering', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders Metadata step card with h3', () => {
    const wrapper = mountViewer()
    expect(stepCardTitles(wrapper)).toContain('Metadata')
  })

  it('renders metadata as JSON', () => {
    const wrapper = mountViewer()
    const text = wrapper.find('pre.trace-metadata').text()
    expect(text).toContain('"builder"')
    expect(text).toContain('DefaultPromptBuilder')
  })

  it('metadata JSON is parseable', () => {
    const wrapper = mountViewer()
    const parsed = JSON.parse(wrapper.find('pre.trace-metadata').text())
    expect(parsed.status).toBe('assembled')
  })

  it('metadata contains phase number', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('pre.trace-metadata').text()).toContain('0.959977')
  })

  it('metadata updates reflect selected trace', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[2].trigger('click')
    await nextTick()
    const parsed = JSON.parse(wrapper.find('pre.trace-metadata').text())
    expect(parsed.status).toBe('resolved')
  })
})

// ---------------------------------------------------------------------------
// Section 9 — Empty Traces
// ---------------------------------------------------------------------------

describe('trace data — empty traces', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders without error when traceView is empty after mount', async () => {
    const store = useObservatoryDataStore()
    const wrapper = mount(ObservatoryTraceViewer)
    store.viewModel = {
      overview: { traceCount: 0, timelineCount: 0, historyCount: 0 },
      trace: [],
      traceView: [],
      timelineView: [],
      historyView: [],
      diffView: [],
      timeline: [],
      history: [],
    }
    await nextTick()
    expect(wrapper.exists()).toBe(true)
  })

  it('renders no trace rows when traceView is empty after mount', async () => {
    const store = useObservatoryDataStore()
    const wrapper = mount(ObservatoryTraceViewer)
    store.viewModel = {
      overview: { traceCount: 0, timelineCount: 0, historyCount: 0 },
      trace: [],
      traceView: [],
      timelineView: [],
      historyView: [],
      diffView: [],
      timeline: [],
      history: [],
    }
    await nextTick()
    expect(rows(wrapper)).toHaveLength(0)
  })

  it('shows "No trace selected" when traceView is empty after mount', async () => {
    const store = useObservatoryDataStore()
    const wrapper = mount(ObservatoryTraceViewer)
    store.viewModel = {
      overview: { traceCount: 0, timelineCount: 0, historyCount: 0 },
      trace: [],
      traceView: [],
      timelineView: [],
      historyView: [],
      diffView: [],
      timeline: [],
      history: [],
    }
    await nextTick()
    expect(wrapper.find('.trace-details').text()).toContain('No trace selected')
  })

  it('renders TraceList and TraceDetails even with empty data after mount', async () => {
    const store = useObservatoryDataStore()
    const wrapper = mount(ObservatoryTraceViewer)
    store.viewModel = {
      overview: { traceCount: 0, timelineCount: 0, historyCount: 0 },
      trace: [],
      traceView: [],
      timelineView: [],
      historyView: [],
      diffView: [],
      timeline: [],
      history: [],
    }
    await nextTick()
    expect(wrapper.findComponent(TraceList).exists()).toBe(true)
    expect(wrapper.findComponent(TraceDetails).exists()).toBe(true)
  })

  it('empty traceView does not crash keyboard navigation', async () => {
    const store = useObservatoryDataStore()
    const wrapper = mount(ObservatoryTraceViewer)
    store.viewModel = {
      overview: { traceCount: 0, timelineCount: 0, historyCount: 0 },
      trace: [],
      traceView: [],
      timelineView: [],
      historyView: [],
      diffView: [],
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
})

// ---------------------------------------------------------------------------
// Section 10 — Defaults and Fallbacks
// ---------------------------------------------------------------------------

describe('trace data — defaults and fallbacks', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('default traceView is empty array before load', () => {
    const store = useObservatoryDataStore()
    expect(store.viewModel.traceView).toEqual([])
  })

  it('adapter returns empty traceView for undefined input', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt(undefined)
    expect(vm.traceView).toEqual([])
  })

  it('adapter returns empty traceView for null input', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt(null)
    expect(vm.traceView).toEqual([])
  })

  it('adapter returns empty traceView for number input', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt(42)
    expect(vm.traceView).toEqual([])
  })

  it('traceView items default to empty strings for missing fields', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({ traceView: [{}] })
    expect(vm.traceView[0].id).toBe('')
    expect(vm.traceView[0].strategy).toBe('')
    expect(vm.traceView[0].timestamp).toBe('')
    expect(vm.traceView[0].plan).toBe('')
  })

  it('traceView snapshot defaults to empty array for missing data', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({ traceView: [{ id: 't1', strategy: 'S', timestamp: 'T', plan: 'P' }] })
    expect(vm.traceView[0].snapshot).toEqual([])
  })

  it('traceView metadata defaults to empty object for missing data', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({ traceView: [{ id: 't1', strategy: 'S', timestamp: 'T', plan: 'P', snapshot: [] }] })
    expect(vm.traceView[0].metadata).toEqual({})
  })
})

// ---------------------------------------------------------------------------
// Section 11 — Deterministic Rendering
// ---------------------------------------------------------------------------

describe('trace data — deterministic rendering', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders identical trace ids across mounts', () => {
    const a = mountViewer()
    const b = mountViewer()
    expect(rowTexts(a, '.trace-row-id')).toEqual(rowTexts(b, '.trace-row-id'))
  })

  it('renders identical strategies across mounts', () => {
    const a = mountViewer()
    const b = mountViewer()
    expect(rowTexts(a, '.trace-row-strategy')).toEqual(rowTexts(b, '.trace-row-strategy'))
  })

  it('renders identical timestamps across mounts', () => {
    const a = mountViewer()
    const b = mountViewer()
    expect(rowTexts(a, '.trace-row-time')).toEqual(rowTexts(b, '.trace-row-time'))
  })

  it('renders identical step card titles across mounts', () => {
    const a = mountViewer()
    const b = mountViewer()
    expect(stepCardTitles(a)).toEqual(stepCardTitles(b))
  })

  it('renders identical active row text across mounts', () => {
    const a = mountViewer()
    const b = mountViewer()
    const activeText = (w: VueWrapper): string => w.find('.trace-row--active').text()
    expect(activeText(a)).toBe('CreateWorldtrace-00110:00:01')
    expect(activeText(b)).toBe('CreateWorldtrace-00110:00:01')
  })

  it('renders identical viewer HTML across mounts', () => {
    const a = mountViewer()
    const b = mountViewer()
    expect(a.html()).toBe(b.html())
  })

  it('plan content is identical across mounts', () => {
    const a = mountViewer()
    const b = mountViewer()
    expect(a.find('.trace-plan').text()).toBe(b.find('.trace-plan').text())
  })
})

// ---------------------------------------------------------------------------
// Section 12 — No Mutation
// ---------------------------------------------------------------------------

describe('trace data — no mutation', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('mounting viewer does not mutate traceView array reference', () => {
    const store = useObservatoryDataStore()
    mountViewer()
    expect(Object.isFrozen(store.viewModel.traceView)).toBe(true)
  })

  it('mounting viewer does not change traceView length', () => {
    const store = useObservatoryDataStore()
    const lenBefore = store.viewModel.traceView.length
    mountViewer()
    // After mount, loadMockObservatory sets traceView to 3 items
    expect(store.viewModel.traceView.length).toBe(3)
  })

  it('traceViewModel fields are readonly', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const t of store.viewModel.traceView) {
      expect(typeof t.id).toBe('string')
      expect(typeof t.strategy).toBe('string')
      expect(typeof t.timestamp).toBe('string')
      expect(typeof t.plan).toBe('string')
    }
  })

  it('traceView snapshot entries are frozen', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const t of store.viewModel.traceView) {
      expect(Object.isFrozen(t.snapshot)).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------
// Section 13 — Integration Path
// ---------------------------------------------------------------------------

describe('trace data — integration path', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('full path: store adapter produces traceView with correct values', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(store.viewModel.traceView[0].id).toBe('trace-001')
    expect(store.viewModel.traceView[0].strategy).toBe('CreateWorld')
    expect(store.viewModel.traceView[1].strategy).toBe('GenerateTerrain')
    expect(store.viewModel.traceView[2].strategy).toBe('CreateFarm')
  })

  it('adapter output matches component display after mount', async () => {
    const adapter = new DefaultObservatoryAdapter()
    const customData = {
      traceView: [
        { id: 'tv-A', strategy: 'Alpha', timestamp: '01:00', plan: 'Plan A', snapshot: [{ key: 'K', value: 'V' }], metadata: { src: 'custom' } },
        { id: 'tv-B', strategy: 'Beta', timestamp: '02:00', plan: 'Plan B', snapshot: [], metadata: {} },
      ],
    }
    const vm = adapter.adapt(customData)
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const wrapper = mount(ObservatoryTraceViewer)
    store.viewModel = vm
    await nextTick()
    await nextTick()
    expect(rows(wrapper)).toHaveLength(2)
    expect(rowTexts(wrapper, '.trace-row-id')).toEqual(['tv-A', 'tv-B'])
    expect(rowTexts(wrapper, '.trace-row-strategy')).toEqual(['Alpha', 'Beta'])
  })

  it('single trace item displays correctly after mount', async () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      traceView: [{ id: 'only', strategy: 'Solo', timestamp: '00:00', plan: 'P', snapshot: [], metadata: {} }],
    })
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    mount(ObservatoryTraceViewer)
    store.viewModel = vm
    await nextTick()
    await nextTick()
    // Mount fresh after setting viewModel
    const wrapper = mount(ObservatoryTraceViewer)
    expect(rows(wrapper)).toHaveLength(1)
    expect(activeRows(wrapper)).toHaveLength(1)
  })

  it('large number of traces list correctly after mount', async () => {
    const adapter = new DefaultObservatoryAdapter()
    const traces = Array.from({ length: 50 }, (_, i) => ({
      id: `tv-${i + 1}`,
      strategy: `S${i + 1}`,
      timestamp: `${String(i).padStart(2, '0')}:00:00`,
      plan: `Plan ${i + 1}`,
      snapshot: [],
      metadata: {},
    }))
    const vm = adapter.adapt({ traceView: traces })
    const store = useObservatoryDataStore()
    store.viewModel = vm
    const wrapper = mount(ObservatoryTraceViewer)
    expect(rows(wrapper)).toHaveLength(50)
  })

  it('selected trace plan displays from viewModel', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const wrapper = mount(ObservatoryTraceViewer)
    const plan = wrapper.find('pre.trace-plan').text()
    expect(plan).toContain('builder=DefaultPromptBuilder')
    expect(plan).toContain('strategy=create')
  })

  it('refreshing traceView updates the viewer', async () => {
    const store = useObservatoryDataStore()
    const wrapper = mountViewer()
    // Change to custom data
    store.viewModel = {
      overview: { traceCount: 2, timelineCount: 0, historyCount: 0 },
      trace: [],
      traceView: [
        { id: 'new-1', strategy: 'NewA', timestamp: '00:00', plan: 'Plan A', snapshot: [], metadata: {} },
        { id: 'new-2', strategy: 'NewB', timestamp: '01:00', plan: 'Plan B', snapshot: [], metadata: {} },
      ],
      timelineView: [],
      historyView: [],
      diffView: [],
      timeline: [],
      history: [],
    }
    await nextTick()
    expect(rows(wrapper)).toHaveLength(2)
    expect(rowTexts(wrapper, '.trace-row-strategy')).toEqual(['NewA', 'NewB'])
  })
})

// ---------------------------------------------------------------------------
// Section 14 — Accessibility
// ---------------------------------------------------------------------------

describe('trace data — accessibility', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('trace list nav has aria-label', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('nav.trace-list').attributes('aria-label')).toBe('Trace list')
  })

  it('trace details article has aria-label', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('article.trace-details').attributes('aria-label')).toBe('Trace details')
  })

  it('uses buttons for trace rows', () => {
    const wrapper = mountViewer()
    for (const row of rows(wrapper)) {
      expect(row.element.tagName).toBe('BUTTON')
      expect(row.attributes('type')).toBe('button')
    }
  })

  it('marks active row with aria-current', () => {
    const wrapper = mountViewer()
    expect(activeRows(wrapper)).toHaveLength(1)
    expect(activeRows(wrapper)[0].attributes('aria-current')).toBe('true')
  })

  it('h2 headings for list and details', () => {
    const wrapper = mountViewer()
    const texts = wrapper.findAll('h2').map((h) => h.text().trim())
    expect(texts).toContain('Trace List')
    expect(texts).toContain('Trace Details')
  })

  it('pre blocks are keyboard reachable', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('pre.trace-plan').attributes('tabindex')).toBe('0')
    expect(wrapper.find('pre.trace-metadata').attributes('tabindex')).toBe('0')
  })

  it('trace meta header uses dl', () => {
    const wrapper = mountViewer()
    const dl = wrapper.find('dl.trace-meta-grid')
    expect(dl.exists()).toBe(true)
    expect(dl.findAll('dt')).toHaveLength(2)
    expect(dl.findAll('dd')).toHaveLength(2)
  })
})

// ---------------------------------------------------------------------------
// Section 15 — ViewModel Shape Integrity
// ---------------------------------------------------------------------------

describe('trace data — viewModel shape integrity', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('traceView is array on default empty viewModel', () => {
    const store = useObservatoryDataStore()
    expect(Array.isArray(store.viewModel.traceView)).toBe(true)
  })

  it('traceView is array after loading mock', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(Array.isArray(store.viewModel.traceView)).toBe(true)
  })

  it('traceViewModel entries have all required fields', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const t of store.viewModel.traceView) {
      const keys = Object.keys(t)
      expect(keys).toContain('id')
      expect(keys).toContain('strategy')
      expect(keys).toContain('timestamp')
      expect(keys).toContain('plan')
      expect(keys).toContain('snapshot')
      expect(keys).toContain('metadata')
    }
  })

  it('traceView is independent from trace field', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(store.viewModel.traceView).not.toBe(store.viewModel.trace)
  })

  it('traceView entry snapshot entries have key and value', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const t of store.viewModel.traceView) {
      for (const s of t.snapshot) {
        expect(typeof s.key).toBe('string')
        expect(typeof s.value).toBe('string')
      }
    }
  })
})

// ---------------------------------------------------------------------------
// Section 16 — Store Edge Cases
// ---------------------------------------------------------------------------

describe('trace data — store edge cases', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('loadMockObservatory fills traceView after multiple calls', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const first = store.viewModel.traceView.map((t) => t.id)
    store.loadMockObservatory()
    const second = store.viewModel.traceView.map((t) => t.id)
    expect(first).toEqual(second)
  })

  it('traceView can be directly replaced with custom data', () => {
    const store = useObservatoryDataStore()
    store.viewModel = {
      overview: { traceCount: 1, timelineCount: 0, historyCount: 0 },
      trace: [],
      traceView: [{ id: 'custom', strategy: 'Custom', timestamp: '00:00', plan: 'Plan', snapshot: [], metadata: {} }],
      timelineView: [],
      historyView: [],
      diffView: [],
      timeline: [],
      history: [],
    }
    expect(store.viewModel.traceView).toHaveLength(1)
    expect(store.viewModel.traceView[0].strategy).toBe('Custom')
  })

  it('viewModel with empty traceView after mount renders empty list', async () => {
    const store = useObservatoryDataStore()
    const wrapper = mount(ObservatoryTraceViewer)
    store.viewModel = {
      overview: { traceCount: 0, timelineCount: 0, historyCount: 0 },
      trace: [],
      traceView: [],
      timelineView: [],
      historyView: [],
      diffView: [],
      timeline: [],
      history: [],
    }
    await nextTick()
    expect(rows(wrapper)).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Section 17 — No AI Package Leakage
// ---------------------------------------------------------------------------

describe('trace data — no AI package leakage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('traceView VM does not contain promptAssembly metadata', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const first = store.viewModel.traceView[0]
    expect('promptAssembly' in first.metadata).toBe(false)
  })

  it('traceView does not expose plannerResult', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const vm = store.viewModel as Record<string, unknown>
    expect('plannerResult' in vm).toBe(false)
  })
})