import { describe, it, expect, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

import ObservatoryHistoryViewer from '../components/observatory/history/ObservatoryHistoryViewer.vue'
import HistoryList from '../components/observatory/history/HistoryList.vue'
import HistoryDetails from '../components/observatory/history/HistoryDetails.vue'
import HistoryEntryCard from '../components/observatory/history/HistoryEntryCard.vue'
import ObservatoryContent from '../components/observatory/ObservatoryContent.vue'
import ObservatoryOverview from '../components/observatory/ObservatoryOverview.vue'
import ObservatoryTraceViewer from '../components/observatory/trace/ObservatoryTraceViewer.vue'
import ObservatoryTimelineViewer from '../components/observatory/timeline/ObservatoryTimelineViewer.vue'
import { useObservatoryStore } from '../stores/observatory'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mountViewer(attachTo?: HTMLElement): VueWrapper {
  return mount(ObservatoryHistoryViewer, attachTo ? { attachTo } : undefined)
}

function rows(wrapper: VueWrapper): ReturnType<VueWrapper['findAll']> {
  return wrapper.findAll('.history-row')
}

function rowTexts(wrapper: VueWrapper, selector: string): string[] {
  return wrapper.findAll(selector).map((el) => el.text().trim())
}

function activeRows(wrapper: VueWrapper): ReturnType<VueWrapper['findAll']> {
  return rows(wrapper).filter((r) => r.classes().includes('history-row--active'))
}

function entryCards(wrapper: VueWrapper): ReturnType<VueWrapper['findAll']> {
  return wrapper.findAll('.history-entry-card')
}

function entryTexts(wrapper: VueWrapper, selector: string): string[] {
  return wrapper.findAll(selector).map((el) => el.text().trim())
}

async function pressKey(wrapper: VueWrapper, key: string): Promise<void> {
  await wrapper.find('nav.history-list').trigger('keydown', { key })
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

describe('history viewer — rendering', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders the root viewer container', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('.observatory-history-viewer').exists()).toBe(true)
  })

  it('renders the HistoryList component', () => {
    const wrapper = mountViewer()
    expect(wrapper.findComponent(HistoryList).exists()).toBe(true)
  })

  it('renders the HistoryDetails component', () => {
    const wrapper = mountViewer()
    expect(wrapper.findComponent(HistoryDetails).exists()).toBe(true)
  })

  it('renders the list as a nav with aria-label "History list"', () => {
    const wrapper = mountViewer()
    const nav = wrapper.find('nav.history-list')
    expect(nav.exists()).toBe(true)
    expect(nav.attributes('aria-label')).toBe('History list')
  })

  it('renders the details as an article with aria-label "History details"', () => {
    const wrapper = mountViewer()
    const article = wrapper.find('article.history-details')
    expect(article.exists()).toBe(true)
    expect(article.attributes('aria-label')).toBe('History details')
  })

  it('renders the list heading "History List" as an h2', () => {
    const wrapper = mountViewer()
    const h2 = wrapper.find('.history-list-title')
    expect(h2.exists()).toBe(true)
    expect(h2.element.tagName).toBe('H2')
    expect(h2.text()).toBe('History List')
  })

  it('renders exactly 3 history rows', () => {
    const wrapper = mountViewer()
    expect(rows(wrapper)).toHaveLength(3)
  })

  it('renders history ids in order', () => {
    const wrapper = mountViewer()
    expect(rowTexts(wrapper, '.history-row-id')).toEqual([
      'history-001',
      'history-002',
      'history-003',
    ])
  })

  it('renders timestamps in order', () => {
    const wrapper = mountViewer()
    expect(rowTexts(wrapper, '.history-row-timestamp')).toEqual([
      '12:00:01',
      '12:05:00',
      '12:08:00',
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
    const items = wrapper.findAll('li.history-list-item')
    expect(items).toHaveLength(3)
    for (const item of items) {
      expect(item.find('button.history-row').exists()).toBe(true)
    }
  })

  it('renders the list as a ul', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('ul.history-list-items').exists()).toBe(true)
  })

  it('renders the details title "History Details" as an h2', () => {
    const wrapper = mountViewer()
    const h2 = wrapper.find('.history-details-title')
    expect(h2.exists()).toBe(true)
    expect(h2.element.tagName).toBe('H2')
    expect(h2.text()).toBe('History Details')
  })

  it('lays out the viewer as a two-column grid', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('.observatory-history-viewer').exists()).toBe(true)
    expect(wrapper.findComponent(HistoryList).exists()).toBe(true)
    expect(wrapper.findComponent(HistoryDetails).exists()).toBe(true)
  })

  it('renders the Prompt section heading', () => {
    const wrapper = mountViewer()
    const h3 = wrapper.find('.history-prompt-title')
    expect(h3.exists()).toBe(true)
    expect(h3.element.tagName).toBe('H3')
    expect(h3.text()).toBe('Prompt')
  })

  it('renders the Result section heading', () => {
    const wrapper = mountViewer()
    const h3 = wrapper.find('.history-result-title')
    expect(h3.exists()).toBe(true)
    expect(h3.element.tagName).toBe('H3')
    expect(h3.text()).toBe('Result')
  })

  it('renders the Evolution section heading', () => {
    const wrapper = mountViewer()
    const h3 = wrapper.find('.history-evolution-title')
    expect(h3.exists()).toBe(true)
    expect(h3.element.tagName).toBe('H3')
    expect(h3.text()).toBe('Evolution')
  })

  it('wraps sections in sections with aria-labelledby', () => {
    const wrapper = mountViewer()
    expect(
      wrapper.find('section.history-prompt-section').attributes('aria-labelledby'),
    ).toBe('history-prompt-title')
    expect(
      wrapper.find('section.history-result-section').attributes('aria-labelledby'),
    ).toBe('history-result-title')
    expect(
      wrapper
        .find('section.history-evolution-section')
        .attributes('aria-labelledby'),
    ).toBe('history-evolution-title')
  })

  it('renders sections in Prompt, Result, Evolution order', () => {
    const wrapper = mountViewer()
    const sections = wrapper
      .findAll('section')
      .map((s) => s.attributes('aria-labelledby'))
    expect(sections).toEqual([
      'history-prompt-title',
      'history-result-title',
      'history-evolution-title',
    ])
  })
})

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

describe('history viewer — mock data', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('displays 3 mock history entries', () => {
    const wrapper = mountViewer()
    expect(rows(wrapper)).toHaveLength(3)
  })

  it('mock ids follow the history-NNN pattern', () => {
    const wrapper = mountViewer()
    const ids = rowTexts(wrapper, '.history-row-id')
    for (const id of ids) {
      expect(id).toMatch(/^history-\d{3}$/)
    }
  })

  it('mock timestamps are clock strings', () => {
    const wrapper = mountViewer()
    const timestamps = rowTexts(wrapper, '.history-row-timestamp')
    for (const ts of timestamps) {
      expect(ts).toMatch(/^\d{2}:\d{2}:\d{2}$/)
    }
  })

  it('default history prompt is "Create Village"', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('.history-prompt-block').text()).toBe('Create Village')
  })

  it('default history result is "11 entities"', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('.history-result-text').text()).toBe('11 entities')
  })

  it('default evolution list contains Tavern, Villager, Tree', () => {
    const wrapper = mountViewer()
    expect(entryTexts(wrapper, '.history-entry-card-name')).toEqual([
      'Tavern',
      'Villager',
      'Tree',
    ])
  })
})

// ---------------------------------------------------------------------------
// Default selection / active state
// ---------------------------------------------------------------------------

describe('history viewer — default selection and active state', () => {
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

  it('sets aria-current=true on the active row', () => {
    const wrapper = mountViewer()
    expect(rows(wrapper)[0].attributes('aria-current')).toBe('true')
  })

  it('leaves aria-current unset on inactive rows', () => {
    const wrapper = mountViewer()
    expect(rows(wrapper)[1].attributes('aria-current')).toBeUndefined()
    expect(rows(wrapper)[2].attributes('aria-current')).toBeUndefined()
  })

  it('shows the first history id in the details header by default', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('.history-meta-grid').text()).toContain('history-001')
  })

  it('shows the first timestamp in the details header by default', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('.history-meta-grid').text()).toContain('12:00:01')
  })

  it('labels the meta fields with dt elements', () => {
    const wrapper = mountViewer()
    const labels = wrapper
      .findAll('.history-meta-label')
      .map((el) => el.text().trim())
    expect(labels).toEqual(['History ID', 'Timestamp'])
  })

  it('uses a definition list for the history meta header', () => {
    const wrapper = mountViewer()
    const dl = wrapper.find('dl.history-meta-grid')
    expect(dl.exists()).toBe(true)
    expect(dl.findAll('dt')).toHaveLength(2)
    expect(dl.findAll('dd')).toHaveLength(2)
  })
})

// ---------------------------------------------------------------------------
// Selection — clicking
// ---------------------------------------------------------------------------

describe('history viewer — selection by click', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('selects history-002 on click and updates details id', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    expect(wrapper.find('.history-meta-grid').text()).toContain('history-002')
  })

  it('selects history-002 on click and updates timestamp', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    expect(wrapper.find('.history-meta-grid').text()).toContain('12:05:00')
  })

  it('moves the active class to the clicked row', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[2].trigger('click')
    await nextTick()
    expect(activeRows(wrapper)).toHaveLength(1)
    expect(activeRows(wrapper)[0].text()).toContain('history-003')
  })

  it('moves aria-current to the clicked row', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    expect(rows(wrapper)[1].attributes('aria-current')).toBe('true')
    expect(rows(wrapper)[0].attributes('aria-current')).toBeUndefined()
  })

  it('selects history-003 on click and shows its prompt', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[2].trigger('click')
    await nextTick()
    expect(wrapper.find('.history-prompt-block').text()).toBe('Add Guards')
  })

  it('switches back to history-001 when clicked again', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    await rows(wrapper)[0].trigger('click')
    await nextTick()
    expect(wrapper.find('.history-meta-grid').text()).toContain('history-001')
    expect(activeRows(wrapper)).toHaveLength(1)
    expect(activeRows(wrapper)[0].text()).toContain('history-001')
  })

  it('clicking the active row keeps the selection', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[0].trigger('click')
    await nextTick()
    expect(activeRows(wrapper)).toHaveLength(1)
    expect(wrapper.find('.history-meta-grid').text()).toContain('history-001')
  })
})

// ---------------------------------------------------------------------------
// Details rendering
// ---------------------------------------------------------------------------

describe('history viewer — details rendering', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders the Prompt section for the default entry', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('section.history-prompt-section').exists()).toBe(true)
  })

  it('renders the prompt as a pre block', () => {
    const wrapper = mountViewer()
    const pre = wrapper.find('pre.history-prompt-block')
    expect(pre.exists()).toBe(true)
    expect(pre.text()).toBe('Create Village')
  })

  it('makes the prompt pre block keyboard reachable', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('pre.history-prompt-block').attributes('tabindex')).toBe(
      '0',
    )
  })

  it('renders the Result section for the default entry', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('section.history-result-section').exists()).toBe(true)
  })

  it('renders the result as a paragraph', () => {
    const wrapper = mountViewer()
    const p = wrapper.find('p.history-result-text')
    expect(p.element.tagName).toBe('P')
    expect(p.text()).toBe('11 entities')
  })

  it('renders the Evolution section for the default entry', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('section.history-evolution-section').exists()).toBe(true)
  })

  it('renders an entry card for each evolution item', () => {
    const wrapper = mountViewer()
    expect(entryCards(wrapper)).toHaveLength(3)
  })

  it('renders evolution cards inside list items', () => {
    const wrapper = mountViewer()
    const items = wrapper.findAll('li.history-evolution-item')
    expect(items).toHaveLength(3)
    for (const item of items) {
      expect(item.find('.history-entry-card').exists()).toBe(true)
    }
  })

  it('renders evolution as a ul', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('ul.history-evolution-list').exists()).toBe(true)
  })

  it('updates all sections when a different entry is selected', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    expect(wrapper.find('.history-prompt-block').text()).toBe('Add Farm')
    expect(wrapper.find('.history-result-text').text()).toBe('5 farms added')
    expect(entryTexts(wrapper, '.history-entry-card-name')).toEqual([
      'Farm',
      'Crop',
      'Well',
    ])
  })

  it('shows distinct evolution lists across entries', async () => {
    const b = mountViewer()
    await b.findAll('.history-row')[2].trigger('click')
    await nextTick()
    expect(entryTexts(b, '.history-entry-card-name')).toEqual([
      'Guard',
      'Barracks',
    ])
  })
})

// ---------------------------------------------------------------------------
// Entry rendering
// ---------------------------------------------------------------------------

describe('history viewer — entry rendering', () => {
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

  it('renders an h3 inside each evolution card', () => {
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

  it('shows the add marker on each evolution card', () => {
    const wrapper = mountViewer()
    const markers = entryTexts(wrapper, '.history-entry-card-marker')
    expect(markers).toEqual(['+', '+', '+'])
  })

  it('displays evolution names for history-002', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    const names = entryTexts(wrapper, '.history-entry-card-name')
    expect(names).toContain('Farm')
    expect(names).toContain('Crop')
    expect(names).toContain('Well')
  })

  it('keeps evolution markers aligned with names', async () => {
    const wrapper = mountViewer()
    const markers = entryTexts(wrapper, '.history-entry-card-marker')
    const names = entryTexts(wrapper, '.history-entry-card-name')
    expect(markers).toHaveLength(names.length)
  })
})

// ---------------------------------------------------------------------------
// HistoryEntryCard
// ---------------------------------------------------------------------------

describe('history entry card', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders as an article', () => {
    const wrapper = mount(HistoryEntryCard, {
      props: { name: 'Tavern' },
    })
    expect(wrapper.find('article.history-entry-card').exists()).toBe(true)
  })

  it('renders the name as an h3', () => {
    const wrapper = mount(HistoryEntryCard, {
      props: { name: 'Villager' },
    })
    const h3 = wrapper.find('h3')
    expect(h3.element.tagName).toBe('H3')
    expect(h3.text()).toBe('Villager')
  })

  it('renders the add marker', () => {
    const wrapper = mount(HistoryEntryCard, {
      props: { name: 'Tree' },
    })
    expect(wrapper.find('.history-entry-card-marker').text()).toBe('+')
  })

  it('includes a header element', () => {
    const wrapper = mount(HistoryEntryCard, {
      props: { name: 'Guard' },
    })
    expect(wrapper.find('header.history-entry-card-header').exists()).toBe(true)
  })

  it('links the article aria-labelledby to the heading id', () => {
    const wrapper = mount(HistoryEntryCard, {
      props: { name: 'Barracks' },
    })
    const article = wrapper.find('article')
    expect(article.attributes('aria-labelledby')).toBe(
      wrapper.find('h3').attributes('id'),
    )
  })

  it('generates the heading id from the name', () => {
    const wrapper = mount(HistoryEntryCard, {
      props: { name: 'Tavern' },
    })
    expect(wrapper.find('h3').attributes('id')).toBe('history-entry-tavern')
  })
})

// ---------------------------------------------------------------------------
// Keyboard navigation
// ---------------------------------------------------------------------------

describe('history viewer — keyboard navigation', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('moves selection to the next entry with ArrowDown', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'ArrowDown')
    expect(activeRows(wrapper)).toHaveLength(1)
    expect(activeRows(wrapper)[0].text()).toContain('history-002')
  })

  it('updates details after ArrowDown', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'ArrowDown')
    expect(wrapper.find('.history-meta-grid').text()).toContain('history-002')
  })

  it('moves selection two steps with repeated ArrowDown', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'ArrowDown')
    await pressKey(wrapper, 'ArrowDown')
    expect(activeRows(wrapper)[0].text()).toContain('history-003')
  })

  it('moves selection to the previous entry with ArrowUp', async () => {
    const el = attachContainer()
    const wrapper = mountViewer(el)
    await pressKey(wrapper, 'ArrowDown')
    await pressKey(wrapper, 'ArrowDown')
    await pressKey(wrapper, 'ArrowUp')
    expect(activeRows(wrapper)[0].text()).toContain('history-002')
    wrapper.unmount()
    el.remove()
  })

  it('clamps ArrowDown at the last entry', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'ArrowDown')
    await pressKey(wrapper, 'ArrowDown')
    await pressKey(wrapper, 'ArrowDown')
    expect(activeRows(wrapper)[0].text()).toContain('history-003')
  })

  it('clamps ArrowUp at the first entry', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'ArrowUp')
    expect(activeRows(wrapper)[0].text()).toContain('history-001')
  })

  it('jumps to the last entry with End', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'End')
    expect(activeRows(wrapper)[0].text()).toContain('history-003')
    expect(wrapper.find('.history-meta-grid').text()).toContain('history-003')
  })

  it('jumps to the first entry with Home', async () => {
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
    expect(document.activeElement?.textContent).toContain('history-002')
    wrapper.unmount()
    el.remove()
  })

  it('keys are handled on the list nav container', async () => {
    const wrapper = mountViewer()
    await wrapper
      .find('nav.history-list')
      .trigger('keydown', { key: 'ArrowDown' })
    await nextTick()
    expect(activeRows(wrapper)[0].text()).toContain('history-002')
  })
})

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------

describe('history viewer — accessibility', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('exposes an accessible nav landmark for the list', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('nav.history-list').attributes('aria-label')).toBe(
      'History list',
    )
  })

  it('exposes an accessible article landmark for details', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('article.history-details').attributes('aria-label')).toBe(
      'History details',
    )
  })

  it('uses buttons for every history row', () => {
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
    expect(texts).toContain('History List')
    expect(texts).toContain('History Details')
  })

  it('uses h3 for the Prompt, Result, and Evolution headings', () => {
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

  it('does not use divs as buttons', () => {
    const wrapper = mountViewer()
    const divButtons = wrapper.findAll('div[role="button"]')
    expect(divButtons).toHaveLength(0)
    const rowsAreButtons = rows(wrapper).every(
      (r) => r.element.tagName === 'BUTTON',
    )
    expect(rowsAreButtons).toBe(true)
  })

  it('uses a definition list for the history meta header', () => {
    const wrapper = mountViewer()
    const dl = wrapper.find('dl.history-meta-grid')
    expect(dl.exists()).toBe(true)
    expect(dl.findAll('dt')).toHaveLength(2)
    expect(dl.findAll('dd')).toHaveLength(2)
  })

  it('links sections to their headings via aria-labelledby', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('#history-prompt-title').exists()).toBe(true)
    expect(wrapper.find('#history-result-title').exists()).toBe(true)
    expect(wrapper.find('#history-evolution-title').exists()).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

describe('history viewer — empty state', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders an empty message when no entry is provided', () => {
    const wrapper = mount(HistoryDetails, {
      props: { entry: null },
    })
    expect(wrapper.text()).toContain('No history entry selected')
  })

  it('hides the header when no entry is provided', () => {
    const wrapper = mount(HistoryDetails, {
      props: { entry: null },
    })
    expect(wrapper.find('.history-details-header').exists()).toBe(false)
  })

  it('hides the sections when no entry is provided', () => {
    const wrapper = mount(HistoryDetails, {
      props: { entry: null },
    })
    expect(wrapper.find('section').exists()).toBe(false)
  })

  it('marks the empty message as a paragraph', () => {
    const wrapper = mount(HistoryDetails, {
      props: { entry: null },
    })
    expect(wrapper.find('p.history-empty').exists()).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Content integration
// ---------------------------------------------------------------------------

describe('history viewer — content integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders the history viewer when History is selected in the store', () => {
    const store = useObservatoryStore()
    store.selectPanel('History')
    const wrapper = mount(ObservatoryContent)
    expect(wrapper.findComponent(ObservatoryHistoryViewer).exists()).toBe(true)
    expect(wrapper.findComponent(ObservatoryOverview).exists()).toBe(false)
    expect(wrapper.findComponent(ObservatoryTraceViewer).exists()).toBe(false)
    expect(wrapper.findComponent(ObservatoryTimelineViewer).exists()).toBe(false)
    expect(wrapper.findAll('.content-card')).toHaveLength(0)
  })

  it('switches from Overview to the history viewer on store change', async () => {
    const store = useObservatoryStore()
    const wrapper = mount(ObservatoryContent)
    expect(wrapper.findComponent(ObservatoryOverview).exists()).toBe(true)
    store.selectPanel('History')
    await nextTick()
    expect(wrapper.findComponent(ObservatoryOverview).exists()).toBe(false)
    expect(wrapper.findComponent(ObservatoryHistoryViewer).exists()).toBe(true)
  })

  it('switches from the timeline viewer to the history viewer', async () => {
    const store = useObservatoryStore()
    store.selectPanel('Timeline')
    const wrapper = mount(ObservatoryContent)
    expect(wrapper.findComponent(ObservatoryTimelineViewer).exists()).toBe(true)
    store.selectPanel('History')
    await nextTick()
    expect(wrapper.findComponent(ObservatoryTimelineViewer).exists()).toBe(false)
    expect(wrapper.findComponent(ObservatoryHistoryViewer).exists()).toBe(true)
  })

  it('switches from the trace viewer to the history viewer', async () => {
    const store = useObservatoryStore()
    store.selectPanel('Trace')
    const wrapper = mount(ObservatoryContent)
    expect(wrapper.findComponent(ObservatoryTraceViewer).exists()).toBe(true)
    store.selectPanel('History')
    await nextTick()
    expect(wrapper.findComponent(ObservatoryTraceViewer).exists()).toBe(false)
    expect(wrapper.findComponent(ObservatoryHistoryViewer).exists()).toBe(true)
  })

  it('switches from the history viewer back to Overview', async () => {
    const store = useObservatoryStore()
    store.selectPanel('History')
    const wrapper = mount(ObservatoryContent)
    expect(wrapper.findComponent(ObservatoryHistoryViewer).exists()).toBe(true)
    store.selectPanel('Overview')
    await nextTick()
    expect(wrapper.findComponent(ObservatoryHistoryViewer).exists()).toBe(false)
    expect(wrapper.findComponent(ObservatoryOverview).exists()).toBe(true)
  })

  it('switches from the history viewer to the placeholder grid', async () => {
    const store = useObservatoryStore()
    store.selectPanel('History')
    const wrapper = mount(ObservatoryContent)
    expect(wrapper.findComponent(ObservatoryHistoryViewer).exists()).toBe(true)
    store.selectPanel('Runtime')
    await nextTick()
    expect(wrapper.findComponent(ObservatoryHistoryViewer).exists()).toBe(false)
    expect(wrapper.findAll('.content-card')).toHaveLength(6)
  })

  it('re-mounts a fresh history viewer after panel switching', async () => {
    const store = useObservatoryStore()
    store.selectPanel('History')
    const wrapper = mount(ObservatoryContent)
    expect(wrapper.findComponent(ObservatoryHistoryViewer).exists()).toBe(true)
    store.selectPanel('Runtime')
    await nextTick()
    store.selectPanel('History')
    await nextTick()
    const viewer = wrapper.findComponent(ObservatoryHistoryViewer)
    expect(viewer.exists()).toBe(true)
    const active = viewer.findAll('.history-row--active')
    expect(active).toHaveLength(1)
    expect(active[0].text()).toContain('history-001')
  })
})

// ---------------------------------------------------------------------------
// Deterministic rendering
// ---------------------------------------------------------------------------

describe('history viewer — deterministic rendering', () => {
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
    expect(rowTexts(a, '.history-row-timestamp')).toEqual(
      rowTexts(b, '.history-row-timestamp'),
    )
  })

  it('renders identical evolution lists across mounts', () => {
    const a = mountViewer()
    const b = mountViewer()
    expect(entryTexts(a, '.history-entry-card-name')).toEqual(
      entryTexts(b, '.history-entry-card-name'),
    )
  })

  it('selects the same default entry across mounts', () => {
    const a = mountViewer()
    const b = mountViewer()
    const activeText = (w: VueWrapper): string =>
      w.find('.history-row--active').text()
    expect(activeText(a)).toBe('history-00112:00:01')
    expect(activeText(b)).toBe('history-00112:00:01')
  })

  it('renders identical viewer HTML across mounts', () => {
    const a = mountViewer()
    const b = mountViewer()
    expect(a.html()).toBe(b.html())
  })
})