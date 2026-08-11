import { describe, it, expect, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

import ObservatoryTraceViewer from '../components/observatory/trace/ObservatoryTraceViewer.vue'
import TraceList from '../components/observatory/trace/TraceList.vue'
import TraceDetails from '../components/observatory/trace/TraceDetails.vue'
import TraceStepCard from '../components/observatory/trace/TraceStepCard.vue'
import ObservatoryContent from '../components/observatory/ObservatoryContent.vue'
import ObservatoryOverview from '../components/observatory/ObservatoryOverview.vue'
import { useObservatoryStore } from '../stores/observatory'
import { useObservatoryDataStore } from '../stores/observatoryData'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mountViewer(attachTo?: HTMLElement): VueWrapper {
  // Load mock data so the viewer has traces to display
  useObservatoryDataStore().loadMockObservatory()
  return mount(ObservatoryTraceViewer, attachTo ? { attachTo } : undefined)
}

function rows(wrapper: VueWrapper): ReturnType<VueWrapper['findAll']> {
  return wrapper.findAll('.trace-row')
}

function rowTexts(wrapper: VueWrapper, selector: string): string[] {
  return wrapper.findAll(selector).map((el) => el.text().trim())
}

function activeRows(wrapper: VueWrapper): ReturnType<VueWrapper['findAll']> {
  return rows(wrapper).filter((r) => r.classes().includes('trace-row--active'))
}

function stepCardTitles(wrapper: VueWrapper): string[] {
  return wrapper.findAll('.trace-step-card-title').map((el) => el.text().trim())
}

async function pressKey(wrapper: VueWrapper, key: string): Promise<void> {
  await wrapper.find('nav.trace-list').trigger('keydown', { key })
  await nextTick()
}

function attachContainer(): HTMLElement {
  const el = document.createElement('div')
  document.body.appendChild(el)
  return el
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('trace viewer — rendering', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders the root viewer container', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('.observatory-trace-viewer').exists()).toBe(true)
  })

  it('renders the TraceList component', () => {
    const wrapper = mountViewer()
    expect(wrapper.findComponent(TraceList).exists()).toBe(true)
  })

  it('renders the TraceDetails component', () => {
    const wrapper = mountViewer()
    expect(wrapper.findComponent(TraceDetails).exists()).toBe(true)
  })

  it('renders the list as a nav with aria-label "Trace list"', () => {
    const wrapper = mountViewer()
    const nav = wrapper.find('nav.trace-list')
    expect(nav.exists()).toBe(true)
    expect(nav.attributes('aria-label')).toBe('Trace list')
  })

  it('renders the details as an article with aria-label "Trace details"', () => {
    const wrapper = mountViewer()
    const article = wrapper.find('article.trace-details')
    expect(article.exists()).toBe(true)
    expect(article.attributes('aria-label')).toBe('Trace details')
  })

  it('renders the list heading "Trace List" as an h2', () => {
    const wrapper = mountViewer()
    const h2 = wrapper.find('.trace-list-title')
    expect(h2.exists()).toBe(true)
    expect(h2.element.tagName).toBe('H2')
    expect(h2.text()).toBe('Trace List')
  })

  it('renders exactly 3 trace rows', () => {
    const wrapper = mountViewer()
    expect(rows(wrapper)).toHaveLength(3)
  })

  it('renders row ids in order', () => {
    const wrapper = mountViewer()
    expect(rowTexts(wrapper, '.trace-row-id')).toEqual([
      'trace-001',
      'trace-002',
      'trace-003',
    ])
  })

  it('renders strategies in order', () => {
    const wrapper = mountViewer()
    expect(rowTexts(wrapper, '.trace-row-strategy')).toEqual([
      'CreateWorld',
      'GenerateTerrain',
      'CreateFarm',
    ])
  })

  it('renders timestamps in order', () => {
    const wrapper = mountViewer()
    expect(rowTexts(wrapper, '.trace-row-time')).toEqual([
      '10:00:01',
      '10:00:05',
      '10:00:09',
    ])
  })

  it('renders rows as buttons (keyboard accessible)', () => {
    const wrapper = mountViewer()
    for (const row of rows(wrapper)) {
      expect(row.element.tagName).toBe('BUTTON')
      expect(row.attributes('type')).toBe('button')
    }
  })

  it('renders rows inside list items', () => {
    const wrapper = mountViewer()
    const items = wrapper.findAll('li.trace-list-item')
    expect(items).toHaveLength(3)
    for (const item of items) {
      expect(item.find('button.trace-row').exists()).toBe(true)
    }
  })

  it('renders the list as a ul', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('ul.trace-list-items').exists()).toBe(true)
  })

  it('renders the details title "Trace Details"', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('.trace-details-title').text()).toBe('Trace Details')
  })

  it('lays out the viewer as a two-column grid', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('.observatory-trace-viewer').exists()).toBe(true)
    expect(wrapper.findComponent(TraceList).exists()).toBe(true)
    expect(wrapper.findComponent(TraceDetails).exists()).toBe(true)
  })

  it('renders the three step cards Plan, Snapshot, Metadata', () => {
    const wrapper = mountViewer()
    expect(stepCardTitles(wrapper)).toEqual(['Plan', 'Snapshot', 'Metadata'])
  })

  it('renders Plan as a preformatted block', () => {
    const wrapper = mountViewer()
    const pre = wrapper.find('pre.trace-plan')
    expect(pre.exists()).toBe(true)
    expect(pre.element.tagName).toBe('PRE')
  })

  it('renders Metadata as a preformatted block', () => {
    const wrapper = mountViewer()
    const pre = wrapper.find('pre.trace-metadata')
    expect(pre.exists()).toBe(true)
    expect(pre.element.tagName).toBe('PRE')
  })

  it('renders the placeholder grid for Settings', () => {
    const store = useObservatoryStore()
    store.selectPanel('Settings')
    const wrapper = mount(ObservatoryContent)
    expect(wrapper.findAll('.content-card')).toHaveLength(6)
    expect(wrapper.findComponent(ObservatoryTraceViewer).exists()).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

describe('trace viewer — mock data', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('displays 3 mock traces', () => {
    const wrapper = mountViewer()
    expect(rows(wrapper)).toHaveLength(3)
  })

  it('mock ids follow the trace-NNN pattern', () => {
    const wrapper = mountViewer()
    const ids = rowTexts(wrapper, '.trace-row-id')
    for (const id of ids) {
      expect(id).toMatch(/^trace-\d+$/)
    }
  })

  it('mock strategies are CreateWorld, GenerateTerrain, CreateFarm', () => {
    const wrapper = mountViewer()
    expect(rowTexts(wrapper, '.trace-row-strategy')).toEqual([
      'CreateWorld',
      'GenerateTerrain',
      'CreateFarm',
    ])
  })

  it('trace-001 plan contains its strategy', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('.trace-plan').text()).toContain('strategy=create')
  })

  it('default trace plan is deterministic', () => {
    const a = mountViewer()
    const b = mountViewer()
    expect(a.find('.trace-plan').text()).toBe(b.find('.trace-plan').text())
  })

  it('trace-1 snapshot contains Module Count', () => {
    const wrapper = mountViewer()
    const keys = wrapper
      .findAll('.trace-snapshot-key')
      .map((el) => el.text().trim())
    expect(keys).toContain('Module Count')
  })

  it('trace-1 metadata is valid JSON', () => {
    const wrapper = mountViewer()
    const json = wrapper.find('pre.trace-metadata').text()
    expect(() => JSON.parse(json)).not.toThrow()
    expect(JSON.parse(json)).toHaveProperty('builder', 'DefaultPromptBuilder')
  })
})

// ---------------------------------------------------------------------------
// Default selection / active state
// ---------------------------------------------------------------------------

describe('trace viewer — default selection and active state', () => {
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

  it('sets aria-current=true on the active row', () => {
    const wrapper = mountViewer()
    expect(rows(wrapper)[0].attributes('aria-current')).toBe('true')
  })

  it('leaves aria-current unset on inactive rows', () => {
    const wrapper = mountViewer()
    expect(rows(wrapper)[1].attributes('aria-current')).toBeUndefined()
    expect(rows(wrapper)[2].attributes('aria-current')).toBeUndefined()
  })

  it('shows the first trace id in the details header by default', () => {
    const wrapper = mountViewer()
    const header = wrapper.find('.trace-meta-grid').text()
    expect(header).toContain('trace-001')
  })

  it('shows the first strategy in the details header by default', () => {
    const wrapper = mountViewer()
    const header = wrapper.find('.trace-meta-grid').text()
    expect(header).toContain('CreateWorld')
  })

  it('labels the Trace ID field with a dt', () => {
    const wrapper = mountViewer()
    const labels = wrapper
      .findAll('.trace-meta-label')
      .map((el) => el.text().trim())
    expect(labels).toEqual(['Trace ID', 'Strategy'])
  })
})

// ---------------------------------------------------------------------------
// Selection — clicking
// ---------------------------------------------------------------------------

describe('trace viewer — selection by click', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('selects trace-2 on click and updates details id', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    expect(wrapper.find('.trace-meta-grid').text()).toContain('trace-002')
  })

  it('selects trace-2 on click and updates strategy', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    expect(wrapper.find('.trace-meta-grid').text()).toContain('GenerateTerrain')
  })

  it('moves the active class to the clicked row', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[2].trigger('click')
    await nextTick()
    expect(activeRows(wrapper)).toHaveLength(1)
    expect(activeRows(wrapper)[0].text()).toContain('trace-003')
  })

  it('moves aria-current to the clicked row', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    expect(rows(wrapper)[1].attributes('aria-current')).toBe('true')
    expect(rows(wrapper)[0].attributes('aria-current')).toBeUndefined()
  })

  it('selects trace-3 on click and shows query strategy', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[2].trigger('click')
    await nextTick()
    expect(wrapper.find('.trace-meta-grid').text()).toContain('CreateFarm')
  })

  it('switches back to trace-1 when clicked again', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    await rows(wrapper)[0].trigger('click')
    await nextTick()
    expect(wrapper.find('.trace-meta-grid').text()).toContain('trace-001')
    expect(activeRows(wrapper)).toHaveLength(1)
    expect(activeRows(wrapper)[0].text()).toContain('trace-001')
  })

  it('clicking the active row keeps the selection', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[0].trigger('click')
    await nextTick()
    expect(activeRows(wrapper)).toHaveLength(1)
    expect(wrapper.find('.trace-meta-grid').text()).toContain('trace-001')
  })
})

// ---------------------------------------------------------------------------
// Detail switching
// ---------------------------------------------------------------------------

describe('trace viewer — detail switching', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('updates the Plan block when a different trace is selected', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    expect(wrapper.find('pre.trace-plan').text()).toContain('strategy=modify')
  })

  it('updates the Plan block to the query trace', async () => {
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

  it('updates the snapshot when trace-2 is selected', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    const keys = wrapper
      .findAll('.trace-snapshot-key')
      .map((el) => el.text().trim())
    expect(keys).toContain('Strategy')
  })

  it('updates the snapshot when trace-003 is selected', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[2].trigger('click')
    await nextTick()
    const values = wrapper
      .findAll('.trace-snapshot-value')
      .map((el) => el.text().trim())
    expect(values).toContain('CreateFarm')
  })

  it('updates the metadata when trace-2 is selected', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    expect(wrapper.find('pre.trace-metadata').text()).toContain('modified')
  })

  it('updates the metadata when trace-3 is selected', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[2].trigger('click')
    await nextTick()
    expect(wrapper.find('pre.trace-metadata').text()).toContain('resolved')
  })
})

// ---------------------------------------------------------------------------
// Snapshot rendering
// ---------------------------------------------------------------------------

describe('trace viewer — snapshot rendering', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders the snapshot as a definition list', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('dl.trace-snapshot-grid').exists()).toBe(true)
  })

  it('renders the snapshot card with a Snapshot h3', () => {
    const wrapper = mountViewer()
    const titles = stepCardTitles(wrapper)
    expect(titles).toContain('Snapshot')
  })

  it('snapshot entries count matches mock structure for trace-001', () => {
    const wrapper = mountViewer()
    expect(wrapper.findAll('.trace-snapshot-item')).toHaveLength(2)
  })

  it('renders snapshot keys', () => {
    const wrapper = mountViewer()
    const keys = wrapper
      .findAll('.trace-snapshot-key')
      .map((el) => el.text().trim())
    expect(keys).toContain('Module Count')
    expect(keys).toContain('Strategy')
  })

  it('renders snapshot values', () => {
    const wrapper = mountViewer()
    const values = wrapper
      .findAll('.trace-snapshot-value')
      .map((el) => el.text().trim())
    expect(values).toContain('3')
    expect(values).toContain('CreateWorld')
  })

  it('renders dt/dd pairs inside each snapshot entry', () => {
    const wrapper = mountViewer()
    for (const item of wrapper.findAll('.trace-snapshot-item')) {
      expect(item.find('dt.trace-snapshot-key').exists()).toBe(true)
      expect(item.find('dd.trace-snapshot-value').exists()).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------
// Metadata rendering
// ---------------------------------------------------------------------------

describe('trace viewer — metadata rendering', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders the Metadata card with an h3', () => {
    const wrapper = mountViewer()
    expect(stepCardTitles(wrapper)).toContain('Metadata')
  })

  it('renders metadata as JSON with the builder field', () => {
    const wrapper = mountViewer()
    const text = wrapper.find('pre.trace-metadata').text()
    expect(text).toContain('"builder"')
    expect(text).toContain('DefaultPromptBuilder')
  })

  it('renders metadata indented with two spaces', () => {
    const wrapper = mountViewer()
    const text = wrapper.find('pre.trace-metadata').text()
    const lines = text.split('\n')
    expect(lines.some((l) => l.startsWith('  "builder"'))).toBe(true)
  })

  it('metadata JSON is parseable and round-trips', () => {
    const wrapper = mountViewer()
    const parsed = JSON.parse(wrapper.find('pre.trace-metadata').text())
    expect(parsed.status).toBe('assembled')
    expect(parsed.phase).toBe('0.959977')
    expect(Array.isArray(parsed.modules)).toBe(true)
  })

  it('includes the phase number in metadata', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('pre.trace-metadata').text()).toContain('0.959977')
  })

  it('metadata updates reflect the selected trace status', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[2].trigger('click')
    await nextTick()
    const parsed = JSON.parse(wrapper.find('pre.trace-metadata').text())
    expect(parsed.status).toBe('resolved')
  })
})

// ---------------------------------------------------------------------------
// Keyboard navigation
// ---------------------------------------------------------------------------

describe('trace viewer — keyboard navigation', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('moves selection to the next trace with ArrowDown', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'ArrowDown')
    expect(activeRows(wrapper)).toHaveLength(1)
    expect(activeRows(wrapper)[0].text()).toContain('trace-002')
  })

  it('updates details after ArrowDown', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'ArrowDown')
    expect(wrapper.find('.trace-meta-grid').text()).toContain('trace-002')
  })

  it('moves selection two steps with repeated ArrowDown', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'ArrowDown')
    await pressKey(wrapper, 'ArrowDown')
    expect(activeRows(wrapper)[0].text()).toContain('trace-003')
  })

  it('moves selection to the previous trace with ArrowUp', async () => {
    const el = attachContainer()
    const wrapper = mountViewer(el)
    await pressKey(wrapper, 'ArrowDown')
    await pressKey(wrapper, 'ArrowDown')
    await pressKey(wrapper, 'ArrowUp')
    expect(activeRows(wrapper)[0].text()).toContain('trace-002')
    wrapper.unmount()
    el.remove()
  })

  it('clamps ArrowDown at the last trace', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'ArrowDown')
    await pressKey(wrapper, 'ArrowDown')
    await pressKey(wrapper, 'ArrowDown')
    expect(activeRows(wrapper)[0].text()).toContain('trace-003')
  })

  it('clamps ArrowUp at the first trace', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'ArrowUp')
    expect(activeRows(wrapper)[0].text()).toContain('trace-001')
  })

  it('jumps to the last trace with End', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'End')
    expect(activeRows(wrapper)[0].text()).toContain('trace-003')
    expect(wrapper.find('.trace-meta-grid').text()).toContain('trace-003')
  })

  it('jumps to the first trace with Home', async () => {
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

  it('moves aria-current alongside keyboard selection', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'ArrowDown')
    expect(rows(wrapper)[1].attributes('aria-current')).toBe('true')
    expect(rows(wrapper)[0].attributes('aria-current')).toBeUndefined()
  })

  it('focuses the newly selected row', async () => {
    const el = attachContainer()
    const wrapper = mountViewer(el)
    await nextTick()
    await pressKey(wrapper, 'ArrowDown')
    expect(document.activeElement?.textContent).toContain('trace-002')
    wrapper.unmount()
    el.remove()
  })

  it('keys are handled on the list nav container', async () => {
    const wrapper = mountViewer()
    await wrapper.find('nav.trace-list').trigger('keydown', { key: 'ArrowDown' })
    await nextTick()
    expect(activeRows(wrapper)[0].text()).toContain('trace-002')
  })
})

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------

describe('trace viewer — accessibility', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('exposes an accessible nav landmark for the list', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('nav.trace-list').attributes('aria-label')).toBe(
      'Trace list',
    )
  })

  it('exposes an accessible article landmark for details', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('article.trace-details').attributes('aria-label')).toBe(
      'Trace details',
    )
  })

  it('uses buttons for every trace row', () => {
    const wrapper = mountViewer()
    for (const row of rows(wrapper)) {
      expect(row.element.tagName).toBe('BUTTON')
      expect(row.attributes('type')).toBe('button')
    }
  })

  it('row buttons expose a text-accessible name', () => {
    const wrapper = mountViewer()
    for (const row of rows(wrapper)) {
      expect(row.text().trim().length).toBeGreaterThan(0)
    }
  })

  it('marks the active row with aria-current', () => {
    const wrapper = mountViewer()
    const active = activeRows(wrapper)
    expect(active).toHaveLength(1)
    expect(active[0].attributes('aria-current')).toBe('true')
  })

  it('uses h2 for the list and details headings', () => {
    const wrapper = mountViewer()
    const headings = wrapper.findAll('h2')
    const texts = headings.map((h) => h.text().trim())
    expect(texts).toContain('Trace List')
    expect(texts).toContain('Trace Details')
  })

  it('step cards are sections with aria-labelledby', () => {
    const wrapper = mountViewer()
    for (const card of wrapper.findAll('section.trace-step-card')) {
      const labelledby = card.attributes('aria-labelledby')
      expect(labelledby).toBeDefined()
      const id = card.find('h3').attributes('id')
      expect(id).toBe(labelledby)
    }
  })

  it('step card headings match their aria-labelledby targets', () => {
    const wrapper = mountViewer()
    const titles = stepCardTitles(wrapper)
    const ids = wrapper
      .findAll('section.trace-step-card h3')
      .map((h) => h.attributes('id'))
    expect(ids).toEqual([
      `trace-step-${titles[0].toLowerCase()}`,
      `trace-step-${titles[1].toLowerCase()}`,
      `trace-step-${titles[2].toLowerCase()}`,
    ])
  })

  it('makes Plan and Metadata pre blocks keyboard reachable', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('pre.trace-plan').attributes('tabindex')).toBe('0')
    expect(wrapper.find('pre.trace-metadata').attributes('tabindex')).toBe('0')
  })

  it('uses a definition list for the trace meta header', () => {
    const wrapper = mountViewer()
    const dl = wrapper.find('dl.trace-meta-grid')
    expect(dl.exists()).toBe(true)
    expect(dl.findAll('dt')).toHaveLength(2)
    expect(dl.findAll('dd')).toHaveLength(2)
  })

  it('keeps the trace field labels static', () => {
    const wrapper = mountViewer()
    expect(wrapper.findAll('.trace-meta-label').length).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// TraceStepCard
// ---------------------------------------------------------------------------

describe('trace step card', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders as a section', () => {
    const wrapper = mount(TraceStepCard, {
      props: { title: 'Plan' },
      slots: { default: '<pre>test plan</pre>' },
    })
    expect(wrapper.find('section.trace-step-card').exists()).toBe(true)
  })

  it('renders the title as an h3', () => {
    const wrapper = mount(TraceStepCard, {
      props: { title: 'Snapshot' },
      slots: { default: '<p>content</p>' },
    })
    const h3 = wrapper.find('h3')
    expect(h3.text()).toBe('Snapshot')
  })

  it('renders slot content inside the card body', () => {
    const wrapper = mount(TraceStepCard, {
      props: { title: 'Metadata' },
      slots: { default: '<p class="custom-slot">hi</p>' },
    })
    expect(wrapper.find('.trace-step-card-body .custom-slot').text()).toBe('hi')
  })

  it('links the section aria-labelledby to the heading id', () => {
    const wrapper = mount(TraceStepCard, {
      props: { title: 'Plan' },
      slots: { default: '<pre>x</pre>' },
    })
    const section = wrapper.find('section.trace-step-card')
    const h3 = wrapper.find('h3')
    expect(section.attributes('aria-labelledby')).toBe(h3.attributes('id'))
  })

  it('normalizes the heading id from the title', () => {
    const wrapper = mount(TraceStepCard, {
      props: { title: 'Step One' },
      slots: { default: '<p>x</p>' },
    })
    expect(wrapper.find('h3').attributes('id')).toBe('trace-step-step-one')
  })

  it('renders the title with the card title class', () => {
    const wrapper = mount(TraceStepCard, {
      props: { title: 'Plan' },
      slots: { default: '<pre>x</pre>' },
    })
    expect(wrapper.find('h3.trace-step-card-title').exists()).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Content integration
// ---------------------------------------------------------------------------

describe('trace viewer — content integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    useObservatoryDataStore().loadMockObservatory()
  })

  it('renders the trace viewer when Trace is selected in the store', () => {
    const store = useObservatoryStore()
    store.selectPanel('Trace')
    const wrapper = mount(ObservatoryContent)
    expect(wrapper.findComponent(ObservatoryTraceViewer).exists()).toBe(true)
    expect(wrapper.findComponent(ObservatoryOverview).exists()).toBe(false)
    expect(wrapper.findAll('.content-card')).toHaveLength(0)
  })

  it('switches from Overview to the trace viewer on store change', async () => {
    const store = useObservatoryStore()
    const wrapper = mount(ObservatoryContent)
    expect(wrapper.findComponent(ObservatoryOverview).exists()).toBe(true)
    store.selectPanel('Trace')
    await nextTick()
    expect(wrapper.findComponent(ObservatoryOverview).exists()).toBe(false)
    expect(wrapper.findComponent(ObservatoryTraceViewer).exists()).toBe(true)
  })

  it('switches from the trace viewer back to Overview', async () => {
    const store = useObservatoryStore()
    store.selectPanel('Trace')
    const wrapper = mount(ObservatoryContent)
    expect(wrapper.findComponent(ObservatoryTraceViewer).exists()).toBe(true)
    store.selectPanel('Overview')
    await nextTick()
    expect(wrapper.findComponent(ObservatoryTraceViewer).exists()).toBe(false)
    expect(wrapper.findComponent(ObservatoryOverview).exists()).toBe(true)
  })

  it('switches from the trace viewer to the placeholder grid', async () => {
    const store = useObservatoryStore()
    store.selectPanel('Trace')
    const wrapper = mount(ObservatoryContent)
    expect(wrapper.findComponent(ObservatoryTraceViewer).exists()).toBe(true)
    store.selectPanel('Settings')
    await nextTick()
    expect(wrapper.findComponent(ObservatoryTraceViewer).exists()).toBe(false)
    expect(wrapper.findAll('.content-card')).toHaveLength(6)
  })

  it('re-mounts a fresh trace viewer after panel switching', async () => {
    const store = useObservatoryStore()
    store.selectPanel('Trace')
    const wrapper = mount(ObservatoryContent)
    expect(wrapper.findComponent(ObservatoryTraceViewer).exists()).toBe(true)
    store.selectPanel('Runtime')
    await nextTick()
    store.selectPanel('Trace')
    await nextTick()
    const viewer = wrapper.findComponent(ObservatoryTraceViewer)
    expect(viewer.exists()).toBe(true)
    const active = viewer.findAll('.trace-row--active')
    expect(active).toHaveLength(1)
    expect(active[0].text()).toContain('trace-001')
  })
})

// ---------------------------------------------------------------------------
// Deterministic rendering
// ---------------------------------------------------------------------------

describe('trace viewer — deterministic rendering', () => {
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
    expect(rowTexts(a, '.trace-row-strategy')).toEqual(
      rowTexts(b, '.trace-row-strategy'),
    )
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

  it('selects the same default trace across mounts', () => {
    const a = mountViewer()
    const b = mountViewer()
    const activeText = (w: VueWrapper): string =>
      w.find('.trace-row--active').text()
    expect(activeText(a)).toBe('CreateWorldtrace-00110:00:01')
    expect(activeText(b)).toBe('CreateWorldtrace-00110:00:01')
  })

  it('renders identical viewer HTML across mounts', () => {
    const a = mountViewer()
    const b = mountViewer()
    expect(a.html()).toBe(b.html())
  })
})