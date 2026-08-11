/**
 * ObservatoryOverviewDataIntegration — verifies the full data integration path
 * from the observatoryData store (via DefaultObservatoryAdapter) through the
 * ObservatoryOverview component rendering.
 *
 * WO-S6-013 — Observatory Overview Real Data Integration
 * Architecture version v1.43
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

import { useObservatoryDataStore } from '../stores/observatoryData'
import { useI18nStore } from '../stores/i18n'
import { DefaultObservatoryAdapter } from '../adapters/observatory'
import type {
  ObservatoryViewModel,
  OverviewDTO,
} from '../adapters/observatory'
import ObservatoryOverview from '../components/observatory/ObservatoryOverview.vue'
import ObservatoryContent from '../components/observatory/ObservatoryContent.vue'
import ObservatoryShell from '../components/observatory/ObservatoryShell.vue'
import { useObservatoryStore } from '../stores/observatory'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function activateEn(): void {
  setActivePinia(createPinia())
  useI18nStore().setLanguage('en-US')
}

function mountOverview(): VueWrapper {
  return mount(ObservatoryOverview)
}

function artifactCards(wrapper: VueWrapper): ReturnType<VueWrapper['findAll']> {
  return wrapper.findAll('.artifact-card')
}

function sectionTexts(wrapper: VueWrapper, selector: string): string[] {
  return wrapper.findAll(selector).map((el) => el.text().trim())
}

// ---------------------------------------------------------------------------
// Section 1 — Store Initialization
// ---------------------------------------------------------------------------

describe('observatoryData store — initialization', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('creates the store without error', () => {
    const store = useObservatoryDataStore()
    expect(store).toBeDefined()
  })

  it('initializes viewModel with empty defaults', () => {
    const store = useObservatoryDataStore()
    expect(store.viewModel.overview.traceCount).toBe(0)
    expect(store.viewModel.overview.timelineCount).toBe(0)
    expect(store.viewModel.overview.historyCount).toBe(0)
  })

  it('initializes viewModel with empty trace array', () => {
    const store = useObservatoryDataStore()
    expect(store.viewModel.trace).toEqual([])
  })

  it('initializes viewModel with empty timeline array', () => {
    const store = useObservatoryDataStore()
    expect(store.viewModel.timeline).toEqual([])
  })

  it('initializes viewModel with empty history array', () => {
    const store = useObservatoryDataStore()
    expect(store.viewModel.history).toEqual([])
  })

  it('viewModel is frozen (returns non-mutable structure)', () => {
    const store = useObservatoryDataStore()
    expect(Object.isFrozen(store.viewModel.trace)).toBe(true)
    expect(Object.isFrozen(store.viewModel.timeline)).toBe(true)
    expect(Object.isFrozen(store.viewModel.history)).toBe(true)
  })

  it('store has a loadMockObservatory function', () => {
    const store = useObservatoryDataStore()
    expect(typeof store.loadMockObservatory).toBe('function')
  })

  it('loadMockObservatory updates viewModel.overview.traceCount', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(store.viewModel.overview.traceCount).toBe(3)
  })

  it('loadMockObservatory updates viewModel.overview.timelineCount', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(store.viewModel.overview.timelineCount).toBe(5)
  })

  it('loadMockObservatory updates viewModel.overview.historyCount', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(store.viewModel.overview.historyCount).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// Section 2 — Adapter Invocation
// ---------------------------------------------------------------------------

describe('observatoryData store — adapter invocation', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('uses DefaultObservatoryAdapter internally', () => {
    const adapter = new DefaultObservatoryAdapter()
    expect(adapter).toBeDefined()
  })

  it('adapter produces correct trace count from mock', () => {
    const adapter = new DefaultObservatoryAdapter()
    const mock = {
      trace: [
        { id: 't1', label: 'T1', steps: [{ id: 's1', label: 'S1', status: 'ok' }] },
        { id: 't2', label: 'T2', steps: [{ id: 's2', label: 'S2', status: 'ok' }] },
        { id: 't3', label: 'T3', steps: [{ id: 's3', label: 'S3', status: 'ok' }] },
      ],
    }
    const vm = adapter.adapt(mock)
    expect(vm.overview.traceCount).toBe(3)
  })

  it('adapter produces correct timeline count from mock', () => {
    const adapter = new DefaultObservatoryAdapter()
    const mock = {
      timeline: Array.from({ length: 5 }, (_, i) => ({
        id: `tl-${i + 1}`,
        label: `TL ${i + 1}`,
        entries: [{ id: `e${i + 1}`, label: `E${i + 1}`, timestamp: '2026-01-01T00:00:00Z' }],
      })),
    }
    const vm = adapter.adapt(mock)
    expect(vm.overview.timelineCount).toBe(5)
  })

  it('adapter produces correct history count from mock', () => {
    const adapter = new DefaultObservatoryAdapter()
    const mock = {
      history: [
        { id: 'h1', label: 'H1', entries: [] },
        { id: 'h2', label: 'H2', entries: [] },
      ],
    }
    const vm = adapter.adapt(mock)
    expect(vm.overview.historyCount).toBe(2)
  })

  it('adapter returns frozen arrays', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({ trace: [], timeline: [], history: [] })
    expect(Object.isFrozen(vm.trace)).toBe(true)
    expect(Object.isFrozen(vm.timeline)).toBe(true)
    expect(Object.isFrozen(vm.history)).toBe(true)
  })

  it('adapter handles undefined gracefully', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt(undefined)
    expect(vm.overview.traceCount).toBe(0)
    expect(vm.overview.timelineCount).toBe(0)
    expect(vm.overview.historyCount).toBe(0)
  })

  it('adapter handles null gracefully', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt(null)
    expect(vm.overview.traceCount).toBe(0)
  })

  it('adapter handles empty object gracefully', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({})
    expect(vm.overview.traceCount).toBe(0)
    expect(vm.trace).toEqual([])
  })

  it('adapter returns deterministically for same input', () => {
    const adapter = new DefaultObservatoryAdapter()
    const input = { trace: [{ id: 't1', label: 'T', steps: [] }] }
    const a = adapter.adapt(input)
    const b = adapter.adapt(input)
    expect(a.overview.traceCount).toBe(b.overview.traceCount)
  })
})

// ---------------------------------------------------------------------------
// Section 3 — Overview Rendering from ViewModel
// ---------------------------------------------------------------------------

describe('observatory overview — rendering from viewModel', () => {
  beforeEach(() => {
    activateEn()
  })

  it('renders 3 artifact cards from viewModel data', () => {
    const wrapper = mountOverview()
    expect(artifactCards(wrapper)).toHaveLength(3)
  })

  it('Trace card displays count 3 from viewModel', () => {
    const wrapper = mountOverview()
    const cards = artifactCards(wrapper)
    const trace = cards.filter((c) => c.text().includes('Trace'))[0]
    expect(trace.find('.artifact-card-count').text()).toBe('3')
  })

  it('Timeline card displays count 5 from viewModel', () => {
    const wrapper = mountOverview()
    const cards = artifactCards(wrapper)
    const timeline = cards.filter((c) => c.text().includes('Timeline'))[0]
    expect(timeline.find('.artifact-card-count').text()).toBe('5')
  })

  it('History card displays count 2 from viewModel', () => {
    const wrapper = mountOverview()
    const cards = artifactCards(wrapper)
    const history = cards.filter((c) => c.text().includes('History'))[0]
    expect(history.find('.artifact-card-count').text()).toBe('2')
  })

  it('counts appear in order Trace, Timeline, History', () => {
    const wrapper = mountOverview()
    const counts = wrapper.findAll('.artifact-card-count').map((c) => c.text())
    expect(counts).toEqual(['3', '5', '2'])
  })

  it('Artifact Count snapshot value sums all counts', () => {
    const wrapper = mountOverview()
    const labels = wrapper.findAll('.snapshot-label')
    const index = labels.findIndex((l) => l.text() === 'Artifact Count')
    expect(wrapper.findAll('.snapshot-value')[index].text()).toContain('10')
  })

  it('Has Trace snapshot shows Yes', () => {
    const wrapper = mountOverview()
    expect(wrapper.text()).toContain('Has Trace')
    expect(wrapper.text()).toContain('Yes')
  })

  it('Has Timeline snapshot shows Yes', () => {
    const wrapper = mountOverview()
    expect(wrapper.text()).toContain('Has Timeline')
    expect(wrapper.text()).toContain('Yes')
  })

  it('Has History snapshot shows Yes', () => {
    const wrapper = mountOverview()
    expect(wrapper.text()).toContain('Has History')
    expect(wrapper.text()).toContain('Yes')
  })

  it('Has Trace Snapshot shows Yes', () => {
    const wrapper = mountOverview()
    expect(wrapper.text()).toContain('Has Trace Snapshot')
    expect(wrapper.text()).toContain('Yes')
  })

  it('Has Timeline Snapshot shows Yes', () => {
    const wrapper = mountOverview()
    expect(wrapper.text()).toContain('Has Timeline Snapshot')
    expect(wrapper.text()).toContain('Yes')
  })

  it('Has History Snapshot shows Yes', () => {
    const wrapper = mountOverview()
    expect(wrapper.text()).toContain('Has History Snapshot')
    expect(wrapper.text()).toContain('Yes')
  })

  it('snapshot labels appear in canonical order', () => {
    const wrapper = mountOverview()
    expect(sectionTexts(wrapper, '.snapshot-label')).toEqual([
      'Artifact Count',
      'Has Trace',
      'Has Timeline',
      'Has History',
      'Has Trace Snapshot',
      'Has Timeline Snapshot',
      'Has History Snapshot',
    ])
  })
})

// ---------------------------------------------------------------------------
// Section 4 — Count Updates (Store Change → Re-render)
// ---------------------------------------------------------------------------

describe('observatory overview — count updates reactivity', () => {
  beforeEach(() => {
    activateEn()
  })

  it('updates Trace count when store changes', async () => {
    const store = useObservatoryDataStore()
    const wrapper = mountOverview()
    // Create a new viewModel with modified trace count
    store.viewModel = {
      overview: { traceCount: 7, timelineCount: 5, historyCount: 2 },
      trace: [],
      traceView: [],
      timelineView: [],
      historyView: [],
      diffView: [],
      timeline: [],
      history: [],
    }
    await nextTick()
    const cards = artifactCards(wrapper)
    const trace = cards.filter((c) => c.text().includes('Trace'))[0]
    expect(trace.find('.artifact-card-count').text()).toBe('7')
  })

  it('updates Timeline count when store changes', async () => {
    const store = useObservatoryDataStore()
    const wrapper = mountOverview()
    store.viewModel = {
      overview: { traceCount: 3, timelineCount: 10, historyCount: 2 },
      trace: [],
      traceView: [],
      timelineView: [],
      historyView: [],
      diffView: [],
      timeline: [],
      history: [],
    }
    await nextTick()
    const cards = artifactCards(wrapper)
    const timeline = cards.filter((c) => c.text().includes('Timeline'))[0]
    expect(timeline.find('.artifact-card-count').text()).toBe('10')
  })

  it('updates History count when store changes', async () => {
    const store = useObservatoryDataStore()
    const wrapper = mountOverview()
    store.viewModel = {
      overview: { traceCount: 3, timelineCount: 5, historyCount: 9 },
      trace: [],
      traceView: [],
      timelineView: [],
      historyView: [],
      diffView: [],
      timeline: [],
      history: [],
    }
    await nextTick()
    const cards = artifactCards(wrapper)
    const history = cards.filter((c) => c.text().includes('History'))[0]
    expect(history.find('.artifact-card-count').text()).toBe('9')
  })

  it('updates Artifact Count when store changes', async () => {
    const store = useObservatoryDataStore()
    const wrapper = mountOverview()
    store.viewModel = {
      overview: { traceCount: 10, timelineCount: 20, historyCount: 30 },
      trace: [],
      traceView: [],
      timelineView: [],
      historyView: [],
      diffView: [],
      timeline: [],
      history: [],
    }
    await nextTick()
    const labels = wrapper.findAll('.snapshot-label')
    const index = labels.findIndex((l) => l.text() === 'Artifact Count')
    expect(wrapper.findAll('.snapshot-value')[index].text()).toContain('60')
  })

  it('toggles Has Trace when count goes to zero', async () => {
    const store = useObservatoryDataStore()
    const wrapper = mountOverview()
    store.viewModel = {
      overview: { traceCount: 0, timelineCount: 5, historyCount: 2 },
      trace: [],
      traceView: [],
      timelineView: [],
      historyView: [],
      diffView: [],
      timeline: [],
      history: [],
    }
    await nextTick()
    const labels = wrapper.findAll('.snapshot-label')
    const index = labels.findIndex((l) => l.text() === 'Has Trace')
    expect(wrapper.findAll('.snapshot-value')[index].text()).toContain('No')
  })

  it('toggles Has Timeline when count goes to zero', async () => {
    const store = useObservatoryDataStore()
    const wrapper = mountOverview()
    store.viewModel = {
      overview: { traceCount: 3, timelineCount: 0, historyCount: 2 },
      trace: [],
      traceView: [],
      timelineView: [],
      historyView: [],
      diffView: [],
      timeline: [],
      history: [],
    }
    await nextTick()
    const labels = wrapper.findAll('.snapshot-label')
    const index = labels.findIndex((l) => l.text() === 'Has Timeline')
    expect(wrapper.findAll('.snapshot-value')[index].text()).toContain('No')
  })

  it('toggles Has History when count goes to zero', async () => {
    const store = useObservatoryDataStore()
    const wrapper = mountOverview()
    store.viewModel = {
      overview: { traceCount: 3, timelineCount: 5, historyCount: 0 },
      trace: [],
      traceView: [],
      timelineView: [],
      historyView: [],
      diffView: [],
      timeline: [],
      history: [],
    }
    await nextTick()
    const labels = wrapper.findAll('.snapshot-label')
    const index = labels.findIndex((l) => l.text() === 'Has History')
    expect(wrapper.findAll('.snapshot-value')[index].text()).toContain('No')
  })

  it('loadMockObservatory resets counts to mock values', async () => {
    const store = useObservatoryDataStore()
    const wrapper = mountOverview()
    // Override with different values
    store.viewModel = {
      overview: { traceCount: 99, timelineCount: 99, historyCount: 99 },
      trace: [],
      traceView: [],
      timelineView: [],
      historyView: [],
      diffView: [],
      timeline: [],
      history: [],
    }
    await nextTick()
    // Reload mock
    store.loadMockObservatory()
    await nextTick()
    const counts = wrapper.findAll('.artifact-card-count').map((c) => c.text())
    expect(counts).toEqual(['3', '5', '2'])
  })

  it('reacts to timeline count zero with snapshot change', async () => {
    const store = useObservatoryDataStore()
    const wrapper = mountOverview()
    store.viewModel = {
      overview: { traceCount: 3, timelineCount: 0, historyCount: 2 },
      trace: [],
      traceView: [],
      timelineView: [],
      historyView: [],
      diffView: [],
      timeline: [],
      history: [],
    }
    await nextTick()
    expect(wrapper.text()).toContain('No')
  })
})

// ---------------------------------------------------------------------------
// Section 5 — Default Values
// ---------------------------------------------------------------------------

describe('observatory overview — default values', () => {
  beforeEach(() => {
    activateEn()
  })

  it('displays zero counts when viewModel is set to empty after mount', async () => {
    const store = useObservatoryDataStore()
    const wrapper = mountOverview()
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
    const counts = wrapper.findAll('.artifact-card-count').map((c) => c.text())
    expect(counts).toEqual(['0', '0', '0'])
  })

  it('displays 3 artifact cards even with zero counts', async () => {
    const store = useObservatoryDataStore()
    const wrapper = mountOverview()
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
    expect(artifactCards(wrapper)).toHaveLength(3)
  })

  it('displays 7 snapshot items even with zero counts', async () => {
    const store = useObservatoryDataStore()
    const wrapper = mountOverview()
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
    expect(wrapper.findAll('.snapshot-item')).toHaveLength(7)
  })

  it('Artifact Count is 0 when all counts are 0', async () => {
    const store = useObservatoryDataStore()
    const wrapper = mountOverview()
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
    const labels = wrapper.findAll('.snapshot-label')
    const index = labels.findIndex((l) => l.text() === 'Artifact Count')
    expect(wrapper.findAll('.snapshot-value')[index].text()).toContain('0')
  })

  it('all snapshot booleans are No when all counts are 0', async () => {
    const store = useObservatoryDataStore()
    const wrapper = mountOverview()
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
    const snapshotValues = wrapper.findAll('.snapshot-value')
    for (let i = 1; i < snapshotValues.length; i++) {
      expect(snapshotValues[i].text()).toContain('No')
    }
  })
})

// ---------------------------------------------------------------------------
// Section 6 — Empty Observatory
// ---------------------------------------------------------------------------

describe('observatory overview — empty observatory', () => {
  beforeEach(() => {
    activateEn()
  })

  it('renders without error when observatory is made empty after mount', async () => {
    const store = useObservatoryDataStore()
    const wrapper = mountOverview()
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

  it('shows no positive counts when set to empty', async () => {
    const store = useObservatoryDataStore()
    const wrapper = mountOverview()
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
    const counts = wrapper.findAll('.artifact-card-count').map((c) => c.text())
    expect(counts.every((c) => c === '0')).toBe(true)
  })

  it('no Yes values appear when set to empty', async () => {
    const store = useObservatoryDataStore()
    const wrapper = mountOverview()
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
    const snapshotValues = wrapper.findAll('.snapshot-value')
    for (let i = 1; i < snapshotValues.length; i++) {
      expect(snapshotValues[i].text()).toContain('No')
    }
  })

  it('maintains section layout in empty state', async () => {
    const store = useObservatoryDataStore()
    const wrapper = mountOverview()
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
    expect(wrapper.findAll('section.overview-section')).toHaveLength(3)
  })

  it('maintains article card structure in empty state', async () => {
    const store = useObservatoryDataStore()
    const wrapper = mountOverview()
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
    for (const card of artifactCards(wrapper)) {
      expect(card.find('.artifact-card-title').exists()).toBe(true)
      expect(card.find('.artifact-card-count').exists()).toBe(true)
      expect(card.find('.artifact-card-description').exists()).toBe(true)
    }
  })

  it('trace card title remains visible in empty state', async () => {
    const store = useObservatoryDataStore()
    const wrapper = mountOverview()
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
    const titles = sectionTexts(wrapper, '.artifact-card-title')
    expect(titles).toContain('Trace')
    expect(titles).toContain('Timeline')
    expect(titles).toContain('History')
  })

  it('count displayed as 0 for all artifacts in empty state', async () => {
    const store = useObservatoryDataStore()
    const wrapper = mountOverview()
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
    const counts = wrapper.findAll('.artifact-card-count').map((c) => c.text())
    expect(counts.every((c) => c === '0')).toBe(true)
  })

  it('snapshot section still renders with correct labels in empty state', async () => {
    const store = useObservatoryDataStore()
    const wrapper = mountOverview()
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
    expect(sectionTexts(wrapper, '.snapshot-label')).toEqual([
      'Artifact Count',
      'Has Trace',
      'Has Timeline',
      'Has History',
      'Has Trace Snapshot',
      'Has Timeline Snapshot',
      'Has History Snapshot',
    ])
  })
})

// ---------------------------------------------------------------------------
// Section 7 — Deterministic Rendering
// ---------------------------------------------------------------------------

describe('observatory overview — deterministic rendering', () => {
  beforeEach(() => {
    activateEn()
  })

  it('renders identical artifact counts across mounts', () => {
    const first = mountOverview()
    const second = mountOverview()
    expect(sectionTexts(first, '.artifact-card-count')).toEqual(
      sectionTexts(second, '.artifact-card-count'),
    )
  })

  it('renders identical snapshot labels across mounts', () => {
    const first = mountOverview()
    const second = mountOverview()
    expect(sectionTexts(first, '.snapshot-label')).toEqual(
      sectionTexts(second, '.snapshot-label'),
    )
  })

  it('renders identical snapshot values across mounts', () => {
    const first = mountOverview()
    const second = mountOverview()
    expect(sectionTexts(first, '.snapshot-value')).toEqual(
      sectionTexts(second, '.snapshot-value'),
    )
  })

  it('renders the same section count across mounts', () => {
    const first = mountOverview()
    const second = mountOverview()
    expect(first.findAll('.overview-section')).toHaveLength(
      second.findAll('.overview-section').length,
    )
  })

  it('full HTML is identical across mounts', () => {
    const html1 = mountOverview().html()
    const html2 = mountOverview().html()
    expect(html1).toBe(html2)
  })

  it('artifact cards maintain order across mounts', () => {
    const first = mountOverview()
    const second = mountOverview()
    const titles1 = sectionTexts(first, '.artifact-card-title')
    const titles2 = sectionTexts(second, '.artifact-card-title')
    expect(titles1).toEqual(titles2)
  })
})

// ---------------------------------------------------------------------------
// Section 8 — No Mutation
// ---------------------------------------------------------------------------

describe('observatory overview — no mutation', () => {
  beforeEach(() => {
    activateEn()
  })

  it('viewModel overview fields are numbers after mount', () => {
    const store = useObservatoryDataStore()
    mountOverview()
    const overview: OverviewDTO = store.viewModel.overview
    expect(typeof overview.traceCount).toBe('number')
    expect(typeof overview.timelineCount).toBe('number')
    expect(typeof overview.historyCount).toBe('number')
  })

  it('viewModel arrays remain frozen after mount', () => {
    const store = useObservatoryDataStore()
    mountOverview()
    expect(Object.isFrozen(store.viewModel.trace)).toBe(true)
    expect(Object.isFrozen(store.viewModel.timeline)).toBe(true)
    expect(Object.isFrozen(store.viewModel.history)).toBe(true)
  })

  it('overview fields are readonly and numeric', () => {
    mountOverview()
    const store = useObservatoryDataStore()
    expect(typeof store.viewModel.overview.traceCount).toBe('number')
    expect(typeof store.viewModel.overview.timelineCount).toBe('number')
    expect(typeof store.viewModel.overview.historyCount).toBe('number')
  })

  it('mounting the component loads mock data deterministically', () => {
    const store = useObservatoryDataStore()
    mountOverview()
    expect(store.viewModel.overview.traceCount).toBe(3)
    expect(store.viewModel.overview.timelineCount).toBe(5)
    expect(store.viewModel.overview.historyCount).toBe(2)
  })

  it('mounting twice produces the same viewModel state', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const first = { ...store.viewModel.overview }
    mountOverview()
    const second = { ...store.viewModel.overview }
    expect(second.traceCount).toBe(first.traceCount)
    expect(second.timelineCount).toBe(first.timelineCount)
    expect(second.historyCount).toBe(first.historyCount)
  })
})

// ---------------------------------------------------------------------------
// Section 9 — Integration Path
// ---------------------------------------------------------------------------

describe('observatory overview — integration path', () => {
  beforeEach(() => {
    activateEn()
  })

  it('full path: store → adapter → viewModel → component', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const wrapper = mount(ObservatoryOverview)
    const counts = wrapper.findAll('.artifact-card-count').map((c) => c.text())
    expect(counts).toEqual(['3', '5', '2'])
  })

  it('integration: adapter output matches component display after mount', async () => {
    const adapter = new DefaultObservatoryAdapter()
    const mock = {
      trace: [{ id: 'a', label: 'A', steps: [] }],
      timeline: [{ id: 'b', label: 'B', entries: [] }, { id: 'c', label: 'C', entries: [] }],
      history: [{ id: 'd', label: 'D', entries: [] }],
    }
    const vm = adapter.adapt(mock)
    const store = useObservatoryDataStore()
    const wrapper = mountOverview()
    store.viewModel = vm
    await nextTick()
    const counts = wrapper.findAll('.artifact-card-count').map((c) => c.text())
    expect(counts).toEqual(['1', '2', '1'])
  })

  it('integration: zero-length arrays produce 0 counts after mount', async () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({ trace: [], timeline: [], history: [] })
    const store = useObservatoryDataStore()
    const wrapper = mountOverview()
    store.viewModel = vm
    await nextTick()
    const counts = wrapper.findAll('.artifact-card-count').map((c) => c.text())
    expect(counts).toEqual(['0', '0', '0'])
  })

  it('integration: large counts display correctly after mount', async () => {
    const adapter = new DefaultObservatoryAdapter()
    const mock = {
      trace: Array.from({ length: 100 }, (_, i) => ({ id: `t${i}`, label: `T${i}`, steps: [] })),
      timeline: Array.from({ length: 200 }, (_, i) => ({ id: `tl${i}`, label: `TL${i}`, entries: [] })),
      history: Array.from({ length: 50 }, (_, i) => ({ id: `h${i}`, label: `H${i}`, entries: [] })),
    }
    const vm = adapter.adapt(mock)
    const store = useObservatoryDataStore()
    const wrapper = mountOverview()
    store.viewModel = vm
    await nextTick()
    const counts = wrapper.findAll('.artifact-card-count').map((c) => c.text())
    expect(counts).toEqual(['100', '200', '50'])
  })

  it('integration: adapter handles partial data from store path', async () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt(undefined)
    const store = useObservatoryDataStore()
    const wrapper = mountOverview()
    store.viewModel = vm
    await nextTick()
    expect(wrapper.findAll('.artifact-card-count')).toHaveLength(3)
  })

  it('overview renders inside content with data store loaded', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const wrapper = mount(ObservatoryOverview)
    expect(wrapper.find('.artifact-card').exists()).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 10 — ViewModel Data Integrity
// ---------------------------------------------------------------------------

describe('observatory overview — viewModel data integrity', () => {
  beforeEach(() => {
    activateEn()
  })

  it('trace array has 3 items after loadMockObservatory', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(store.viewModel.trace).toHaveLength(3)
  })

  it('timeline array has 5 items after loadMockObservatory', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(store.viewModel.timeline).toHaveLength(5)
  })

  it('history array has 2 items after loadMockObservatory', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(store.viewModel.history).toHaveLength(2)
  })

  it('trace items have id and label fields', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const t of store.viewModel.trace) {
      expect(typeof t.id).toBe('string')
      expect(typeof t.label).toBe('string')
    }
  })

  it('trace steps are arrays of {id, label, status}', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const t of store.viewModel.trace) {
      expect(Array.isArray(t.steps)).toBe(true)
      for (const s of t.steps) {
        expect(typeof s.id).toBe('string')
        expect(typeof s.label).toBe('string')
        expect(typeof s.status).toBe('string')
      }
    }
  })

  it('timeline items have id, label, entries fields', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const tl of store.viewModel.timeline) {
      expect(typeof tl.id).toBe('string')
      expect(typeof tl.label).toBe('string')
      expect(Array.isArray(tl.entries)).toBe(true)
    }
  })

  it('history items have id, label, entries fields', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const h of store.viewModel.history) {
      expect(typeof h.id).toBe('string')
      expect(typeof h.label).toBe('string')
      expect(Array.isArray(h.entries)).toBe(true)
    }
  })

  it('overview counts match array lengths', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(store.viewModel.overview.traceCount).toBe(store.viewModel.trace.length)
    expect(store.viewModel.overview.timelineCount).toBe(store.viewModel.timeline.length)
    expect(store.viewModel.overview.historyCount).toBe(store.viewModel.history.length)
  })

  it('viewModel is not null after load', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(store.viewModel).toBeTruthy()
  })

  it('overview is an object with all required fields', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const o = store.viewModel.overview
    expect('traceCount' in o).toBe(true)
    expect('timelineCount' in o).toBe(true)
    expect('historyCount' in o).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 11 — No AI Package / No Runtime Contamination
// ---------------------------------------------------------------------------

describe('observatory overview — no AI package leakage', () => {
  beforeEach(() => {
    activateEn()
  })

  it('viewModel does not contain promptAssembly metadata', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const vm = store.viewModel as Record<string, unknown>
    expect('promptAssembly' in vm).toBe(false)
  })

  it('viewModel does not contain metadata field', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const vm = store.viewModel as Record<string, unknown>
    expect('metadata' in vm).toBe(false)
  })

  it('viewModel does not contain plannerResult', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const vm = store.viewModel as Record<string, unknown>
    expect('plannerResult' in vm).toBe(false)
  })

  it('overview DTO does not contain AI-specific fields', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const keys = Object.keys(store.viewModel.overview)
    expect(keys).toEqual(['traceCount', 'timelineCount', 'historyCount'])
  })
})

// ---------------------------------------------------------------------------
// Section 12 — Store Edge Cases
// ---------------------------------------------------------------------------

describe('observatoryData store — edge cases', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('loadMockObservatory can be called multiple times', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const first = store.viewModel.overview.traceCount
    store.loadMockObservatory()
    expect(store.viewModel.overview.traceCount).toBe(first)
  })

  it('viewModel can be directly replaced', () => {
    const store = useObservatoryDataStore()
    const custom: ObservatoryViewModel = {
      overview: { traceCount: 42, timelineCount: 24, historyCount: 12 },
      trace: [],
      traceView: [],
      timelineView: [],
      historyView: [],
      diffView: [],
      timeline: [],
      history: [],
    }
    store.viewModel = custom
    expect(store.viewModel.overview.traceCount).toBe(42)
  })

  it('store is independent across Pinia instances', () => {
    const pinia1 = createPinia()
    const pinia2 = createPinia()
    setActivePinia(pinia1)
    const store1 = useObservatoryDataStore()
    store1.loadMockObservatory()
    setActivePinia(pinia2)
    const store2 = useObservatoryDataStore()
    expect(store2.viewModel.overview.traceCount).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Section 13 — Semantic & Accessibility (mostly unchanged from S6-002)
// ---------------------------------------------------------------------------

describe('observatory overview — semantics and accessibility with data', () => {
  beforeEach(() => {
    activateEn()
  })

  it('renders 3 semantic section elements', () => {
    const wrapper = mountOverview()
    expect(wrapper.findAll('section.overview-section')).toHaveLength(3)
  })

  it('uses h2 headings for all section titles', () => {
    const wrapper = mountOverview()
    expect(wrapper.findAll('h2')).toHaveLength(3)
  })

  it('labels each section via aria-labelledby', () => {
    const wrapper = mountOverview()
    for (const section of wrapper.findAll('section.overview-section')) {
      const labelledBy = section.attributes('aria-labelledby')
      expect(labelledBy).toBeTruthy()
      expect(wrapper.find(`#${labelledBy}`).exists()).toBe(true)
    }
  })

  it('renders exactly 3 overview section titles', () => {
    const wrapper = mountOverview()
    expect(sectionTexts(wrapper, '.overview-section-title')).toEqual([
      'Artifact Summary',
      'Observatory Snapshot',
      'System Status',
    ])
  })

  it('exposes an accessible label on each artifact card', () => {
    const wrapper = mountOverview()
    for (const card of artifactCards(wrapper)) {
      expect(card.attributes('aria-label')).toBeTruthy()
    }
  })

  it('uses semantic article elements for artifact cards', () => {
    const wrapper = mountOverview()
    for (const card of artifactCards(wrapper)) {
      expect(card.element.tagName).toBe('ARTICLE')
    }
  })

  it('makes artifact cards keyboard reachable via tabindex', () => {
    const wrapper = mountOverview()
    for (const card of artifactCards(wrapper)) {
      expect(card.attributes('tabindex')).toBe('0')
    }
  })

  it('uses dl/dt/dd for snapshot items', () => {
    const wrapper = mountOverview()
    for (const item of wrapper.findAll('.snapshot-item')) {
      expect(item.find('dt.snapshot-label').exists()).toBe(true)
      expect(item.find('dd.snapshot-value').exists()).toBe(true)
    }
  })

  it('uses dl/dt/dd for system status items', () => {
    const wrapper = mountOverview()
    for (const item of wrapper.findAll('.system-status-item')) {
      expect(item.find('dt').exists()).toBe(true)
      expect(item.find('dd').exists()).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------
// Section 14 — System Status Integration
// ---------------------------------------------------------------------------

describe('observatory overview — system status integration', () => {
  beforeEach(() => {
    activateEn()
  })

  it('renders version from observatory store', () => {
    const obsStore = useObservatoryStore()
    const wrapper = mountOverview()
    expect(wrapper.text()).toContain(obsStore.version)
  })

  it('renders Sprint 6 label', () => {
    const wrapper = mountOverview()
    expect(wrapper.text()).toContain('Sprint 6')
  })

  it('renders status from observatory store', () => {
    const obsStore = useObservatoryStore()
    const wrapper = mountOverview()
    expect(wrapper.text()).toContain(obsStore.status)
  })

  it('updates version reactively from observatory store', async () => {
    const store = useObservatoryStore()
    const wrapper = mountOverview()
    store.setVersion('v2.0.0')
    await nextTick()
    expect(wrapper.text()).toContain('v2.0.0')
  })

  it('updates status reactively from observatory store', async () => {
    const store = useObservatoryStore()
    const wrapper = mountOverview()
    store.setStatus('Building')
    await nextTick()
    expect(wrapper.text()).toContain('Building')
  })
})

// ---------------------------------------------------------------------------
// Section 15 — ViewModel Field Integrity
// ---------------------------------------------------------------------------

describe('observatory overview — viewModel field integrity', () => {
  beforeEach(() => {
    activateEn()
  })

  it('trace items have properly shaped steps', async () => {
    const store = useObservatoryDataStore()
    const wrapper = mountOverview()
    for (const t of store.viewModel.trace) {
      for (const s of t.steps) {
        expect(typeof s.id).toBe('string')
        expect(typeof s.label).toBe('string')
        expect(typeof s.status).toBe('string')
      }
    }
    expect(wrapper.text()).toContain('3')
  })

  it('timeline entries have properly shaped fields', () => {
    const store = useObservatoryDataStore()
    mountOverview()
    for (const tl of store.viewModel.timeline) {
      for (const e of tl.entries) {
        expect(typeof e.id).toBe('string')
        expect(typeof e.label).toBe('string')
        expect(typeof e.timestamp).toBe('string')
      }
    }
  })

  it('history entries have properly shaped fields', () => {
    const store = useObservatoryDataStore()
    mountOverview()
    for (const h of store.viewModel.history) {
      for (const e of h.entries) {
        expect(typeof e.id).toBe('string')
        expect(typeof e.label).toBe('string')
        expect(typeof e.timestamp).toBe('string')
      }
    }
  })

  it('overview DTO has exactly 3 fields', () => {
    const store = useObservatoryDataStore()
    mountOverview()
    expect(Object.keys(store.viewModel.overview)).toHaveLength(3)
  })

  it('overview DTO field names are correct', () => {
    const store = useObservatoryDataStore()
    mountOverview()
    expect(Object.keys(store.viewModel.overview).sort()).toEqual(
      ['historyCount', 'timelineCount', 'traceCount'].sort(),
    )
  })
})

// ---------------------------------------------------------------------------
// Section 16 — Count Toggle Edge Cases
// ---------------------------------------------------------------------------

describe('observatory overview — count toggle edge cases', () => {
  beforeEach(() => {
    activateEn()
  })

  it('switches Has Trace from Yes to No when count goes from positive to zero', async () => {
    const store = useObservatoryDataStore()
    const wrapper = mountOverview()
    store.viewModel = {
      overview: { traceCount: 0, timelineCount: 5, historyCount: 2 },
      trace: [],
      traceView: [],
      timelineView: [],
      historyView: [],
      diffView: [],
      timeline: [],
      history: [],
    }
    await nextTick()
    const labels = wrapper.findAll('.snapshot-label')
    const idx = labels.findIndex((l) => l.text() === 'Has Trace')
    expect(wrapper.findAll('.snapshot-value')[idx].text()).toContain('No')
  })

  it('switches Has Timeline from Yes to No when count goes to zero', async () => {
    const store = useObservatoryDataStore()
    const wrapper = mountOverview()
    store.viewModel = {
      overview: { traceCount: 3, timelineCount: 0, historyCount: 2 },
      trace: [],
      traceView: [],
      timelineView: [],
      historyView: [],
      diffView: [],
      timeline: [],
      history: [],
    }
    await nextTick()
    const labels = wrapper.findAll('.snapshot-label')
    const idx = labels.findIndex((l) => l.text() === 'Has Timeline')
    expect(wrapper.findAll('.snapshot-value')[idx].text()).toContain('No')
  })

  it('switches Has History from Yes to No when count goes to zero', async () => {
    const store = useObservatoryDataStore()
    const wrapper = mountOverview()
    store.viewModel = {
      overview: { traceCount: 3, timelineCount: 5, historyCount: 0 },
      trace: [],
      traceView: [],
      timelineView: [],
      historyView: [],
      diffView: [],
      timeline: [],
      history: [],
    }
    await nextTick()
    const labels = wrapper.findAll('.snapshot-label')
    const idx = labels.findIndex((l) => l.text() === 'Has History')
    expect(wrapper.findAll('.snapshot-value')[idx].text()).toContain('No')
  })

  it('snapshot booleans re-enable when count goes from zero to positive', async () => {
    const store = useObservatoryDataStore()
    const wrapper = mountOverview()
    // Set all to zero
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
    // Set back to positive
    store.viewModel = {
      overview: { traceCount: 5, timelineCount: 5, historyCount: 5 },
      trace: [],
      traceView: [],
      timelineView: [],
      historyView: [],
      diffView: [],
      timeline: [],
      history: [],
    }
    await nextTick()
    const labels = wrapper.findAll('.snapshot-label')
    const traceIdx = labels.findIndex((l) => l.text() === 'Has Trace')
    const timelineIdx = labels.findIndex((l) => l.text() === 'Has Timeline')
    const historyIdx = labels.findIndex((l) => l.text() === 'Has History')
    expect(wrapper.findAll('.snapshot-value')[traceIdx].text()).toContain('Yes')
    expect(wrapper.findAll('.snapshot-value')[timelineIdx].text()).toContain('Yes')
    expect(wrapper.findAll('.snapshot-value')[historyIdx].text()).toContain('Yes')
  })

  it('single positive count still shows as Yes', async () => {
    const store = useObservatoryDataStore()
    const wrapper = mountOverview()
    store.viewModel = {
      overview: { traceCount: 1, timelineCount: 0, historyCount: 0 },
      trace: [],
      traceView: [],
      timelineView: [],
      historyView: [],
      diffView: [],
      timeline: [],
      history: [],
    }
    await nextTick()
    const labels = wrapper.findAll('.snapshot-label')
    const idx = labels.findIndex((l) => l.text() === 'Has Trace')
    expect(wrapper.findAll('.snapshot-value')[idx].text()).toContain('Yes')
  })
})

// ---------------------------------------------------------------------------
// Section 17 — I18n Integration with Data Store
// ---------------------------------------------------------------------------

describe('observatory overview — i18n integration with data', () => {
  beforeEach(() => {
    activateEn()
  })

  it('renders artifact title in Chinese when language switched', async () => {
    const i18n = useI18nStore()
    const wrapper = mountOverview()
    i18n.setLanguage('zh-CN')
    await nextTick()
    expect(sectionTexts(wrapper, '.artifact-card-title')).toContain('追踪')
  })

  it('renders artifact title in English after switching back', async () => {
    const i18n = useI18nStore()
    const wrapper = mountOverview()
    i18n.setLanguage('zh-CN')
    await nextTick()
    i18n.setLanguage('en-US')
    await nextTick()
    expect(sectionTexts(wrapper, '.artifact-card-title')).toContain('Trace')
  })

  it('renders snapshot labels in Chinese when language switched', async () => {
    const i18n = useI18nStore()
    const wrapper = mountOverview()
    i18n.setLanguage('zh-CN')
    await nextTick()
    const texts = wrapper.findAll('.snapshot-label').map((el) => el.text().trim())
    expect(texts).toContain('工件数量')
  })

  it('renders count values unchanged across language switch', async () => {
    const i18n = useI18nStore()
    const wrapper = mountOverview()
    i18n.setLanguage('zh-CN')
    await nextTick()
    const zhCounts = wrapper.findAll('.artifact-card-count').map((c) => c.text())
    i18n.setLanguage('en-US')
    await nextTick()
    const enCounts = wrapper.findAll('.artifact-card-count').map((c) => c.text())
    expect(zhCounts).toEqual(enCounts)
  })

  it('Yes/No values react to language switch', async () => {
    const i18n = useI18nStore()
    const wrapper = mountOverview()
    i18n.setLanguage('zh-CN')
    await nextTick()
    expect(wrapper.findAll('.snapshot-value')[1].text()).toContain('是')
    i18n.setLanguage('en-US')
    await nextTick()
    expect(wrapper.findAll('.snapshot-value')[1].text()).toContain('Yes')
  })
})

// ---------------------------------------------------------------------------
// Section 18 — Content Integration
// ---------------------------------------------------------------------------

describe('observatory overview — content panel integration', () => {
  beforeEach(() => {
    activateEn()
  })

  it('renders overview inside content area by default', () => {
    const wrapper = mount(ObservatoryContent)
    expect(wrapper.findComponent(ObservatoryOverview).exists()).toBe(true)
  })

  it('renders overview inside full shell by default', () => {
    const wrapper = mount(ObservatoryShell)
    expect(wrapper.findComponent(ObservatoryOverview).exists()).toBe(true)
  })

  it('hides overview when non-Overview panel selected', async () => {
    const store = useObservatoryStore()
    const wrapper = mount(ObservatoryContent)
    store.selectPanel('Trace')
    await nextTick()
    expect(wrapper.findComponent(ObservatoryOverview).exists()).toBe(false)
  })

  it('re-shows overview when Overview panel re-selected', async () => {
    const store = useObservatoryStore()
    const wrapper = mount(ObservatoryContent)
    store.selectPanel('Trace')
    await nextTick()
    store.selectPanel('Overview')
    await nextTick()
    expect(wrapper.findComponent(ObservatoryOverview).exists()).toBe(true)
  })

  it('overview inside shell shows data-driven counts', () => {
    const wrapper = mount(ObservatoryShell)
    const counts = wrapper.findAll('.artifact-card-count').map((c) => c.text())
    expect(counts).toEqual(['3', '5', '2'])
  })
})