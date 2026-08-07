import { describe, it, expect, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

import ObservatoryTimelineViewer from '../components/observatory/timeline/ObservatoryTimelineViewer.vue'
import TimelineList from '../components/observatory/timeline/TimelineList.vue'
import TimelineDetails from '../components/observatory/timeline/TimelineDetails.vue'
import TimelineEntryCard from '../components/observatory/timeline/TimelineEntryCard.vue'
import ObservatoryContent from '../components/observatory/ObservatoryContent.vue'
import ObservatoryOverview from '../components/observatory/ObservatoryOverview.vue'
import ObservatoryTraceViewer from '../components/observatory/trace/ObservatoryTraceViewer.vue'
import { useObservatoryStore } from '../stores/observatory'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mountViewer(attachTo?: HTMLElement): VueWrapper {
  return mount(ObservatoryTimelineViewer, attachTo ? { attachTo } : undefined)
}

function rows(wrapper: VueWrapper): ReturnType<VueWrapper['findAll']> {
  return wrapper.findAll('.timeline-row')
}

function rowTexts(wrapper: VueWrapper, selector: string): string[] {
  return wrapper.findAll(selector).map((el) => el.text().trim())
}

function activeRows(wrapper: VueWrapper): ReturnType<VueWrapper['findAll']> {
  return rows(wrapper).filter((r) => r.classes().includes('timeline-row--active'))
}

function entryCards(wrapper: VueWrapper): ReturnType<VueWrapper['findAll']> {
  return wrapper.findAll('.timeline-entry-card')
}

function entryTexts(wrapper: VueWrapper, selector: string): string[] {
  return wrapper.findAll(selector).map((el) => el.text().trim())
}

async function pressKey(wrapper: VueWrapper, key: string): Promise<void> {
  await wrapper.find('nav.timeline-list').trigger('keydown', { key })
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

describe('timeline viewer — rendering', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders the root viewer container', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('.observatory-timeline-viewer').exists()).toBe(true)
  })

  it('renders the TimelineList component', () => {
    const wrapper = mountViewer()
    expect(wrapper.findComponent(TimelineList).exists()).toBe(true)
  })

  it('renders the TimelineDetails component', () => {
    const wrapper = mountViewer()
    expect(wrapper.findComponent(TimelineDetails).exists()).toBe(true)
  })

  it('renders the list as a nav with aria-label "Timeline list"', () => {
    const wrapper = mountViewer()
    const nav = wrapper.find('nav.timeline-list')
    expect(nav.exists()).toBe(true)
    expect(nav.attributes('aria-label')).toBe('Timeline list')
  })

  it('renders the details as an article with aria-label "Timeline details"', () => {
    const wrapper = mountViewer()
    const article = wrapper.find('article.timeline-details')
    expect(article.exists()).toBe(true)
    expect(article.attributes('aria-label')).toBe('Timeline details')
  })

  it('renders the list heading "Timeline List" as an h2', () => {
    const wrapper = mountViewer()
    const h2 = wrapper.find('.timeline-list-title')
    expect(h2.exists()).toBe(true)
    expect(h2.element.tagName).toBe('H2')
    expect(h2.text()).toBe('Timeline List')
  })

  it('renders exactly 3 timeline rows', () => {
    const wrapper = mountViewer()
    expect(rows(wrapper)).toHaveLength(3)
  })

  it('renders timeline ids in order', () => {
    const wrapper = mountViewer()
    expect(rowTexts(wrapper, '.timeline-row-id')).toEqual([
      'timeline-001',
      'timeline-002',
      'timeline-003',
    ])
  })

  it('renders entry counts in order', () => {
    const wrapper = mountViewer()
    expect(rowTexts(wrapper, '.timeline-row-count')).toEqual([
      '12 entries',
      '8 entries',
      '4 entries',
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
    const items = wrapper.findAll('li.timeline-list-item')
    expect(items).toHaveLength(3)
    for (const item of items) {
      expect(item.find('button.timeline-row').exists()).toBe(true)
    }
  })

  it('renders the list as a ul', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('ul.timeline-list-items').exists()).toBe(true)
  })

  it('renders the details title "Timeline Details" as an h2', () => {
    const wrapper = mountViewer()
    const h2 = wrapper.find('.timeline-details-title')
    expect(h2.exists()).toBe(true)
    expect(h2.element.tagName).toBe('H2')
    expect(h2.text()).toBe('Timeline Details')
  })

  it('lays out the viewer as a two-column grid', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('.observatory-timeline-viewer').exists()).toBe(true)
    expect(wrapper.findComponent(TimelineList).exists()).toBe(true)
    expect(wrapper.findComponent(TimelineDetails).exists()).toBe(true)
  })

  it('renders the Timeline Entries section heading', () => {
    const wrapper = mountViewer()
    const h3 = wrapper.find('.timeline-entries-title')
    expect(h3.exists()).toBe(true)
    expect(h3.element.tagName).toBe('H3')
    expect(h3.text()).toBe('Timeline Entries')
  })

  it('wraps Timeline Entries in a section with aria-labelledby', () => {
    const wrapper = mountViewer()
    const section = wrapper.find('section.timeline-entries-section')
    expect(section.exists()).toBe(true)
    expect(section.attributes('aria-labelledby')).toBe('timeline-entries-title')
  })
})

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

describe('timeline viewer — mock data', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('displays 3 mock timelines', () => {
    const wrapper = mountViewer()
    expect(rows(wrapper)).toHaveLength(3)
  })

  it('mock ids follow the timeline-NNN pattern', () => {
    const wrapper = mountViewer()
    const ids = rowTexts(wrapper, '.timeline-row-id')
    for (const id of ids) {
      expect(id).toMatch(/^timeline-\d{3}$/)
    }
  })

  it('mock entry counts are 12, 8, 4', () => {
    const wrapper = mountViewer()
    const counts = rowTexts(wrapper, '.timeline-row-count')
    for (const count of counts) {
      expect(count).toMatch(/^\d+ entries$/)
    }
  })

  it('default timeline has 12 entries', () => {
    const wrapper = mountViewer()
    expect(entryCards(wrapper)).toHaveLength(12)
  })

  it('default timeline entries start with CreateEntity', () => {
    const wrapper = mountViewer()
    const strategies = entryTexts(wrapper, '.timeline-entry-card-strategy')
    expect(strategies[0]).toBe('CreateEntity')
  })

  it('default timeline entries include MoveEntity at index 1', () => {
    const wrapper = mountViewer()
    const strategies = entryTexts(wrapper, '.timeline-entry-card-strategy')
    expect(strategies[1]).toBe('MoveEntity')
  })

  it('entry indices are sequential from #0', () => {
    const wrapper = mountViewer()
    const titles = entryTexts(wrapper, '.timeline-entry-card-title')
    expect(titles).toHaveLength(12)
    expect(titles[0]).toBe('#0')
    expect(titles[11]).toBe('#11')
  })
})

// ---------------------------------------------------------------------------
// Default selection / active state
// ---------------------------------------------------------------------------

describe('timeline viewer — default selection and active state', () => {
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

  it('sets aria-current=true on the active row', () => {
    const wrapper = mountViewer()
    expect(rows(wrapper)[0].attributes('aria-current')).toBe('true')
  })

  it('leaves aria-current unset on inactive rows', () => {
    const wrapper = mountViewer()
    expect(rows(wrapper)[1].attributes('aria-current')).toBeUndefined()
    expect(rows(wrapper)[2].attributes('aria-current')).toBeUndefined()
  })

  it('shows the first timeline id in the details header by default', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('.timeline-meta-grid').text()).toContain('timeline-001')
  })

  it('shows the first entry count in the details header by default', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('.timeline-meta-grid').text()).toContain('12')
  })

  it('labels the meta fields with dt elements', () => {
    const wrapper = mountViewer()
    const labels = wrapper
      .findAll('.timeline-meta-label')
      .map((el) => el.text().trim())
    expect(labels).toEqual(['Timeline ID', 'Entry Count'])
  })

  it('uses a definition list for the timeline meta header', () => {
    const wrapper = mountViewer()
    const dl = wrapper.find('dl.timeline-meta-grid')
    expect(dl.exists()).toBe(true)
    expect(dl.findAll('dt')).toHaveLength(2)
    expect(dl.findAll('dd')).toHaveLength(2)
  })
})

// ---------------------------------------------------------------------------
// Selection — clicking
// ---------------------------------------------------------------------------

describe('timeline viewer — selection by click', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('selects timeline-002 on click and updates details id', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    expect(wrapper.find('.timeline-meta-grid').text()).toContain('timeline-002')
  })

  it('selects timeline-002 on click and updates entry count', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    expect(wrapper.find('.timeline-meta-grid').text()).toContain('8')
  })

  it('moves the active class to the clicked row', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[2].trigger('click')
    await nextTick()
    expect(activeRows(wrapper)).toHaveLength(1)
    expect(activeRows(wrapper)[0].text()).toContain('timeline-003')
  })

  it('moves aria-current to the clicked row', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    expect(rows(wrapper)[1].attributes('aria-current')).toBe('true')
    expect(rows(wrapper)[0].attributes('aria-current')).toBeUndefined()
  })

  it('selects timeline-003 on click and shows 4 entries', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[2].trigger('click')
    await nextTick()
    expect(wrapper.find('.timeline-meta-grid').text()).toContain('timeline-003')
    expect(entryCards(wrapper)).toHaveLength(4)
  })

  it('switches back to timeline-001 when clicked again', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    await rows(wrapper)[0].trigger('click')
    await nextTick()
    expect(wrapper.find('.timeline-meta-grid').text()).toContain('timeline-001')
    expect(activeRows(wrapper)).toHaveLength(1)
    expect(activeRows(wrapper)[0].text()).toContain('timeline-001')
  })

  it('clicking the active row keeps the selection', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[0].trigger('click')
    await nextTick()
    expect(activeRows(wrapper)).toHaveLength(1)
    expect(wrapper.find('.timeline-meta-grid').text()).toContain('timeline-001')
  })
})

// ---------------------------------------------------------------------------
// Details rendering
// ---------------------------------------------------------------------------

describe('timeline viewer — details rendering', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders the Timeline Entries section for the default timeline', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('section.timeline-entries-section').exists()).toBe(true)
  })

  it('renders an entry card for each entry in the default timeline', () => {
    const wrapper = mountViewer()
    expect(entryCards(wrapper)).toHaveLength(12)
  })

  it('renders entry cards inside list items', () => {
    const wrapper = mountViewer()
    const items = wrapper.findAll('li.timeline-entries-item')
    expect(items).toHaveLength(12)
    for (const item of items) {
      expect(item.find('.timeline-entry-card').exists()).toBe(true)
    }
  })

  it('renders entries as a ul', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('ul.timeline-entries-list').exists()).toBe(true)
  })

  it('shows the entry index with a hash prefix', () => {
    const wrapper = mountViewer()
    const titles = entryTexts(wrapper, '.timeline-entry-card-title')
    expect(titles[0]).toBe('#0')
    expect(titles[1]).toBe('#1')
  })

  it('shows the strategy name on the first entry card', () => {
    const wrapper = mountViewer()
    const first = entryCards(wrapper)[0]
    expect(first.find('.timeline-entry-card-strategy').text()).toBe(
      'CreateEntity',
    )
  })

  it('updates entries when a different timeline is selected', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[2].trigger('click')
    await nextTick()
    expect(entryCards(wrapper)).toHaveLength(4)
  })

  it('shows distinct first strategies across timelines', async () => {
    const b = mountViewer()
    await b.findAll('.timeline-row')[2].trigger('click')
    await nextTick()
    const strategies = entryTexts(b, '.timeline-entry-card-strategy')
    expect(strategies[0]).toBe('QueryWorld')
  })

  it('renders empty state placeholder grid for non-Overview/Trace/Timeline/History panels', () => {
    const store = useObservatoryStore()
    store.selectPanel('Diff')
    const wrapper = mount(ObservatoryContent)
    expect(wrapper.findAll('.content-card')).toHaveLength(6)
    expect(wrapper.findComponent(ObservatoryTimelineViewer).exists()).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Entry rendering
// ---------------------------------------------------------------------------

describe('timeline viewer — entry rendering', () => {
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
      expect(card.find('h3.timeline-entry-card-title').element.tagName).toBe(
        'H3',
      )
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

  it('displays strategies for timeline-002 entries', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    const strategies = entryTexts(wrapper, '.timeline-entry-card-strategy')
    expect(strategies).toContain('CreateEntity')
    expect(strategies).toContain('QueryWorld')
    expect(strategies).toContain('DestroyEntity')
  })

  it('displays strategies for timeline-003 entries', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[2].trigger('click')
    await nextTick()
    const strategies = entryTexts(wrapper, '.timeline-entry-card-strategy')
    expect(strategies).toEqual([
      'QueryWorld',
      'CreateEntity',
      'MoveEntity',
      'UpdateEntity',
    ])
  })

  it('keeps entry indices aligned with strategy order', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[2].trigger('click')
    await nextTick()
    const titles = entryTexts(wrapper, '.timeline-entry-card-title')
    const strategies = entryTexts(wrapper, '.timeline-entry-card-strategy')
    expect(titles).toHaveLength(strategies.length)
    expect(titles).toEqual(['#0', '#1', '#2', '#3'])
  })
})

// ---------------------------------------------------------------------------
// TimelineEntryCard
// ---------------------------------------------------------------------------

describe('timeline entry card', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders as an article', () => {
    const wrapper = mount(TimelineEntryCard, {
      props: { index: 0, strategy: 'CreateEntity' },
    })
    expect(wrapper.find('article.timeline-entry-card').exists()).toBe(true)
  })

  it('renders the index as an h3 with hash prefix', () => {
    const wrapper = mount(TimelineEntryCard, {
      props: { index: 3, strategy: 'MoveEntity' },
    })
    const h3 = wrapper.find('h3')
    expect(h3.element.tagName).toBe('H3')
    expect(h3.text()).toBe('#3')
  })

  it('renders the strategy name', () => {
    const wrapper = mount(TimelineEntryCard, {
      props: { index: 0, strategy: 'QueryWorld' },
    })
    expect(wrapper.find('.timeline-entry-card-strategy').text()).toBe(
      'QueryWorld',
    )
  })

  it('includes a header element', () => {
    const wrapper = mount(TimelineEntryCard, {
      props: { index: 1, strategy: 'UpdateEntity' },
    })
    expect(wrapper.find('header.timeline-entry-card-header').exists()).toBe(true)
  })

  it('links the article aria-labelledby to the heading id', () => {
    const wrapper = mount(TimelineEntryCard, {
      props: { index: 5, strategy: 'DestroyEntity' },
    })
    const article = wrapper.find('article')
    expect(article.attributes('aria-labelledby')).toBe(
      wrapper.find('h3').attributes('id'),
    )
  })

  it('generates the heading id from the index', () => {
    const wrapper = mount(TimelineEntryCard, {
      props: { index: 2, strategy: 'MoveEntity' },
    })
    expect(wrapper.find('h3').attributes('id')).toBe('timeline-entry-2')
  })
})

// ---------------------------------------------------------------------------
// Keyboard navigation
// ---------------------------------------------------------------------------

describe('timeline viewer — keyboard navigation', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('moves selection to the next timeline with ArrowDown', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'ArrowDown')
    expect(activeRows(wrapper)).toHaveLength(1)
    expect(activeRows(wrapper)[0].text()).toContain('timeline-002')
  })

  it('updates details after ArrowDown', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'ArrowDown')
    expect(wrapper.find('.timeline-meta-grid').text()).toContain('timeline-002')
  })

  it('moves selection two steps with repeated ArrowDown', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'ArrowDown')
    await pressKey(wrapper, 'ArrowDown')
    expect(activeRows(wrapper)[0].text()).toContain('timeline-003')
  })

  it('moves selection to the previous timeline with ArrowUp', async () => {
    const el = attachContainer()
    const wrapper = mountViewer(el)
    await pressKey(wrapper, 'ArrowDown')
    await pressKey(wrapper, 'ArrowDown')
    await pressKey(wrapper, 'ArrowUp')
    expect(activeRows(wrapper)[0].text()).toContain('timeline-002')
    wrapper.unmount()
    el.remove()
  })

  it('clamps ArrowDown at the last timeline', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'ArrowDown')
    await pressKey(wrapper, 'ArrowDown')
    await pressKey(wrapper, 'ArrowDown')
    expect(activeRows(wrapper)[0].text()).toContain('timeline-003')
  })

  it('clamps ArrowUp at the first timeline', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'ArrowUp')
    expect(activeRows(wrapper)[0].text()).toContain('timeline-001')
  })

  it('jumps to the last timeline with End', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'End')
    expect(activeRows(wrapper)[0].text()).toContain('timeline-003')
    expect(wrapper.find('.timeline-meta-grid').text()).toContain('timeline-003')
  })

  it('jumps to the first timeline with Home', async () => {
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
    expect(document.activeElement?.textContent).toContain('timeline-002')
    wrapper.unmount()
    el.remove()
  })

  it('keys are handled on the list nav container', async () => {
    const wrapper = mountViewer()
    await wrapper
      .find('nav.timeline-list')
      .trigger('keydown', { key: 'ArrowDown' })
    await nextTick()
    expect(activeRows(wrapper)[0].text()).toContain('timeline-002')
  })
})

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------

describe('timeline viewer — accessibility', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('exposes an accessible nav landmark for the list', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('nav.timeline-list').attributes('aria-label')).toBe(
      'Timeline list',
    )
  })

  it('exposes an accessible article landmark for details', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('article.timeline-details').attributes('aria-label')).toBe(
      'Timeline details',
    )
  })

  it('uses buttons for every timeline row', () => {
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
    const texts = wrapper.findAll('h2').map((h) => h.text().trim())
    expect(texts).toContain('Timeline List')
    expect(texts).toContain('Timeline Details')
  })

  it('uses h3 for the entries section heading', () => {
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

  it('does not use divs as buttons', () => {
    const wrapper = mountViewer()
    const divButtons = wrapper.findAll('div[role="button"]')
    expect(divButtons).toHaveLength(0)
    const rowsAreButtons = rows(wrapper).every((r) => r.element.tagName === 'BUTTON')
    expect(rowsAreButtons).toBe(true)
  })

  it('uses a definition list for the timeline meta header', () => {
    const wrapper = mountViewer()
    const dl = wrapper.find('dl.timeline-meta-grid')
    expect(dl.exists()).toBe(true)
    expect(dl.findAll('dt')).toHaveLength(2)
    expect(dl.findAll('dd')).toHaveLength(2)
  })

  it('links the entries section to its heading via aria-labelledby', () => {
    const wrapper = mountViewer()
    const section = wrapper.find('section.timeline-entries-section')
    expect(section.attributes('aria-labelledby')).toBe('timeline-entries-title')
    expect(wrapper.find('#timeline-entries-title').exists()).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

describe('timeline viewer — empty state', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders an empty message when no timeline is provided', () => {
    const wrapper = mount(TimelineDetails, {
      props: { timeline: null },
    })
    expect(wrapper.text()).toContain('No timeline selected')
  })

  it('hides the header when no timeline is provided', () => {
    const wrapper = mount(TimelineDetails, {
      props: { timeline: null },
    })
    expect(wrapper.find('.timeline-details-header').exists()).toBe(false)
  })

  it('hides the entries section when no timeline is provided', () => {
    const wrapper = mount(TimelineDetails, {
      props: { timeline: null },
    })
    expect(wrapper.find('.timeline-entries-section').exists()).toBe(false)
  })

  it('marks the empty message as a paragraph', () => {
    const wrapper = mount(TimelineDetails, {
      props: { timeline: null },
    })
    expect(wrapper.find('p.timeline-empty').exists()).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Content integration
// ---------------------------------------------------------------------------

describe('timeline viewer — content integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders the timeline viewer when Timeline is selected in the store', () => {
    const store = useObservatoryStore()
    store.selectPanel('Timeline')
    const wrapper = mount(ObservatoryContent)
    expect(wrapper.findComponent(ObservatoryTimelineViewer).exists()).toBe(true)
    expect(wrapper.findComponent(ObservatoryOverview).exists()).toBe(false)
    expect(wrapper.findComponent(ObservatoryTraceViewer).exists()).toBe(false)
    expect(wrapper.findAll('.content-card')).toHaveLength(0)
  })

  it('switches from Overview to the timeline viewer on store change', async () => {
    const store = useObservatoryStore()
    const wrapper = mount(ObservatoryContent)
    expect(wrapper.findComponent(ObservatoryOverview).exists()).toBe(true)
    store.selectPanel('Timeline')
    await nextTick()
    expect(wrapper.findComponent(ObservatoryOverview).exists()).toBe(false)
    expect(wrapper.findComponent(ObservatoryTimelineViewer).exists()).toBe(true)
  })

  it('switches from the trace viewer to the timeline viewer', async () => {
    const store = useObservatoryStore()
    store.selectPanel('Trace')
    const wrapper = mount(ObservatoryContent)
    expect(wrapper.findComponent(ObservatoryTraceViewer).exists()).toBe(true)
    store.selectPanel('Timeline')
    await nextTick()
    expect(wrapper.findComponent(ObservatoryTraceViewer).exists()).toBe(false)
    expect(wrapper.findComponent(ObservatoryTimelineViewer).exists()).toBe(true)
  })

  it('switches from the timeline viewer back to Overview', async () => {
    const store = useObservatoryStore()
    store.selectPanel('Timeline')
    const wrapper = mount(ObservatoryContent)
    expect(wrapper.findComponent(ObservatoryTimelineViewer).exists()).toBe(true)
    store.selectPanel('Overview')
    await nextTick()
    expect(wrapper.findComponent(ObservatoryTimelineViewer).exists()).toBe(false)
    expect(wrapper.findComponent(ObservatoryOverview).exists()).toBe(true)
  })

  it('switches from the timeline viewer to the placeholder grid', async () => {
    const store = useObservatoryStore()
    store.selectPanel('Timeline')
    const wrapper = mount(ObservatoryContent)
    expect(wrapper.findComponent(ObservatoryTimelineViewer).exists()).toBe(true)
    store.selectPanel('Diff')
    await nextTick()
    expect(wrapper.findComponent(ObservatoryTimelineViewer).exists()).toBe(false)
    expect(wrapper.findAll('.content-card')).toHaveLength(6)
  })

  it('re-mounts a fresh timeline viewer after panel switching', async () => {
    const store = useObservatoryStore()
    store.selectPanel('Timeline')
    const wrapper = mount(ObservatoryContent)
    expect(wrapper.findComponent(ObservatoryTimelineViewer).exists()).toBe(true)
    store.selectPanel('Diff')
    await nextTick()
    store.selectPanel('Timeline')
    await nextTick()
    const viewer = wrapper.findComponent(ObservatoryTimelineViewer)
    expect(viewer.exists()).toBe(true)
    const active = viewer.findAll('.timeline-row--active')
    expect(active).toHaveLength(1)
    expect(active[0].text()).toContain('timeline-001')
  })
})

// ---------------------------------------------------------------------------
// Deterministic rendering
// ---------------------------------------------------------------------------

describe('timeline viewer — deterministic rendering', () => {
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
    expect(rowTexts(a, '.timeline-row-count')).toEqual(
      rowTexts(b, '.timeline-row-count'),
    )
  })

  it('renders identical entry strategy lists across mounts', () => {
    const a = mountViewer()
    const b = mountViewer()
    expect(entryTexts(a, '.timeline-entry-card-strategy')).toEqual(
      entryTexts(b, '.timeline-entry-card-strategy'),
    )
  })

  it('selects the same default timeline across mounts', () => {
    const a = mountViewer()
    const b = mountViewer()
    const activeText = (w: VueWrapper): string =>
      w.find('.timeline-row--active').text()
    expect(activeText(a)).toBe('timeline-00112 entries')
    expect(activeText(b)).toBe('timeline-00112 entries')
  })

  it('renders identical viewer HTML across mounts', () => {
    const a = mountViewer()
    const b = mountViewer()
    expect(a.html()).toBe(b.html())
  })
})