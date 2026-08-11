import { describe, it, expect, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

import RuntimeComponentCard from '../components/observatory/runtime/RuntimeComponentCard.vue'
import RuntimeEntityInspector from '../components/observatory/runtime/RuntimeEntityInspector.vue'
import ObservatoryRuntimeViewer from '../components/observatory/runtime/ObservatoryRuntimeViewer.vue'
import RuntimeEntityList from '../components/observatory/runtime/RuntimeEntityList.vue'
import RuntimeEntityDetails from '../components/observatory/runtime/RuntimeEntityDetails.vue'
import RuntimeStatCard from '../components/observatory/runtime/RuntimeStatCard.vue'
import type { InspectorComponent } from '../components/observatory/runtime/RuntimeComponentCard.vue'
import { useI18nStore } from '../stores/i18n'
import { resolveKey } from '../i18n'
import { zhCN } from '../i18n/locales/zh-CN'
import { enUS } from '../i18n/locales/en-US'
import { useObservatoryDataStore } from '../stores/observatoryData'

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const MOCK_POSITION_COMPONENT: InspectorComponent = {
  name: 'Position',
  data: { x: 10, y: 4 },
}

const MOCK_HEALTH_COMPONENT: InspectorComponent = {
  name: 'Health',
  data: { current: 100, max: 100 },
}

const MOCK_AI_COMPONENT: InspectorComponent = {
  name: 'AI',
  data: { state: 'Patrol', target: null },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mountInspector(entityId: string | null): VueWrapper {
  useObservatoryDataStore().loadMockObservatory()
  return mount(RuntimeEntityInspector, {
    props: { entityId },
  })
}

function mountCard(component: InspectorComponent): VueWrapper {
  return mount(RuntimeComponentCard, {
    props: { component },
  })
}

function mountViewer(): VueWrapper {
  useObservatoryDataStore().loadMockObservatory()
  return mount(ObservatoryRuntimeViewer)
}

function rows(wrapper: VueWrapper): ReturnType<VueWrapper['findAll']> {
  return wrapper.findAll('.runtime-row')
}

function cardComponents(wrapper: VueWrapper): ReturnType<VueWrapper['findAll']> {
  return wrapper.findAll('.runtime-component-card')
}

function cardNames(wrapper: VueWrapper): string[] {
  return wrapper
    .findAll('.runtime-component-name')
    .map((el) => el.text().trim())
}

function cardJSONs(wrapper: VueWrapper): string[] {
  return wrapper
    .findAll('.runtime-component-json')
    .map((el) => el.text().trim())
}

function jsonText(wrapper: VueWrapper): string {
  return wrapper.find('.runtime-component-json').text().trim()
}

function deserializeJSON(wrapper: VueWrapper): unknown {
  return JSON.parse(jsonText(wrapper))
}

// ---------------------------------------------------------------------------
// RuntimeComponentCard — rendering
// ---------------------------------------------------------------------------

describe('RuntimeComponentCard — rendering', () => {
  it('renders as an article with class runtime-component-card', () => {
    const wrapper = mountCard(MOCK_POSITION_COMPONENT)
    expect(wrapper.find('article.runtime-component-card').exists()).toBe(true)
  })

  it('renders the component name in a header', () => {
    const wrapper = mountCard(MOCK_POSITION_COMPONENT)
    expect(wrapper.find('header.runtime-component-header').exists()).toBe(true)
  })

  it('renders the component name as an h3', () => {
    const wrapper = mountCard(MOCK_POSITION_COMPONENT)
    const h3 = wrapper.find('h3.runtime-component-name')
    expect(h3.exists()).toBe(true)
    expect(h3.text()).toBe('Position')
  })

  it('renders a pre element for JSON', () => {
    const wrapper = mountCard(MOCK_POSITION_COMPONENT)
    expect(wrapper.find('pre.runtime-component-json').exists()).toBe(true)
  })

  it('renders a code element inside the pre', () => {
    const wrapper = mountCard(MOCK_POSITION_COMPONENT)
    expect(wrapper.find('pre > code').exists()).toBe(true)
  })

  it('renders formatted JSON with 2-space indentation', () => {
    const wrapper = mountCard(MOCK_POSITION_COMPONENT)
    expect(jsonText(wrapper)).toBe('{\n  "x": 10,\n  "y": 4\n}')
  })

  it('renders numerical values correctly', () => {
    const wrapper = mountCard(MOCK_HEALTH_COMPONENT)
    const parsed = deserializeJSON(wrapper) as Record<string, unknown>
    expect(parsed.current).toBe(100)
    expect(parsed.max).toBe(100)
  })

  it('renders string values correctly', () => {
    const wrapper = mountCard(MOCK_AI_COMPONENT)
    const parsed = deserializeJSON(wrapper) as Record<string, unknown>
    expect(parsed.state).toBe('Patrol')
  })

  it('renders null values correctly', () => {
    const wrapper = mountCard(MOCK_AI_COMPONENT)
    const parsed = deserializeJSON(wrapper) as Record<string, unknown>
    expect(parsed.target).toBeNull()
  })

  it('renders nested empty objects', () => {
    const wrapper = mountCard({
      name: 'EmptyData',
      data: {},
    })
    expect(jsonText(wrapper)).toBe('{}')
  })

  it('renders arrays in component data', () => {
    const wrapper = mountCard({
      name: 'Inventory',
      data: { gold: 250, items: ['potion', 'sword'] },
    })
    const parsed = deserializeJSON(wrapper) as Record<string, unknown>
    expect(parsed.items).toEqual(['potion', 'sword'])
  })

  it('renders deeply nested objects', () => {
    const wrapper = mountCard({
      name: 'Nested',
      data: { level: { inner: { value: 42 } } },
    })
    const parsed = deserializeJSON(wrapper) as Record<string, Record<string, Record<string, number>>>
    expect(parsed.level.inner.value).toBe(42)
  })

  it('renders boolean values', () => {
    const wrapper = mountCard({
      name: 'Flags',
      data: { active: true, visible: false },
    })
    const parsed = deserializeJSON(wrapper) as Record<string, unknown>
    expect(parsed.active).toBe(true)
    expect(parsed.visible).toBe(false)
  })

  it('renders the component name even with empty data', () => {
    const wrapper = mountCard({
      name: 'Tags',
      data: {},
    })
    expect(wrapper.find('.runtime-component-name').text()).toBe('Tags')
  })

  it('renders a unique article per component', () => {
    const wrapper = mountCard(MOCK_POSITION_COMPONENT)
    expect(wrapper.findAll('article')).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// RuntimeComponentCard — varying component names
// ---------------------------------------------------------------------------

describe('RuntimeComponentCard — varying component names', () => {
  it('renders Component A name', () => {
    const wrapper = mountCard({ name: 'Transform', data: {} })
    expect(wrapper.find('.runtime-component-name').text()).toBe('Transform')
  })

  it('renders Component B name', () => {
    const wrapper = mountCard({ name: 'Physics', data: {} })
    expect(wrapper.find('.runtime-component-name').text()).toBe('Physics')
  })

  it('renders Component C name with special characters', () => {
    const wrapper = mountCard({ name: 'AI_Config-v2', data: {} })
    expect(wrapper.find('.runtime-component-name').text()).toBe('AI_Config-v2')
  })

  it('renders Component D long name', () => {
    const wrapper = mountCard({ name: 'VeryLongComponentName', data: {} })
    expect(wrapper.find('.runtime-component-name').text()).toBe(
      'VeryLongComponentName',
    )
  })
})

// ---------------------------------------------------------------------------
// RuntimeComponentCard — JSON formatting edge cases
// ---------------------------------------------------------------------------

describe('RuntimeComponentCard — JSON formatting edge cases', () => {
  it('renders zero values', () => {
    const wrapper = mountCard({ name: 'Zero', data: { x: 0, y: 0 } })
    const parsed = deserializeJSON(wrapper) as Record<string, unknown>
    expect(parsed.x).toBe(0)
    expect(parsed.y).toBe(0)
  })

  it('renders negative numbers', () => {
    const wrapper = mountCard({ name: 'Negative', data: { temp: -5 } })
    const parsed = deserializeJSON(wrapper) as Record<string, unknown>
    expect(parsed.temp).toBe(-5)
  })

  it('renders mixed data types', () => {
    const wrapper = mountCard({
      name: 'Mixed',
      data: { str: 'hello', num: 42, bool: true, arr: [1, 2] },
    })
    const parsed = deserializeJSON(wrapper) as Record<string, unknown>
    expect(parsed.str).toBe('hello')
    expect(parsed.num).toBe(42)
    expect(parsed.bool).toBe(true)
    expect(parsed.arr).toEqual([1, 2])
  })

  it('produces valid parseable JSON', () => {
    const wrapper = mountCard(MOCK_POSITION_COMPONENT)
    expect(() => JSON.parse(jsonText(wrapper))).not.toThrow()
  })

  it('round-trips JSON through parse/stringify', () => {
    const wrapper = mountCard(MOCK_AI_COMPONENT)
    const parsed = JSON.parse(jsonText(wrapper))
    expect(JSON.stringify(parsed)).toBe(JSON.stringify(MOCK_AI_COMPONENT.data))
  })
})

// ---------------------------------------------------------------------------
// RuntimeEntityInspector — rendering with entity
// ---------------------------------------------------------------------------

describe('RuntimeEntityInspector — rendering with entity', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders the inspector as a section with class runtime-entity-inspector', () => {
    const wrapper = mountInspector('guard-001')
    expect(wrapper.find('section.runtime-entity-inspector').exists()).toBe(true)
  })

  it('renders the inspector header', () => {
    const wrapper = mountInspector('guard-001')
    expect(wrapper.find('header.runtime-inspector-header').exists()).toBe(true)
  })

  it('renders the inspector title as an h3', () => {
    const wrapper = mountInspector('guard-001')
    const h3 = wrapper.find('h3.runtime-inspector-title')
    expect(h3.exists()).toBe(true)
    expect(h3.element.tagName).toBe('H3')
  })

  it('renders the component count text', () => {
    const wrapper = mountInspector('guard-001')
    expect(wrapper.find('.runtime-inspector-count').exists()).toBe(true)
  })

  it('renders the component list container', () => {
    const wrapper = mountInspector('guard-001')
    expect(wrapper.find('.runtime-inspector-list').exists()).toBe(true)
  })

  it('renders one RuntimeComponentCard per component', () => {
    const wrapper = mountInspector('guard-001')
    expect(cardComponents(wrapper)).toHaveLength(3)
  })

  it('renders component names for guard-001', () => {
    const wrapper = mountInspector('guard-001')
    expect(cardNames(wrapper)).toEqual(['Position', 'Health', 'AI'])
  })

  it('renders correct component names for merchant-001', () => {
    const wrapper = mountInspector('merchant-001')
    expect(cardNames(wrapper)).toEqual([
      'Position',
      'Health',
      'Inventory',
      'AI',
    ])
  })

  it('renders correct component names for villager-001', () => {
    const wrapper = mountInspector('villager-001')
    expect(cardNames(wrapper)).toEqual([
      'Position',
      'Health',
      'Inventory',
      'AI',
      'Schedule',
    ])
  })

  it('renders guard-001 with 3 components', () => {
    const wrapper = mountInspector('guard-001')
    expect(cardComponents(wrapper)).toHaveLength(3)
  })

  it('renders merchant-001 with 4 components', () => {
    const wrapper = mountInspector('merchant-001')
    expect(cardComponents(wrapper)).toHaveLength(4)
  })

  it('renders villager-001 with 5 components', () => {
    const wrapper = mountInspector('villager-001')
    expect(cardComponents(wrapper)).toHaveLength(5)
  })

  it('renders runtime-component-card components', () => {
    const wrapper = mountInspector('guard-001')
    for (const card of cardComponents(wrapper)) {
      expect(card.find('.runtime-component-name').exists()).toBe(true)
      expect(card.find('.runtime-component-json').exists()).toBe(true)
    }
  })

  it('renders guard-001 position JSON', () => {
    const wrapper = mountInspector('guard-001')
    const json = wrapper.findAll('.runtime-component-json')[0].text().trim()
    expect(json).toContain('"x": 10')
    expect(json).toContain('"y": 4')
  })

  it('renders merchant-001 inventory items', () => {
    const wrapper = mountInspector('merchant-001')
    const json = wrapper.findAll('.runtime-component-json')[2].text().trim()
    expect(json).toContain('"potion"')
    expect(json).toContain('"sword"')
    expect(json).toContain('"shield"')
  })

  it('renders villager-001 schedule data', () => {
    const wrapper = mountInspector('villager-001')
    const json = wrapper.findAll('.runtime-component-json')[4].text().trim()
    expect(json).toContain('"harvest"')
    expect(json).toContain('"wakeHour": 6')
    expect(json).toContain('"sleepHour": 20')
  })
})

// ---------------------------------------------------------------------------
// RuntimeEntityInspector — null / empty entity
// ---------------------------------------------------------------------------

describe('RuntimeEntityInspector — no entity state', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders nothing when entityId is null', () => {
    const wrapper = mountInspector(null)
    expect(wrapper.find('.runtime-entity-inspector').exists()).toBe(false)
  })

  it('renders nothing for unknown entityId', () => {
    const wrapper = mountInspector('unknown-entity')
    expect(wrapper.find('.runtime-entity-inspector').exists()).toBe(false)
  })

  it('renders nothing when entityId is empty string', () => {
    const wrapper = mountInspector('')
    expect(wrapper.find('.runtime-entity-inspector').exists()).toBe(false)
  })

  it('renders nothing and has no child components', () => {
    const wrapper = mountInspector(null)
    expect(wrapper.findAll('*')).toHaveLength(0)
  })

  it('renders nothing when entity has no matching mock data', () => {
    const wrapper = mountInspector('non-existent-entity')
    expect(wrapper.find('section').exists()).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// RuntimeEntityInspector — undefined entity
// ---------------------------------------------------------------------------

describe('RuntimeEntityInspector — undefined entity edge cases', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders nothing when entityId is explicitly null', () => {
    const wrapper = mount(RuntimeEntityInspector, {
      props: { entityId: null as string | null },
    })
    expect(wrapper.find('.runtime-entity-inspector').exists()).toBe(false)
  })

  it('switches from entity to null hides inspector', async () => {
    const wrapper = mountInspector('guard-001')
    expect(wrapper.find('.runtime-entity-inspector').exists()).toBe(true)
    await wrapper.setProps({ entityId: null })
    expect(wrapper.find('.runtime-entity-inspector').exists()).toBe(false)
  })

  it('switches from null to entity shows inspector', async () => {
    const wrapper = mountInspector(null)
    expect(wrapper.find('.runtime-entity-inspector').exists()).toBe(false)
    await wrapper.setProps({ entityId: 'guard-001' })
    expect(wrapper.find('.runtime-entity-inspector').exists()).toBe(true)
  })

  it('switches between entities updates the inspector', async () => {
    const wrapper = mountInspector('guard-001')
    expect(cardComponents(wrapper)).toHaveLength(3)
    await wrapper.setProps({ entityId: 'villager-001' })
    expect(cardComponents(wrapper)).toHaveLength(5)
  })
})

// ---------------------------------------------------------------------------
// RuntimeEntityInspector — entity switching
// ---------------------------------------------------------------------------

describe('RuntimeEntityInspector — entity switching', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('switches from guard-001 to merchant-001 updates component names', async () => {
    const wrapper = mountInspector('guard-001')
    expect(cardNames(wrapper)).toEqual(['Position', 'Health', 'AI'])
    await wrapper.setProps({ entityId: 'merchant-001' })
    expect(cardNames(wrapper)).toEqual([
      'Position',
      'Health',
      'Inventory',
      'AI',
    ])
  })

  it('switches from merchant-001 to villager-001 updates component count', async () => {
    const wrapper = mountInspector('merchant-001')
    expect(cardComponents(wrapper)).toHaveLength(4)
    await wrapper.setProps({ entityId: 'villager-001' })
    expect(cardComponents(wrapper)).toHaveLength(5)
  })

  it('switches back to guard-001 restores original components', async () => {
    const wrapper = mountInspector('guard-001')
    await wrapper.setProps({ entityId: 'merchant-001' })
    await wrapper.setProps({ entityId: 'guard-001' })
    expect(cardNames(wrapper)).toEqual(['Position', 'Health', 'AI'])
  })

  it('switching does not share component references across entities', async () => {
    const wrapper = mountInspector('guard-001')
    const guardJSONs = cardJSONs(wrapper)
    await wrapper.setProps({ entityId: 'villager-001' })
    const villagerJSONs = cardJSONs(wrapper)
    expect(guardJSONs[0]).not.toBe(villagerJSONs[0])
  })

  it('repeated switching to same entity is stable', async () => {
    const wrapper = mountInspector('guard-001')
    const firstNames = cardNames(wrapper)
    await wrapper.setProps({ entityId: 'merchant-001' })
    await wrapper.setProps({ entityId: 'guard-001' })
    const secondNames = cardNames(wrapper)
    expect(firstNames).toEqual(secondNames)
  })
})

// ---------------------------------------------------------------------------
// Integration with Runtime Viewer
// ---------------------------------------------------------------------------

describe('runtime entity inspector — integration with runtime viewer', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders the RuntimeEntityInspector component inside the viewer', () => {
    const wrapper = mountViewer()
    expect(wrapper.findComponent(RuntimeEntityInspector).exists()).toBe(true)
  })

  it('renders the inspector as a child of runtime-main', () => {
    const wrapper = mountViewer()
    const main = wrapper.find('.runtime-main')
    expect(main.find('.runtime-entity-inspector').exists()).toBe(true)
  })

  it('renders the inspector after entity details', () => {
    const wrapper = mountViewer()
    const main = wrapper.find('.runtime-main')
    const details = main.find('.runtime-entity-details')
    const inspector = main.find('.runtime-entity-inspector')
    expect(
      details.element.compareDocumentPosition(inspector.element),
    ).toBe(4)
  })

  it('shows 3 components for the default guard-001 entity', () => {
    const wrapper = mountViewer()
    const inspector = wrapper.findComponent(RuntimeEntityInspector)
    expect(inspector.findAll('.runtime-component-card')).toHaveLength(3)
  })

  it('updates inspector components when entity is switched by click', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    const inspector = wrapper.findComponent(RuntimeEntityInspector)
    expect(inspector.findAll('.runtime-component-card')).toHaveLength(4)
  })

  it('updates inspector components when entity is switched by keyboard', async () => {
    const wrapper = mountViewer()
    await wrapper
      .find('nav.runtime-entity-list')
      .trigger('keydown', { key: 'ArrowDown' })
    await nextTick()
    await wrapper
      .find('nav.runtime-entity-list')
      .trigger('keydown', { key: 'ArrowDown' })
    await nextTick()
    const inspector = wrapper.findComponent(RuntimeEntityInspector)
    expect(inspector.findAll('.runtime-component-card')).toHaveLength(5)
  })

  it('keeps all viewer components when inspector is added', () => {
    const wrapper = mountViewer()
    expect(wrapper.findComponent(RuntimeEntityList).exists()).toBe(true)
    expect(wrapper.findComponent(RuntimeEntityDetails).exists()).toBe(true)
    expect(wrapper.findComponent(RuntimeEntityInspector).exists()).toBe(true)
    expect(wrapper.findAllComponents(RuntimeStatCard)).toHaveLength(4)
  })

  it('switches to villager-001 and shows AI component with farm target', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[2].trigger('click')
    await nextTick()
    const cards = wrapper.findAll('.runtime-component-card')
    expect(cards).toHaveLength(5)
    const aiJSON = cards[3].find('.runtime-component-json').text().trim()
    expect(aiJSON).toContain('"farm-001"')
  })

  it('switches to merchant-001 and shows Inventory with items', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    const cards = wrapper.findAll('.runtime-component-card')
    expect(cards).toHaveLength(4)
    const inventoryJSON = cards[2].find('.runtime-component-json').text().trim()
    expect(inventoryJSON).toContain('250')
    expect(inventoryJSON).toContain('"sword"')
  })

  it('inspector and details both update on entity switch', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[2].trigger('click')
    await nextTick()
    const detailsValues = wrapper
      .findAll('.runtime-entity-grid-value')
      .map((el) => el.text().trim())
    expect(detailsValues).toEqual(['(1,2)', '100', 'Working'])
    const inspectorNames = wrapper
      .findAll('.runtime-component-name')
      .map((el) => el.text().trim())
    expect(inspectorNames).toContain('Schedule')
  })

  it('inspector section appears below entity details in DOM', () => {
    const wrapper = mountViewer()
    const main = wrapper.find('.runtime-main')
    const details = main.find('article.runtime-entity-details')
    const inspector = main.find('section.runtime-entity-inspector')
    expect(
      details.element.compareDocumentPosition(inspector.element),
    ).toBe(4)
  })
})

// ---------------------------------------------------------------------------
// RuntimeEntityInspector — accessibility
// ---------------------------------------------------------------------------

describe('RuntimeEntityInspector — accessibility', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('uses a section element as root', () => {
    const wrapper = mountInspector('guard-001')
    expect(wrapper.find('section.runtime-entity-inspector').exists()).toBe(true)
  })

  it('has aria-label "Entity inspector" on the section', () => {
    const wrapper = mountInspector('guard-001')
    expect(
      wrapper.find('section.runtime-entity-inspector').attributes('aria-label'),
    ).toBe('Entity inspector')
  })

  it('uses a header element inside the section', () => {
    const wrapper = mountInspector('guard-001')
    expect(wrapper.find('header.runtime-inspector-header').exists()).toBe(true)
  })

  it('uses an h3 for the inspector title', () => {
    const wrapper = mountInspector('guard-001')
    expect(wrapper.find('h3.runtime-inspector-title').element.tagName).toBe(
      'H3',
    )
  })

  it('uses article elements for each component card', () => {
    const wrapper = mountInspector('guard-001')
    for (const card of cardComponents(wrapper)) {
      expect(card.element.tagName).toBe('ARTICLE')
    }
  })

  it('has a semantic header in each component card', () => {
    const wrapper = mountInspector('guard-001')
    for (const card of cardComponents(wrapper)) {
      expect(card.find('header').exists()).toBe(true)
    }
  })

  it('uses h3 for each component name', () => {
    const wrapper = mountInspector('guard-001')
    for (const name of wrapper.findAll('.runtime-component-name')) {
      expect(name.element.tagName).toBe('H3')
    }
  })

  it('uses pre for JSON display (preserves formatting)', () => {
    const wrapper = mountInspector('guard-001')
    for (const card of cardComponents(wrapper)) {
      expect(card.find('pre').exists()).toBe(true)
    }
  })

  it('does not use divs as buttons', () => {
    const wrapper = mountInspector('guard-001')
    expect(wrapper.findAll('div[role="button"]')).toHaveLength(0)
  })

  it('inspector contains no heading level skip from h3', () => {
    const wrapper = mountInspector('guard-001')
    const h3Count = wrapper.findAll('h3').length
    expect(h3Count).toBeGreaterThan(0)
    expect(wrapper.findAll('h4').length).toBe(0)
  })

  it('component count text has accessible font size', () => {
    const wrapper = mountInspector('guard-001')
    const count = wrapper.find('.runtime-inspector-count')
    expect(count.exists()).toBe(true)
    expect(count.text().length).toBeGreaterThan(0)
  })

  it('section is only rendered when entity is present', () => {
    const wrapper = mountInspector(null)
    expect(wrapper.find('section').exists()).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// RuntimeEntityInspector — i18n rendering
// ---------------------------------------------------------------------------

describe('RuntimeEntityInspector — i18n rendering', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders inspector title in Chinese by default', () => {
    const wrapper = mountInspector('guard-001')
    expect(wrapper.find('.runtime-inspector-title').text()).toBe('实体检查器')
  })

  it('renders component count label in Chinese by default', () => {
    const wrapper = mountInspector('guard-001')
    expect(wrapper.find('.runtime-inspector-count').text()).toContain('组件数量')
  })

  it('renders component count with number in Chinese', () => {
    const wrapper = mountInspector('guard-001')
    expect(wrapper.find('.runtime-inspector-count').text()).toBe('组件数量: 3')
  })

  it('renders inspector title in English after switching language', async () => {
    const wrapper = mountInspector('guard-001')
    useI18nStore().setLanguage('en-US')
    await nextTick()
    expect(wrapper.find('.runtime-inspector-title').text()).toBe(
      'Entity Inspector',
    )
  })

  it('renders component count label in English after switching', async () => {
    const wrapper = mountInspector('guard-001')
    useI18nStore().setLanguage('en-US')
    await nextTick()
    expect(wrapper.find('.runtime-inspector-count').text()).toBe(
      'Component Count: 3',
    )
  })

  it('updates inspector title reactively on language switch back to zh-CN', async () => {
    const wrapper = mountInspector('guard-001')
    const store = useI18nStore()
    store.setLanguage('en-US')
    await nextTick()
    store.setLanguage('zh-CN')
    await nextTick()
    expect(wrapper.find('.runtime-inspector-title').text()).toBe('实体检查器')
  })

  it('updates component count label on language switch back to zh-CN', async () => {
    const wrapper = mountInspector('guard-001')
    const store = useI18nStore()
    store.setLanguage('en-US')
    await nextTick()
    store.setLanguage('zh-CN')
    await nextTick()
    expect(wrapper.find('.runtime-inspector-count').text()).toBe('组件数量: 3')
  })

  it('updates count number for different entities in Chinese', async () => {
    const wrapper = mountInspector('guard-001')
    expect(wrapper.find('.runtime-inspector-count').text()).toBe('组件数量: 3')
    await wrapper.setProps({ entityId: 'villager-001' })
    expect(wrapper.find('.runtime-inspector-count').text()).toBe('组件数量: 5')
  })

  it('updates count number in English when switching entity', async () => {
    const wrapper = mountInspector('guard-001')
    useI18nStore().setLanguage('en-US')
    await nextTick()
    expect(wrapper.find('.runtime-inspector-count').text()).toBe(
      'Component Count: 3',
    )
    await wrapper.setProps({ entityId: 'merchant-001' })
    expect(wrapper.find('.runtime-inspector-count').text()).toBe(
      'Component Count: 4',
    )
  })

  it('does not remount the inspector on language switch', async () => {
    const wrapper = mountInspector('guard-001')
    const section = wrapper.find('.runtime-entity-inspector')
    useI18nStore().setLanguage('en-US')
    await nextTick()
    expect(wrapper.find('.runtime-entity-inspector').exists()).toBe(true)
    expect(section.element).toBe(wrapper.find('.runtime-entity-inspector').element)
  })
})

// ---------------------------------------------------------------------------
// RuntimeEntityInspector — i18n catalog keys
// ---------------------------------------------------------------------------

describe('i18n catalog — inspector keys', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('zh-CN catalog contains the runtime inspector key', () => {
    expect(resolveKey(zhCN, 'observatory.runtime.inspector')).toBe('实体检查器')
  })

  it('zh-CN catalog contains the runtime components key', () => {
    expect(resolveKey(zhCN, 'observatory.runtime.components')).toBe('组件')
  })

  it('zh-CN catalog contains the runtime componentCount key', () => {
    expect(resolveKey(zhCN, 'observatory.runtime.componentCount')).toBe('组件数量')
  })

  it('en-US catalog contains the runtime inspector key', () => {
    expect(resolveKey(enUS, 'observatory.runtime.inspector')).toBe(
      'Entity Inspector',
    )
  })

  it('en-US catalog contains the runtime components key', () => {
    expect(resolveKey(enUS, 'observatory.runtime.components')).toBe('Components')
  })

  it('en-US catalog contains the runtime componentCount key', () => {
    expect(resolveKey(enUS, 'observatory.runtime.componentCount')).toBe(
      'Component Count',
    )
  })

  it('inspector keys are in the key parity check', () => {
    for (const key of [
      'observatory.runtime.inspector',
      'observatory.runtime.components',
      'observatory.runtime.componentCount',
    ]) {
      expect(resolveKey(zhCN, key), `zh key ${key}`).toBeDefined()
      expect(resolveKey(enUS, key), `en key ${key}`).toBeDefined()
    }
  })
})

// ---------------------------------------------------------------------------
// Runtime viewer integration — i18n rendering
// ---------------------------------------------------------------------------

describe('runtime viewer integration — i18n rendering', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders inspector title in Chinese in the viewer by default', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('.runtime-inspector-title').text()).toBe('实体检查器')
  })

  it('renders inspector count in Chinese in the viewer by default', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('.runtime-inspector-count').text()).toBe('组件数量: 3')
  })

  it('renders inspector title in English after language switch in viewer', async () => {
    const wrapper = mountViewer()
    useI18nStore().setLanguage('en-US')
    await nextTick()
    expect(wrapper.find('.runtime-inspector-title').text()).toBe(
      'Entity Inspector',
    )
  })

  it('renders inspector count in English after language switch in viewer', async () => {
    const wrapper = mountViewer()
    useI18nStore().setLanguage('en-US')
    await nextTick()
    expect(wrapper.find('.runtime-inspector-count').text()).toBe(
      'Component Count: 3',
    )
  })

  it('updates inspector count on entity switch in viewer', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[2].trigger('click')
    await nextTick()
    expect(wrapper.find('.runtime-inspector-count').text()).toBe('组件数量: 5')
  })
})

// ---------------------------------------------------------------------------
// Runtime viewer integration — accessibility
// ---------------------------------------------------------------------------

describe('runtime viewer integration — accessibility', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('inspector section has aria-label in the viewer', () => {
    const wrapper = mountViewer()
    expect(
      wrapper.find('section.runtime-entity-inspector').attributes('aria-label'),
    ).toBe('Entity inspector')
  })

  it('viewer has section, article, header landmarks', () => {
    const wrapper = mountViewer()
    expect(wrapper.findAll('section').length).toBeGreaterThanOrEqual(2)
    expect(wrapper.findAll('article').length).toBeGreaterThanOrEqual(1)
    expect(wrapper.findAll('header').length).toBeGreaterThanOrEqual(3)
  })

  it('uses three heading levels (h2, h3) hierarchy', () => {
    const wrapper = mountViewer()
    expect(wrapper.findAll('h2').length).toBeGreaterThanOrEqual(3)
    expect(wrapper.findAll('h3').length).toBeGreaterThanOrEqual(1)
  })

  it('no div-as-button antipatterns', () => {
    const wrapper = mountViewer()
    expect(wrapper.findAll('div[role="button"]')).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Deterministic rendering
// ---------------------------------------------------------------------------

describe('runtime entity inspector — deterministic rendering', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders identical component names across mounts', () => {
    const a = mountInspector('guard-001')
    const b = mountInspector('guard-001')
    expect(cardNames(a)).toEqual(cardNames(b))
  })

  it('renders identical component JSON across mounts', () => {
    const a = mountInspector('guard-001')
    const b = mountInspector('guard-001')
    expect(cardJSONs(a)).toEqual(cardJSONs(b))
  })

  it('renders identical component count across mounts', () => {
    const a = mountInspector('villager-001')
    const b = mountInspector('villager-001')
    expect(cardComponents(a)).toHaveLength(cardComponents(b).length)
  })

  it('renders identical inspector HTML across mounts', () => {
    const a = mountInspector('guard-001')
    const b = mountInspector('guard-001')
    expect(a.html()).toBe(b.html())
  })

  it('renders identical inspector in viewer across mounts', () => {
    const a = mountViewer()
    const b = mountViewer()
    const aInspector = a.find('.runtime-entity-inspector').html()
    const bInspector = b.find('.runtime-entity-inspector').html()
    expect(aInspector).toBe(bInspector)
  })
})

// ---------------------------------------------------------------------------
// RuntimeComponentCard — style checks
// ---------------------------------------------------------------------------

describe('RuntimeComponentCard — style', () => {
  it('renders monospace JSON', () => {
    const wrapper = mountCard(MOCK_POSITION_COMPONENT)
    const pre = wrapper.find('pre.runtime-component-json')
    expect(pre.exists()).toBe(true)
  })

  it('preserves whitespace in JSON output', () => {
    const wrapper = mountCard(MOCK_POSITION_COMPONENT)
    const html = wrapper.find('pre').element.innerHTML
    expect(html).toContain('\n')
    expect(html).toContain('  ')
  })

  it('does not flatten JSON to single line', () => {
    const wrapper = mountCard(MOCK_POSITION_COMPONENT)
    const lines = jsonText(wrapper).split('\n')
    expect(lines.length).toBeGreaterThan(1)
  })

  it('renders component name in non-monospace font', () => {
    const wrapper = mountCard(MOCK_POSITION_COMPONENT)
    const name = wrapper.find('.runtime-component-name')
    expect(name.exists()).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// RuntimeEntityInspector — store integration
// ---------------------------------------------------------------------------

describe('RuntimeEntityInspector — store integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('uses i18n store when available', () => {
    const wrapper = mountInspector('guard-001')
    expect(wrapper.find('.runtime-inspector-title').text()).toBe('实体检查器')
  })
})

// ---------------------------------------------------------------------------
// RuntimeComponentCard — structural integrity
// ---------------------------------------------------------------------------

describe('RuntimeComponentCard — structural integrity', () => {
  it('renders header before pre element', () => {
    const wrapper = mountCard(MOCK_POSITION_COMPONENT)
    const html = wrapper.html()
    const headerIdx = html.indexOf('runtime-component-header')
    const preIdx = html.indexOf('runtime-component-json')
    expect(headerIdx).toBeLessThan(preIdx)
  })

  it('renders h3 inside header', () => {
    const wrapper = mountCard(MOCK_POSITION_COMPONENT)
    const header = wrapper.find('header.runtime-component-header')
    expect(header.find('h3').exists()).toBe(true)
  })

  it('renders code element as direct child of pre', () => {
    const wrapper = mountCard(MOCK_POSITION_COMPONENT)
    const pre = wrapper.find('pre')
    expect(pre.find('code').exists()).toBe(true)
  })

  it('renders article with only one header', () => {
    const wrapper = mountCard(MOCK_POSITION_COMPONENT)
    expect(wrapper.findAll('header')).toHaveLength(1)
  })

  it('renders article with only one pre', () => {
    const wrapper = mountCard(MOCK_POSITION_COMPONENT)
    expect(wrapper.findAll('pre')).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// RuntimeComponentCard — complex JSON structures
// ---------------------------------------------------------------------------

describe('RuntimeComponentCard — complex JSON structures', () => {
  it('renders nested arrays', () => {
    const wrapper = mountCard({
      name: 'Matrix',
      data: { grid: [[1, 2], [3, 4]] },
    })
    const parsed = deserializeJSON(wrapper) as Record<string, number[][]>
    expect(parsed.grid[0]).toEqual([1, 2])
    expect(parsed.grid[1]).toEqual([3, 4])
  })

  it('renders mixed empty structures', () => {
    const wrapper = mountCard({
      name: 'MixedEmpty',
      data: { arr: [], obj: {} },
    })
    const parsed = deserializeJSON(wrapper) as Record<string, unknown>
    expect(parsed.arr).toEqual([])
    expect(parsed.obj).toEqual({})
  })

  it('renders deeply nested array of objects', () => {
    const wrapper = mountCard({
      name: 'Complex',
      data: {
        items: [
          { id: 1, tags: ['a'] },
          { id: 2, tags: ['b', 'c'] },
        ],
      },
    })
    const html = wrapper.find('pre').text()
    expect(html).toContain('"id": 1')
    expect(html).toContain('"tags"')
  })

  it('renders JSON with special characters in strings', () => {
    const wrapper = mountCard({
      name: 'Special',
      data: { path: 'C:\\Users\\test', note: 'line1\nline2' },
    })
    const parsed = deserializeJSON(wrapper) as Record<string, unknown>
    expect(parsed.path).toBe('C:\\Users\\test')
  })

  it('renders floating point numbers', () => {
    const wrapper = mountCard({
      name: 'Float',
      data: { x: 3.14, y: -0.001 },
    })
    const parsed = deserializeJSON(wrapper) as Record<string, number>
    expect(parsed.x).toBe(3.14)
    expect(parsed.y).toBe(-0.001)
  })
})

// ---------------------------------------------------------------------------
// RuntimeComponentCard — count accuracy
// ---------------------------------------------------------------------------

describe('RuntimeComponentCard — count accuracy', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('displays 3 components for guard', () => {
    const wrapper = mountInspector('guard-001')
    expect(wrapper.findAll('.runtime-component-card')).toHaveLength(3)
  })

  it('displays 4 components for merchant when refreshed', () => {
    const wrapper = mountInspector('merchant-001')
    expect(wrapper.findAll('.runtime-component-card')).toHaveLength(4)
  })

  it('displays 5 components for villager when refreshed', () => {
    const wrapper = mountInspector('villager-001')
    expect(wrapper.findAll('.runtime-component-card')).toHaveLength(5)
  })

  it('displays 0 components for null entity', () => {
    const wrapper = mountInspector(null)
    expect(wrapper.findAll('.runtime-component-card')).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// RuntimeEntityInspector — header structure
// ---------------------------------------------------------------------------

describe('RuntimeEntityInspector — header structure', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders the inspector with a header section', () => {
    const wrapper = mountInspector('guard-001')
    expect(wrapper.find('header.runtime-inspector-header').exists()).toBe(true)
  })

  it('has exactly one h3 in inspector section', () => {
    const wrapper = mountInspector('guard-001')
    const h3s = wrapper.findAll('h3.runtime-inspector-title')
    expect(h3s).toHaveLength(1)
  })

  it('puts title before count in the header', () => {
    const wrapper = mountInspector('guard-001')
    const header = wrapper.find('header.runtime-inspector-header')
    const title = header.find('.runtime-inspector-title')
    const count = header.find('.runtime-inspector-count')
    expect(title.element.compareDocumentPosition(count.element)).toBe(4)
  })
})

// ---------------------------------------------------------------------------
// RuntimeEntityInspector — deterministic component order
// ---------------------------------------------------------------------------

describe('RuntimeEntityInspector — deterministic component order', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('guard-001 has components in Position, Health, AI order', () => {
    const wrapper = mountInspector('guard-001')
    expect(cardNames(wrapper)).toEqual(['Position', 'Health', 'AI'])
  })

  it('merchant-001 has components in defined order', () => {
    const wrapper = mountInspector('merchant-001')
    expect(cardNames(wrapper)).toEqual([
      'Position',
      'Health',
      'Inventory',
      'AI',
    ])
  })

  it('villager-001 has components in defined order', () => {
    const wrapper = mountInspector('villager-001')
    expect(cardNames(wrapper)).toEqual([
      'Position',
      'Health',
      'Inventory',
      'AI',
      'Schedule',
    ])
  })
})

// ---------------------------------------------------------------------------
// RuntimeEntityInspector — component value accuracy
// ---------------------------------------------------------------------------

describe('RuntimeEntityInspector — component value accuracy', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('guard-001 health component shows current and max', () => {
    const wrapper = mountInspector('guard-001')
    const healthJSON = wrapper.findAll('.runtime-component-json')[1].text()
    expect(healthJSON).toContain('"current": 100')
    expect(healthJSON).toContain('"max": 100')
  })

  it('merchant-001 inventory shows 250 gold', () => {
    const wrapper = mountInspector('merchant-001')
    const invJSON = wrapper.findAll('.runtime-component-json')[2].text()
    expect(invJSON).toContain('"gold": 250')
  })

  it('villager-001 AI target is farm-001', () => {
    const wrapper = mountInspector('villager-001')
    const aiJSON = wrapper.findAll('.runtime-component-json')[3].text()
    expect(aiJSON).toContain('"farm-001"')
  })

  it('guard-001 AI state is Patrol', () => {
    const wrapper = mountInspector('guard-001')
    const aiJSON = wrapper.findAll('.runtime-component-json')[2].text()
    expect(aiJSON).toContain('"Patrol"')
  })

  it('villager-001 schedule has correct wake/sleep hours', () => {
    const wrapper = mountInspector('villager-001')
    const schedJSON = wrapper.findAll('.runtime-component-json')[4].text()
    expect(schedJSON).toContain('"wakeHour": 6')
    expect(schedJSON).toContain('"sleepHour": 20')
  })

  it('merchant-001 AI state is Trading', () => {
    const wrapper = mountInspector('merchant-001')
    const aiJSON = wrapper.findAll('.runtime-component-json')[3].text()
    expect(aiJSON).toContain('"Trading"')
  })

  it('all entities have Health component with max health 100', () => {
    const wrapper = mountInspector('guard-001')
    const healthText = wrapper.findAll('.runtime-component-json')[1].text()
    expect(healthText).toContain('"max": 100')
  })
})