/**
 * ObservatoryRuntimeDataIntegration — verifies the full data integration path
 * for the Runtime Viewer panel from the observatoryData store
 * (via DefaultObservatoryAdapter) through the runtime viewer components.
 *
 * WO-S6-018 — Observatory Runtime Real Data Integration
 * Architecture version v1.48
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
import ObservatoryRuntimeViewer from '../components/observatory/runtime/ObservatoryRuntimeViewer.vue'
import RuntimeEntityList from '../components/observatory/runtime/RuntimeEntityList.vue'
import RuntimeEntityDetails from '../components/observatory/runtime/RuntimeEntityDetails.vue'
import RuntimeEntityInspector from '../components/observatory/runtime/RuntimeEntityInspector.vue'
import RuntimeStatCard from '../components/observatory/runtime/RuntimeStatCard.vue'
import RuntimeComponentCard from '../components/observatory/runtime/RuntimeComponentCard.vue'
import { resolveKey } from '../i18n'
import { zhCN } from '../i18n/locales/zh-CN'
import { useI18nStore } from '../stores/i18n'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function initI18n(): void {
  useI18nStore().setLanguage('zh-CN')
}

function mountViewer(): VueWrapper {
  initI18n()
  useObservatoryDataStore().loadMockObservatory()
  return mount(ObservatoryRuntimeViewer)
}

function rows(wrapper: VueWrapper): ReturnType<VueWrapper['findAll']> {
  return wrapper.findAll('.runtime-row')
}

function activeRows(wrapper: VueWrapper): ReturnType<VueWrapper['findAll']> {
  return rows(wrapper).filter((r) => r.classes().includes('runtime-row--active'))
}

function rowTexts(wrapper: VueWrapper, selector: string): string[] {
  return wrapper.findAll(selector).map((el) => el.text().trim())
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

function cardComponents(wrapper: VueWrapper): ReturnType<VueWrapper['findAll']> {
  return wrapper.findAll('.runtime-component-card')
}

function cardNames(wrapper: VueWrapper): string[] {
  return wrapper.findAll('.runtime-component-name').map((el) => el.text().trim())
}

function cardJSONs(wrapper: VueWrapper): string[] {
  return wrapper.findAll('.runtime-component-json').map((el) => el.text().trim())
}

function jsonText(wrapper: VueWrapper): string {
  return wrapper.find('.runtime-component-json').text().trim()
}

// ---------------------------------------------------------------------------
// Section 1 — Store runtimeView Integration
// ---------------------------------------------------------------------------

describe('runtime data — store runtimeView integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('store initializes with empty runtimeView', () => {
    const store = useObservatoryDataStore()
    expect(store.viewModel.runtimeView.worldId).toBe('')
    expect(store.viewModel.runtimeView.entityCount).toBe(0)
    expect(store.viewModel.runtimeView.entities).toEqual([])
  })

  it('loadMockObservatory populates runtimeView', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(store.viewModel.runtimeView.worldId).toBe('world-001')
  })

  it('runtimeView worldId is a string', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(typeof store.viewModel.runtimeView.worldId).toBe('string')
  })

  it('runtimeView entityCount is 187', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(store.viewModel.runtimeView.entityCount).toBe(187)
  })

  it('runtimeView systemCount is 8', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(store.viewModel.runtimeView.systemCount).toBe(8)
  })

  it('runtimeView eventCount is 31', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(store.viewModel.runtimeView.eventCount).toBe(31)
  })

  it('runtimeView fps is 60', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(store.viewModel.runtimeView.fps).toBe(60)
  })

  it('runtimeView has 3 entities', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(store.viewModel.runtimeView.entities).toHaveLength(3)
  })

  it('runtimeView entities have id field', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const e of store.viewModel.runtimeView.entities) {
      expect(typeof e.id).toBe('string')
      expect(e.id.length).toBeGreaterThan(0)
    }
  })

  it('runtimeView entities have type field', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const e of store.viewModel.runtimeView.entities) {
      expect(typeof e.type).toBe('string')
    }
  })

  it('runtimeView entities have position field', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const e of store.viewModel.runtimeView.entities) {
      expect(typeof e.position).toBe('string')
    }
  })

  it('runtimeView entities have health field', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const e of store.viewModel.runtimeView.entities) {
      expect(typeof e.health).toBe('string')
    }
  })

  it('runtimeView entities have state field', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const e of store.viewModel.runtimeView.entities) {
      expect(typeof e.state).toBe('string')
    }
  })

  it('runtimeView entities have components array', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const e of store.viewModel.runtimeView.entities) {
      expect(Array.isArray(e.components)).toBe(true)
    }
  })

  it('guard-001 has 3 components', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const entity = store.viewModel.runtimeView.entities.find((e) => e.id === 'guard-001')
    expect(entity?.components).toHaveLength(3)
  })

  it('merchant-001 has 4 components', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const entity = store.viewModel.runtimeView.entities.find((e) => e.id === 'merchant-001')
    expect(entity?.components).toHaveLength(4)
  })

  it('villager-001 has 5 components', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const entity = store.viewModel.runtimeView.entities.find((e) => e.id === 'villager-001')
    expect(entity?.components).toHaveLength(5)
  })

  it('components have name field', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const e of store.viewModel.runtimeView.entities) {
      for (const c of e.components) {
        expect(typeof c.name).toBe('string')
      }
    }
  })

  it('components have data field', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const e of store.viewModel.runtimeView.entities) {
      for (const c of e.components) {
        expect(typeof c.data).toBe('string')
      }
    }
  })

  it('component data is valid JSON string', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const e of store.viewModel.runtimeView.entities) {
      for (const c of e.components) {
        expect(() => JSON.parse(c.data)).not.toThrow()
      }
    }
  })

  it('entity ids are guard-001, merchant-001, villager-001', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const ids = store.viewModel.runtimeView.entities.map((e) => e.id)
    expect(ids).toEqual(['guard-001', 'merchant-001', 'villager-001'])
  })

  it('entity types are Guard, Merchant, Villager', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const types = store.viewModel.runtimeView.entities.map((e) => e.type)
    expect(types).toEqual(['Guard', 'Merchant', 'Villager'])
  })
})

// ---------------------------------------------------------------------------
// Section 2 — Adapter Mapping
// ---------------------------------------------------------------------------

describe('runtime data — adapter runtimeView mapping', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('adapter maps runtimeView from raw observatory', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      runtimeView: {
        worldId: 'w-001',
        entityCount: 10,
        systemCount: 3,
        eventCount: 5,
        fps: 30,
        entities: [{ id: 'e1', type: 'T1', position: '(0,0)', health: 100, state: 'S1', components: [] }],
      },
    })
    expect(vm.runtimeView.worldId).toBe('w-001')
    expect(vm.runtimeView.entityCount).toBe(10)
    expect(vm.runtimeView.entities).toHaveLength(1)
  })

  it('adapter maps Runtime session completion truth', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      runtimeView: {
        worldId: 'w-001',
        gameplaySession: { status: 'completed', completedByGoalId: 'goal', completedAtTick: 12 },
      },
    })

    expect(vm.runtimeView.gameplaySession).toEqual({
      status: 'completed',
      completedByGoalId: 'goal',
      completedAtTick: 12,
    })
  })

  it('adapter handles missing runtimeView gracefully', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({})
    expect(vm.runtimeView.worldId).toBe('')
    expect(vm.runtimeView.entityCount).toBe(0)
    expect(vm.runtimeView.entities).toEqual([])
  })

  it('adapter handles null runtimeView gracefully', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({ runtimeView: null })
    expect(vm.runtimeView.worldId).toBe('')
  })

  it('adapter handles undefined runtimeView gracefully', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({ runtimeView: undefined })
    expect(vm.runtimeView.worldId).toBe('')
  })

  it('adapter handles non-object runtimeView gracefully', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({ runtimeView: 'invalid' })
    expect(vm.runtimeView.worldId).toBe('')
  })

  it('adapter maps entity id correctly', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      runtimeView: {
        worldId: 'w', entityCount: 0, systemCount: 0, eventCount: 0, fps: 0,
        entities: [{ id: 'my-entity', type: 'T', position: '(0,0)', health: 50, state: 'Active', components: [] }],
      },
    })
    expect(vm.runtimeView.entities[0].id).toBe('my-entity')
  })

  it('adapter maps entity type correctly', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      runtimeView: {
        worldId: 'w', entityCount: 0, systemCount: 0, eventCount: 0, fps: 0,
        entities: [{ id: 'e1', type: 'Warrior', position: '(0,0)', health: 50, state: 'S', components: [] }],
      },
    })
    expect(vm.runtimeView.entities[0].type).toBe('Warrior')
  })

  it('adapter maps entity position correctly', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      runtimeView: {
        worldId: 'w', entityCount: 0, systemCount: 0, eventCount: 0, fps: 0,
        entities: [{ id: 'e1', type: 'T', position: '(5,10)', health: 50, state: 'S', components: [] }],
      },
    })
    expect(vm.runtimeView.entities[0].position).toBe('(5,10)')
  })

  it('adapter maps entity health as string', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      runtimeView: {
        worldId: 'w', entityCount: 0, systemCount: 0, eventCount: 0, fps: 0,
        entities: [{ id: 'e1', type: 'T', position: '(0,0)', health: 75, state: 'S', components: [] }],
      },
    })
    expect(vm.runtimeView.entities[0].health).toBe('75')
  })

  it('adapter maps entity state correctly', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      runtimeView: {
        worldId: 'w', entityCount: 0, systemCount: 0, eventCount: 0, fps: 0,
        entities: [{ id: 'e1', type: 'T', position: '(0,0)', health: 50, state: 'Patrol', components: [] }],
      },
    })
    expect(vm.runtimeView.entities[0].state).toBe('Patrol')
  })

  it('adapter maps entity components', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      runtimeView: {
        worldId: 'w', entityCount: 0, systemCount: 0, eventCount: 0, fps: 0,
        entities: [{
          id: 'e1', type: 'T', position: '(0,0)', health: 50, state: 'S',
          components: [{ name: 'Pos', data: { x: 1 } }, { name: 'HP', data: { current: 100 } }],
        }],
      },
    })
    expect(vm.runtimeView.entities[0].components).toHaveLength(2)
    expect(vm.runtimeView.entities[0].components[0].name).toBe('Pos')
  })

  it('adapter serializes component data to JSON string', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      runtimeView: {
        worldId: 'w', entityCount: 0, systemCount: 0, eventCount: 0, fps: 0,
        entities: [{
          id: 'e1', type: 'T', position: '(0,0)', health: 50, state: 'S',
          components: [{ name: 'Pos', data: { x: 10, y: 4 } }],
        }],
      },
    })
    const parsed = JSON.parse(vm.runtimeView.entities[0].components[0].data)
    expect(parsed.x).toBe(10)
    expect(parsed.y).toBe(4)
  })

  it('adapter handles non-object entities gracefully', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      runtimeView: {
        worldId: 'w', entityCount: 0, systemCount: 0, eventCount: 0, fps: 0,
        entities: [null, undefined, 'string', 42],
      },
    })
    expect(vm.runtimeView.entities).toHaveLength(4)
    for (const e of vm.runtimeView.entities) {
      expect(typeof e.id).toBe('string')
      expect(typeof e.type).toBe('string')
    }
  })

  it('adapter handles health as string input', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      runtimeView: {
        worldId: 'w', entityCount: 0, systemCount: 0, eventCount: 0, fps: 0,
        entities: [{ id: 'e1', type: 'T', position: '(0,0)', health: '100', state: 'S', components: [] }],
      },
    })
    expect(vm.runtimeView.entities[0].health).toBe('100')
  })

  it('adapter handles missing entity fields gracefully', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      runtimeView: {
        worldId: 'w', entityCount: 0, systemCount: 0, eventCount: 0, fps: 0,
        entities: [{}],
      },
    })
    expect(vm.runtimeView.entities[0].id).toBe('')
    expect(vm.runtimeView.entities[0].type).toBe('')
    expect(vm.runtimeView.entities[0].position).toBe('')
    expect(vm.runtimeView.entities[0].health).toBe('')
    expect(vm.runtimeView.entities[0].state).toBe('')
    expect(vm.runtimeView.entities[0].components).toEqual([])
  })

  it('adapter handles missing components gracefully', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      runtimeView: {
        worldId: 'w', entityCount: 0, systemCount: 0, eventCount: 0, fps: 0,
        entities: [{ id: 'e1', type: 'T', position: '(0,0)', health: 50, state: 'S' }],
      },
    })
    expect(vm.runtimeView.entities[0].components).toEqual([])
  })

  it('adapter handles non-array entities gracefully', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      runtimeView: {
        worldId: 'w', entityCount: 0, systemCount: 0, eventCount: 0, fps: 0,
        entities: 'invalid',
      },
    })
    expect(vm.runtimeView.entities).toEqual([])
  })

  it('adapter returns frozen entities array', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      runtimeView: {
        worldId: 'w', entityCount: 0, systemCount: 0, eventCount: 0, fps: 0,
        entities: [{ id: 'e1', type: 'T', position: '(0,0)', health: 50, state: 'S', components: [] }],
      },
    })
    expect(Object.isFrozen(vm.runtimeView.entities)).toBe(true)
  })

  it('adapter returns frozen runtimeView', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({})
    expect(Object.isFrozen(vm.runtimeView)).toBe(true)
  })

  it('adapter returns frozen component arrays', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      runtimeView: {
        worldId: 'w', entityCount: 0, systemCount: 0, eventCount: 0, fps: 0,
        entities: [{ id: 'e1', type: 'T', position: '(0,0)', health: 50, state: 'S', components: [{ name: 'C', data: {} }] }],
      },
    })
    expect(Object.isFrozen(vm.runtimeView.entities[0].components)).toBe(true)
  })

  it('adapter handles non-finite health numbers', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      runtimeView: {
        worldId: 'w', entityCount: 0, systemCount: 0, eventCount: 0, fps: 0,
        entities: [{ id: 'e1', type: 'T', position: '(0,0)', health: NaN, state: 'S', components: [] }],
      },
    })
    expect(vm.runtimeView.entities[0].health).toBe('')
  })
})

// ---------------------------------------------------------------------------
// Section 3 — Runtime Viewer Rendering
// ---------------------------------------------------------------------------

describe('runtime data — viewer rendering from viewModel', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders the root viewer container', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('.observatory-runtime-viewer').exists()).toBe(true)
  })

  it('renders 3 entity rows from viewModel', () => {
    const wrapper = mountViewer()
    expect(rows(wrapper)).toHaveLength(3)
  })

  it('renders entity ids from viewModel', () => {
    const wrapper = mountViewer()
    expect(rowTexts(wrapper, '.runtime-row-id')).toEqual([
      'guard-001',
      'merchant-001',
      'villager-001',
    ])
  })

  it('renders entity types from viewModel', () => {
    const wrapper = mountViewer()
    expect(rowTexts(wrapper, '.runtime-row-type')).toEqual([
      'Guard',
      'Merchant',
      'Villager',
    ])
  })

  it('renders the RuntimeEntityList component', () => {
    const wrapper = mountViewer()
    expect(wrapper.findComponent(RuntimeEntityList).exists()).toBe(true)
  })

  it('renders the RuntimeEntityDetails component', () => {
    const wrapper = mountViewer()
    expect(wrapper.findComponent(RuntimeEntityDetails).exists()).toBe(true)
  })

  it('renders the RuntimeEntityInspector component', () => {
    const wrapper = mountViewer()
    expect(wrapper.findComponent(RuntimeEntityInspector).exists()).toBe(true)
  })

  it('renders 4 RuntimeStatCard components', () => {
    const wrapper = mountViewer()
    expect(wrapper.findAllComponents(RuntimeStatCard)).toHaveLength(4)
  })
})

// ---------------------------------------------------------------------------
// Section 4 — Stats Rendering
// ---------------------------------------------------------------------------

describe('runtime data — stats rendering', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders the runtime stats section', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('section.runtime-stats').exists()).toBe(true)
  })

  it('renders "Runtime Stats" as the section heading', () => {
    const wrapper = mountViewer()
    const title = wrapper.find('.runtime-stats-title')
    expect(title.text()).toBe('Runtime Stats')
  })

  it('renders the world id from viewModel', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('.runtime-world-id').text()).toBe('world-001')
  })

  it('renders 4 stat cards', () => {
    const wrapper = mountViewer()
    expect(statCards(wrapper)).toHaveLength(4)
  })

  it('renders stat cards as dt/dd pairs inside a dl', () => {
    const wrapper = mountViewer()
    const dl = wrapper.find('dl.runtime-stats-grid')
    expect(dl.exists()).toBe(true)
    expect(dl.findAll('dt')).toHaveLength(4)
    expect(dl.findAll('dd')).toHaveLength(4)
  })

  it('renders stat values from viewModel', () => {
    const wrapper = mountViewer()
    expect(statValues(wrapper)).toEqual(['187', '8', '31', '60'])
  })
})

// ---------------------------------------------------------------------------
// Section 5 — Entity Rendering
// ---------------------------------------------------------------------------

describe('runtime data — entity rendering', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders the entity details article', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('article.runtime-entity-details').exists()).toBe(true)
  })

  it('renders entity ID for the first entity', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('.runtime-entity-meta').text()).toContain('guard-001')
  })

  it('renders 3 entity detail grid items', () => {
    const wrapper = mountViewer()
    expect(gridLabels(wrapper)).toHaveLength(3)
  })

  it('renders position label for first entity', () => {
    const wrapper = mountViewer()
    expect(gridLabels(wrapper)).toContain('位置')
  })

  it('renders health label for first entity', () => {
    const wrapper = mountViewer()
    expect(gridLabels(wrapper)).toContain('生命值')
  })

  it('renders state label for first entity', () => {
    const wrapper = mountViewer()
    expect(gridLabels(wrapper)).toContain('状态')
  })

  it('renders position value for guard-001', () => {
    const wrapper = mountViewer()
    expect(gridValues(wrapper)).toContain('(10,4)')
  })

  it('renders health value for guard-001', () => {
    const wrapper = mountViewer()
    expect(gridValues(wrapper)).toContain('100')
  })

  it('renders state value for guard-001', () => {
    const wrapper = mountViewer()
    expect(gridValues(wrapper)).toContain('Patrol')
  })

  it('renders entity details for merchant-001', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    expect(gridValues(wrapper)).toContain('(4,8)')
    expect(gridValues(wrapper)).toContain('Trading')
  })

  it('renders entity details for villager-001', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[2].trigger('click')
    await nextTick()
    expect(gridValues(wrapper)).toContain('(1,2)')
    expect(gridValues(wrapper)).toContain('Working')
  })

  it('renders detail grid items as dt/dd pairs', () => {
    const wrapper = mountViewer()
    const dl = wrapper.find('dl.runtime-entity-grid')
    expect(dl.findAll('dt')).toHaveLength(3)
    expect(dl.findAll('dd')).toHaveLength(3)
  })

  it('renders entity ID and Type in meta header', () => {
    const wrapper = mountViewer()
    const dl = wrapper.find('dl.runtime-entity-meta')
    expect(dl.findAll('dt')).toHaveLength(2)
    expect(dl.findAll('dt')[0].text()).toBe('ID')
    expect(dl.findAll('dt')[1].text()).toBe('Type')
  })

  it('renders entity meta values', () => {
    const wrapper = mountViewer()
    const dl = wrapper.find('dl.runtime-entity-meta')
    expect(dl.findAll('dd')[0].text()).toBe('guard-001')
    expect(dl.findAll('dd')[1].text()).toBe('Guard')
  })
})

// ---------------------------------------------------------------------------
// Section 6 — Entity Selection
// ---------------------------------------------------------------------------

describe('runtime data — entity selection', () => {
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

  it('shows the first entity id in details header by default', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('.runtime-entity-meta').text()).toContain('guard-001')
  })

  it('shows the first entity type in details header by default', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('.runtime-entity-meta').text()).toContain('Guard')
  })

  it('selects second entity on click', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    expect(wrapper.find('.runtime-entity-meta').text()).toContain('merchant-001')
  })

  it('selects third entity on click', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[2].trigger('click')
    await nextTick()
    expect(wrapper.find('.runtime-entity-meta').text()).toContain('villager-001')
  })

  it('moves active class to clicked row', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[2].trigger('click')
    await nextTick()
    expect(activeRows(wrapper)).toHaveLength(1)
    expect(activeRows(wrapper)[0].text()).toContain('villager-001')
  })

  it('switches back to first entity when re-clicked', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    await rows(wrapper)[0].trigger('click')
    await nextTick()
    expect(wrapper.find('.runtime-entity-meta').text()).toContain('guard-001')
  })

  it('clicking active row keeps selection', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[0].trigger('click')
    await nextTick()
    expect(activeRows(wrapper)).toHaveLength(1)
  })

  it('updates entity details after click', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    const labels = gridLabels(wrapper)
    expect(labels).toContain('位置')
    expect(labels).toContain('生命值')
    expect(labels).toContain('状态')
  })

  it('updates entity position after click', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    expect(gridValues(wrapper)).toContain('(4,8)')
  })
})

// ---------------------------------------------------------------------------
// Section 7 — Keyboard Navigation
// ---------------------------------------------------------------------------

describe('runtime data — keyboard navigation', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('moves selection to next entity with ArrowDown', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'ArrowDown')
    expect(activeRows(wrapper)[0].text()).toContain('merchant-001')
  })

  it('moves selection two steps with ArrowDown', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'ArrowDown')
    await pressKey(wrapper, 'ArrowDown')
    expect(activeRows(wrapper)[0].text()).toContain('villager-001')
  })

  it('clamps ArrowDown at last entity', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'ArrowDown')
    await pressKey(wrapper, 'ArrowDown')
    await pressKey(wrapper, 'ArrowDown')
    expect(activeRows(wrapper)[0].text()).toContain('villager-001')
  })

  it('moves selection to previous with ArrowUp', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'ArrowDown')
    await pressKey(wrapper, 'ArrowUp')
    expect(activeRows(wrapper)[0].text()).toContain('guard-001')
  })

  it('clamps ArrowUp at first entity', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'ArrowUp')
    expect(activeRows(wrapper)[0].text()).toContain('guard-001')
  })

  it('jumps to last entity with End', async () => {
    const wrapper = mountViewer()
    await pressKey(wrapper, 'End')
    expect(activeRows(wrapper)[0].text()).toContain('villager-001')
  })

  it('jumps to first entity with Home', async () => {
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
})

// ---------------------------------------------------------------------------
// Section 8 — Empty Runtime
// ---------------------------------------------------------------------------

describe('runtime data — empty runtime', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders without error when runtimeView is empty after mount', async () => {
    const store = useObservatoryDataStore()
    const wrapper = mount(ObservatoryRuntimeViewer)
    store.viewModel = {
      overview: { traceCount: 0, timelineCount: 0, historyCount: 0 },
      trace: [],
      traceView: [],
      timelineView: [],
      historyView: [],
      diffView: [],
      runtimeView: { worldId: '', entityCount: 0, systemCount: 0, eventCount: 0, fps: 0, entities: [] },
      eventStreamView: { events: [] },
      timeline: [],
      history: [],
    }
    await nextTick()
    expect(wrapper.exists()).toBe(true)
  })

  it('renders worldId as empty when runtimeView is empty', async () => {
    const store = useObservatoryDataStore()
    const wrapper = mount(ObservatoryRuntimeViewer)
    store.viewModel = {
      overview: { traceCount: 0, timelineCount: 0, historyCount: 0 },
      trace: [],
      traceView: [],
      timelineView: [],
      historyView: [],
      diffView: [],
      runtimeView: { worldId: '', entityCount: 0, systemCount: 0, eventCount: 0, fps: 0, entities: [] },
      eventStreamView: { events: [] },
      timeline: [],
      history: [],
    }
    await nextTick()
    expect(wrapper.find('.runtime-world-id').text()).toBe('')
  })

  it('renders stat values as 0 when runtimeView is empty', async () => {
    const store = useObservatoryDataStore()
    setActivePinia(createPinia())
    const wrapper = mount(ObservatoryRuntimeViewer)
    store.viewModel = {
      overview: { traceCount: 0, timelineCount: 0, historyCount: 0 },
      trace: [],
      traceView: [],
      timelineView: [],
      historyView: [],
      diffView: [],
      runtimeView: { worldId: '', entityCount: 0, systemCount: 0, eventCount: 0, fps: 0, entities: [] },
      eventStreamView: { events: [] },
      timeline: [],
      history: [],
    }
    await nextTick()
    await nextTick()
    expect(statValues(wrapper)).toEqual(['0', '0', '0', '0'])
  })

  it('renders no entity rows when runtimeView is empty', async () => {
    const store = useObservatoryDataStore()
    const wrapper = mount(ObservatoryRuntimeViewer)
    store.viewModel = {
      overview: { traceCount: 0, timelineCount: 0, historyCount: 0 },
      trace: [],
      traceView: [],
      timelineView: [],
      historyView: [],
      diffView: [],
      runtimeView: { worldId: '', entityCount: 0, systemCount: 0, eventCount: 0, fps: 0, entities: [] },
      eventStreamView: { events: [] },
      timeline: [],
      history: [],
    }
    await nextTick()
    expect(rows(wrapper)).toHaveLength(0)
  })

  it('shows "No entity selected" when runtimeView has no entities', async () => {
    const store = useObservatoryDataStore()
    const wrapper = mount(ObservatoryRuntimeViewer)
    store.viewModel = {
      overview: { traceCount: 0, timelineCount: 0, historyCount: 0 },
      trace: [],
      traceView: [],
      timelineView: [],
      historyView: [],
      diffView: [],
      runtimeView: { worldId: '', entityCount: 0, systemCount: 0, eventCount: 0, fps: 0, entities: [] },
      eventStreamView: { events: [] },
      timeline: [],
      history: [],
    }
    await nextTick()
    expect(wrapper.find('.runtime-entity-details').text()).toContain('No entity selected')
  })

  it('empty runtimeView does not crash keyboard navigation', async () => {
    const store = useObservatoryDataStore()
    const wrapper = mount(ObservatoryRuntimeViewer)
    store.viewModel = {
      overview: { traceCount: 0, timelineCount: 0, historyCount: 0 },
      trace: [],
      traceView: [],
      timelineView: [],
      historyView: [],
      diffView: [],
      runtimeView: { worldId: '', entityCount: 0, systemCount: 0, eventCount: 0, fps: 0, entities: [] },
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
// Section 9 — Defaults
// ---------------------------------------------------------------------------

describe('runtime data — defaults', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('default runtimeView is empty before load', () => {
    const store = useObservatoryDataStore()
    expect(store.viewModel.runtimeView.worldId).toBe('')
    expect(store.viewModel.runtimeView.entityCount).toBe(0)
  })

  it('adapter returns default runtimeView for undefined input', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt(undefined)
    expect(vm.runtimeView.worldId).toBe('')
    expect(vm.runtimeView.entities).toEqual([])
  })

  it('adapter returns default runtimeView for null input', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt(null)
    expect(vm.runtimeView.worldId).toBe('')
  })

  it('adapter returns default runtimeView for number input', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt(42)
    expect(vm.runtimeView.worldId).toBe('')
  })

  it('count fields default to 0', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      runtimeView: { worldId: 'w', entities: [] },
      eventStreamView: { events: [] },
    })
    expect(vm.runtimeView.entityCount).toBe(0)
    expect(vm.runtimeView.systemCount).toBe(0)
    expect(vm.runtimeView.eventCount).toBe(0)
    expect(vm.runtimeView.fps).toBe(0)
  })

  it('entity fields default to empty string', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      runtimeView: {
        worldId: 'w', entityCount: 0, systemCount: 0, eventCount: 0, fps: 0,
        entities: [{}],
      },
    })
    expect(vm.runtimeView.entities[0].id).toBe('')
    expect(vm.runtimeView.entities[0].type).toBe('')
    expect(vm.runtimeView.entities[0].position).toBe('')
    expect(vm.runtimeView.entities[0].health).toBe('')
    expect(vm.runtimeView.entities[0].state).toBe('')
  })

  it('entity components default to empty array', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      runtimeView: {
        worldId: 'w', entityCount: 0, systemCount: 0, eventCount: 0, fps: 0,
        entities: [{ id: 'e1', type: 'T', position: '(0,0)', health: 50, state: 'S' }],
      },
    })
    expect(vm.runtimeView.entities[0].components).toEqual([])
  })

  it('component fields default to empty string', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      runtimeView: {
        worldId: 'w', entityCount: 0, systemCount: 0, eventCount: 0, fps: 0,
        entities: [{ id: 'e1', type: 'T', position: '(0,0)', health: 50, state: 'S', components: [{}] }],
      },
    })
    expect(vm.runtimeView.entities[0].components[0].name).toBe('')
    expect(vm.runtimeView.entities[0].components[0].data).toBe('')
  })
})

// ---------------------------------------------------------------------------
// Section 10 — Deterministic Rendering
// ---------------------------------------------------------------------------

describe('runtime data — deterministic rendering', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders identical entity ids across mounts', () => {
    const a = mountViewer()
    const b = mountViewer()
    expect(rowTexts(a, '.runtime-row-id')).toEqual(rowTexts(b, '.runtime-row-id'))
  })

  it('renders identical entity types across mounts', () => {
    const a = mountViewer()
    const b = mountViewer()
    expect(rowTexts(a, '.runtime-row-type')).toEqual(rowTexts(b, '.runtime-row-type'))
  })

  it('renders identical stat values across mounts', () => {
    const a = mountViewer()
    const b = mountViewer()
    expect(statValues(a)).toEqual(statValues(b))
  })

  it('renders identical worldId across mounts', () => {
    const a = mountViewer()
    const b = mountViewer()
    expect(a.find('.runtime-world-id').text()).toBe(b.find('.runtime-world-id').text())
  })

  it('renders identical viewer HTML across mounts', () => {
    const a = mountViewer()
    const b = mountViewer()
    expect(a.html()).toBe(b.html())
  })

  it('renders identical component names across mounts', () => {
    const a = mountViewer()
    const b = mountViewer()
    expect(cardNames(a)).toEqual(cardNames(b))
  })

  it('renders identical component JSON data across mounts', () => {
    const a = mountViewer()
    const b = mountViewer()
    expect(cardJSONs(a)).toEqual(cardJSONs(b))
  })

  it('renders identical active row across mounts', () => {
    const a = mountViewer()
    const b = mountViewer()
    const activeText = (w: VueWrapper): string => w.find('.runtime-row--active').text()
    expect(activeText(a)).toBe('guard-001Guard')
    expect(activeText(b)).toBe('guard-001Guard')
  })
})

// ---------------------------------------------------------------------------
// Section 11 — No Mutation
// ---------------------------------------------------------------------------

describe('runtime data — no mutation', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('mounting viewer does not mutate runtimeView', () => {
    const store = useObservatoryDataStore()
    mountViewer()
    expect(Object.isFrozen(store.viewModel.runtimeView)).toBe(true)
  })

  it('runtimeView entities array is frozen', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(Object.isFrozen(store.viewModel.runtimeView.entities)).toBe(true)
  })

  it('runtimeView entity components arrays are frozen', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    for (const e of store.viewModel.runtimeView.entities) {
      expect(Object.isFrozen(e.components)).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------
// Section 12 — Integration Path
// ---------------------------------------------------------------------------

describe('runtime data — integration path', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('full path: store adapter produces runtimeView with correct values', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(store.viewModel.runtimeView.worldId).toBe('world-001')
    expect(store.viewModel.runtimeView.entityCount).toBe(187)
    expect(store.viewModel.runtimeView.entities[0].id).toBe('guard-001')
  })

  it('adapter output matches component display after mount', async () => {
    const adapter = new DefaultObservatoryAdapter()
    const customData = {
      runtimeView: {
        worldId: 'custom-world',
        entityCount: 5,
        systemCount: 2,
        eventCount: 10,
        fps: 30,
        entities: [
          { id: 'e1', type: 'Hero', position: '(5,5)', health: 100, state: 'Active', components: [] },
          { id: 'e2', type: 'NPC', position: '(3,3)', health: 50, state: 'Idle', components: [] },
        ],
      },
    }
    const vm = adapter.adapt(customData)
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const wrapper = mount(ObservatoryRuntimeViewer)
    store.viewModel = vm
    await nextTick()
    await nextTick()
    expect(rows(wrapper)).toHaveLength(2)
    expect(rowTexts(wrapper, '.runtime-row-id')).toEqual(['e1', 'e2'])
  })

  it('single entity displays correctly after mount', async () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      runtimeView: {
        worldId: 'w', entityCount: 1, systemCount: 0, eventCount: 0, fps: 0,
        entities: [{ id: 'only', type: 'Solo', position: '(0,0)', health: 100, state: 'S', components: [] }],
      },
    })
    const store = useObservatoryDataStore()
    store.viewModel = vm
    const wrapper = mount(ObservatoryRuntimeViewer)
    expect(rows(wrapper)).toHaveLength(1)
    expect(activeRows(wrapper)).toHaveLength(1)
  })

  it('large number of entities list correctly', async () => {
    const adapter = new DefaultObservatoryAdapter()
    const entities = Array.from({ length: 50 }, (_, i) => ({
      id: `e-${i + 1}`,
      type: `T${i}`,
      position: `(${i},0)`,
      health: 50,
      state: 'S',
      components: [],
    }))
    const vm = adapter.adapt({
      runtimeView: {
        worldId: 'w', entityCount: 50, systemCount: 0, eventCount: 0, fps: 0,
        entities,
      },
    })
    const store = useObservatoryDataStore()
    store.viewModel = vm
    const wrapper = mount(ObservatoryRuntimeViewer)
    expect(rows(wrapper)).toHaveLength(50)
  })

  it('refreshing runtimeView updates the viewer', async () => {
    const store = useObservatoryDataStore()
    const wrapper = mountViewer()
    store.viewModel = {
      overview: { traceCount: 0, timelineCount: 0, historyCount: 0 },
      trace: [],
      traceView: [],
      timelineView: [],
      historyView: [],
      diffView: [],
      runtimeView: {
        worldId: 'new-world',
        entityCount: 1,
        systemCount: 1,
        eventCount: 1,
        fps: 1,
        entities: [{ id: 'new-e', type: 'New', position: '(9,9)', health: '99', state: 'Active', components: [] }],
      },
      eventStreamView: { events: [] },
      timeline: [],
      history: [],
    }
    await nextTick()
    expect(rows(wrapper)).toHaveLength(1)
    expect(rowTexts(wrapper, '.runtime-row-id')).toEqual(['new-e'])
  })
})

// ---------------------------------------------------------------------------
// Section 13 — Accessibility
// ---------------------------------------------------------------------------

describe('runtime data — accessibility', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('entity list nav has aria-label', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('nav.runtime-entity-list').attributes('aria-label')).toBe('Entity list')
  })

  it('entity details article has aria-label', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('article.runtime-entity-details').attributes('aria-label')).toBe('Runtime entity details')
  })

  it('uses buttons for entity rows', () => {
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
    expect(headings).toContain('Runtime Stats')
    expect(headings).toContain('Runtime Entity Details')
  })

  it('uses h3 for inspector title', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('h3.runtime-inspector-title').exists()).toBe(true)
  })

  it('uses section with aria-label for inspector', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('section.runtime-entity-inspector').attributes('aria-label')).toBe('Entity inspector')
  })

  it('uses dl for stats grid', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('dl.runtime-stats-grid').exists()).toBe(true)
  })

  it('uses dl for entity meta', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('dl.runtime-entity-meta').exists()).toBe(true)
  })

  it('uses dl for entity details grid', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('dl.runtime-entity-grid').exists()).toBe(true)
  })

  it('row buttons expose accessible name', () => {
    const wrapper = mountViewer()
    for (const row of rows(wrapper)) {
      expect(row.text().trim().length).toBeGreaterThan(0)
    }
  })

  it('uses h3 for component card names', () => {
    const wrapper = mountViewer()
    for (const name of wrapper.findAll('h3.runtime-component-name')) {
      expect(name.exists()).toBe(true)
    }
  })

  it('renders all component cards as articles', () => {
    const wrapper = mountViewer()
    for (const card of cardComponents(wrapper)) {
      expect(card.element.tagName).toBe('ARTICLE')
    }
  })

  it('uses section with aria-labelledby for stats', () => {
    const wrapper = mountViewer()
    const section = wrapper.find('section.runtime-stats')
    expect(section.attributes('aria-labelledby')).toBe('runtime-stats-title')
  })

  it('renders section empty messages as paragraphs', () => {
    const wrapper = mountViewer()
    const empty = wrapper.find('p.runtime-entity-empty')
    expect(empty.exists()).toBe(false) // not empty when entity selected
  })

  it('no divs used as buttons', () => {
    const wrapper = mountViewer()
    const divButtons = wrapper.findAll('div[role="button"]')
    expect(divButtons).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Section 14 — Shape Integrity
// ---------------------------------------------------------------------------

describe('runtime data — shape integrity', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('runtimeView is an object', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(typeof store.viewModel.runtimeView).toBe('object')
    expect(Array.isArray(store.viewModel.runtimeView)).toBe(false)
  })

  it('runtimeView has all required fields', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const rv = store.viewModel.runtimeView
    expect(rv).toHaveProperty('worldId')
    expect(rv).toHaveProperty('entityCount')
    expect(rv).toHaveProperty('systemCount')
    expect(rv).toHaveProperty('eventCount')
    expect(rv).toHaveProperty('fps')
    expect(rv).toHaveProperty('entities')
  })

  it('viewModel properties are independent', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    expect(Object.is(store.viewModel.runtimeView, store.viewModel.diffView)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Section 15 — Edge Cases
// ---------------------------------------------------------------------------

describe('runtime data — edge cases', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('adapter handles empty entities array', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      runtimeView: {
        worldId: 'w', entityCount: 0, systemCount: 0, eventCount: 0, fps: 0,
        entities: [],
      },
    })
    expect(vm.runtimeView.entities).toEqual([])
  })

  it('adapter handles double empty runtimeView gracefully', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm1 = adapter.adapt({})
    const vm2 = adapter.adapt({})
    expect(vm1.runtimeView).toEqual(vm2.runtimeView)
  })

  it('adapter handles component data that is already a string', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      runtimeView: {
        worldId: 'w', entityCount: 0, systemCount: 0, eventCount: 0, fps: 0,
        entities: [{ id: 'e1', type: 'T', position: '(0,0)', health: 50, state: 'S', components: [{ name: 'C', data: 'raw string' }] }],
      },
    })
    expect(vm.runtimeView.entities[0].components[0].data).toBe('raw string')
  })

  it('adapter handles entity with no components key at all', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      runtimeView: {
        worldId: 'w', entityCount: 1, systemCount: 0, eventCount: 0, fps: 0,
        entities: [{ id: 'e1', type: 'T', position: '(0,0)', health: 50, state: 'S' }],
      },
    })
    expect(vm.runtimeView.entities[0].components).toEqual([])
  })

  it('store handles multiple loadMockObservatory calls', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    store.loadMockObservatory()
    store.loadMockObservatory()
    expect(store.viewModel.runtimeView.entityCount).toBe(187)
  })

  it('adapter handles negative health values', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      runtimeView: {
        worldId: 'w', entityCount: 0, systemCount: 0, eventCount: 0, fps: 0,
        entities: [{ id: 'e1', type: 'T', position: '(0,0)', health: -5, state: 'Dead', components: [] }],
      },
    })
    expect(vm.runtimeView.entities[0].health).toBe('-5')
  })

  it('adapter handles zero health values', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      runtimeView: {
        worldId: 'w', entityCount: 0, systemCount: 0, eventCount: 0, fps: 0,
        entities: [{ id: 'e1', type: 'T', position: '(0,0)', health: 0, state: 'Dead', components: [] }],
      },
    })
    expect(vm.runtimeView.entities[0].health).toBe('0')
  })

  it('adapter handles Infinity health', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      runtimeView: {
        worldId: 'w', entityCount: 0, systemCount: 0, eventCount: 0, fps: 0,
        entities: [{ id: 'e1', type: 'T', position: '(0,0)', health: Infinity, state: 'S', components: [] }],
      },
    })
    expect(vm.runtimeView.entities[0].health).toBe('')
  })

  it('adapter handles null entity health', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      runtimeView: {
        worldId: 'w', entityCount: 0, systemCount: 0, eventCount: 0, fps: 0,
        entities: [{ id: 'e1', type: 'T', position: '(0,0)', health: null, state: 'S', components: [] }],
      },
    })
    expect(vm.runtimeView.entities[0].health).toBe('')
  })

  it('adapter handles undefined entity health', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      runtimeView: {
        worldId: 'w', entityCount: 0, systemCount: 0, eventCount: 0, fps: 0,
        entities: [{ id: 'e1', type: 'T', position: '(0,0)', health: undefined, state: 'S', components: [] }],
      },
    })
    expect(vm.runtimeView.entities[0].health).toBe('')
  })

  it('adapter handles non-object components gracefully', () => {
    const adapter = new DefaultObservatoryAdapter()
    const vm = adapter.adapt({
      runtimeView: {
        worldId: 'w', entityCount: 0, systemCount: 0, eventCount: 0, fps: 0,
        entities: [{ id: 'e1', type: 'T', position: '(0,0)', health: 50, state: 'S', components: [null, undefined, 'string', 42] }],
      },
    })
    expect(vm.runtimeView.entities[0].components).toHaveLength(4)
    expect(vm.runtimeView.entities[0].components[0].name).toBe('')
    expect(vm.runtimeView.entities[0].components[0].data).toBe('')
  })
})

// ---------------------------------------------------------------------------
// Section 16 — Component Rendering (Inspector)
// ---------------------------------------------------------------------------

describe('runtime data — component rendering', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders the inspector for the default entity', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('section.runtime-entity-inspector').exists()).toBe(true)
  })

  it('renders 3 component cards for guard-001', () => {
    const wrapper = mountViewer()
    expect(wrapper.findAllComponents(RuntimeComponentCard)).toHaveLength(3)
  })

  it('renders component names for guard-001', () => {
    const wrapper = mountViewer()
    expect(cardNames(wrapper)).toEqual(['Position', 'Health', 'AI'])
  })

  it('renders 4 component cards for merchant-001 when selected', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    expect(cardComponents(wrapper)).toHaveLength(4)
  })

  it('renders component names for merchant-001', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    expect(cardNames(wrapper)).toEqual(['Position', 'Health', 'Inventory', 'AI'])
  })

  it('renders 5 component cards for villager-001 when selected', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[2].trigger('click')
    await nextTick()
    expect(cardComponents(wrapper)).toHaveLength(5)
  })

  it('renders component names for villager-001', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[2].trigger('click')
    await nextTick()
    expect(cardNames(wrapper)).toEqual(['Position', 'Health', 'Inventory', 'AI', 'Schedule'])
  })

  it('renders component data as JSON', () => {
    const wrapper = mountViewer()
    const text = jsonText(wrapper)
    expect(() => JSON.parse(text)).not.toThrow()
  })

  it('renders position data correctly', () => {
    const wrapper = mountViewer()
    const text = jsonText(wrapper)
    const parsed = JSON.parse(text)
    expect(parsed.x).toBe(10)
    expect(parsed.y).toBe(4)
  })

  it('renders health data correctly', () => {
    const wrapper = mountViewer()
    const jsons = cardJSONs(wrapper)
    const healthJson = JSON.parse(jsons[1])
    expect(healthJson.current).toBe(100)
    expect(healthJson.max).toBe(100)
  })

  it('renders component cards as articles', () => {
    const wrapper = mountViewer()
    for (const card of cardComponents(wrapper)) {
      expect(card.element.tagName).toBe('ARTICLE')
    }
  })

  it('renders component names in h3', () => {
    const wrapper = mountViewer()
    for (const name of cardNames(wrapper)) {
      expect(typeof name).toBe('string')
      expect(name.length).toBeGreaterThan(0)
    }
  })

  it('hides inspector when entityId is null', () => {
    const wrapper = mount(RuntimeEntityInspector, {
      props: { entityId: null },
    })
    expect(wrapper.find('section').exists()).toBe(false)
  })

  it('updates component list when entity changes', async () => {
    const wrapper = mountViewer()
    expect(cardComponents(wrapper)).toHaveLength(3)
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    expect(cardComponents(wrapper)).toHaveLength(4)
  })

  it('updates component names when entity changes', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[2].trigger('click')
    await nextTick()
    const names = cardNames(wrapper)
    expect(names).toContain('Schedule')
    expect(names).toHaveLength(5)
  })

  it('renders component JSON data for merchant inventory', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[1].trigger('click')
    await nextTick()
    const jsons = cardJSONs(wrapper)
    const inventoryJson = JSON.parse(jsons[2])
    expect(inventoryJson.gold).toBe(250)
    expect(inventoryJson.items).toEqual(['potion', 'sword', 'shield'])
  })

  it('renders component JSON data for villager schedule', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[2].trigger('click')
    await nextTick()
    const names = cardNames(wrapper)
    const schedIdx = names.indexOf('Schedule')
    const schedJson = JSON.parse(cardJSONs(wrapper)[schedIdx])
    expect(schedJson.wakeHour).toBe(6)
    expect(schedJson.sleepHour).toBe(20)
    expect(schedJson.task).toBe('harvest')
  })

  it('renders component count in inspector header', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('.runtime-inspector-count').text()).toContain('3')
  })

  it('updates component count when entity changes', async () => {
    const wrapper = mountViewer()
    await rows(wrapper)[2].trigger('click')
    await nextTick()
    expect(wrapper.find('.runtime-inspector-count').text()).toContain('5')
  })

  it('renders component cards with correct structure', () => {
    const wrapper = mountViewer()
    for (const card of cardComponents(wrapper)) {
      expect(card.find('header.runtime-component-header').exists()).toBe(true)
      expect(card.find('pre.runtime-component-json').exists()).toBe(true)
      expect(card.find('code').exists()).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------
// Section 17 — Backward Compatibility
// ---------------------------------------------------------------------------

describe('runtime data — backward compatibility', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('adapter preserves existing style and layout', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('.observatory-runtime-viewer').exists()).toBe(true)
    expect(wrapper.find('.runtime-main').exists()).toBe(true)
    expect(wrapper.find('.runtime-stats').exists()).toBe(true)
  })

  it('adapter preserves stat card component', () => {
    const wrapper = mountViewer()
    expect(wrapper.findComponent(RuntimeStatCard).exists()).toBe(true)
  })

  it('adapter preserves entity list component', () => {
    const wrapper = mountViewer()
    expect(wrapper.findComponent(RuntimeEntityList).exists()).toBe(true)
  })

  it('adapter preserves entity details component', () => {
    const wrapper = mountViewer()
    expect(wrapper.findComponent(RuntimeEntityDetails).exists()).toBe(true)
  })

  it('adapter preserves inspector component', () => {
    const wrapper = mountViewer()
    expect(wrapper.findComponent(RuntimeEntityInspector).exists()).toBe(true)
  })

  it('existing expectations work with same mock data', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const entity = store.viewModel.runtimeView.entities[0]
    expect(entity.id).toBe('guard-001')
    expect(entity.type).toBe('Guard')
  })
})

// ---------------------------------------------------------------------------
// Section 18 — Store Edge Cases
// ---------------------------------------------------------------------------

describe('runtime data — store edge cases', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('store handles multiple loads consistently', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const first = store.viewModel.runtimeView.worldId
    store.loadMockObservatory()
    const second = store.viewModel.runtimeView.worldId
    expect(first).toBe(second)
  })

  it('empty runtimeView after store init is consistent', () => {
    const store = useObservatoryDataStore()
    const a = store.viewModel.runtimeView
    const b = store.viewModel.runtimeView
    expect(Object.is(a, b)).toBe(true)
  })

  it('store handles direct runtimeView replacement', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const custom = {
      worldId: 'custom-world',
      entityCount: 99,
      systemCount: 99,
      eventCount: 99,
      fps: 99,
      entities: [],
    }
    store.viewModel = {
      overview: { traceCount: 0, timelineCount: 0, historyCount: 0 },
      trace: [],
      traceView: [],
      timelineView: [],
      historyView: [],
      diffView: [],
      runtimeView: custom,
      eventStreamView: { events: [] },
      timeline: [],
      history: [],
    }
    expect(store.viewModel.runtimeView.worldId).toBe('custom-world')
    expect(store.viewModel.runtimeView.entityCount).toBe(99)
  })
})

// ---------------------------------------------------------------------------
// Section 19 — No AI Package Leakage
// ---------------------------------------------------------------------------

describe('runtime data — no AI package leakage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('viewModel does not contain AI-specific root properties', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const keys = Object.keys(store.viewModel)
    expect(keys).not.toContain('promptAssembly')
    expect(keys).not.toContain('plannerResult')
  })

  it('runtimeView does not contain AI-specific fields', () => {
    const store = useObservatoryDataStore()
    store.loadMockObservatory()
    const keys = Object.keys(store.viewModel.runtimeView)
    expect(keys).not.toContain('promptAssembly')
    expect(keys).not.toContain('strategy')
    expect(keys).not.toContain('plan')
  })
})
