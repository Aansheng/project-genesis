import { describe, it, expect, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

import ObservatoryRuntimeViewer from '../components/observatory/runtime/ObservatoryRuntimeViewer.vue'
import RuntimeEntityList from '../components/observatory/runtime/RuntimeEntityList.vue'
import RuntimeEntityDetails from '../components/observatory/runtime/RuntimeEntityDetails.vue'
import RuntimeStatCard from '../components/observatory/runtime/RuntimeStatCard.vue'
import ObservatoryContent from '../components/observatory/ObservatoryContent.vue'
import ObservatoryOverview from '../components/observatory/ObservatoryOverview.vue'
import ObservatoryTraceViewer from '../components/observatory/trace/ObservatoryTraceViewer.vue'
import ObservatoryDiffViewer from '../components/observatory/diff/ObservatoryDiffViewer.vue'
import { useObservatoryStore } from '../stores/observatory'
import { useObservatoryDataStore } from '../stores/observatoryData'
import { useI18nStore } from '../stores/i18n'
import { resolveKey } from '../i18n'
import { zhCN } from '../i18n/locales/zh-CN'
import { enUS } from '../i18n/locales/en-US'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mountViewer(attachTo?: HTMLElement): VueWrapper {
  useObservatoryDataStore().loadMockObservatory()
  return mount(ObservatoryRuntimeViewer, attachTo ? { attachTo } : undefined)
}

function rows(wrapper: VueWrapper): ReturnType<VueWrapper['findAll']> {
  return wrapper.findAll('.runtime-row')
}

function rowTexts(wrapper: VueWrapper, selector: string): string[] {
  return wrapper.findAll(selector).map((el) => el.text().trim())
}

function activeRows(wrapper: VueWrapper): ReturnType<VueWrapper['findAll']> {
  return rows(wrapper).filter((r) => r.classes().includes('runtime-row--active'))
}

function statCards(wrapper: VueWrapper): ReturnType<VueWrapper['findAll']> {
  return wrapper.findAll('.runtime-stat-card')
}

function statLabels(wrapper: VueWrapper): string[] {
  return wrapper.findAll('.runtime-stat-label').map((el) => el.text().trim())
}

function statValues(wrapper: VueWrapper): string[] {
  return wrapper.findAll('.runtime-stat-value').map((el) => el.text().trim())
}

function gridLabels(wrapper: VueWrapper): string[] {
  return wrapper.findAll('.runtime-entity-grid-label').map((el) => el.text().trim())
}

function gridValues(wrapper: VueWrapper): string[] {
  return wrapper.findAll('.runtime-entity-grid-value').map((el) => el.text().trim())
}

async function pressKey(wrapper: VueWrapper, key: string): Promise<void> {
  await wrapper.find('nav.runtime-entity-list').trigger('keydown', { key })
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

describe('runtime viewer — rendering', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders the root viewer container', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('.observatory-runtime-viewer').exists()).toBe(true)
  })

  it('renders the RuntimeEntityList component', () => {
    const wrapper = mountViewer()
    expect(wrapper.findComponent(RuntimeEntityList).exists()).toBe(true)
  })

  it('renders the RuntimeEntityDetails component', () => {
    const wrapper = mountViewer()
    expect(wrapper.findComponent(RuntimeEntityDetails).exists()).toBe(true)
  })

  it('renders 4 RuntimeStatCard components', () => {
    const wrapper = mountViewer()
    expect(wrapper.findAllComponents(RuntimeStatCard)).toHaveLength(4)
  })

  it('renders the entity list as a nav with aria-label "Entity list"', () => {
    const wrapper = mountViewer()
    const nav = wrapper.find('nav.runtime-entity-list')
    expect(nav.exists()).toBe(true)
    expect(nav.attributes('aria-label')).toBe('Entity list')
  })

  it('renders the details as an article with aria-label "Runtime entity details"', () => {
    const wrapper = mountViewer()
    const article = wrapper.find('article.runtime-entity-details')
    expect(article.exists()).toBe(true)
    expect(article.attributes('aria-label')).toBe('Runtime entity details')
  })

  it('renders the list heading "Entity List" as an h2', () => {
    const wrapper = mountViewer()
    const h2 = wrapper.find('.runtime-entity-list-title')
    expect(h2.exists()).toBe(true)
    expect(h2.element.tagName).toBe('H2')
    expect(h2.text()).toBe('Entity List')
  })

  it('renders the stats heading "Runtime Stats" with a title id', () => {
    const wrapper = mountViewer()
    const h2 = wrapper.find('.runtime-stats-title')
    expect(h2.exists()).toBe(true)
    expect(h2.element.tagName).toBe('H2')
    expect(h2.attributes('id')).toBe('runtime-stats-title')
    expect(h2.text()).toBe('Runtime Stats')
  })

  it('renders the details title "Runtime Entity Details" as an h2', () => {
    const wrapper = mountViewer()
    const h2 = wrapper.find('.runtime-entity-title')
    expect(h2.exists()).toBe(true)
    expect(h2.element.tagName).toBe('H2')
    expect(h2.text()).toBe('Runtime Entity Details')
  })

  it('renders exactly 3 entity rows', () => {
    const wrapper = mountViewer()
    expect(rows(wrapper)).toHaveLength(3)
  })

  it('renders entity ids in order', () => {
    const wrapper = mountViewer()
    expect(rowTexts(wrapper, '.runtime-row-id')).toEqual([
      'guard-001',
      'merchant-001',
      'villager-001',
    ])
  })

  it('renders entity types in order', () => {
    const wrapper = mountViewer()
    expect(rowTexts(wrapper, '.runtime-row-type')).toEqual([
      'Guard',
      'Merchant',
      'Villager',
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
    const items = wrapper.findAll('li.runtime-entity-list-item')
    expect(items).toHaveLength(3)
    for (const item of items) {
      expect(item.find('button.runtime-row').exists()).toBe(true)
    }
  })

  it('renders the entity list as a ul', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('ul.runtime-entity-list-items').exists()).toBe(true)
  })

  it('lays out the viewer as a two-column grid', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('.observatory-runtime-viewer').exists()).toBe(true)
    expect(wrapper.findComponent(RuntimeEntityList).exists()).toBe(true)
    expect(wrapper.find('.runtime-main').exists()).toBe(true)
  })

  it('renders the stats section with aria-labelledby to the stats title', () => {
    const wrapper = mountViewer()
    const section = wrapper.find('section.runtime-stats')
    expect(section.exists()).toBe(true)
    expect(section.attributes('aria-labelledby')).toBe('runtime-stats-title')
  })

  it('renders the mock world id', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('.runtime-world-id').text()).toBe('world-001')
  })

  it('renders the stats section before the details in the right panel', () => {
    const wrapper = mountViewer()
    const main = wrapper.find('.runtime-main')
    const stats = main.find('section.runtime-stats')
    const details = main.find('article.runtime-entity-details')
    expect(stats.element.compareDocumentPosition(details.element)).toBe(4) // DOCUMENT_POSITION_FOLLOWING
  })

  it('renders the stats grid as a definition list', () => {
    const wrapper = mountViewer()
    const dl = wrapper.find('dl.runtime-stats-grid')
    expect(dl.exists()).toBe(true)
  })

  it('shows both id and type inside each row', () => {
    const wrapper = mountViewer()
    for (const row of rows(wrapper)) {
      expect(row.find('.runtime-row-id').exists()).toBe(true)
      expect(row.find('.runtime-row-type').exists()).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------
// Stats rendering
// ---------------------------------------------------------------------------

describe('runtime viewer — stats rendering', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders 4 stat cards', () => {
    const wrapper = mountViewer()
    expect(statCards(wrapper)).toHaveLength(4)
  })

  it('renders zh-CN stat labels by default', () => {
    const wrapper = mountViewer()
    expect(statLabels(wrapper)).toEqual(['实体', '系统', '事件', '运行帧率'])
  })

  it('renders stat values in stats order', () => {
    const wrapper = mountViewer()
    expect(statValues(wrapper)).toEqual(['187', '8', '31', '60'])
  })

  it('renders the entities stat value 187', () => {
    const wrapper = mountViewer()
    expect(statValues(wrapper)[0]).toBe('187')
  })

  it('renders the systems stat value 8', () => {
    const wrapper = mountViewer()
    expect(statValues(wrapper)[1]).toBe('8')
  })

  it('renders the events stat value 31', () => {
    const wrapper = mountViewer()
    expect(statValues(wrapper)[2]).toBe('31')
  })

  it('renders the fps stat value 60', () => {
    const wrapper = mountViewer()
    expect(statValues(wrapper)[3]).toBe('60')
  })

  it('renders stat labels as dt elements', () => {
    const wrapper = mountViewer()
    for (const label of wrapper.findAll('.runtime-stat-label')) {
      expect(label.element.tagName).toBe('DT')
    }
  })

  it('renders stat values as dd elements', () => {
    const wrapper = mountViewer()
    for (const value of wrapper.findAll('.runtime-stat-value')) {
      expect(value.element.tagName).toBe('DD')
    }
  })

  it('nests stat cards inside the stats definition list', () => {
    const wrapper = mountViewer()
    const dl = wrapper.find('dl.runtime-stats-grid')
    expect(dl.findAll('.runtime-stat-card')).toHaveLength(4)
  })

  it('pairs stat labels with their values', () => {
    const wrapper = mountViewer()
    const labels = statLabels(wrapper)
    const values = statValues(wrapper)
    expect(labels).toHaveLength(values.length)
    expect(labels[0]).toBe('实体')
    expect(values[0]).toBe('187')
  })

  it('orders stat cards after the stats heading', () => {
    const wrapper = mountViewer()
    const section = wrapper.find('section.runtime-stats')
    expect(section.find('.runtime-stats-title').exists()).toBe(true)
    expect(section.find('dl.runtime-stats-grid').exists()).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

describe('runtime viewer — mock data', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('displays 3 mock runtime entities', () => {
    const wrapper = mountViewer()
    expect(rows(wrapper)).toHaveLength(3)
  })

  it('mock entity ids use the NNN entity pattern', () => {
    const wrapper = mountViewer()
    expect(rowTexts(wrapper, '.runtime-row-id')).toEqual([
      'guard-001',
      'merchant-001',
      'villager-001',
    ])
  })

  it('mock entity types are Guard, Merchant, Villager', () => {
    const wrapper = mountViewer()
    expect(rowTexts(wrapper, '.runtime-row-type')).toEqual([
      'Guard',
      'Merchant',
      'Villager',
    ])
  })

  it('mock positions are coordinate strings', async () => {
    const wrapper = mountViewer()
    expect(gridValues(wrapper)[0]).toBe('(10,4)')
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    expect(gridValues(wrapper)[0]).toBe('(4,8)')
    await rows(wrapper)[2].trigger('click')
    await nextTick()
    expect(gridValues(wrapper)[0]).toBe('(1,2)')
  })

  it('mock states are Patrol, Trading, Working', async () => {
    const wrapper = mountViewer()
    expect(gridValues(wrapper)[2]).toBe('Patrol')
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    expect(gridValues(wrapper)[2]).toBe('Trading')
    await rows(wrapper)[2].trigger('click')
    await nextTick()
    expect(gridValues(wrapper)[2]).toBe('Working')
  })

  it('mock health is 100 for every entity', async () => {
    const wrapper = mountViewer()
    for (let i = 0; i < 3; i++) {
      await wrapper.findAll('.runtime-row')[i].trigger('click')
      await nextTick()
      expect(wrapper.findAll('.runtime-entity-grid-value')[1].text()).toBe('100')
    }
  })

  it('defaults the selected entity to guard-001', () => {
    const wrapper = mountViewer()
    expect(activeRows(wrapper)[0].text()).toContain('guard-001')
  })
})

// ---------------------------------------------------------------------------
// Default selection / active state
// ---------------------------------------------------------------------------

describe('runtime viewer — default selection and active state', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('marks the first entity row active by default', () => {
    const wrapper = mountViewer()
    expect(rows(wrapper)[0].classes()).toContain('runtime-row--active')
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

  it('shows the default entity id in the details header', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('.runtime-entity-meta').text()).toContain('guard-001')
  })

  it('shows the default entity type in the details header', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('.runtime-entity-meta').text()).toContain('Guard')
  })

  it('labels the meta fields with dt elements', () => {
    const wrapper = mountViewer()
    const labels = wrapper
      .findAll('.runtime-entity-meta-label')
      .map((el) => el.text().trim())
    expect(labels).toEqual(['ID', 'Type'])
  })

  it('uses a definition list for the details meta header', () => {
    const wrapper = mountViewer()
    const dl = wrapper.find('dl.runtime-entity-meta')
    expect(dl.exists()).toBe(true)
    expect(dl.findAll('dt')).toHaveLength(2)
    expect(dl.findAll('dd')).toHaveLength(2)
  })
})

// ---------------------------------------------------------------------------
// Selection — clicking
// ---------------------------------------------------------------------------

describe('runtime viewer — selection by click', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('selects merchant-001 on click and updates the header id', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    expect(wrapper.find('.runtime-entity-meta').text()).toContain('merchant-001')
  })

  it('selects merchant-001 on click and updates the header type', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    expect(wrapper.find('.runtime-entity-meta').text()).toContain('Merchant')
  })

  it('updates the position when merchant-001 is selected', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    expect(wrapper.findAll('.runtime-entity-grid-value')[0].text()).toBe('(4,8)')
  })

  it('updates the state when merchant-001 is selected', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    expect(wrapper.findAll('.runtime-entity-grid-value')[2].text()).toBe('Trading')
  })

  it('moves the active class to the clicked row', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[2].trigger('click')
    await nextTick()
    expect(activeRows(wrapper)).toHaveLength(1)
    expect(activeRows(wrapper)[0].text()).toContain('villager-001')
  })

  it('moves aria-current to the clicked row', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    expect(rows(wrapper)[1].attributes('aria-current')).toBe('true')
    expect(rows(wrapper)[0].attributes('aria-current')).toBeUndefined()
  })

  it('selects villager-001 on click and shows its details', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[2].trigger('click')
    await nextTick()
    expect(wrapper.find('.runtime-entity-meta').text()).toContain('villager-001')
    expect(wrapper.findAll('.runtime-entity-grid-value')[0].text()).toBe('(1,2)')
    expect(wrapper.findAll('.runtime-entity-grid-value')[2].text()).toBe('Working')
  })

  it('switches back to guard-001 when clicked again', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    await rows(wrapper)[0].trigger('click')
    await nextTick()
    expect(wrapper.find('.runtime-entity-meta').text()).toContain('guard-001')
    expect(activeRows(wrapper)).toHaveLength(1)
    expect(activeRows(wrapper)[0].text()).toContain('guard-001')
  })

  it('clicking the active row keeps the selection', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[0].trigger('click')
    await nextTick()
    expect(activeRows(wrapper)).toHaveLength(1)
    expect(wrapper.find('.runtime-entity-meta').text()).toContain('guard-001')
  })
})

// ---------------------------------------------------------------------------
// Details rendering
// ---------------------------------------------------------------------------

describe('runtime viewer — details rendering', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders the details header for the default entity', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('header.runtime-entity-header').exists()).toBe(true)
  })

  it('renders the default position as (10,4)', () => {
    const wrapper = mountViewer()
    expect(wrapper.findAll('.runtime-entity-grid-value')[0].text()).toBe('(10,4)')
  })

  it('renders the default health as 100', () => {
    const wrapper = mountViewer()
    expect(wrapper.findAll('.runtime-entity-grid-value')[1].text()).toBe('100')
  })

  it('renders the default state as Patrol', () => {
    const wrapper = mountViewer()
    expect(wrapper.findAll('.runtime-entity-grid-value')[2].text()).toBe('Patrol')
  })

  it('renders the properties grid as a dl with 3 items', () => {
    const wrapper = mountViewer()
    const dl = wrapper.find('dl.runtime-entity-grid')
    expect(dl.exists()).toBe(true)
    expect(dl.findAll('div.runtime-entity-grid-item')).toHaveLength(3)
  })

  it('renders zh-CN property labels by default', () => {
    const wrapper = mountViewer()
    expect(gridLabels(wrapper)).toEqual(['位置', '生命值', '状态'])
  })

  it('renders property values in Position, Health, State order', () => {
    const wrapper = mountViewer()
    expect(gridValues(wrapper)).toEqual(['(10,4)', '100', 'Patrol'])
  })

  it('uses dt/dd pairs inside the properties grid', () => {
    const wrapper = mountViewer()
    const dl = wrapper.find('dl.runtime-entity-grid')
    expect(dl.findAll('dt')).toHaveLength(3)
    expect(dl.findAll('dd')).toHaveLength(3)
  })

  it('updates every property when a different entity is selected', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    expect(gridValues(wrapper)).toEqual(['(4,8)', '100', 'Trading'])
  })

  it('shows distinct details across entities', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[2].trigger('click')
    await nextTick()
    expect(gridValues(wrapper)).toEqual(['(1,2)', '100', 'Working'])
  })

  it('keeps details values aligned with the selected entity', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    expect(wrapper.find('.runtime-entity-meta').text()).toContain('merchant-001')
    expect(gridValues(wrapper)[0]).toBe('(4,8)')
    expect(gridValues(wrapper)[2]).toBe('Trading')
  })
})

// ---------------------------------------------------------------------------
// RuntimeStatCard
// ---------------------------------------------------------------------------

describe('runtime stat card', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders as a div with the stat card class', () => {
    const wrapper = mount(RuntimeStatCard, {
      props: { label: 'Entities', value: '187' },
    })
    const card = wrapper.find('div.runtime-stat-card')
    expect(card.exists()).toBe(true)
  })

  it('renders the label text', () => {
    const wrapper = mount(RuntimeStatCard, {
      props: { label: 'Systems', value: '8' },
    })
    expect(wrapper.find('.runtime-stat-label').text()).toBe('Systems')
  })

  it('renders the value text', () => {
    const wrapper = mount(RuntimeStatCard, {
      props: { label: 'Events', value: '31' },
    })
    expect(wrapper.find('.runtime-stat-value').text()).toBe('31')
  })

  it('renders the label as a dt element', () => {
    const wrapper = mount(RuntimeStatCard, {
      props: { label: 'FPS', value: '60' },
    })
    expect(wrapper.find('dt.runtime-stat-label').exists()).toBe(true)
  })

  it('renders the value as a dd element', () => {
    const wrapper = mount(RuntimeStatCard, {
      props: { label: 'FPS', value: '60' },
    })
    expect(wrapper.find('dd.runtime-stat-value').exists()).toBe(true)
  })

  it('accepts arbitrary label and value props', () => {
    const wrapper = mount(RuntimeStatCard, {
      props: { label: 'Custom', value: '42' },
    })
    expect(wrapper.find('.runtime-stat-label').text()).toBe('Custom')
    expect(wrapper.find('.runtime-stat-value').text()).toBe('42')
  })
})

// ---------------------------------------------------------------------------
// Keyboard navigation
// ---------------------------------------------------------------------------

describe('runtime viewer — keyboard navigation', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('moves selection to the next entity with ArrowDown', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'ArrowDown')
    expect(activeRows(wrapper)).toHaveLength(1)
    expect(activeRows(wrapper)[0].text()).toContain('merchant-001')
  })

  it('updates details after ArrowDown', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'ArrowDown')
    expect(wrapper.find('.runtime-entity-meta').text()).toContain('merchant-001')
    expect(gridValues(wrapper)[0]).toBe('(4,8)')
  })

  it('moves selection two steps with repeated ArrowDown', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'ArrowDown')
    await pressKey(wrapper, 'ArrowDown')
    expect(activeRows(wrapper)[0].text()).toContain('villager-001')
  })

  it('moves selection to the previous entity with ArrowUp', async () => {
    const el = attachContainer()
    const wrapper = mountViewer(el)
    await pressKey(wrapper, 'ArrowDown')
    await pressKey(wrapper, 'ArrowDown')
    await pressKey(wrapper, 'ArrowUp')
    expect(activeRows(wrapper)[0].text()).toContain('merchant-001')
    wrapper.unmount()
    el.remove()
  })

  it('clamps ArrowDown at the last entity', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'ArrowDown')
    await pressKey(wrapper, 'ArrowDown')
    await pressKey(wrapper, 'ArrowDown')
    expect(activeRows(wrapper)[0].text()).toContain('villager-001')
  })

  it('clamps ArrowUp at the first entity', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'ArrowUp')
    expect(activeRows(wrapper)[0].text()).toContain('guard-001')
  })

  it('jumps to the last entity with End', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'End')
    expect(activeRows(wrapper)[0].text()).toContain('villager-001')
    expect(wrapper.find('.runtime-entity-meta').text()).toContain('villager-001')
  })

  it('jumps to the first entity with Home', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'End')
    await pressKey(wrapper, 'Home')
    expect(activeRows(wrapper)[0].text()).toContain('guard-001')
  })

  it('ignores unrelated keys', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'Tab')
    await pressKey(wrapper, 'Enter')
    await pressKey(wrapper, 'x')
    expect(activeRows(wrapper)[0].text()).toContain('guard-001')
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
    expect(document.activeElement?.textContent).toContain('merchant-001')
    wrapper.unmount()
    el.remove()
  })

  it('keys are handled on the list nav container', async () => {
    const wrapper = mountViewer()
    await wrapper
      .find('nav.runtime-entity-list')
      .trigger('keydown', { key: 'ArrowDown' })
    await nextTick()
    expect(activeRows(wrapper)[0].text()).toContain('merchant-001')
  })

  it('keyboard selection keeps exactly one active row', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'ArrowDown')
    await pressKey(wrapper, 'End')
    await pressKey(wrapper, 'Home')
    expect(activeRows(wrapper)).toHaveLength(1)
    expect(activeRows(wrapper)[0].text()).toContain('guard-001')
  })
})

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------

describe('runtime viewer — accessibility', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('exposes an accessible nav landmark for the entity list', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('nav.runtime-entity-list').attributes('aria-label')).toBe(
      'Entity list',
    )
  })

  it('exposes an accessible article landmark for details', () => {
    const wrapper = mountViewer()
    expect(
      wrapper.find('article.runtime-entity-details').attributes('aria-label'),
    ).toBe('Runtime entity details')
  })

  it('uses buttons for every entity row', () => {
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

  it('uses h2 for the list, stats, and details headings', () => {
    const wrapper = mountViewer()
    const texts = wrapper.findAll('h2').map((h) => h.text().trim())
    expect(texts).toContain('Entity List')
    expect(texts).toContain('Runtime Stats')
    expect(texts).toContain('Runtime Entity Details')
  })

  it('does not use divs as buttons', () => {
    const wrapper = mountViewer()
    expect(wrapper.findAll('div[role="button"]')).toHaveLength(0)
    const rowsAreButtons = rows(wrapper).every(
      (r) => r.element.tagName === 'BUTTON',
    )
    expect(rowsAreButtons).toBe(true)
  })

  it('uses a definition list for the details meta header', () => {
    const wrapper = mountViewer()
    const dl = wrapper.find('dl.runtime-entity-meta')
    expect(dl.exists()).toBe(true)
    expect(dl.findAll('dt')).toHaveLength(2)
    expect(dl.findAll('dd')).toHaveLength(2)
  })

  it('uses a definition list for the entity properties', () => {
    const wrapper = mountViewer()
    const dl = wrapper.find('dl.runtime-entity-grid')
    expect(dl.exists()).toBe(true)
    expect(dl.findAll('dt')).toHaveLength(3)
    expect(dl.findAll('dd')).toHaveLength(3)
  })

  it('links the stats section to its heading via aria-labelledby', () => {
    const wrapper = mountViewer()
    const section = wrapper.find('section.runtime-stats')
    const headingId = section.attributes('aria-labelledby')
    expect(headingId).toBe('runtime-stats-title')
    expect(section.find(`#${headingId}`).element.tagName).toBe('H2')
  })

  it('uses a definition list for the stats grid', () => {
    const wrapper = mountViewer()
    const dl = wrapper.find('dl.runtime-stats-grid')
    expect(dl.findAll('dt')).toHaveLength(4)
    expect(dl.findAll('dd')).toHaveLength(4)
  })

  it('renders the world id as a non-heading identifier', () => {
    const wrapper = mountViewer()
    const id = wrapper.find('.runtime-world-id')
    expect(id.exists()).toBe(true)
    expect(id.element.tagName).not.toBe('H1')
  })

  it('keeps the empty state paragraph semantic', () => {
    const wrapper = mount(RuntimeEntityDetails, {
      props: { entity: null },
    })
    expect(wrapper.find('p.runtime-entity-empty').exists()).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

describe('runtime viewer — empty state', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders an empty message when no entity is provided', () => {
    const wrapper = mount(RuntimeEntityDetails, {
      props: { entity: null },
    })
    expect(wrapper.text()).toContain('No entity selected')
  })

  it('hides the header when no entity is provided', () => {
    const wrapper = mount(RuntimeEntityDetails, {
      props: { entity: null },
    })
    expect(wrapper.find('.runtime-entity-header').exists()).toBe(false)
  })

  it('hides the property grid when no entity is provided', () => {
    const wrapper = mount(RuntimeEntityDetails, {
      props: { entity: null },
    })
    expect(wrapper.find('dl.runtime-entity-grid').exists()).toBe(false)
  })

  it('marks the empty message as a paragraph', () => {
    const wrapper = mount(RuntimeEntityDetails, {
      props: { entity: null },
    })
    expect(wrapper.find('p.runtime-entity-empty').element.tagName).toBe('P')
  })
})

// ---------------------------------------------------------------------------
// i18n rendering
// ---------------------------------------------------------------------------

describe('runtime viewer — i18n rendering', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders the entities stat label in Chinese by default', () => {
    const wrapper = mountViewer()
    expect(wrapper.findAll('.runtime-stat-label')[0].text()).toBe('实体')
  })

  it('renders the systems stat label in Chinese by default', () => {
    const wrapper = mountViewer()
    expect(wrapper.findAll('.runtime-stat-label')[1].text()).toBe('系统')
  })

  it('renders the events stat label in Chinese by default', () => {
    const wrapper = mountViewer()
    expect(wrapper.findAll('.runtime-stat-label')[2].text()).toBe('事件')
  })

  it('renders the fps stat label in Chinese by default', () => {
    const wrapper = mountViewer()
    expect(wrapper.findAll('.runtime-stat-label')[3].text()).toBe('运行帧率')
  })

  it('renders the position property label in Chinese by default', () => {
    const wrapper = mountViewer()
    expect(gridLabels(wrapper)[0]).toBe('位置')
  })

  it('renders the health property label in Chinese by default', () => {
    const wrapper = mountViewer()
    expect(gridLabels(wrapper)[1]).toBe('生命值')
  })

  it('renders the state property label in Chinese by default', () => {
    const wrapper = mountViewer()
    expect(gridLabels(wrapper)[2]).toBe('状态')
  })

  it('renders stat labels in English after switching language', async () => {
    const wrapper = mountViewer()
    useI18nStore().setLanguage('en-US')
    await nextTick()
    expect(statLabels(wrapper)).toEqual(['Entities', 'Systems', 'Events', 'FPS'])
  })

  it('renders property labels in English after switching language', async () => {
    const wrapper = mountViewer()
    useI18nStore().setLanguage('en-US')
    await nextTick()
    expect(gridLabels(wrapper)).toEqual(['Position', 'Health', 'State'])
  })

  it('updates stat labels reactively on language switch', async () => {
    const wrapper = mountViewer()
    useI18nStore().setLanguage('en-US')
    await nextTick()
    expect(statValues(wrapper)).toEqual(['187', '8', '31', '60'])
    expect(wrapper.findAll('.runtime-stat-label')[0].text()).toBe('Entities')
  })

  it('switches back to Chinese labels reactively', async () => {
    const wrapper = mountViewer()
    const store = useI18nStore()
    store.setLanguage('en-US')
    await nextTick()
    store.setLanguage('zh-CN')
    await nextTick()
    expect(statLabels(wrapper)[3]).toBe('运行帧率')
    expect(gridLabels(wrapper)[0]).toBe('位置')
  })

  it('does not remount the viewer on language switch', async () => {
    const wrapper = mountViewer()
    const titleElement = wrapper.find('.runtime-stats-title')
    useI18nStore().setLanguage('en-US')
    await nextTick()
    expect(wrapper.find('.runtime-stats-title').exists()).toBe(true)
    expect(titleElement.text()).toBe('Runtime Stats')
  })

  it('zh-CN catalog contains the runtime entities key', () => {
    expect(resolveKey(zhCN, 'observatory.runtime.entities')).toBe('实体')
  })

  it('zh-CN catalog contains the runtime systems key', () => {
    expect(resolveKey(zhCN, 'observatory.runtime.systems')).toBe('系统')
  })

  it('zh-CN catalog contains the runtime events key', () => {
    expect(resolveKey(zhCN, 'observatory.runtime.events')).toBe('事件')
  })

  it('zh-CN catalog contains the runtime fps key', () => {
    expect(resolveKey(zhCN, 'observatory.runtime.fps')).toBe('运行帧率')
  })

  it('zh-CN catalog contains the runtime position key', () => {
    expect(resolveKey(zhCN, 'observatory.runtime.position')).toBe('位置')
  })

  it('zh-CN catalog contains the runtime state key', () => {
    expect(resolveKey(zhCN, 'observatory.runtime.state')).toBe('状态')
  })

  it('zh-CN catalog contains the runtime health key', () => {
    expect(resolveKey(zhCN, 'observatory.runtime.health')).toBe('生命值')
  })

  it('en-US catalog contains all runtime keys', () => {
    expect(resolveKey(enUS, 'observatory.runtime.entities')).toBe('Entities')
    expect(resolveKey(enUS, 'observatory.runtime.systems')).toBe('Systems')
    expect(resolveKey(enUS, 'observatory.runtime.events')).toBe('Events')
    expect(resolveKey(enUS, 'observatory.runtime.fps')).toBe('FPS')
    expect(resolveKey(enUS, 'observatory.runtime.position')).toBe('Position')
    expect(resolveKey(enUS, 'observatory.runtime.state')).toBe('State')
    expect(resolveKey(enUS, 'observatory.runtime.health')).toBe('Health')
  })

  it('runtime keys have matching parity across locales', () => {
    for (const key of [
      'entities',
      'systems',
      'events',
      'fps',
      'position',
      'state',
      'health',
    ]) {
      const full = `observatory.runtime.${key}`
      expect(resolveKey(zhCN, full), `zh key ${full}`).toBeDefined()
      expect(resolveKey(enUS, full), `en key ${full}`).toBeDefined()
    }
  })
})

// ---------------------------------------------------------------------------
// Content integration
// ---------------------------------------------------------------------------

describe('runtime viewer — content integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders the runtime viewer when Runtime is selected in the store', () => {
    const store = useObservatoryStore()
    store.selectPanel('Runtime')
    const wrapper = mount(ObservatoryContent)
    expect(wrapper.findComponent(ObservatoryRuntimeViewer).exists()).toBe(true)
    expect(wrapper.findComponent(ObservatoryOverview).exists()).toBe(false)
    expect(wrapper.findComponent(ObservatoryTraceViewer).exists()).toBe(false)
    expect(wrapper.findComponent(ObservatoryDiffViewer).exists()).toBe(false)
    expect(wrapper.findAll('.content-card')).toHaveLength(0)
  })

  it('does not render placeholder cards when Runtime is selected', () => {
    const store = useObservatoryStore()
    store.selectPanel('Runtime')
    const wrapper = mount(ObservatoryContent)
    expect(wrapper.findAll('.content-card')).toHaveLength(0)
  })

  it('switches from Overview to the runtime viewer on store change', async () => {
    const store = useObservatoryStore()
    const wrapper = mount(ObservatoryContent)
    expect(wrapper.findComponent(ObservatoryOverview).exists()).toBe(true)
    store.selectPanel('Runtime')
    await nextTick()
    expect(wrapper.findComponent(ObservatoryOverview).exists()).toBe(false)
    expect(wrapper.findComponent(ObservatoryRuntimeViewer).exists()).toBe(true)
  })

  it('switches from the trace viewer to the runtime viewer', async () => {
    const store = useObservatoryStore()
    store.selectPanel('Trace')
    const wrapper = mount(ObservatoryContent)
    expect(wrapper.findComponent(ObservatoryTraceViewer).exists()).toBe(true)
    store.selectPanel('Runtime')
    await nextTick()
    expect(wrapper.findComponent(ObservatoryTraceViewer).exists()).toBe(false)
    expect(wrapper.findComponent(ObservatoryRuntimeViewer).exists()).toBe(true)
  })

  it('switches from the diff viewer to the runtime viewer', async () => {
    const store = useObservatoryStore()
    store.selectPanel('Diff')
    const wrapper = mount(ObservatoryContent)
    expect(wrapper.findComponent(ObservatoryDiffViewer).exists()).toBe(true)
    store.selectPanel('Runtime')
    await nextTick()
    expect(wrapper.findComponent(ObservatoryDiffViewer).exists()).toBe(false)
    expect(wrapper.findComponent(ObservatoryRuntimeViewer).exists()).toBe(true)
  })

  it('renders the placeholder grid for Settings', () => {
    const store = useObservatoryStore()
    store.selectPanel('Settings')
    const wrapper = mount(ObservatoryContent)
    expect(wrapper.findAll('.content-card')).toHaveLength(6)
    expect(wrapper.findComponent(ObservatoryRuntimeViewer).exists()).toBe(false)
  })

  it('switches from the runtime viewer back to Overview', async () => {
    const store = useObservatoryStore()
    store.selectPanel('Runtime')
    const wrapper = mount(ObservatoryContent)
    expect(wrapper.findComponent(ObservatoryRuntimeViewer).exists()).toBe(true)
    store.selectPanel('Overview')
    await nextTick()
    expect(wrapper.findComponent(ObservatoryRuntimeViewer).exists()).toBe(false)
    expect(wrapper.findComponent(ObservatoryOverview).exists()).toBe(true)
  })

  it('switches from the runtime viewer to the placeholder grid', async () => {
    const store = useObservatoryStore()
    store.selectPanel('Runtime')
    const wrapper = mount(ObservatoryContent)
    expect(wrapper.findComponent(ObservatoryRuntimeViewer).exists()).toBe(true)
    store.selectPanel('Settings')
    await nextTick()
    expect(wrapper.findComponent(ObservatoryRuntimeViewer).exists()).toBe(false)
    expect(wrapper.findAll('.content-card')).toHaveLength(6)
  })

  it('re-mounts a fresh runtime viewer after panel switching', async () => {
    const store = useObservatoryStore()
    useObservatoryDataStore().loadMockObservatory()
    store.selectPanel('Runtime')
    const wrapper = mount(ObservatoryContent)
    expect(wrapper.findComponent(ObservatoryRuntimeViewer).exists()).toBe(true)
    store.selectPanel('Settings')
    await nextTick()
    store.selectPanel('Runtime')
    await nextTick()
    const viewer = wrapper.findComponent(ObservatoryRuntimeViewer)
    expect(viewer.exists()).toBe(true)
    const active = viewer.findAll('.runtime-row--active')
    expect(active).toHaveLength(1)
    expect(active[0].text()).toContain('guard-001')
  })
})

// ---------------------------------------------------------------------------
// Deterministic rendering
// ---------------------------------------------------------------------------

describe('runtime viewer — deterministic rendering', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders identical entity ids across mounts', () => {
    const a = mountViewer()
    const b = mountViewer()
    expect(rowTexts(a, '.runtime-row-id')).toEqual(
      rowTexts(b, '.runtime-row-id'),
    )
  })

  it('renders identical entity types across mounts', () => {
    const a = mountViewer()
    const b = mountViewer()
    expect(rowTexts(a, '.runtime-row-type')).toEqual(
      rowTexts(b, '.runtime-row-type'),
    )
  })

  it('renders identical stat values across mounts', () => {
    const a = mountViewer()
    const b = mountViewer()
    expect(statValues(a)).toEqual(statValues(b))
  })

  it('selects the same default entity across mounts', () => {
    const a = mountViewer()
    const b = mountViewer()
    const activeText = (w: VueWrapper): string =>
      w.find('.runtime-row--active').text()
    expect(activeText(a)).toBe('guard-001Guard')
    expect(activeText(b)).toBe('guard-001Guard')
  })

  it('renders identical viewer HTML across mounts', () => {
    const a = mountViewer()
    const b = mountViewer()
    expect(a.html()).toBe(b.html())
  })
})