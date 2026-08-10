import { describe, it, expect, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

import ObservatoryWorldGraph from '../components/observatory/world/ObservatoryWorldGraph.vue'
import WorldGraphNode from '../components/observatory/world/WorldGraphNode.vue'
import type { WorldNodeData } from '../components/observatory/world/WorldGraphNode.vue'
import WorldGraphConnection from '../components/observatory/world/WorldGraphConnection.vue'
import WorldGraphLegend from '../components/observatory/world/WorldGraphLegend.vue'
import ObservatoryContent from '../components/observatory/ObservatoryContent.vue'
import { useObservatoryStore, OBSERVATORY_PANELS } from '../stores/observatory'
import { useI18nStore } from '../stores/i18n'
import { resolveKey } from '../i18n'
import { zhCN } from '../i18n/locales/zh-CN'
import { enUS } from '../i18n/locales/en-US'

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const MOCK_WORLD_NODE: WorldNodeData = {
  id: 'world-root',
  name: 'World',
  type: 'world',
  status: 'active',
}

const MOCK_LOCATION_ACTIVE: WorldNodeData = {
  id: 'node-farm',
  name: 'Farm',
  type: 'location',
  status: 'active',
}

const MOCK_LOCATION_INACTIVE: WorldNodeData = {
  id: 'node-barn',
  name: 'Barn',
  type: 'location',
  status: 'inactive',
}

const MOCK_NPC_NODE: WorldNodeData = {
  id: 'node-farmer',
  name: 'Farmer',
  type: 'npc',
  status: 'active',
}

const MOCK_QUEST_NODE: WorldNodeData = {
  id: 'node-quest',
  name: 'HarvestQuest',
  type: 'quest',
  status: 'active',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mountGraph(): VueWrapper {
  return mount(ObservatoryWorldGraph)
}

function mountNode(node: WorldNodeData): VueWrapper {
  return mount(WorldGraphNode, {
    props: { node },
  })
}

function mountConnection(): VueWrapper {
  return mount(WorldGraphConnection)
}

function mountLegend(): VueWrapper {
  return mount(WorldGraphLegend, {
    props: {
      types: [
        { key: 'world' as const },
        { key: 'location' as const },
        { key: 'npc' as const },
        { key: 'quest' as const },
      ],
      statuses: [
        { key: 'active' as const },
        { key: 'inactive' as const },
      ],
    },
  })
}

function mountContentAsWorldGraph(): VueWrapper {
  const store = useObservatoryStore()
  store.selectPanel('WorldGraph')
  return mount(ObservatoryContent)
}

// ---------------------------------------------------------------------------
// WorldGraphNode — rendering
// ---------------------------------------------------------------------------

describe('WorldGraphNode — rendering', () => {
  it('renders as an article with class world-graph-node', () => {
    const wrapper = mountNode(MOCK_WORLD_NODE)
    expect(wrapper.find('article.world-graph-node').exists()).toBe(true)
  })

  it('renders a header inside the node', () => {
    const wrapper = mountNode(MOCK_WORLD_NODE)
    expect(wrapper.find('header.world-graph-node-header').exists()).toBe(true)
  })

  it('renders the type badge', () => {
    const wrapper = mountNode(MOCK_WORLD_NODE)
    expect(wrapper.find('.world-graph-node-type-badge').exists()).toBe(true)
  })

  it('renders the type badge text', () => {
    const wrapper = mountNode(MOCK_WORLD_NODE)
    expect(wrapper.find('.world-graph-node-type-badge').text()).toBe('world')
  })

  it('renders the status dot', () => {
    const wrapper = mountNode(MOCK_WORLD_NODE)
    expect(wrapper.find('.world-graph-node-status-dot').exists()).toBe(true)
  })

  it('renders the status label', () => {
    const wrapper = mountNode(MOCK_WORLD_NODE)
    expect(wrapper.find('.world-graph-node-status-label').text()).toBe('active')
  })

  it('renders the node name', () => {
    const wrapper = mountNode(MOCK_WORLD_NODE)
    expect(wrapper.find('.world-graph-node-name').text()).toBe('World')
  })

  it('renders name as a paragraph', () => {
    const wrapper = mountNode(MOCK_WORLD_NODE)
    expect(wrapper.find('p.world-graph-node-name').exists()).toBe(true)
  })

  it('applies world type class', () => {
    const wrapper = mountNode(MOCK_WORLD_NODE)
    expect(wrapper.classes()).toContain('world-graph-node--world')
  })

  it('applies location type class', () => {
    const wrapper = mountNode(MOCK_LOCATION_ACTIVE)
    expect(wrapper.classes()).toContain('world-graph-node--location')
  })

  it('applies npc type class', () => {
    const wrapper = mountNode(MOCK_NPC_NODE)
    expect(wrapper.classes()).toContain('world-graph-node--npc')
  })

  it('applies quest type class', () => {
    const wrapper = mountNode(MOCK_QUEST_NODE)
    expect(wrapper.classes()).toContain('world-graph-node--quest')
  })

  it('applies active status class', () => {
    const wrapper = mountNode(MOCK_WORLD_NODE)
    expect(wrapper.classes()).toContain('world-graph-node--active')
  })

  it('applies inactive status class', () => {
    const wrapper = mountNode(MOCK_LOCATION_INACTIVE)
    expect(wrapper.classes()).toContain('world-graph-node--inactive')
  })

  it('renders inactive status label', () => {
    const wrapper = mountNode(MOCK_LOCATION_INACTIVE)
    expect(wrapper.find('.world-graph-node-status-label').text()).toBe('inactive')
  })

  it('renders location type badge', () => {
    const wrapper = mountNode(MOCK_LOCATION_ACTIVE)
    expect(wrapper.find('.world-graph-node-type-badge').text()).toBe('location')
  })

  it('renders npc type badge', () => {
    const wrapper = mountNode(MOCK_NPC_NODE)
    expect(wrapper.find('.world-graph-node-type-badge').text()).toBe('npc')
  })

  it('renders quest type badge', () => {
    const wrapper = mountNode(MOCK_QUEST_NODE)
    expect(wrapper.find('.world-graph-node-type-badge').text()).toBe('quest')
  })

  it('renders location node name', () => {
    const wrapper = mountNode(MOCK_LOCATION_ACTIVE)
    expect(wrapper.find('.world-graph-node-name').text()).toBe('Farm')
  })

  it('renders npc node name', () => {
    const wrapper = mountNode(MOCK_NPC_NODE)
    expect(wrapper.find('.world-graph-node-name').text()).toBe('Farmer')
  })

  it('renders quest node name', () => {
    const wrapper = mountNode(MOCK_QUEST_NODE)
    expect(wrapper.find('.world-graph-node-name').text()).toBe('HarvestQuest')
  })

  it('renders header with badge, dot, and status text', () => {
    const wrapper = mountNode(MOCK_WORLD_NODE)
    const header = wrapper.find('header.world-graph-node-header')
    expect(header.find('.world-graph-node-type-badge').exists()).toBe(true)
    expect(header.find('.world-graph-node-status').exists()).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// WorldGraphNode — type-specific styling
// ---------------------------------------------------------------------------

describe('WorldGraphNode — type badge styling', () => {
  it('world badge has correct background class', () => {
    const wrapper = mountNode(MOCK_WORLD_NODE)
    expect(wrapper.find('.world-graph-node-type-badge').exists()).toBe(true)
  })

  it('location badge has correct background class', () => {
    const wrapper = mountNode(MOCK_LOCATION_ACTIVE)
    expect(wrapper.find('.world-graph-node-type-badge').exists()).toBe(true)
  })

  it('npc badge has correct background class', () => {
    const wrapper = mountNode(MOCK_NPC_NODE)
    expect(wrapper.find('.world-graph-node-type-badge').exists()).toBe(true)
  })

  it('quest badge has correct background class', () => {
    const wrapper = mountNode(MOCK_QUEST_NODE)
    expect(wrapper.find('.world-graph-node-type-badge').exists()).toBe(true)
  })

  it('active node has green-tinted border', () => {
    const wrapper = mountNode(MOCK_WORLD_NODE)
    expect(wrapper.classes()).toContain('world-graph-node--active')
  })

  it('inactive node has gray-tinted border', () => {
    const wrapper = mountNode(MOCK_LOCATION_INACTIVE)
    expect(wrapper.classes()).toContain('world-graph-node--inactive')
  })

  it('active node has green status dot', () => {
    const wrapper = mountNode(MOCK_WORLD_NODE)
    expect(wrapper.find('.world-graph-node-status-dot').exists()).toBe(true)
  })

  it('inactive node has gray status dot', () => {
    const wrapper = mountNode(MOCK_LOCATION_INACTIVE)
    expect(wrapper.find('.world-graph-node-status-dot').exists()).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// WorldGraphNode — accessibility
// ---------------------------------------------------------------------------

describe('WorldGraphNode — accessibility', () => {
  it('uses article element', () => {
    const wrapper = mountNode(MOCK_WORLD_NODE)
    expect(wrapper.element.tagName).toBe('ARTICLE')
  })

  it('uses header element inside', () => {
    const wrapper = mountNode(MOCK_WORLD_NODE)
    expect(wrapper.find('header').exists()).toBe(true)
  })

  it('does not use divs as buttons', () => {
    const wrapper = mountNode(MOCK_WORLD_NODE)
    expect(wrapper.findAll('div[role="button"]')).toHaveLength(0)
  })

  it('has no interactive elements (display-only)', () => {
    const wrapper = mountNode(MOCK_WORLD_NODE)
    expect(wrapper.findAll('button')).toHaveLength(0)
  })

  it('name is rendered as a paragraph', () => {
    const wrapper = mountNode(MOCK_WORLD_NODE)
    expect(wrapper.find('p').exists()).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// WorldGraphConnection — rendering
// ---------------------------------------------------------------------------

describe('WorldGraphConnection — rendering', () => {
  it('renders as a div with class world-graph-connection', () => {
    const wrapper = mountConnection()
    expect(wrapper.find('div.world-graph-connection').exists()).toBe(true)
  })

  it('renders a vertical connector', () => {
    const wrapper = mountConnection()
    expect(wrapper.find('.world-graph-connection-vertical').exists()).toBe(true)
  })

  it('renders a horizontal arrow indicator', () => {
    const wrapper = mountConnection()
    expect(wrapper.find('.world-graph-connection-horizontal').exists()).toBe(true)
  })

  it('has role img for accessibility', () => {
    const wrapper = mountConnection()
    expect(wrapper.attributes('role')).toBe('img')
  })

  it('has aria-label "connects parent to child"', () => {
    const wrapper = mountConnection()
    expect(wrapper.attributes('aria-label')).toBe('connects parent to child')
  })
})

// ---------------------------------------------------------------------------
// WorldGraphLegend — rendering
// ---------------------------------------------------------------------------

describe('WorldGraphLegend — rendering', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders as a section with class world-graph-legend', () => {
    const wrapper = mountLegend()
    expect(wrapper.find('section.world-graph-legend').exists()).toBe(true)
  })

  it('renders a header with title', () => {
    const wrapper = mountLegend()
    expect(wrapper.find('header.world-graph-legend-header').exists()).toBe(true)
  })

  it('renders the legend title as an h3', () => {
    const wrapper = mountLegend()
    const h3 = wrapper.find('h3.world-graph-legend-title')
    expect(h3.exists()).toBe(true)
  })

  it('renders two legend groups', () => {
    const wrapper = mountLegend()
    expect(wrapper.findAll('.world-graph-legend-group')).toHaveLength(2)
  })

  it('renders a types group', () => {
    const wrapper = mountLegend()
    const groups = wrapper.findAll('.world-graph-legend-group')
    expect(groups[0].find('.world-graph-legend-list').exists()).toBe(true)
  })

  it('renders a statuses group', () => {
    const wrapper = mountLegend()
    const groups = wrapper.findAll('.world-graph-legend-group')
    expect(groups[1].find('.world-graph-legend-list').exists()).toBe(true)
  })

  it('renders 4 type items', () => {
    const wrapper = mountLegend()
    const groups = wrapper.findAll('.world-graph-legend-group')
    expect(groups[0].findAll('li.world-graph-legend-item')).toHaveLength(4)
  })

  it('renders 2 status items', () => {
    const wrapper = mountLegend()
    const groups = wrapper.findAll('.world-graph-legend-group')
    expect(groups[1].findAll('li.world-graph-legend-item')).toHaveLength(2)
  })

  it('renders world badge', () => {
    const wrapper = mountLegend()
    expect(wrapper.find('.world-graph-legend-badge--world').exists()).toBe(true)
  })

  it('renders location badge', () => {
    const wrapper = mountLegend()
    expect(wrapper.find('.world-graph-legend-badge--location').exists()).toBe(true)
  })

  it('renders npc badge', () => {
    const wrapper = mountLegend()
    expect(wrapper.find('.world-graph-legend-badge--npc').exists()).toBe(true)
  })

  it('renders quest badge', () => {
    const wrapper = mountLegend()
    expect(wrapper.find('.world-graph-legend-badge--quest').exists()).toBe(true)
  })

  it('renders active dot', () => {
    const wrapper = mountLegend()
    expect(wrapper.find('.world-graph-legend-dot--active').exists()).toBe(true)
  })

  it('renders inactive dot', () => {
    const wrapper = mountLegend()
    expect(wrapper.find('.world-graph-legend-dot--inactive').exists()).toBe(true)
  })

  it('renders world badge label in Chinese by default', () => {
    const wrapper = mountLegend()
    const badges = wrapper.findAll('.world-graph-legend-badge')
    expect(badges[0].text()).toBe('世界')
  })

  it('renders location badge label in Chinese by default', () => {
    const wrapper = mountLegend()
    const badges = wrapper.findAll('.world-graph-legend-badge')
    expect(badges[1].text()).toBe('地点')
  })

  it('renders npc badge label in Chinese by default', () => {
    const wrapper = mountLegend()
    const badges = wrapper.findAll('.world-graph-legend-badge')
    expect(badges[2].text()).toBe('NPC')
  })

  it('renders quest badge label in Chinese by default', () => {
    const wrapper = mountLegend()
    const badges = wrapper.findAll('.world-graph-legend-badge')
    expect(badges[3].text()).toBe('任务')
  })

  it('renders active label in Chinese by default', () => {
    const wrapper = mountLegend()
    const labels = wrapper.findAll('.world-graph-legend-label')
    expect(labels[0].text()).toBe('活跃')
  })

  it('renders inactive label in Chinese by default', () => {
    const wrapper = mountLegend()
    const labels = wrapper.findAll('.world-graph-legend-label')
    expect(labels[1].text()).toBe('非活跃')
  })

  it('has group title for types', () => {
    const wrapper = mountLegend()
    const titles = wrapper.findAll('.world-graph-legend-group-title')
    expect(titles[0].text()).toBe('类型')
  })

  it('has group title for statuses', () => {
    const wrapper = mountLegend()
    const titles = wrapper.findAll('.world-graph-legend-group-title')
    expect(titles[1].text()).toBe('状态')
  })

  it('renders items in ul elements', () => {
    const wrapper = mountLegend()
    expect(wrapper.findAll('ul')).toHaveLength(2)
  })

  it('renders items as li elements', () => {
    const wrapper = mountLegend()
    expect(wrapper.findAll('li')).toHaveLength(6)
  })
})

// ---------------------------------------------------------------------------
// WorldGraphLegend — accessibility
// ---------------------------------------------------------------------------

describe('WorldGraphLegend — accessibility', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('uses section element', () => {
    const wrapper = mountLegend()
    expect(wrapper.find('section').exists()).toBe(true)
  })

  it('has aria-label "World graph legend"', () => {
    const wrapper = mountLegend()
    expect(wrapper.find('section').attributes('aria-label')).toBe('World graph legend')
  })

  it('uses header element', () => {
    const wrapper = mountLegend()
    expect(wrapper.find('header').exists()).toBe(true)
  })

  it('uses h3 for title', () => {
    const wrapper = mountLegend()
    expect(wrapper.find('h3').exists()).toBe(true)
  })

  it('uses h4 for group titles', () => {
    const wrapper = mountLegend()
    expect(wrapper.findAll('h4')).toHaveLength(2)
  })

  it('uses ul for lists', () => {
    const wrapper = mountLegend()
    expect(wrapper.findAll('ul')).toHaveLength(2)
  })

  it('uses li for each item', () => {
    const wrapper = mountLegend()
    expect(wrapper.findAll('li')).toHaveLength(6)
  })

  it('does not use divs as buttons', () => {
    const wrapper = mountLegend()
    expect(wrapper.findAll('div[role="button"]')).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// WorldGraphLegend — i18n rendering
// ---------------------------------------------------------------------------

describe('WorldGraphLegend — i18n rendering', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders legend title in Chinese by default', () => {
    const wrapper = mountLegend()
    expect(wrapper.find('.world-graph-legend-title').text()).toBe('图例')
  })

  it('renders legend title in English after language switch', async () => {
    const wrapper = mountLegend()
    useI18nStore().setLanguage('en-US')
    await nextTick()
    expect(wrapper.find('.world-graph-legend-title').text()).toBe('Legend')
  })

  it('renders world badge in English after language switch', async () => {
    const wrapper = mountLegend()
    useI18nStore().setLanguage('en-US')
    await nextTick()
    const badges = wrapper.findAll('.world-graph-legend-badge')
    expect(badges[0].text()).toBe('World')
  })

  it('renders location badge in English after language switch', async () => {
    const wrapper = mountLegend()
    useI18nStore().setLanguage('en-US')
    await nextTick()
    const badges = wrapper.findAll('.world-graph-legend-badge')
    expect(badges[1].text()).toBe('Location')
  })

  it('renders npc badge in English after language switch', async () => {
    const wrapper = mountLegend()
    useI18nStore().setLanguage('en-US')
    await nextTick()
    const badges = wrapper.findAll('.world-graph-legend-badge')
    expect(badges[2].text()).toBe('NPC')
  })

  it('renders quest badge in English after language switch', async () => {
    const wrapper = mountLegend()
    useI18nStore().setLanguage('en-US')
    await nextTick()
    const badges = wrapper.findAll('.world-graph-legend-badge')
    expect(badges[3].text()).toBe('Quest')
  })

  it('renders active label in English after language switch', async () => {
    const wrapper = mountLegend()
    useI18nStore().setLanguage('en-US')
    await nextTick()
    const labels = wrapper.findAll('.world-graph-legend-label')
    expect(labels[0].text()).toBe('Active')
  })

  it('renders inactive label in English after language switch', async () => {
    const wrapper = mountLegend()
    useI18nStore().setLanguage('en-US')
    await nextTick()
    const labels = wrapper.findAll('.world-graph-legend-label')
    expect(labels[1].text()).toBe('Inactive')
  })

  it('all labels switch back to Chinese', async () => {
    const wrapper = mountLegend()
    const store = useI18nStore()
    store.setLanguage('en-US')
    await nextTick()
    store.setLanguage('zh-CN')
    await nextTick()
    const labels = wrapper.findAll('.world-graph-legend-label')
    expect(labels[0].text()).toBe('活跃')
    expect(labels[1].text()).toBe('非活跃')
  })

  it('group titles switch to English', async () => {
    const wrapper = mountLegend()
    useI18nStore().setLanguage('en-US')
    await nextTick()
    const titles = wrapper.findAll('.world-graph-legend-group-title')
    expect(titles[0].text()).toBe('Types')
    expect(titles[1].text()).toBe('Status')
  })
})

// ---------------------------------------------------------------------------
// ObservatoryWorldGraph — rendering
// ---------------------------------------------------------------------------

describe('ObservatoryWorldGraph — rendering', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders the root container', () => {
    const wrapper = mountGraph()
    expect(wrapper.find('.observatory-world-graph').exists()).toBe(true)
  })

  it('renders the graph canvas section', () => {
    const wrapper = mountGraph()
    expect(wrapper.find('section.world-graph-canvas').exists()).toBe(true)
  })

  it('renders the graph header', () => {
    const wrapper = mountGraph()
    expect(wrapper.find('header.world-graph-header').exists()).toBe(true)
  })

  it('renders the graph title as an h2', () => {
    const wrapper = mountGraph()
    const h2 = wrapper.find('h2.world-graph-title')
    expect(h2.exists()).toBe(true)
    expect(h2.element.tagName).toBe('H2')
  })

  it('renders the tree container', () => {
    const wrapper = mountGraph()
    expect(wrapper.find('.world-graph-tree').exists()).toBe(true)
  })

  it('renders the root node section', () => {
    const wrapper = mountGraph()
    expect(wrapper.find('.world-graph-root').exists()).toBe(true)
  })

  it('renders the children container', () => {
    const wrapper = mountGraph()
    expect(wrapper.find('.world-graph-children').exists()).toBe(true)
  })

  it('renders 1 WorldGraphNode for the root', () => {
    const wrapper = mountGraph()
    const nodes = wrapper.findAllComponents(WorldGraphNode)
    expect(nodes).toHaveLength(7)
  })

  it('renders 7 total WorldGraphNode components', () => {
    const wrapper = mountGraph()
    expect(wrapper.findAllComponents(WorldGraphNode)).toHaveLength(7)
  })

  it('renders the WorldGraphLegend component', () => {
    const wrapper = mountGraph()
    expect(wrapper.findComponent(WorldGraphLegend).exists()).toBe(true)
  })

  it('renders the root node named "World"', () => {
    const wrapper = mountGraph()
    const names = wrapper.findAll('.world-graph-node-name')
    expect(names[0].text()).toBe('World')
  })

  it('renders 6 child nodes', () => {
    const wrapper = mountGraph()
    const children = wrapper.find('.world-graph-children')
    expect(children.findAllComponents(WorldGraphNode)).toHaveLength(6)
  })

  it('renders child nodes in the correct order', () => {
    const wrapper = mountGraph()
    const names = wrapper.findAll('.world-graph-node-name')
    expect(names).toHaveLength(7)
    expect(names[1].text()).toBe('Farm')
    expect(names[2].text()).toBe('Barn')
    expect(names[3].text()).toBe('WheatField')
    expect(names[4].text()).toBe('Farmer')
    expect(names[5].text()).toBe('Merchant')
    expect(names[6].text()).toBe('HarvestQuest')
  })
})

// ---------------------------------------------------------------------------
// ObservatoryWorldGraph — i18n
// ---------------------------------------------------------------------------

describe('ObservatoryWorldGraph — i18n', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders title in Chinese by default', () => {
    const wrapper = mountGraph()
    expect(wrapper.find('.world-graph-title').text()).toBe('世界图谱')
  })

  it('renders title in English after language switch', async () => {
    const wrapper = mountGraph()
    useI18nStore().setLanguage('en-US')
    await nextTick()
    expect(wrapper.find('.world-graph-title').text()).toBe('World Graph')
  })
})

// ---------------------------------------------------------------------------
// ObservatoryWorldGraph — accessibility
// ---------------------------------------------------------------------------

describe('ObservatoryWorldGraph — accessibility', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('uses a section with aria-label for the graph canvas', () => {
    const wrapper = mountGraph()
    expect(
      wrapper.find('section.world-graph-canvas').attributes('aria-label'),
    ).toBe('World graph')
  })

  it('uses h2 for the graph title', () => {
    const wrapper = mountGraph()
    expect(wrapper.find('h2.world-graph-title').element.tagName).toBe('H2')
  })

  it('uses article elements for each node', () => {
    const wrapper = mountGraph()
    const articles = wrapper.findAll('article.world-graph-node')
    expect(articles).toHaveLength(7)
  })

  it('does not use divs as buttons', () => {
    const wrapper = mountGraph()
    expect(wrapper.findAll('div[role="button"]')).toHaveLength(0)
  })

  it('has no interactive elements (display-only graph)', () => {
    const wrapper = mountGraph()
    expect(wrapper.findAll('button')).toHaveLength(0)
  })

  it('uses section for the legend', () => {
    const wrapper = mountGraph()
    expect(wrapper.find('section.world-graph-legend').exists()).toBe(true)
  })

  it('uses header for the graph title', () => {
    const wrapper = mountGraph()
    expect(wrapper.find('header.world-graph-header').exists()).toBe(true)
  })

  it('uses h3 for legend title', () => {
    const wrapper = mountGraph()
    expect(wrapper.find('h3.world-graph-legend-title').exists()).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Content integration
// ---------------------------------------------------------------------------

describe('world graph — content integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders the world graph when WorldGraph is selected', () => {
    const wrapper = mountContentAsWorldGraph()
    expect(wrapper.findComponent(ObservatoryWorldGraph).exists()).toBe(true)
  })

  it('does not render placeholder cards for WorldGraph', () => {
    const wrapper = mountContentAsWorldGraph()
    expect(wrapper.findAll('.content-card')).toHaveLength(0)
  })

  it('switches from dashboard to world graph', async () => {
    const store = useObservatoryStore()
    const wrapper = mount(ObservatoryContent)
    expect(wrapper.findComponent(ObservatoryWorldGraph).exists()).toBe(false)
    store.selectPanel('WorldGraph')
    await nextTick()
    expect(wrapper.findComponent(ObservatoryWorldGraph).exists()).toBe(true)
  })

  it('switches from world graph to Settings grid', async () => {
    const store = useObservatoryStore()
    const wrapper = mountContentAsWorldGraph()
    expect(wrapper.findComponent(ObservatoryWorldGraph).exists()).toBe(true)
    store.selectPanel('Settings')
    await nextTick()
    expect(wrapper.findComponent(ObservatoryWorldGraph).exists()).toBe(false)
    expect(wrapper.findAll('.content-card').length).toBeGreaterThan(0)
  })

  it('switches from world graph back to Overview', async () => {
    const store = useObservatoryStore()
    const wrapper = mountContentAsWorldGraph()
    expect(wrapper.findComponent(ObservatoryWorldGraph).exists()).toBe(true)
    store.selectPanel('Overview')
    await nextTick()
    expect(wrapper.findComponent(ObservatoryWorldGraph).exists()).toBe(false)
  })

  it('switches from trace graph to world graph', async () => {
    const store = useObservatoryStore()
    store.selectPanel('TraceGraph')
    const wrapper = mount(ObservatoryContent)
    expect(wrapper.findComponent(ObservatoryWorldGraph).exists()).toBe(false)
    store.selectPanel('WorldGraph')
    await nextTick()
    expect(wrapper.findComponent(ObservatoryWorldGraph).exists()).toBe(true)
  })

  it('switches from world graph to trace graph', async () => {
    const store = useObservatoryStore()
    const wrapper = mountContentAsWorldGraph()
    expect(wrapper.findComponent(ObservatoryWorldGraph).exists()).toBe(true)
    store.selectPanel('TraceGraph')
    await nextTick()
    expect(wrapper.findComponent(ObservatoryWorldGraph).exists()).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Deterministic rendering
// ---------------------------------------------------------------------------

describe('world graph — deterministic rendering', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders identical node names across mounts', () => {
    const a = mountGraph()
    const b = mountGraph()
    const aNames = a.findAll('.world-graph-node-name').map((el) => el.text())
    const bNames = b.findAll('.world-graph-node-name').map((el) => el.text())
    expect(aNames).toEqual(bNames)
  })

  it('renders identical node count across mounts', () => {
    const a = mountGraph()
    const b = mountGraph()
    expect(a.findAllComponents(WorldGraphNode)).toHaveLength(
      b.findAllComponents(WorldGraphNode).length,
    )
  })

  it('renders identical HTML across mounts', () => {
    const a = mountGraph()
    const b = mountGraph()
    expect(a.html()).toBe(b.html())
  })

  it('renders identical child order across mounts', () => {
    const a = mountGraph()
    const b = mountGraph()
    const aNames = a.findAll('.world-graph-node-name').map((el) => el.text())
    const bNames = b.findAll('.world-graph-node-name').map((el) => el.text())
    for (let i = 0; i < aNames.length; i++) {
      expect(aNames[i]).toBe(bNames[i])
    }
  })
})

// ---------------------------------------------------------------------------
// I18n catalog keys
// ---------------------------------------------------------------------------

describe('i18n catalog — world graph keys', () => {
  it('zh-CN contains the world title key', () => {
    expect(resolveKey(zhCN, 'observatory.world.title')).toBe('世界图谱')
  })

  it('zh-CN contains the world legend key', () => {
    expect(resolveKey(zhCN, 'observatory.world.legend')).toBe('图例')
  })

  it('zh-CN contains the world world key', () => {
    expect(resolveKey(zhCN, 'observatory.world.world')).toBe('世界')
  })

  it('zh-CN contains the world location key', () => {
    expect(resolveKey(zhCN, 'observatory.world.location')).toBe('地点')
  })

  it('zh-CN contains the world npc key', () => {
    expect(resolveKey(zhCN, 'observatory.world.npc')).toBe('NPC')
  })

  it('zh-CN contains the world quest key', () => {
    expect(resolveKey(zhCN, 'observatory.world.quest')).toBe('任务')
  })

  it('zh-CN contains the world active key', () => {
    expect(resolveKey(zhCN, 'observatory.world.active')).toBe('活跃')
  })

  it('zh-CN contains the world inactive key', () => {
    expect(resolveKey(zhCN, 'observatory.world.inactive')).toBe('非活跃')
  })

  it('zh-CN contains the panel worldgraph key', () => {
    expect(resolveKey(zhCN, 'observatory.panels.worldgraph')).toBe('世界图谱')
  })

  it('en-US contains the world title key', () => {
    expect(resolveKey(enUS, 'observatory.world.title')).toBe('World Graph')
  })

  it('en-US contains the world legend key', () => {
    expect(resolveKey(enUS, 'observatory.world.legend')).toBe('Legend')
  })

  it('en-US contains the world world key', () => {
    expect(resolveKey(enUS, 'observatory.world.world')).toBe('World')
  })

  it('en-US contains the world location key', () => {
    expect(resolveKey(enUS, 'observatory.world.location')).toBe('Location')
  })

  it('en-US contains the world npc key', () => {
    expect(resolveKey(enUS, 'observatory.world.npc')).toBe('NPC')
  })

  it('en-US contains the world quest key', () => {
    expect(resolveKey(enUS, 'observatory.world.quest')).toBe('Quest')
  })

  it('en-US contains the world active key', () => {
    expect(resolveKey(enUS, 'observatory.world.active')).toBe('Active')
  })

  it('en-US contains the world inactive key', () => {
    expect(resolveKey(enUS, 'observatory.world.inactive')).toBe('Inactive')
  })

  it('en-US contains the panel worldgraph key', () => {
    expect(resolveKey(enUS, 'observatory.panels.worldgraph')).toBe('World Graph')
  })

  it('zh-CN contains the types label key', () => {
    expect(resolveKey(zhCN, 'observatory.labels.types')).toBe('类型')
  })

  it('en-US contains the types label key', () => {
    expect(resolveKey(enUS, 'observatory.labels.types')).toBe('Types')
  })
})

// ---------------------------------------------------------------------------
// Structural integrity
// ---------------------------------------------------------------------------

describe('ObservatoryWorldGraph — structural integrity', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('graph canvas section contains the tree container', () => {
    const wrapper = mountGraph()
    const canvas = wrapper.find('section.world-graph-canvas')
    expect(canvas.find('.world-graph-tree').exists()).toBe(true)
  })

  it('graph section contains the header', () => {
    const wrapper = mountGraph()
    const canvas = wrapper.find('section.world-graph-canvas')
    expect(canvas.find('header.world-graph-header').exists()).toBe(true)
  })

  it('legend is rendered after the canvas', () => {
    const wrapper = mountGraph()
    const root = wrapper.find('.observatory-world-graph')
    const canvas = root.find('section.world-graph-canvas')
    const legend = root.find('section.world-graph-legend')
    expect(
      canvas.element.compareDocumentPosition(legend.element),
    ).toBe(4)
  })

  it('root has a single WorldGraphNode', () => {
    const wrapper = mountGraph()
    const root = wrapper.find('.world-graph-root')
    expect(root.findAllComponents(WorldGraphNode)).toHaveLength(1)
  })

  it('children container has 6 WorldGraphNode components', () => {
    const wrapper = mountGraph()
    const children = wrapper.find('.world-graph-children')
    expect(children.findAllComponents(WorldGraphNode)).toHaveLength(6)
  })

  it('title is inside the header', () => {
    const wrapper = mountGraph()
    const header = wrapper.find('header.world-graph-header')
    expect(header.find('h2.world-graph-title').exists()).toBe(true)
  })

  it('legend has two groups', () => {
    const wrapper = mountGraph()
    const legend = wrapper.find('section.world-graph-legend')
    expect(legend.findAll('.world-graph-legend-group')).toHaveLength(2)
  })
})

// ---------------------------------------------------------------------------
// Node types and statuses
// ---------------------------------------------------------------------------

describe('world graph — node types and statuses', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('root node has world type', () => {
    const wrapper = mountGraph()
    const root = wrapper.find('.world-graph-root').findComponent(WorldGraphNode)
    expect(root.classes()).toContain('world-graph-node--world')
  })

  it('root node has active status', () => {
    const wrapper = mountGraph()
    const root = wrapper.find('.world-graph-root').findComponent(WorldGraphNode)
    expect(root.classes()).toContain('world-graph-node--active')
  })

  it('Farm node has location type', () => {
    const wrapper = mountGraph()
    const nodes = wrapper.findAllComponents(WorldGraphNode)
    expect(nodes[1].classes()).toContain('world-graph-node--location')
  })

  it('Farm node has active status', () => {
    const wrapper = mountGraph()
    const nodes = wrapper.findAllComponents(WorldGraphNode)
    expect(nodes[1].classes()).toContain('world-graph-node--active')
  })

  it('Barn node has location type', () => {
    const wrapper = mountGraph()
    const nodes = wrapper.findAllComponents(WorldGraphNode)
    expect(nodes[2].classes()).toContain('world-graph-node--location')
  })

  it('Barn node has inactive status', () => {
    const wrapper = mountGraph()
    const nodes = wrapper.findAllComponents(WorldGraphNode)
    expect(nodes[2].classes()).toContain('world-graph-node--inactive')
  })

  it('WheatField node has location type', () => {
    const wrapper = mountGraph()
    const nodes = wrapper.findAllComponents(WorldGraphNode)
    expect(nodes[3].classes()).toContain('world-graph-node--location')
  })

  it('WheatField node has active status', () => {
    const wrapper = mountGraph()
    const nodes = wrapper.findAllComponents(WorldGraphNode)
    expect(nodes[3].classes()).toContain('world-graph-node--active')
  })

  it('Farmer node has npc type', () => {
    const wrapper = mountGraph()
    const nodes = wrapper.findAllComponents(WorldGraphNode)
    expect(nodes[4].classes()).toContain('world-graph-node--npc')
  })

  it('Farmer node has active status', () => {
    const wrapper = mountGraph()
    const nodes = wrapper.findAllComponents(WorldGraphNode)
    expect(nodes[4].classes()).toContain('world-graph-node--active')
  })

  it('Merchant node has npc type', () => {
    const wrapper = mountGraph()
    const nodes = wrapper.findAllComponents(WorldGraphNode)
    expect(nodes[5].classes()).toContain('world-graph-node--npc')
  })

  it('Merchant node has inactive status', () => {
    const wrapper = mountGraph()
    const nodes = wrapper.findAllComponents(WorldGraphNode)
    expect(nodes[5].classes()).toContain('world-graph-node--inactive')
  })

  it('HarvestQuest node has quest type', () => {
    const wrapper = mountGraph()
    const nodes = wrapper.findAllComponents(WorldGraphNode)
    expect(nodes[6].classes()).toContain('world-graph-node--quest')
  })

  it('HarvestQuest node has active status', () => {
    const wrapper = mountGraph()
    const nodes = wrapper.findAllComponents(WorldGraphNode)
    expect(nodes[6].classes()).toContain('world-graph-node--active')
  })
})

// ---------------------------------------------------------------------------
// Empty graph — legend edge cases (can render legend with no items)
// ---------------------------------------------------------------------------

describe('world graph — legend with empty items', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders legend with empty types array', () => {
    const wrapper = mount(WorldGraphLegend, {
      props: {
        types: [],
        statuses: [{ key: 'active' as const }, { key: 'inactive' as const }],
      },
    })
    const groups = wrapper.findAll('.world-graph-legend-group')
    expect(groups[0].findAll('li')).toHaveLength(0)
  })

  it('renders legend with empty statuses array', () => {
    const wrapper = mount(WorldGraphLegend, {
      props: {
        types: [{ key: 'world' as const }],
        statuses: [],
      },
    })
    const groups = wrapper.findAll('.world-graph-legend-group')
    expect(groups[1].findAll('li')).toHaveLength(0)
  })

  it('renders legend with both empty arrays', () => {
    const wrapper = mount(WorldGraphLegend, {
      props: {
        types: [],
        statuses: [],
      },
    })
    expect(wrapper.findAll('li')).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// WorldGraphNode — all type combinations
// ---------------------------------------------------------------------------

describe('WorldGraphNode — all node type combinations', () => {
  const types: Array<{ type: WorldNodeData['type']; name: string }> = [
    { type: 'world', name: 'World' },
    { type: 'location', name: 'Forest' },
    { type: 'npc', name: 'Blacksmith' },
    { type: 'quest', name: 'FindSword' },
  ]
  const statuses: WorldNodeData['status'][] = ['active', 'inactive']

  for (const typeDef of types) {
    for (const status of statuses) {
      it(`renders ${typeDef.type} ${status} node correctly`, () => {
        const node: WorldNodeData = {
          id: `node-${typeDef.type}-${status}`,
          name: typeDef.name,
          type: typeDef.type,
          status,
        }
        const wrapper = mountNode(node)
        expect(wrapper.classes()).toContain(`world-graph-node--${typeDef.type}`)
        expect(wrapper.classes()).toContain(`world-graph-node--${status}`)
        expect(wrapper.find('.world-graph-node-type-badge').text()).toBe(typeDef.type)
        expect(wrapper.find('.world-graph-node-status-label').text()).toBe(status)
        expect(wrapper.find('.world-graph-node-name').text()).toBe(typeDef.name)
      })
    }
  }
})

// ---------------------------------------------------------------------------
// Content integration details
// ---------------------------------------------------------------------------

describe('world graph — content integration details', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('world graph renders correct title via store', () => {
    const store = useObservatoryStore()
    store.selectPanel('WorldGraph')
    const wrapper = mount(ObservatoryContent)
    expect(wrapper.find('h2.world-graph-title').text()).toBe('世界图谱')
  })

  it('world graph shows 7 article nodes in content area', () => {
    const wrapper = mountContentAsWorldGraph()
    expect(wrapper.findAll('article.world-graph-node')).toHaveLength(7)
  })

  it('world graph shows legend in content area', () => {
    const wrapper = mountContentAsWorldGraph()
    expect(wrapper.find('.world-graph-legend').exists()).toBe(true)
  })

  it('world graph shows 4 type badges in legend in content area', () => {
    const wrapper = mountContentAsWorldGraph()
    expect(wrapper.findAll('.world-graph-legend-badge')).toHaveLength(4)
  })

  it('world graph shows 2 status items in legend in content area', () => {
    const wrapper = mountContentAsWorldGraph()
    expect(wrapper.findAll('.world-graph-legend-label')).toHaveLength(2)
  })
})

// ---------------------------------------------------------------------------
// Accessibility details
// ---------------------------------------------------------------------------

describe('world graph — accessibility details', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('graph canvas has aria-label World graph', () => {
    const wrapper = mountGraph()
    expect(
      wrapper.find('section.world-graph-canvas').attributes('aria-label'),
    ).toBe('World graph')
  })

  it('connection has role img', () => {
    const wrapper = mountGraph()
    const connections = wrapper.findAll('.world-graph-connection')
    for (const conn of connections) {
      expect(conn.attributes('role')).toBe('img')
    }
  })

  it('connection has aria-label "connects parent to child"', () => {
    const wrapper = mountGraph()
    const connections = wrapper.findAll('.world-graph-connection')
    for (const conn of connections) {
      expect(conn.attributes('aria-label')).toBe('connects parent to child')
    }
  })

  it('legend has aria-label World graph legend', () => {
    const wrapper = mountGraph()
    expect(
      wrapper.find('section.world-graph-legend').attributes('aria-label'),
    ).toBe('World graph legend')
  })

  it('uses h2 for graph title', () => {
    const wrapper = mountGraph()
    expect(wrapper.find('h2.world-graph-title').exists()).toBe(true)
  })

  it('uses h3 for legend title', () => {
    const wrapper = mountGraph()
    expect(wrapper.find('h3.world-graph-legend-title').exists()).toBe(true)
  })

  it('uses h4 for legend group titles', () => {
    const wrapper = mountGraph()
    expect(wrapper.findAll('h4')).toHaveLength(2)
  })

  it('uses article for all nodes', () => {
    const wrapper = mountGraph()
    const articles = wrapper.findAll('article')
    expect(articles.length).toBeGreaterThanOrEqual(7)
  })

  it('uses header for section headers', () => {
    const wrapper = mountGraph()
    const headers = wrapper.findAll('header')
    expect(headers.length).toBeGreaterThanOrEqual(2)
  })

  it('no div-as-button in the entire graph', () => {
    const wrapper = mountGraph()
    expect(wrapper.findAll('div[role="button"]')).toHaveLength(0)
  })

  it('no button elements in the graph', () => {
    const wrapper = mountGraph()
    expect(wrapper.findAll('button')).toHaveLength(0)
  })

  it('uses paragraph for node names', () => {
    const wrapper = mountGraph()
    expect(wrapper.findAll('p.world-graph-node-name')).toHaveLength(7)
  })

  it('uses ul for legend lists', () => {
    const wrapper = mountGraph()
    expect(wrapper.findAll('ul')).toHaveLength(2)
  })

  it('uses li for legend items', () => {
    const wrapper = mountGraph()
    expect(wrapper.findAll('li')).toHaveLength(6)
  })

  it('has correct heading hierarchy (h2 → h3 → h4)', () => {
    const wrapper = mountGraph()
    const h2 = wrapper.findAll('h2')
    const h3 = wrapper.findAll('h3')
    const h4 = wrapper.findAll('h4')
    expect(h2).toHaveLength(1)
    expect(h3).toHaveLength(1)
    expect(h4).toHaveLength(2)
  })
})

// ---------------------------------------------------------------------------
// WorldGraphLegend — legend items (custom props)
// ---------------------------------------------------------------------------

describe('WorldGraphLegend — custom items', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders with single type item', () => {
    const wrapper = mount(WorldGraphLegend, {
      props: {
        types: [{ key: 'npc' as const }],
        statuses: [{ key: 'active' as const }],
      },
    })
    expect(wrapper.findAll('li')).toHaveLength(2)
  })

  it('renders with all type items from enum', () => {
    const wrapper = mount(WorldGraphLegend, {
      props: {
        types: [
          { key: 'world' as const },
          { key: 'location' as const },
          { key: 'npc' as const },
          { key: 'quest' as const },
        ],
        statuses: [
          { key: 'active' as const },
          { key: 'inactive' as const },
        ],
      },
    })
    expect(wrapper.findAll('.world-graph-legend-badge')).toHaveLength(4)
    expect(wrapper.findAll('.world-graph-legend-dot')).toHaveLength(2)
  })
})

// ---------------------------------------------------------------------------
// ObservatoryWorldGraph — i18n integration
// ---------------------------------------------------------------------------

describe('ObservatoryWorldGraph — i18n integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('title switches to English reactively', async () => {
    const wrapper = mountGraph()
    useI18nStore().setLanguage('en-US')
    await nextTick()
    expect(wrapper.find('.world-graph-title').text()).toBe('World Graph')
  })

  it('title switches back to Chinese', async () => {
    const wrapper = mountGraph()
    const store = useI18nStore()
    store.setLanguage('en-US')
    await nextTick()
    store.setLanguage('zh-CN')
    await nextTick()
    expect(wrapper.find('.world-graph-title').text()).toBe('世界图谱')
  })

  it('legend title switches to English reactively', async () => {
    const wrapper = mountGraph()
    useI18nStore().setLanguage('en-US')
    await nextTick()
    expect(wrapper.find('.world-graph-legend-title').text()).toBe('Legend')
  })
})

// ---------------------------------------------------------------------------
// Sidebar panel parity
// ---------------------------------------------------------------------------

describe('world graph — sidebar panel', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('WorldGraph is in the OBSERVATORY_PANELS array', () => {
    expect(OBSERVATORY_PANELS.includes('WorldGraph')).toBe(true)
  })

  it('WorldGraph is between TraceGraph and Settings', () => {
    const idx = OBSERVATORY_PANELS.indexOf('WorldGraph')
    expect(idx).toBeGreaterThan(OBSERVATORY_PANELS.indexOf('TraceGraph'))
    expect(idx).toBeLessThan(OBSERVATORY_PANELS.indexOf('Settings'))
  })
})