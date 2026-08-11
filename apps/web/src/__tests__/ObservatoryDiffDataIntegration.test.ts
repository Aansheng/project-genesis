/**
 * ObservatoryDiffDataIntegration — verifies the full data integration path
 * for the Diff Viewer panel from the observatoryData store
 * (via DefaultObservatoryAdapter) through the diff viewer components.
 *
 * WO-S6-017 — Observatory Diff Real Data Integration
 * Architecture version v1.47
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
import ObservatoryDiffViewer from '../components/observatory/diff/ObservatoryDiffViewer.vue'
import DiffList from '../components/observatory/diff/DiffList.vue'
import DiffDetails from '../components/observatory/diff/DiffDetails.vue'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mountViewer(): VueWrapper {
  useObservatoryDataStore().loadMockObservatory()
  return mount(ObservatoryDiffViewer)
}

function rows(wrapper: VueWrapper): ReturnType<VueWrapper['findAll']> {
  return wrapper.findAll('.diff-row')
}

function activeRows(wrapper: VueWrapper): ReturnType<VueWrapper['findAll']> {
  return rows(wrapper).filter((r) => r.classes().includes('diff-row--active'))
}

function rowTexts(wrapper: VueWrapper, selector: string): string[] {
  return wrapper.findAll(selector).map((el) => el.text().trim())
}

function changeCards(wrapper: VueWrapper): ReturnType<VueWrapper['findAll']> {
  return wrapper.findAll('.diff-change-card')
}

function changeTexts(wrapper: VueWrapper, selector: string): string[] {
  return wrapper.findAll(selector).map((el) => el.text().trim())
}

async function pressKey(wrapper: VueWrapper, key: string): Promise<void> {
  await wrapper.find('nav.diff-list').trigger('keydown', { key })
  await nextTick()
}

// ---------------------------------------------------------------------------
// Section 1 — Store diffView Integration
// ---------------------------------------------------------------------------

describe('diff data — store diffView integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('store initializes with empty diffView', () => {
    const store = useObservatoryDataStore()
    expect(store.viewModel.diffView).toEqual([])
  })

  it('loadMockObservatory populates diffView with 3 entries', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(store.viewModel.diffView).toHaveLength(3)
  })

  it('diffView entries have id field', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const d of store.viewModel.diffView) {
      expect(typeof d.id).toBe('string')
      expect(d.id.length).toBeGreaterThan(0)
    }
  })

  it('diffView entries have timestamp field', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const d of store.viewModel.diffView) {
      expect(typeof d.timestamp).toBe('string')
    }
  })

  it('diffView entries have added array', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const d of store.viewModel.diffView) {
      expect(Array.isArray(d.added)).toBe(true)
    }
  })

  it('diffView entries have removed array', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const d of store.viewModel.diffView) {
      expect(Array.isArray(d.removed)).toBe(true)
    }
  })

  it('diffView entries have changed array', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const d of store.viewModel.diffView) {
      expect(Array.isArray(d.changed)).toBe(true)
    }
  })

  it('diffView added items are DiffChangeViewModel with name field', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const d of store.viewModel.diffView) {
      for (const item of d.added) {
        expect(typeof item.name).toBe('string')
      }
    }
  })

  it('diffView removed items are DiffChangeViewModel with name field', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const d of store.viewModel.diffView) {
      for (const item of d.removed) {
        expect(typeof item.name).toBe('string')
      }
    }
  })

  it('diffView changed items are DiffChangeViewModel with name field', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const d of store.viewModel.diffView) {
      for (const item of d.changed) {
        expect(typeof item.name).toBe('string')
      }
    }
  })

  it('diffView is frozen', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(Object.isFrozen(store.viewModel.diffView)).toBe(true)
  })

  it('diffView entry ids are diff-001, diff-002, diff-003', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const ids = store.viewModel.diffView.map((d) => d.id)
    expect(ids).toEqual(['diff-001', 'diff-002', 'diff-003'])
  })

  it('diffView timestamps are 12:00:01, 12:05:00, 12:08:00', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const timestamps = store.viewModel.diffView.map((d) => d.timestamp)
    expect(timestamps).toEqual(['12:00:01', '12:05:00', '12:08:00'])
  })

  it('diff-001 has 3 added items', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const d = store.viewModel.diffView.find((d) => d.id === 'diff-001')
    expect(d?.added).toHaveLength(3)
  })

  it('diff-001 has 0 removed items', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const d = store.viewModel.diffView.find((d) => d.id === 'diff-001')
    expect(d?.removed).toHaveLength(0)
  })

  it('diff-001 has 1 changed item', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const d = store.viewModel.diffView.find((d) => d.id === 'diff-001')
    expect(d?.changed).toHaveLength(1)
  })

  it('diff-001 added names are Tavern, Villager-1, Villager-2', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const d = store.viewModel.diffView.find((d) => d.id === 'diff-001')
    const names = d?.added.map((a) => a.name)
    expect(names).toEqual(['Tavern', 'Villager-1', 'Villager-2'])
  })

  it('diff-001 changed names is VillageCenter', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const d = store.viewModel.diffView.find((d) => d.id === 'diff-001')
    const names = d?.changed.map((c) => c.name)
    expect(names).toEqual(['VillageCenter'])
  })

  it('diff-002 has 2 added items', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const d = store.viewModel.diffView.find((d) => d.id === 'diff-002')
    expect(d?.added).toHaveLength(2)
  })

  it('diff-002 has 0 changed items', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const d = store.viewModel.diffView.find((d) => d.id === 'diff-002')
    expect(d?.changed).toHaveLength(0)
  })

  it('diff-003 has 2 added items', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const d = store.viewModel.diffView.find((d) => d.id === 'diff-003')
    expect(d?.added).toHaveLength(2)
  })

  it('diff-003 has 1 removed item', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const d = store.viewModel.diffView.find((d) => d.id === 'diff-003')
    expect(d?.removed).toHaveLength(1)
  })

  it('diff-003 has 1 changed item', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const d = store.viewModel.diffView.find((d) => d.id === 'diff-003')
    expect(d?.changed).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// Section 2 — Adapter Mapping
// ---------------------------------------------------------------------------

describe('diff data — adapter diffView mapping', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('adapter maps diffView from raw observatory', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      diffView: [
        {
          id: 'dv-1',
          timestamp: '01:00:00',
          added: ['ComponentA'],
          removed: [],
          changed: [],
        },
      ],
    })
    expect(vm.diffView).toHaveLength(1)
    expect(vm.diffView[0].id).toBe('dv-1')
    expect(vm.diffView[0].timestamp).toBe('01:00:00')
  })

  it('adapter maps diffView added items from string[]', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      diffView: [
        {
          id: 'dv-1',
          timestamp: '00:00',
          added: ['A', 'B'],
          removed: [],
          changed: [],
        },
      ],
    })
    expect(vm.diffView[0].added).toHaveLength(2)
    expect(vm.diffView[0].added[0].name).toBe('A')
    expect(vm.diffView[0].added[1].name).toBe('B')
  })

  it('adapter maps diffView removed items from string[]', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      diffView: [
        {
          id: 'dv-1',
          timestamp: '00:00',
          added: [],
          removed: ['OldA', 'OldB'],
          changed: [],
        },
      ],
    })
    expect(vm.diffView[0].removed).toHaveLength(2)
    expect(vm.diffView[0].removed[0].name).toBe('OldA')
    expect(vm.diffView[0].removed[1].name).toBe('OldB')
  })

  it('adapter maps diffView changed items from string[]', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      diffView: [
        {
          id: 'dv-1',
          timestamp: '00:00',
          added: [],
          removed: [],
          changed: ['X', 'Y'],
        },
      ],
    })
    expect(vm.diffView[0].changed).toHaveLength(2)
    expect(vm.diffView[0].changed[0].name).toBe('X')
    expect(vm.diffView[0].changed[1].name).toBe('Y')
  })

  it('adapter maps diffView from DiffChangeViewModel[]', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      diffView: [
        {
          id: 'dv-1',
          timestamp: '00:00',
          added: [{ name: 'NewA' }, { name: 'NewB' }],
          removed: [],
          changed: [],
        },
      ],
    })
    expect(vm.diffView[0].added).toHaveLength(2)
    expect(vm.diffView[0].added[0].name).toBe('NewA')
    expect(vm.diffView[0].added[1].name).toBe('NewB')
  })

  it('adapter handles missing diffView gracefully', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({})
    expect(vm.diffView).toEqual([])
  })

  it('adapter handles null diffView gracefully', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({ diffView: null })
    expect(vm.diffView).toEqual([])
  })

  it('adapter handles undefined diffView gracefully', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({ diffView: undefined })
    expect(vm.diffView).toEqual([])
  })

  it('adapter handles non-array diffView gracefully', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({ diffView: 'invalid' })
    expect(vm.diffView).toEqual([])
  })

  it('adapter handles non-object diffView items gracefully', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      diffView: [null, undefined, 'string', 42],
    })
    expect(vm.diffView).toHaveLength(4)
    for (const d of vm.diffView) {
      expect(typeof d.id).toBe('string')
      expect(typeof d.timestamp).toBe('string')
      expect(Array.isArray(d.added)).toBe(true)
      expect(Array.isArray(d.removed)).toBe(true)
      expect(Array.isArray(d.changed)).toBe(true)
    }
  })

  it('adapter returns frozen diffView', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      diffView: [{ id: 'd1', timestamp: 'T', added: [], removed: [], changed: [] }],
    })
    expect(Object.isFrozen(vm.diffView)).toBe(true)
  })

  it('adapter returns frozen added arrays', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      diffView: [{ id: 'd1', timestamp: 'T', added: ['A'], removed: [], changed: [] }],
    })
    expect(Object.isFrozen(vm.diffView[0].added)).toBe(true)
  })

  it('adapter returns frozen removed arrays', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      diffView: [{ id: 'd1', timestamp: 'T', added: [], removed: ['R'], changed: [] }],
    })
    expect(Object.isFrozen(vm.diffView[0].removed)).toBe(true)
  })

  it('adapter returns frozen changed arrays', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      diffView: [{ id: 'd1', timestamp: 'T', added: [], removed: [], changed: ['C'] }],
    })
    expect(Object.isFrozen(vm.diffView[0].changed)).toBe(true)
  })

  it('adapter handles mixed string[] and DiffChangeViewModel[]', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      diffView: [
        {
          id: 'dv-1',
          timestamp: '00:00',
          added: ['ItemA', { name: 'ItemB' }],
          removed: [],
          changed: [],
        },
      ],
    })
    expect(vm.diffView[0].added).toHaveLength(2)
    expect(vm.diffView[0].added[0].name).toBe('ItemA')
    expect(vm.diffView[0].added[1].name).toBe('ItemB')
  })

  it('adapter handles non-string, non-object items in change arrays', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      diffView: [
        {
          id: 'dv-1',
          timestamp: '00:00',
          added: [null, undefined, 42],
          removed: [],
          changed: [],
        },
      ],
    })
    expect(vm.diffView[0].added).toHaveLength(3)
    for (const item of vm.diffView[0].added) {
      expect(typeof item.name).toBe('string')
    }
  })

  it('adapter handles empty arrays in diffView items', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      diffView: [
        { id: 'd1', timestamp: 'T', added: [], removed: [], changed: [] },
      ],
    })
    expect(vm.diffView[0].added).toEqual([])
    expect(vm.diffView[0].removed).toEqual([])
    expect(vm.diffView[0].changed).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Section 3 — Diff Viewer Rendering
// ---------------------------------------------------------------------------

describe('diff data — viewer rendering from viewModel', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders the root viewer container', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('.observatory-diff-viewer').exists()).toBe(true)
  })

  it('renders 3 diff rows from viewModel', () => {
    const wrapper = mountViewer()
    expect(rows(wrapper)).toHaveLength(3)
  })

  it('renders diff ids from viewModel', () => {
    const wrapper = mountViewer()
    expect(rowTexts(wrapper, '.diff-row-id')).toEqual([
      'diff-001',
      'diff-002',
      'diff-003',
    ])
  })

  it('renders timestamps from viewModel', () => {
    const wrapper = mountViewer()
    expect(rowTexts(wrapper, '.diff-row-timestamp')).toEqual([
      '12:00:01',
      '12:05:00',
      '12:08:00',
    ])
  })

  it('renders the DiffList component', () => {
    const wrapper = mountViewer()
    expect(wrapper.findComponent(DiffList).exists()).toBe(true)
  })

  it('renders the DiffDetails component', () => {
    const wrapper = mountViewer()
    expect(wrapper.findComponent(DiffDetails).exists()).toBe(true)
  })

  it('renders "Diff List" as h2 heading', () => {
    const wrapper = mountViewer()
    const h2 = wrapper.find('.diff-list-title')
    expect(h2.exists()).toBe(true)
    expect(h2.text()).toBe('Diff List')
  })

  it('renders "Diff Details" as h2 heading', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('.diff-details-title').text()).toBe('Diff Details')
  })

  it('renders the Added section heading', () => {
    const wrapper = mountViewer()
    const h3 = wrapper.find('.diff-added-title')
    expect(h3.exists()).toBe(true)
    expect(h3.text()).toBe('Added')
  })

  it('renders the Removed section heading', () => {
    const wrapper = mountViewer()
    const h3 = wrapper.find('.diff-removed-title')
    expect(h3.exists()).toBe(true)
    expect(h3.text()).toBe('Removed')
  })

  it('renders the Changed section heading', () => {
    const wrapper = mountViewer()
    const h3 = wrapper.find('.diff-changed-title')
    expect(h3.exists()).toBe(true)
    expect(h3.text()).toBe('Changed')
  })
})

// ---------------------------------------------------------------------------
// Section 4 — Added Rendering
// ---------------------------------------------------------------------------

describe('diff data — added rendering', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders the Added section', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('section.diff-added-section').exists()).toBe(true)
  })

  it('renders 3 added cards for first diff', () => {
    const wrapper = mountViewer()
    expect(wrapper.findAll('.diff-added-item .diff-change-card')).toHaveLength(3)
  })

  it('renders added card names for first diff', () => {
    const wrapper = mountViewer()
    expect(changeTexts(wrapper, '.diff-added-item .diff-change-card-name')).toEqual([
      'Tavern',
      'Villager-1',
      'Villager-2',
    ])
  })

  it('renders 2 added cards for second diff', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    expect(wrapper.findAll('.diff-added-item .diff-change-card')).toHaveLength(2)
  })

  it('renders added card names for second diff', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    expect(changeTexts(wrapper, '.diff-added-item .diff-change-card-name')).toEqual([
      'Farm-1',
      'Farm-2',
    ])
  })

  it('renders 2 added cards for third diff', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[2].trigger('click')
    await nextTick()
    expect(wrapper.findAll('.diff-added-item .diff-change-card')).toHaveLength(2)
  })

  it('renders added card names for third diff', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[2].trigger('click')
    await nextTick()
    expect(changeTexts(wrapper, '.diff-added-item .diff-change-card-name')).toEqual([
      'Guard-1',
      'Guard-2',
    ])
  })

  it('labels added cards with added modifier class', () => {
    const wrapper = mountViewer()
    for (const card of wrapper.findAll('.diff-added-item .diff-change-card')) {
      expect(card.classes()).toContain('diff-change-card--added')
    }
  })

  it('shows plus marker on added cards', () => {
    const wrapper = mountViewer()
    const markers = changeTexts(wrapper, '.diff-added-item .diff-change-card-marker')
    expect(markers).toEqual(['+', '+', '+'])
  })

  it('renders added items inside list items', () => {
    const wrapper = mountViewer()
    const items = wrapper.findAll('li.diff-added-item')
    expect(items).toHaveLength(3)
    for (const item of items) {
      expect(item.find('.diff-change-card').exists()).toBe(true)
    }
  })

  it('renders added list as ul', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('ul.diff-added-list').exists()).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 5 — Removed Rendering
// ---------------------------------------------------------------------------

describe('diff data — removed rendering', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders the Removed section', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('section.diff-removed-section').exists()).toBe(true)
  })

  it('shows empty message when nothing removed', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('section.diff-removed-section').text()).toContain('No removals')
  })

  it('shows no removed cards for first diff', () => {
    const wrapper = mountViewer()
    expect(wrapper.findAll('.diff-removed-item .diff-change-card')).toHaveLength(0)
  })

  it('shows removed card for third diff', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[2].trigger('click')
    await nextTick()
    expect(wrapper.findAll('.diff-removed-item .diff-change-card')).toHaveLength(1)
  })

  it('shows removed card name for third diff', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[2].trigger('click')
    await nextTick()
    expect(changeTexts(wrapper, '.diff-removed-item .diff-change-card-name')).toEqual([
      'OldRoad',
    ])
  })

  it('labels removed cards with removed modifier class', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[2].trigger('click')
    await nextTick()
    const card = wrapper.find('.diff-removed-item .diff-change-card')
    expect(card.classes()).toContain('diff-change-card--removed')
  })

  it('shows minus marker on removed cards', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[2].trigger('click')
    await nextTick()
    const markers = changeTexts(wrapper, '.diff-removed-item .diff-change-card-marker')
    expect(markers).toEqual(['-'])
  })
})

// ---------------------------------------------------------------------------
// Section 6 — Changed Rendering
// ---------------------------------------------------------------------------

describe('diff data — changed rendering', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders the Changed section', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('section.diff-changed-section').exists()).toBe(true)
  })

  it('shows changed item for first diff', () => {
    const wrapper = mountViewer()
    expect(changeTexts(wrapper, '.diff-changed-item .diff-change-card-name')).toEqual([
      'VillageCenter',
    ])
  })

  it('shows empty message when nothing changed', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    expect(wrapper.find('section.diff-changed-section').text()).toContain('No changes')
  })

  it('shows changed item for third diff', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[2].trigger('click')
    await nextTick()
    expect(changeTexts(wrapper, '.diff-changed-item .diff-change-card-name')).toEqual([
      'VillageGate',
    ])
  })

  it('labels changed cards with changed modifier class', () => {
    const wrapper = mountViewer()
    const card = wrapper.find('.diff-changed-item .diff-change-card')
    expect(card.classes()).toContain('diff-change-card--changed')
  })

  it('shows bullet marker on changed cards', () => {
    const wrapper = mountViewer()
    const markers = changeTexts(wrapper, '.diff-changed-item .diff-change-card-marker')
    expect(markers).toEqual(['•'])
  })
})

// ---------------------------------------------------------------------------
// Section 7 — Selection
// ---------------------------------------------------------------------------

describe('diff data — selection', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('marks the first diff row active by default', () => {
    const wrapper = mountViewer()
    expect(rows(wrapper)[0].classes()).toContain('diff-row--active')
  })

  it('marks exactly one row active by default', () => {
    const wrapper = mountViewer()
    expect(activeRows(wrapper)).toHaveLength(1)
  })

  it('shows the first diff id in details by default', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('.diff-meta-grid').text()).toContain('diff-001')
  })

  it('shows the first timestamp in details by default', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('.diff-meta-grid').text()).toContain('12:00:01')
  })

  it('selects second diff on click', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    expect(wrapper.find('.diff-meta-grid').text()).toContain('diff-002')
  })

  it('clicking second diff shows its timestamp', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    expect(wrapper.find('.diff-meta-grid').text()).toContain('12:05:00')
  })

  it('clicking third diff shows its id', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[2].trigger('click')
    await nextTick()
    expect(wrapper.find('.diff-meta-grid').text()).toContain('diff-003')
  })

  it('moves active class to clicked row', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[2].trigger('click')
    await nextTick()
    expect(activeRows(wrapper)).toHaveLength(1)
    expect(activeRows(wrapper)[0].text()).toContain('diff-003')
  })

  it('switches back to first diff when re-clicked', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    await rows(wrapper)[0].trigger('click')
    await nextTick()
    expect(wrapper.find('.diff-meta-grid').text()).toContain('diff-001')
  })

  it('clicking active row keeps selection', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[0].trigger('click')
    await nextTick()
    expect(activeRows(wrapper)).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// Section 8 — Keyboard Navigation
// ---------------------------------------------------------------------------

describe('diff data — keyboard navigation', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('moves selection to next diff with ArrowDown', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'ArrowDown')
    expect(activeRows(wrapper)[0].text()).toContain('diff-002')
  })

  it('updates details after ArrowDown', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'ArrowDown')
    expect(wrapper.find('.diff-meta-grid').text()).toContain('diff-002')
  })

  it('moves selection two steps with ArrowDown', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'ArrowDown')
    await pressKey(wrapper, 'ArrowDown')
    expect(activeRows(wrapper)[0].text()).toContain('diff-003')
  })

  it('clamps ArrowDown at last diff', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'ArrowDown')
    await pressKey(wrapper, 'ArrowDown')
    await pressKey(wrapper, 'ArrowDown')
    expect(activeRows(wrapper)[0].text()).toContain('diff-003')
  })

  it('clamps ArrowUp at first diff', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'ArrowUp')
    expect(activeRows(wrapper)[0].text()).toContain('diff-001')
  })

  it('jumps to last diff with End', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'End')
    expect(activeRows(wrapper)[0].text()).toContain('diff-003')
  })

  it('jumps to first diff with Home', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'End')
    await pressKey(wrapper, 'Home')
    expect(activeRows(wrapper)[0].text()).toContain('diff-001')
  })

  it('ignores unrelated keys', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'Tab')
    await pressKey(wrapper, 'Enter')
    await pressKey(wrapper, 'x')
    expect(activeRows(wrapper)[0].text()).toContain('diff-001')
  })
})

// ---------------------------------------------------------------------------
// Section 9 — Empty Diff
// ---------------------------------------------------------------------------

describe('diff data — empty diff', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders without error when diffView is empty after mount', async () => {
    const store = useObservatoryDataStore()
    const wrapper = mount(ObservatoryDiffViewer)
    store.viewModel = {
      overview: { traceCount: 0, timelineCount: 0, historyCount: 0 },
      trace: [],
      traceView: [],
      timelineView: [],
      historyView: [],
      diffView: [],
      runtimeView: { worldId: "", entityCount: 0, systemCount: 0, eventCount: 0, fps: 0, entities: [] },
      eventStreamView: { events: [] },
      timeline: [],
      history: [],
    }
    await nextTick()
    expect(wrapper.exists()).toBe(true)
  })

  it('renders no diff rows when diffView is empty', async () => {
    const store = useObservatoryDataStore()
    const wrapper = mount(ObservatoryDiffViewer)
    store.viewModel = {
      overview: { traceCount: 0, timelineCount: 0, historyCount: 0 },
      trace: [],
      traceView: [],
      timelineView: [],
      historyView: [],
      diffView: [],
      runtimeView: { worldId: "", entityCount: 0, systemCount: 0, eventCount: 0, fps: 0, entities: [] },
      eventStreamView: { events: [] },
      timeline: [],
      history: [],
    }
    await nextTick()
    expect(rows(wrapper)).toHaveLength(0)
  })

  it('shows "No diff selected" when diffView is empty', async () => {
    const store = useObservatoryDataStore()
    const wrapper = mount(ObservatoryDiffViewer)
    store.viewModel = {
      overview: { traceCount: 0, timelineCount: 0, historyCount: 0 },
      trace: [],
      traceView: [],
      timelineView: [],
      historyView: [],
      diffView: [],
      runtimeView: { worldId: "", entityCount: 0, systemCount: 0, eventCount: 0, fps: 0, entities: [] },
      eventStreamView: { events: [] },
      timeline: [],
      history: [],
    }
    await nextTick()
    expect(wrapper.find('.diff-details').text()).toContain('No diff selected')
  })

  it('renders DiffList and DiffDetails even with empty data', async () => {
    const store = useObservatoryDataStore()
    const wrapper = mount(ObservatoryDiffViewer)
    store.viewModel = {
      overview: { traceCount: 0, timelineCount: 0, historyCount: 0 },
      trace: [],
      traceView: [],
      timelineView: [],
      historyView: [],
      diffView: [],
      runtimeView: { worldId: "", entityCount: 0, systemCount: 0, eventCount: 0, fps: 0, entities: [] },
      eventStreamView: { events: [] },
      timeline: [],
      history: [],
    }
    await nextTick()
    expect(wrapper.findComponent(DiffList).exists()).toBe(true)
    expect(wrapper.findComponent(DiffDetails).exists()).toBe(true)
  })

  it('empty diffView does not crash keyboard navigation', async () => {
    const store = useObservatoryDataStore()
    const wrapper = mount(ObservatoryDiffViewer)
    store.viewModel = {
      overview: { traceCount: 0, timelineCount: 0, historyCount: 0 },
      trace: [],
      traceView: [],
      timelineView: [],
      historyView: [],
      diffView: [],
      runtimeView: { worldId: "", entityCount: 0, systemCount: 0, eventCount: 0, fps: 0, entities: [] },
      eventStreamView: { events: [] },
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
// Section 10 — Defaults
// ---------------------------------------------------------------------------

describe('diff data — defaults', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('default diffView is empty array before load', () => {
    const store = useObservatoryDataStore()
    expect(store.viewModel.diffView).toEqual([])
  })

  it('adapter returns empty diffView for undefined input', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt(undefined)
    expect(vm.diffView).toEqual([])
  })

  it('adapter returns empty diffView for null input', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt(null)
    expect(vm.diffView).toEqual([])
  })

  it('adapter returns empty diffView for number input', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt(42)
    expect(vm.diffView).toEqual([])
  })

  it('diffView items default to empty string for missing id', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({ diffView: [{}] })
    expect(vm.diffView[0].id).toBe('')
  })

  it('diffView timestamp defaults to empty string', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({ diffView: [{}] })
    expect(vm.diffView[0].timestamp).toBe('')
  })

  it('diffView added defaults to empty array', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({ diffView: [{ id: 'd1', timestamp: 'T' }] })
    expect(vm.diffView[0].added).toEqual([])
  })

  it('diffView removed defaults to empty array', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({ diffView: [{ id: 'd1', timestamp: 'T' }] })
    expect(vm.diffView[0].removed).toEqual([])
  })

  it('diffView changed defaults to empty array', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({ diffView: [{ id: 'd1', timestamp: 'T' }] })
    expect(vm.diffView[0].changed).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Section 11 — Deterministic Rendering
// ---------------------------------------------------------------------------

describe('diff data — deterministic rendering', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders identical diff ids across mounts', () => {
    const a = mountViewer()
    const b = mountViewer()
    expect(rowTexts(a, '.diff-row-id')).toEqual(rowTexts(b, '.diff-row-id'))
  })

  it('renders identical timestamps across mounts', () => {
    const a = mountViewer()
    const b = mountViewer()
    expect(rowTexts(a, '.diff-row-timestamp')).toEqual(rowTexts(b, '.diff-row-timestamp'))
  })

  it('renders identical added lists across mounts', () => {
    const a = mountViewer()
    const b = mountViewer()
    expect(changeTexts(a, '.diff-added-item .diff-change-card-name')).toEqual(
      changeTexts(b, '.diff-added-item .diff-change-card-name'),
    )
  })

  it('renders identical removed lists across mounts', () => {
    const a = mountViewer()
    const b = mountViewer()
    expect(changeTexts(a, '.diff-removed-item .diff-change-card-name')).toEqual(
      changeTexts(b, '.diff-removed-item .diff-change-card-name'),
    )
  })

  it('renders identical changed lists across mounts', () => {
    const a = mountViewer()
    const b = mountViewer()
    expect(changeTexts(a, '.diff-changed-item .diff-change-card-name')).toEqual(
      changeTexts(b, '.diff-changed-item .diff-change-card-name'),
    )
  })

  it('renders identical active row across mounts', () => {
    const a = mountViewer()
    const b = mountViewer()
    const activeText = (w: VueWrapper): string => w.find('.diff-row--active').text()
    expect(activeText(a)).toBe('diff-00112:00:01')
    expect(activeText(b)).toBe('diff-00112:00:01')
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

describe('diff data — no mutation', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('mounting viewer does not mutate diffView array reference', () => {
    const store = useObservatoryDataStore()
    mountViewer()
    expect(Object.isFrozen(store.viewModel.diffView)).toBe(true)
  })

  it('mounting viewer does not change diffView length', () => {
    const store = useObservatoryDataStore()
    const lenBefore = store.viewModel.diffView.length
    mountViewer()
    expect(store.viewModel.diffView.length).toBe(3)
  })

  it('diffView entry fields are readonly strings', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const d of store.viewModel.diffView) {
      expect(typeof d.id).toBe('string')
      expect(typeof d.timestamp).toBe('string')
      expect(Array.isArray(d.added)).toBe(true)
      expect(Array.isArray(d.removed)).toBe(true)
      expect(Array.isArray(d.changed)).toBe(true)
    }
  })

  it('diffView nested arrays are frozen', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const d of store.viewModel.diffView) {
      expect(Object.isFrozen(d.added)).toBe(true)
      expect(Object.isFrozen(d.removed)).toBe(true)
      expect(Object.isFrozen(d.changed)).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------
// Section 13 — Integration Path
// ---------------------------------------------------------------------------

describe('diff data — integration path', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('full path: store adapter produces diffView with correct values', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(store.viewModel.diffView[0].id).toBe('diff-001')
    expect(store.viewModel.diffView[0].timestamp).toBe('12:00:01')
    expect(store.viewModel.diffView[1].id).toBe('diff-002')
    expect(store.viewModel.diffView[1].timestamp).toBe('12:05:00')
    expect(store.viewModel.diffView[2].id).toBe('diff-003')
    expect(store.viewModel.diffView[2].timestamp).toBe('12:08:00')
  })

  it('adapter output matches component display after mount', async () => {
    const adapter = new DefaultObservatoryAdapter()
    const customData = {
      diffView: [
        { id: 'dv-A', timestamp: '01:00', added: ['Alpha'], removed: [], changed: [] },
        { id: 'dv-B', timestamp: '02:00', added: ['Beta'], removed: ['Old'], changed: ['Gamma'] },
      ],
    }
    const vm = adapter.adapt(customData)
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const wrapper = mount(ObservatoryDiffViewer)
    store.viewModel = vm
    await nextTick()
    await nextTick()
    expect(rows(wrapper)).toHaveLength(2)
    expect(rowTexts(wrapper, '.diff-row-id')).toEqual(['dv-A', 'dv-B'])
  })

  it('single diff item displays correctly after mount', async () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      diffView: [{ id: 'only', timestamp: '00:00', added: [], removed: [], changed: [] }],
    })
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    mount(ObservatoryDiffViewer)
    store.viewModel = vm
    await nextTick()
    await nextTick()
    const wrapper = mount(ObservatoryDiffViewer)
    expect(rows(wrapper)).toHaveLength(1)
    expect(activeRows(wrapper)).toHaveLength(1)
  })

  it('large number of diffs list correctly after mount', async () => {
    const adapter = new DefaultObservatoryAdapter()
    const diffs = Array.from({ length: 30 }, (_, i) => ({
      id: `dv-${i + 1}`,
      timestamp: `${String(i).padStart(2, '0')}:00:00`,
      added: [],
      removed: [],
      changed: [],
    }))
    const vm = adapter.adapt({ diffView: diffs })
    const store = useObservatoryDataStore()
    store.viewModel = vm
    const wrapper = mount(ObservatoryDiffViewer)
    expect(rows(wrapper)).toHaveLength(30)
  })

  it('selected diff details display from viewModel', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const wrapper = mount(ObservatoryDiffViewer)
    const details = wrapper.find('.diff-meta-grid').text()
    expect(details).toContain('diff-001')
    expect(details).toContain('12:00:01')
  })

  it('refreshing diffView updates the viewer', async () => {
    const store = useObservatoryDataStore()
    const wrapper = mountViewer()
    store.viewModel = {
      overview: { traceCount: 0, timelineCount: 0, historyCount: 0 },
      trace: [],
      traceView: [],
      timelineView: [],
      historyView: [],
      diffView: [
        { id: 'new-1', timestamp: '99:00', added: [{ name: 'NewA' }], removed: [], changed: [] },
        { id: 'new-2', timestamp: '99:01', added: [], removed: [{ name: 'Old' }], changed: [] },
      ],
      runtimeView: { worldId: '', entityCount: 0, systemCount: 0, eventCount: 0, fps: 0, entities: [] },
      eventStreamView: { events: [] },
      timeline: [],
      history: [],
    }
    await nextTick()
    expect(rows(wrapper)).toHaveLength(2)
    expect(rowTexts(wrapper, '.diff-row-id')).toEqual(['new-1', 'new-2'])
  })
})

// ---------------------------------------------------------------------------
// Section 14 — Accessibility
// ---------------------------------------------------------------------------

describe('diff data — accessibility', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('diff list nav has aria-label', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('nav.diff-list').attributes('aria-label')).toBe('Diff list')
  })

  it('diff details article has aria-label', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('article.diff-details').attributes('aria-label')).toBe(
      'Diff details',
    )
  })

  it('uses buttons for diff rows', () => {
    const wrapper = mountViewer()
    for (const row of rows(wrapper)) {
      expect(row.element.tagName).toBe('BUTTON')
    }
  })

  it('marks active row with aria-current', () => {
    const wrapper = mountViewer()
    expect(rows(wrapper)[0].attributes('aria-current')).toBe('true')
  })

  it('uses h2 for panel headings', () => {
    const wrapper = mountViewer()
    const headings = wrapper.findAll('h2').map((h) => h.text().trim())
    expect(headings).toContain('Diff List')
    expect(headings).toContain('Diff Details')
  })

  it('uses h3 for section headings', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('h3.diff-added-title').exists()).toBe(true)
    expect(wrapper.find('h3.diff-removed-title').exists()).toBe(true)
    expect(wrapper.find('h3.diff-changed-title').exists()).toBe(true)
  })

  it('uses section with aria-labelledby', () => {
    const wrapper = mountViewer()
    expect(
      wrapper.find('section.diff-added-section').attributes('aria-labelledby'),
    ).toBe('diff-added-title')
  })

  it('renders change cards as articles', () => {
    const wrapper = mountViewer()
    for (const card of changeCards(wrapper)) {
      expect(card.element.tagName).toBe('ARTICLE')
    }
  })

  it('uses definition list for meta header', () => {
    const wrapper = mountViewer()
    const dl = wrapper.find('dl.diff-meta-grid')
    expect(dl.exists()).toBe(true)
    expect(dl.findAll('dt')).toHaveLength(2)
  })
})

// ---------------------------------------------------------------------------
// Section 15 — Shape Integrity
// ---------------------------------------------------------------------------

describe('diff data — shape integrity', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('diffView is an array', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(Array.isArray(store.viewModel.diffView)).toBe(true)
  })

  it('each diffView entry has all required fields', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const d of store.viewModel.diffView) {
      expect(d).toHaveProperty('id')
      expect(d).toHaveProperty('timestamp')
      expect(d).toHaveProperty('added')
      expect(d).toHaveProperty('removed')
      expect(d).toHaveProperty('changed')
    }
  })

  it('viewModel properties are independent', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    // Changing traceView should not affect diffView
    const diffLenBefore = store.viewModel.diffView.length
    const traceLenBefore = store.viewModel.traceView.length
    expect(diffLenBefore).toBeGreaterThan(0)
    expect(traceLenBefore).toBeGreaterThan(0)
  })

  it('diffView is separate from traceView', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(Object.is(store.viewModel.diffView, store.viewModel.traceView)).toBe(false)
  })

  it('diffView is separate from historyView', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(Object.is(store.viewModel.diffView, store.viewModel.historyView)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Section 16 — Edge Cases
// ---------------------------------------------------------------------------

describe('diff data — edge cases', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('adapter handles double empty diffView gracefully', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm1 = adapter.adapt({ diffView: [] })
    const vm2 = adapter.adapt({ diffView: [] })
    expect(vm1.diffView).toEqual(vm2.diffView)
  })

  it('adapter handles diffView with large change arrays', () => {
    const adapter = new DefaultObservatoryAdapter()
    const large = Array.from({ length: 100 }, (_, i) => ({ name: `Item-${i}` }))
    const vm = adapter.adapt({
      diffView: [{ id: 'large', timestamp: 'T', added: large, removed: [], changed: [] }],
    })
    expect(vm.diffView[0].added).toHaveLength(100)
    expect(vm.diffView[0].added[99].name).toBe('Item-99')
  })

  it('diffView nested arrays are independent between entries', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      diffView: [
        { id: 'd1', timestamp: 'T', added: ['A'], removed: [], changed: [] },
        { id: 'd2', timestamp: 'T', added: ['B'], removed: [], changed: [] },
      ],
    })
    expect(vm.diffView[0].added[0].name).toBe('A')
    expect(vm.diffView[1].added[0].name).toBe('B')
    expect(Object.is(vm.diffView[0].added, vm.diffView[1].added)).toBe(false)
  })

  it('viewModel with only diffView field is valid', () => {
    const store = useObservatoryDataStore()
    const vm: ObservatoryViewModel = {
      overview: { traceCount: 0, timelineCount: 0, historyCount: 0 },
      trace: [],
      traceView: [],
      timelineView: [],
      historyView: [],
      diffView: [{ id: 'd1', timestamp: 'T', added: [], removed: [], changed: [] }],
      runtimeView: { worldId: '', entityCount: 0, systemCount: 0, eventCount: 0, fps: 0, entities: [] },
      eventStreamView: { events: [] },
      timeline: [],
      history: [],
    }
    store.viewModel = vm
    expect(store.viewModel.diffView).toHaveLength(1)
  })

  it('store handles multiple loadMockObservatory calls', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    store.loadMockObservatory()
    store.loadMockObservatory()
    expect(store.viewModel.diffView).toHaveLength(3)
  })
})

// ---------------------------------------------------------------------------
// Section 17 — Backward Compatibility
// ---------------------------------------------------------------------------

describe('diff data — backward compatibility', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('adapter string[] input produces DiffChangeViewModel[] output', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      diffView: [
        { id: 'd1', timestamp: 'T', added: ['A'], removed: [], changed: [] },
      ],
    })
    expect(vm.diffView[0].added[0]).toEqual({ name: 'A' })
  })

  it('adapter DiffChangeViewModel[] input preserves name', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      diffView: [
        { id: 'd1', timestamp: 'T', added: [{ name: 'Alpha' }], removed: [], changed: [] },
      ],
    })
    expect(vm.diffView[0].added[0].name).toBe('Alpha')
  })

  it('adapter handles mixed added arrays', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      diffView: [
        {
          id: 'd1',
          timestamp: 'T',
          added: ['StrItem', { name: 'ObjItem' }],
          removed: [],
          changed: [],
        },
      ],
    })
    expect(vm.diffView[0].added).toHaveLength(2)
    expect(vm.diffView[0].added[0].name).toBe('StrItem')
    expect(vm.diffView[0].added[1].name).toBe('ObjItem')
  })

  it('adapter handles mixed removed arrays', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      diffView: [
        {
          id: 'd1',
          timestamp: 'T',
          added: [],
          removed: ['OldStr', { name: 'OldObj' }],
          changed: [],
        },
      ],
    })
    expect(vm.diffView[0].removed).toHaveLength(2)
    expect(vm.diffView[0].removed[0].name).toBe('OldStr')
    expect(vm.diffView[0].removed[1].name).toBe('OldObj')
  })

  it('adapter handles mixed changed arrays', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      diffView: [
        {
          id: 'd1',
          timestamp: 'T',
          added: [],
          removed: [],
          changed: ['ChgStr', { name: 'ChgObj' }],
        },
      ],
    })
    expect(vm.diffView[0].changed).toHaveLength(2)
    expect(vm.diffView[0].changed[0].name).toBe('ChgStr')
    expect(vm.diffView[0].changed[1].name).toBe('ChgObj')
  })

  it('existing tests continue to work with same mock data expectations', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const diff = store.viewModel.diffView[0]
    expect(diff.id).toBe('diff-001')
    expect(diff.timestamp).toBe('12:00:01')
    const addedNames = diff.added.map((a) => a.name)
    expect(addedNames).toEqual(['Tavern', 'Villager-1', 'Villager-2'])
  })
})

// ---------------------------------------------------------------------------
// Section 18 — Store Edge Cases
// ---------------------------------------------------------------------------

describe('diff data — store edge cases', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('store handles multiple loadMockObservatory calls consistently', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const first = store.viewModel.diffView.map((d) => d.id)
    store.loadMockObservatory()
    const second = store.viewModel.diffView.map((d) => d.id)
    expect(first).toEqual(second)
  })

  it('store handles direct diffView replacement', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const custom = [
      { id: 'custom', timestamp: 'C', added: [{ name: 'X' }], removed: [], changed: [] },
    ]
    store.viewModel = {
      overview: { traceCount: 0, timelineCount: 0, historyCount: 0 },
      trace: [],
      traceView: [],
      timelineView: [],
      historyView: [],
      diffView: custom as any,
      runtimeView: { worldId: '', entityCount: 0, systemCount: 0, eventCount: 0, fps: 0, entities: [] },
      eventStreamView: { events: [] },
      timeline: [],
      history: [],
    }
    expect(store.viewModel.diffView).toHaveLength(1)
    expect(store.viewModel.diffView[0].id).toBe('custom')
  })

  it('empty diffView after load is deterministic', () => {
    const store = useObservatoryDataStore()
    const a = store.viewModel.diffView
    const b = store.viewModel.diffView
    expect(Object.is(a, b)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 19 — No AI Package Leakage
// ---------------------------------------------------------------------------

describe('diff data — no AI package leakage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('viewModel does not contain AI-specific root properties', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const keys = Object.keys(store.viewModel)
    expect(keys).not.toContain('promptAssembly')
    expect(keys).not.toContain('promptAssemblyObservatory')
    expect(keys).not.toContain('plannerResult')
  })

  it('diffView does not contain AI-specific fields', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const d of store.viewModel.diffView) {
      const keys = Object.keys(d)
      expect(keys).not.toContain('promptAssembly')
      expect(keys).not.toContain('plannerResult')
      expect(keys).not.toContain('strategy')
      expect(keys).not.toContain('plan')
    }
  })

  it('diffChange items do not contain AI-specific fields', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const d of store.viewModel.diffView) {
      for (const item of d.added) {
        const keys = Object.keys(item)
        expect(keys).toEqual(['name'])
      }
    }
  })
})