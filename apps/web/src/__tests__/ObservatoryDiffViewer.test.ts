import { describe, it, expect, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

import ObservatoryDiffViewer from '../components/observatory/diff/ObservatoryDiffViewer.vue'
import DiffList from '../components/observatory/diff/DiffList.vue'
import DiffDetails, { type DiffEntry } from '../components/observatory/diff/DiffDetails.vue'
import DiffChangeCard from '../components/observatory/diff/DiffChangeCard.vue'
import ObservatoryContent from '../components/observatory/ObservatoryContent.vue'
import ObservatoryOverview from '../components/observatory/ObservatoryOverview.vue'
import ObservatoryTraceViewer from '../components/observatory/trace/ObservatoryTraceViewer.vue'
import ObservatoryTimelineViewer from '../components/observatory/timeline/ObservatoryTimelineViewer.vue'
import ObservatoryHistoryViewer from '../components/observatory/history/ObservatoryHistoryViewer.vue'
import { useObservatoryStore } from '../stores/observatory'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mountViewer(attachTo?: HTMLElement): VueWrapper {
  return mount(ObservatoryDiffViewer, attachTo ? { attachTo } : undefined)
}

function rows(wrapper: VueWrapper): ReturnType<VueWrapper['findAll']> {
  return wrapper.findAll('.diff-row')
}

function rowTexts(wrapper: VueWrapper, selector: string): string[] {
  return wrapper.findAll(selector).map((el) => el.text().trim())
}

function activeRows(wrapper: VueWrapper): ReturnType<VueWrapper['findAll']> {
  return rows(wrapper).filter((r) => r.classes().includes('diff-row--active'))
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

function attachContainer(): HTMLElement {
  const el = document.createElement('div')
  document.body.appendChild(el)
  return el
}

function emptyListEntry(): DiffEntry {
  return {
    id: 'diff-empty',
    timestamp: '00:00:00',
    added: [],
    removed: [],
    changed: [],
  }
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('diff viewer — rendering', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders the root viewer container', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('.observatory-diff-viewer').exists()).toBe(true)
  })

  it('renders the DiffList component', () => {
    const wrapper = mountViewer()
    expect(wrapper.findComponent(DiffList).exists()).toBe(true)
  })

  it('renders the DiffDetails component', () => {
    const wrapper = mountViewer()
    expect(wrapper.findComponent(DiffDetails).exists()).toBe(true)
  })

  it('renders the list as a nav with aria-label "Diff list"', () => {
    const wrapper = mountViewer()
    const nav = wrapper.find('nav.diff-list')
    expect(nav.exists()).toBe(true)
    expect(nav.attributes('aria-label')).toBe('Diff list')
  })

  it('renders the details as an article with aria-label "Diff details"', () => {
    const wrapper = mountViewer()
    const article = wrapper.find('article.diff-details')
    expect(article.exists()).toBe(true)
    expect(article.attributes('aria-label')).toBe('Diff details')
  })

  it('renders the list heading "Diff List" as an h2', () => {
    const wrapper = mountViewer()
    const h2 = wrapper.find('.diff-list-title')
    expect(h2.exists()).toBe(true)
    expect(h2.element.tagName).toBe('H2')
    expect(h2.text()).toBe('Diff List')
  })

  it('renders exactly 3 diff rows', () => {
    const wrapper = mountViewer()
    expect(rows(wrapper)).toHaveLength(3)
  })

  it('renders diff ids in order', () => {
    const wrapper = mountViewer()
    expect(rowTexts(wrapper, '.diff-row-id')).toEqual([
      'diff-001',
      'diff-002',
      'diff-003',
    ])
  })

  it('renders timestamps in order', () => {
    const wrapper = mountViewer()
    expect(rowTexts(wrapper, '.diff-row-timestamp')).toEqual([
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
    const items = wrapper.findAll('li.diff-list-item')
    expect(items).toHaveLength(3)
    for (const item of items) {
      expect(item.find('button.diff-row').exists()).toBe(true)
    }
  })

  it('renders the list as a ul', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('ul.diff-list-items').exists()).toBe(true)
  })

  it('renders the details title "Diff Details" as an h2', () => {
    const wrapper = mountViewer()
    const h2 = wrapper.find('.diff-details-title')
    expect(h2.exists()).toBe(true)
    expect(h2.element.tagName).toBe('H2')
    expect(h2.text()).toBe('Diff Details')
  })

  it('lays out the viewer as a two-column grid', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('.observatory-diff-viewer').exists()).toBe(true)
    expect(wrapper.findComponent(DiffList).exists()).toBe(true)
    expect(wrapper.findComponent(DiffDetails).exists()).toBe(true)
  })

  it('renders the Added section heading', () => {
    const wrapper = mountViewer()
    const h3 = wrapper.find('.diff-added-title')
    expect(h3.exists()).toBe(true)
    expect(h3.element.tagName).toBe('H3')
    expect(h3.text()).toBe('Added')
  })

  it('renders the Removed section heading', () => {
    const wrapper = mountViewer()
    const h3 = wrapper.find('.diff-removed-title')
    expect(h3.exists()).toBe(true)
    expect(h3.element.tagName).toBe('H3')
    expect(h3.text()).toBe('Removed')
  })

  it('renders the Changed section heading', () => {
    const wrapper = mountViewer()
    const h3 = wrapper.find('.diff-changed-title')
    expect(h3.exists()).toBe(true)
    expect(h3.element.tagName).toBe('H3')
    expect(h3.text()).toBe('Changed')
  })

  it('wraps sections in sections with aria-labelledby', () => {
    const wrapper = mountViewer()
    expect(
      wrapper.find('section.diff-added-section').attributes('aria-labelledby'),
    ).toBe('diff-added-title')
    expect(
      wrapper.find('section.diff-removed-section').attributes('aria-labelledby'),
    ).toBe('diff-removed-title')
    expect(
      wrapper
        .find('section.diff-changed-section')
        .attributes('aria-labelledby'),
    ).toBe('diff-changed-title')
  })

  it('renders sections in Added, Removed, Changed order', () => {
    const wrapper = mountViewer()
    const sections = wrapper
      .findAll('section')
      .map((s) => s.attributes('aria-labelledby'))
    expect(sections).toEqual([
      'diff-added-title',
      'diff-removed-title',
      'diff-changed-title',
    ])
  })
})

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

describe('diff viewer — mock data', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('displays 3 mock diffs', () => {
    const wrapper = mountViewer()
    expect(rows(wrapper)).toHaveLength(3)
  })

  it('mock ids follow the diff-NNN pattern', () => {
    const wrapper = mountViewer()
    const ids = rowTexts(wrapper, '.diff-row-id')
    for (const id of ids) {
      expect(id).toMatch(/^diff-\d{3}$/)
    }
  })

  it('mock timestamps are clock strings', () => {
    const wrapper = mountViewer()
    const timestamps = rowTexts(wrapper, '.diff-row-timestamp')
    for (const ts of timestamps) {
      expect(ts).toMatch(/^\d{2}:\d{2}:\d{2}$/)
    }
  })

  it('default diff added list contains Tavern, Villager-1, Villager-2', () => {
    const wrapper = mountViewer()
    expect(changeTexts(wrapper, '.diff-added-item .diff-change-card-name')).toEqual(
      ['Tavern', 'Villager-1', 'Villager-2'],
    )
  })

  it('default diff removed list is empty', () => {
    const wrapper = mountViewer()
    expect(wrapper.findAll('.diff-removed-item .diff-change-card')).toHaveLength(0)
  })

  it('default diff changed list contains VillageCenter', () => {
    const wrapper = mountViewer()
    expect(
      changeTexts(wrapper, '.diff-changed-item .diff-change-card-name'),
    ).toEqual(['VillageCenter'])
  })

  it('diff-003 removed list contains OldRoad', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[2].trigger('click')
    await nextTick()
    expect(
      changeTexts(wrapper, '.diff-removed-item .diff-change-card-name'),
    ).toEqual(['OldRoad'])
  })
})

// ---------------------------------------------------------------------------
// Default selection / active state
// ---------------------------------------------------------------------------

describe('diff viewer — default selection and active state', () => {
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

  it('sets aria-current=true on the active row', () => {
    const wrapper = mountViewer()
    expect(rows(wrapper)[0].attributes('aria-current')).toBe('true')
  })

  it('leaves aria-current unset on inactive rows', () => {
    const wrapper = mountViewer()
    expect(rows(wrapper)[1].attributes('aria-current')).toBeUndefined()
    expect(rows(wrapper)[2].attributes('aria-current')).toBeUndefined()
  })

  it('shows the first diff id in the details header by default', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('.diff-meta-grid').text()).toContain('diff-001')
  })

  it('shows the first timestamp in the details header by default', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('.diff-meta-grid').text()).toContain('12:00:01')
  })

  it('labels the meta fields with dt elements', () => {
    const wrapper = mountViewer()
    const labels = wrapper
      .findAll('.diff-meta-label')
      .map((el) => el.text().trim())
    expect(labels).toEqual(['Diff ID', 'Timestamp'])
  })

  it('uses a definition list for the diff meta header', () => {
    const wrapper = mountViewer()
    const dl = wrapper.find('dl.diff-meta-grid')
    expect(dl.exists()).toBe(true)
    expect(dl.findAll('dt')).toHaveLength(2)
    expect(dl.findAll('dd')).toHaveLength(2)
  })
})

// ---------------------------------------------------------------------------
// Selection — clicking
// ---------------------------------------------------------------------------

describe('diff viewer — selection by click', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('selects diff-002 on click and updates details id', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    expect(wrapper.find('.diff-meta-grid').text()).toContain('diff-002')
  })

  it('selects diff-002 on click and updates timestamp', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    expect(wrapper.find('.diff-meta-grid').text()).toContain('12:05:00')
  })

  it('moves the active class to the clicked row', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[2].trigger('click')
    await nextTick()
    expect(activeRows(wrapper)).toHaveLength(1)
    expect(activeRows(wrapper)[0].text()).toContain('diff-003')
  })

  it('moves aria-current to the clicked row', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    expect(rows(wrapper)[1].attributes('aria-current')).toBe('true')
    expect(rows(wrapper)[0].attributes('aria-current')).toBeUndefined()
  })

  it('selects diff-003 on click and shows its changed list', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[2].trigger('click')
    await nextTick()
    expect(
      changeTexts(wrapper, '.diff-changed-item .diff-change-card-name'),
    ).toEqual(['VillageGate'])
  })

  it('switches back to diff-001 when clicked again', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    await rows(wrapper)[0].trigger('click')
    await nextTick()
    expect(wrapper.find('.diff-meta-grid').text()).toContain('diff-001')
    expect(activeRows(wrapper)).toHaveLength(1)
    expect(activeRows(wrapper)[0].text()).toContain('diff-001')
  })

  it('clicking the active row keeps the selection', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[0].trigger('click')
    await nextTick()
    expect(activeRows(wrapper)).toHaveLength(1)
    expect(wrapper.find('.diff-meta-grid').text()).toContain('diff-001')
  })
})

// ---------------------------------------------------------------------------
// Added rendering
// ---------------------------------------------------------------------------

describe('diff viewer — added rendering', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders the Added section for the default diff', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('section.diff-added-section').exists()).toBe(true)
  })

  it('renders a change card for each added item', () => {
    const wrapper = mountViewer()
    expect(wrapper.findAll('.diff-added-item .diff-change-card')).toHaveLength(3)
  })

  it('renders added cards inside list items', () => {
    const wrapper = mountViewer()
    const items = wrapper.findAll('li.diff-added-item')
    expect(items).toHaveLength(3)
    for (const item of items) {
      expect(item.find('.diff-change-card').exists()).toBe(true)
    }
  })

  it('renders added items as a ul', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('ul.diff-added-list').exists()).toBe(true)
  })

  it('labels added cards with the added modifier class', () => {
    const wrapper = mountViewer()
    for (const card of wrapper.findAll('.diff-added-item .diff-change-card')) {
      expect(card.classes()).toContain('diff-change-card--added')
    }
  })

  it('shows the add marker on added cards', () => {
    const wrapper = mountViewer()
    const markers = changeTexts(wrapper, '.diff-added-item .diff-change-card-marker')
    expect(markers).toEqual(['+', '+', '+'])
  })

  it('updates the added list per diff', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    expect(
      changeTexts(wrapper, '.diff-added-item .diff-change-card-name'),
    ).toEqual(['Farm-1', 'Farm-2'])
  })
})

// ---------------------------------------------------------------------------
// Removed rendering
// ---------------------------------------------------------------------------

describe('diff viewer — removed rendering', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders the Removed section for the default diff', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('section.diff-removed-section').exists()).toBe(true)
  })

  it('shows an empty message when nothing was removed', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('section.diff-removed-section').text()).toContain(
      'No removals',
    )
  })

  it('shows no removed cards for the default diff', () => {
    const wrapper = mountViewer()
    expect(wrapper.findAll('.diff-removed-item .diff-change-card')).toHaveLength(0)
  })

  it('shows removed cards for diff-003', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[2].trigger('click')
    await nextTick()
    expect(wrapper.findAll('.diff-removed-item .diff-change-card')).toHaveLength(1)
    expect(
      changeTexts(wrapper, '.diff-removed-item .diff-change-card-name'),
    ).toEqual(['OldRoad'])
  })

  it('labels removed cards with the removed modifier class', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[2].trigger('click')
    await nextTick()
    const card = wrapper.find('.diff-removed-item .diff-change-card')
    expect(card.classes()).toContain('diff-change-card--removed')
  })

  it('shows the minus marker on removed cards', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[2].trigger('click')
    await nextTick()
    const markers = changeTexts(wrapper, '.diff-removed-item .diff-change-card-marker')
    expect(markers).toEqual(['-'])
  })
})

// ---------------------------------------------------------------------------
// Changed rendering
// ---------------------------------------------------------------------------

describe('diff viewer — changed rendering', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders the Changed section for the default diff', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('section.diff-changed-section').exists()).toBe(true)
  })

  it('shows the changed item for the default diff', () => {
    const wrapper = mountViewer()
    expect(
      changeTexts(wrapper, '.diff-changed-item .diff-change-card-name'),
    ).toEqual(['VillageCenter'])
  })

  it('shows an empty message when nothing changed', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    expect(wrapper.find('section.diff-changed-section').text()).toContain(
      'No changes',
    )
  })

  it('shows the changed list for diff-003', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[2].trigger('click')
    await nextTick()
    expect(
      changeTexts(wrapper, '.diff-changed-item .diff-change-card-name'),
    ).toEqual(['VillageGate'])
  })

  it('labels changed cards with the changed modifier class', async () => {
    const wrapper = mountViewer()
    const card = wrapper.find('.diff-changed-item .diff-change-card')
    expect(card.classes()).toContain('diff-change-card--changed')
  })

  it('shows the bullet marker on changed cards', () => {
    const wrapper = mountViewer()
    const markers = changeTexts(wrapper, '.diff-changed-item .diff-change-card-marker')
    expect(markers).toEqual(['•'])
  })
})

// ---------------------------------------------------------------------------
// Change card structure
// ---------------------------------------------------------------------------

describe('diff viewer — change card structure', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders each change card as an article', () => {
    const wrapper = mountViewer()
    for (const card of changeCards(wrapper)) {
      expect(card.element.tagName).toBe('ARTICLE')
    }
  })

  it('renders a header inside each change card', () => {
    const wrapper = mountViewer()
    for (const card of changeCards(wrapper)) {
      expect(card.find('header.diff-change-card-header').exists()).toBe(true)
    }
  })

  it('renders an h3 inside each change card', () => {
    const wrapper = mountViewer()
    for (const card of changeCards(wrapper)) {
      expect(card.find('h3.diff-change-card-name').element.tagName).toBe('H3')
    }
  })

  it('links each article aria-labelledby to its h3 id', () => {
    const wrapper = mountViewer()
    for (const card of changeCards(wrapper)) {
      const labelledby = card.attributes('aria-labelledby')
      expect(labelledby).toBeDefined()
      expect(card.find('h3').attributes('id')).toBe(labelledby)
    }
  })

  it('keeps marker counts aligned with card counts', () => {
    const wrapper = mountViewer()
    expect(changeTexts(wrapper, '.diff-change-card-marker')).toHaveLength(
      changeCards(wrapper).length,
    )
  })
})

// ---------------------------------------------------------------------------
// DiffChangeCard
// ---------------------------------------------------------------------------

describe('diff change card', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders as an article', () => {
    const wrapper = mount(DiffChangeCard, {
      props: { kind: 'added', name: 'Tavern' },
    })
    expect(wrapper.find('article.diff-change-card').exists()).toBe(true)
  })

  it('applies the kind modifier class for added', () => {
    const wrapper = mount(DiffChangeCard, {
      props: { kind: 'added', name: 'Tavern' },
    })
    expect(wrapper.find('article').classes()).toContain('diff-change-card--added')
  })

  it('applies the kind modifier class for removed', () => {
    const wrapper = mount(DiffChangeCard, {
      props: { kind: 'removed', name: 'OldRoad' },
    })
    expect(wrapper.find('article').classes()).toContain('diff-change-card--removed')
  })

  it('applies the kind modifier class for changed', () => {
    const wrapper = mount(DiffChangeCard, {
      props: { kind: 'changed', name: 'VillageGate' },
    })
    expect(wrapper.find('article').classes()).toContain('diff-change-card--changed')
  })

  it('renders the name as an h3', () => {
    const wrapper = mount(DiffChangeCard, {
      props: { kind: 'added', name: 'Villager-1' },
    })
    const h3 = wrapper.find('h3')
    expect(h3.element.tagName).toBe('H3')
    expect(h3.text()).toBe('Villager-1')
  })

  it('renders a plus marker for added', () => {
    const wrapper = mount(DiffChangeCard, {
      props: { kind: 'added', name: 'Tavern' },
    })
    expect(wrapper.find('.diff-change-card-marker').text()).toBe('+')
  })

  it('renders a minus marker for removed', () => {
    const wrapper = mount(DiffChangeCard, {
      props: { kind: 'removed', name: 'OldRoad' },
    })
    expect(wrapper.find('.diff-change-card-marker').text()).toBe('-')
  })

  it('renders a bullet marker for changed', () => {
    const wrapper = mount(DiffChangeCard, {
      props: { kind: 'changed', name: 'VillageCenter' },
    })
    expect(wrapper.find('.diff-change-card-marker').text()).toBe('•')
  })

  it('includes a header element', () => {
    const wrapper = mount(DiffChangeCard, {
      props: { kind: 'added', name: 'Farm-1' },
    })
    expect(wrapper.find('header.diff-change-card-header').exists()).toBe(true)
  })

  it('links the article aria-labelledby to the heading id', () => {
    const wrapper = mount(DiffChangeCard, {
      props: { kind: 'changed', name: 'VillageGate' },
    })
    const article = wrapper.find('article')
    expect(article.attributes('aria-labelledby')).toBe(
      wrapper.find('h3').attributes('id'),
    )
  })

  it('generates the heading id from kind and name', () => {
    const wrapper = mount(DiffChangeCard, {
      props: { kind: 'removed', name: 'Old Road' },
    })
    expect(wrapper.find('h3').attributes('id')).toBe('diff-change-removed-old-road')
  })
})

// ---------------------------------------------------------------------------
// Keyboard navigation
// ---------------------------------------------------------------------------

describe('diff viewer — keyboard navigation', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('moves selection to the next diff with ArrowDown', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'ArrowDown')
    expect(activeRows(wrapper)).toHaveLength(1)
    expect(activeRows(wrapper)[0].text()).toContain('diff-002')
  })

  it('updates details after ArrowDown', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'ArrowDown')
    expect(wrapper.find('.diff-meta-grid').text()).toContain('diff-002')
  })

  it('moves selection two steps with repeated ArrowDown', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'ArrowDown')
    await pressKey(wrapper, 'ArrowDown')
    expect(activeRows(wrapper)[0].text()).toContain('diff-003')
  })

  it('moves selection to the previous diff with ArrowUp', async () => {
    const el = attachContainer()
    const wrapper = mountViewer(el)
    await pressKey(wrapper, 'ArrowDown')
    await pressKey(wrapper, 'ArrowDown')
    await pressKey(wrapper, 'ArrowUp')
    expect(activeRows(wrapper)[0].text()).toContain('diff-002')
    wrapper.unmount()
    el.remove()
  })

  it('clamps ArrowDown at the last diff', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'ArrowDown')
    await pressKey(wrapper, 'ArrowDown')
    await pressKey(wrapper, 'ArrowDown')
    expect(activeRows(wrapper)[0].text()).toContain('diff-003')
  })

  it('clamps ArrowUp at the first diff', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'ArrowUp')
    expect(activeRows(wrapper)[0].text()).toContain('diff-001')
  })

  it('jumps to the last diff with End', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'End')
    expect(activeRows(wrapper)[0].text()).toContain('diff-003')
    expect(wrapper.find('.diff-meta-grid').text()).toContain('diff-003')
  })

  it('jumps to the first diff with Home', async () => {
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
    expect(document.activeElement?.textContent).toContain('diff-002')
    wrapper.unmount()
    el.remove()
  })

  it('keys are handled on the list nav container', async () => {
    const wrapper = mountViewer()
    await wrapper.find('nav.diff-list').trigger('keydown', { key: 'ArrowDown' })
    await nextTick()
    expect(activeRows(wrapper)[0].text()).toContain('diff-002')
  })
})

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------

describe('diff viewer — accessibility', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('exposes an accessible nav landmark for the list', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('nav.diff-list').attributes('aria-label')).toBe('Diff list')
  })

  it('exposes an accessible article landmark for details', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('article.diff-details').attributes('aria-label')).toBe(
      'Diff details',
    )
  })

  it('uses buttons for every diff row', () => {
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
    expect(texts).toContain('Diff List')
    expect(texts).toContain('Diff Details')
  })

  it('uses h3 for the Added, Removed, and Changed headings', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('h3.diff-added-title').exists()).toBe(true)
    expect(wrapper.find('h3.diff-removed-title').exists()).toBe(true)
    expect(wrapper.find('h3.diff-changed-title').exists()).toBe(true)
  })

  it('renders change cards as articles with aria-labelledby', () => {
    const wrapper = mountViewer()
    for (const card of changeCards(wrapper)) {
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

  it('uses a definition list for the diff meta header', () => {
    const wrapper = mountViewer()
    const dl = wrapper.find('dl.diff-meta-grid')
    expect(dl.exists()).toBe(true)
    expect(dl.findAll('dt')).toHaveLength(2)
    expect(dl.findAll('dd')).toHaveLength(2)
  })

  it('links sections to their headings via aria-labelledby', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('#diff-added-title').exists()).toBe(true)
    expect(wrapper.find('#diff-removed-title').exists()).toBe(true)
    expect(wrapper.find('#diff-changed-title').exists()).toBe(true)
  })

  it('renders section empty messages as paragraphs', () => {
    const wrapper = mountViewer()
    const empty = wrapper.findAll('section p.diff-section-empty')
    expect(empty.length).toBeGreaterThan(0)
    for (const p of empty) {
      expect(p.element.tagName).toBe('P')
    }
  })
})

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

describe('diff viewer — empty state', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders an empty message when no entry is provided', () => {
    const wrapper = mount(DiffDetails, {
      props: { entry: null },
    })
    expect(wrapper.text()).toContain('No diff selected')
  })

  it('hides the header when no entry is provided', () => {
    const wrapper = mount(DiffDetails, {
      props: { entry: null },
    })
    expect(wrapper.find('.diff-details-header').exists()).toBe(false)
  })

  it('hides the sections when no entry is provided', () => {
    const wrapper = mount(DiffDetails, {
      props: { entry: null },
    })
    expect(wrapper.find('section').exists()).toBe(false)
  })

  it('marks the empty message as a paragraph', () => {
    const wrapper = mount(DiffDetails, {
      props: { entry: null },
    })
    expect(wrapper.find('p.diff-empty').exists()).toBe(true)
  })

  it('shows "No additions" for an empty added list', () => {
    const wrapper = mount(DiffDetails, {
      props: { entry: emptyListEntry() },
    })
    expect(wrapper.find('section.diff-added-section').text()).toContain(
      'No additions',
    )
  })

  it('shows "No removals" for an empty removed list', () => {
    const wrapper = mount(DiffDetails, {
      props: { entry: emptyListEntry() },
    })
    expect(wrapper.find('section.diff-removed-section').text()).toContain(
      'No removals',
    )
  })

  it('shows "No changes" for an empty changed list', () => {
    const wrapper = mount(DiffDetails, {
      props: { entry: emptyListEntry() },
    })
    expect(wrapper.find('section.diff-changed-section').text()).toContain(
      'No changes',
    )
  })

  it('hides all lists when lists are empty', () => {
    const wrapper = mount(DiffDetails, {
      props: { entry: emptyListEntry() },
    })
    expect(wrapper.find('ul').exists()).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Content integration
// ---------------------------------------------------------------------------

describe('diff viewer — content integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders the diff viewer when Diff is selected in the store', () => {
    const store = useObservatoryStore()
    store.selectPanel('Diff')
    const wrapper = mount(ObservatoryContent)
    expect(wrapper.findComponent(ObservatoryDiffViewer).exists()).toBe(true)
    expect(wrapper.findComponent(ObservatoryOverview).exists()).toBe(false)
    expect(wrapper.findComponent(ObservatoryTraceViewer).exists()).toBe(false)
    expect(wrapper.findComponent(ObservatoryTimelineViewer).exists()).toBe(false)
    expect(wrapper.findComponent(ObservatoryHistoryViewer).exists()).toBe(false)
    expect(wrapper.findAll('.content-card')).toHaveLength(0)
  })

  it('switches from Overview to the diff viewer on store change', async () => {
    const store = useObservatoryStore()
    const wrapper = mount(ObservatoryContent)
    expect(wrapper.findComponent(ObservatoryOverview).exists()).toBe(true)
    store.selectPanel('Diff')
    await nextTick()
    expect(wrapper.findComponent(ObservatoryOverview).exists()).toBe(false)
    expect(wrapper.findComponent(ObservatoryDiffViewer).exists()).toBe(true)
  })

  it('switches from the history viewer to the diff viewer', async () => {
    const store = useObservatoryStore()
    store.selectPanel('History')
    const wrapper = mount(ObservatoryContent)
    expect(wrapper.findComponent(ObservatoryHistoryViewer).exists()).toBe(true)
    store.selectPanel('Diff')
    await nextTick()
    expect(wrapper.findComponent(ObservatoryHistoryViewer).exists()).toBe(false)
    expect(wrapper.findComponent(ObservatoryDiffViewer).exists()).toBe(true)
  })

  it('switches from the diff viewer back to Overview', async () => {
    const store = useObservatoryStore()
    store.selectPanel('Diff')
    const wrapper = mount(ObservatoryContent)
    expect(wrapper.findComponent(ObservatoryDiffViewer).exists()).toBe(true)
    store.selectPanel('Overview')
    await nextTick()
    expect(wrapper.findComponent(ObservatoryDiffViewer).exists()).toBe(false)
    expect(wrapper.findComponent(ObservatoryOverview).exists()).toBe(true)
  })

  it('switches from the diff viewer to the placeholder grid', async () => {
    const store = useObservatoryStore()
    store.selectPanel('Diff')
    const wrapper = mount(ObservatoryContent)
    expect(wrapper.findComponent(ObservatoryDiffViewer).exists()).toBe(true)
    store.selectPanel('Runtime')
    await nextTick()
    expect(wrapper.findComponent(ObservatoryDiffViewer).exists()).toBe(false)
    expect(wrapper.findAll('.content-card')).toHaveLength(6)
  })

  it('renders the placeholder grid for Runtime', () => {
    const store = useObservatoryStore()
    store.selectPanel('Runtime')
    const wrapper = mount(ObservatoryContent)
    expect(wrapper.findAll('.content-card')).toHaveLength(6)
    expect(wrapper.findComponent(ObservatoryDiffViewer).exists()).toBe(false)
  })

  it('re-mounts a fresh diff viewer after panel switching', async () => {
    const store = useObservatoryStore()
    store.selectPanel('Diff')
    const wrapper = mount(ObservatoryContent)
    expect(wrapper.findComponent(ObservatoryDiffViewer).exists()).toBe(true)
    store.selectPanel('Runtime')
    await nextTick()
    store.selectPanel('Diff')
    await nextTick()
    const viewer = wrapper.findComponent(ObservatoryDiffViewer)
    expect(viewer.exists()).toBe(true)
    const active = viewer.findAll('.diff-row--active')
    expect(active).toHaveLength(1)
    expect(active[0].text()).toContain('diff-001')
  })
})

// ---------------------------------------------------------------------------
// Deterministic rendering
// ---------------------------------------------------------------------------

describe('diff viewer — deterministic rendering', () => {
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
    expect(rowTexts(a, '.diff-row-timestamp')).toEqual(
      rowTexts(b, '.diff-row-timestamp'),
    )
  })

  it('renders identical added lists across mounts', () => {
    const a = mountViewer()
    const b = mountViewer()
    expect(
      changeTexts(a, '.diff-added-item .diff-change-card-name'),
    ).toEqual(changeTexts(b, '.diff-added-item .diff-change-card-name'))
  })

  it('selects the same default diff across mounts', () => {
    const a = mountViewer()
    const b = mountViewer()
    const activeText = (w: VueWrapper): string =>
      w.find('.diff-row--active').text()
    expect(activeText(a)).toBe('diff-00112:00:01')
    expect(activeText(b)).toBe('diff-00112:00:01')
  })

  it('renders identical viewer HTML across mounts', () => {
    const a = mountViewer()
    const b = mountViewer()
    expect(a.html()).toBe(b.html())
  })
})