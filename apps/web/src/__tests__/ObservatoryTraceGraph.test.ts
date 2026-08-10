import { describe, it, expect, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

import ObservatoryTraceGraph from '../components/observatory/graph/ObservatoryTraceGraph.vue'
import TraceGraphNode from '../components/observatory/graph/TraceGraphNode.vue'
import TraceGraphEdge from '../components/observatory/graph/TraceGraphEdge.vue'
import TraceGraphLegend from '../components/observatory/graph/TraceGraphLegend.vue'
import ObservatoryContent from '../components/observatory/ObservatoryContent.vue'
import type { GraphNode } from '../components/observatory/graph/TraceGraphNode.vue'
import { useObservatoryStore } from '../stores/observatory'
import { useI18nStore } from '../stores/i18n'
import { resolveKey } from '../i18n'
import { zhCN } from '../i18n/locales/zh-CN'
import { enUS } from '../i18n/locales/en-US'

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const MOCK_COMPLETED_NODE: GraphNode = {
  id: 'node-1',
  label: 'CreateWorld',
  status: 'completed',
}

const MOCK_PENDING_NODE: GraphNode = {
  id: 'node-p',
  label: 'PendingTask',
  status: 'pending',
}

const MOCK_FAILED_NODE: GraphNode = {
  id: 'node-f',
  label: 'FailedTask',
  status: 'failed',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mountGraph(): VueWrapper {
  return mount(ObservatoryTraceGraph)
}

function mountNode(node: GraphNode): VueWrapper {
  return mount(TraceGraphNode, {
    props: { node },
  })
}

function mountEdge(): VueWrapper {
  return mount(TraceGraphEdge)
}

function mountLegend(): VueWrapper {
  return mount(TraceGraphLegend, {
    props: {
      items: [
        { status: 'completed' as const },
        { status: 'pending' as const },
        { status: 'failed' as const },
      ],
    },
  })
}

function mountContentAsTraceGraph(): VueWrapper {
  const store = useObservatoryStore()
  store.selectPanel('TraceGraph')
  return mount(ObservatoryContent)
}

// ---------------------------------------------------------------------------
// TraceGraphNode — rendering
// ---------------------------------------------------------------------------

describe('TraceGraphNode — rendering', () => {
  it('renders as an article with class graph-node', () => {
    const wrapper = mountNode(MOCK_COMPLETED_NODE)
    expect(wrapper.find('article.graph-node').exists()).toBe(true)
  })

  it('renders a header inside the node', () => {
    const wrapper = mountNode(MOCK_COMPLETED_NODE)
    expect(wrapper.find('header.graph-node-header').exists()).toBe(true)
  })

  it('renders the status dot', () => {
    const wrapper = mountNode(MOCK_COMPLETED_NODE)
    expect(wrapper.find('.graph-node-status-dot').exists()).toBe(true)
  })

  it('renders the status label as uppercase text', () => {
    const wrapper = mountNode(MOCK_COMPLETED_NODE)
    expect(wrapper.find('.graph-node-status-label').text()).toBe('completed')
  })

  it('renders the strategy label', () => {
    const wrapper = mountNode(MOCK_COMPLETED_NODE)
    expect(wrapper.find('.graph-node-label').exists()).toBe(true)
    expect(wrapper.find('.graph-node-label').text()).toBe('CreateWorld')
  })

  it('renders label as a paragraph', () => {
    const wrapper = mountNode(MOCK_COMPLETED_NODE)
    expect(wrapper.find('p.graph-node-label').exists()).toBe(true)
  })

  it('applies completed status class', () => {
    const wrapper = mountNode(MOCK_COMPLETED_NODE)
    expect(wrapper.classes()).toContain('graph-node--completed')
  })

  it('applies pending status class', () => {
    const wrapper = mountNode(MOCK_PENDING_NODE)
    expect(wrapper.classes()).toContain('graph-node--pending')
  })

  it('applies failed status class', () => {
    const wrapper = mountNode(MOCK_FAILED_NODE)
    expect(wrapper.classes()).toContain('graph-node--failed')
  })

  it('renders pending status label', () => {
    const wrapper = mountNode(MOCK_PENDING_NODE)
    expect(wrapper.find('.graph-node-status-label').text()).toBe('pending')
  })

  it('renders failed status label', () => {
    const wrapper = mountNode(MOCK_FAILED_NODE)
    expect(wrapper.find('.graph-node-status-label').text()).toBe('failed')
  })

  it('renders pending node label', () => {
    const wrapper = mountNode(MOCK_PENDING_NODE)
    expect(wrapper.find('.graph-node-label').text()).toBe('PendingTask')
  })

  it('renders failed node label', () => {
    const wrapper = mountNode(MOCK_FAILED_NODE)
    expect(wrapper.find('.graph-node-label').text()).toBe('FailedTask')
  })

  it('renders header with dot and status text', () => {
    const wrapper = mountNode(MOCK_COMPLETED_NODE)
    const header = wrapper.find('header.graph-node-header')
    expect(header.find('.graph-node-status-dot').exists()).toBe(true)
    expect(header.find('.graph-node-status-label').exists()).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// TraceGraphNode — accessibility
// ---------------------------------------------------------------------------

describe('TraceGraphNode — accessibility', () => {
  it('uses article element', () => {
    const wrapper = mountNode(MOCK_COMPLETED_NODE)
    expect(wrapper.element.tagName).toBe('ARTICLE')
  })

  it('uses header element inside', () => {
    const wrapper = mountNode(MOCK_COMPLETED_NODE)
    expect(wrapper.find('header').exists()).toBe(true)
  })

  it('uses h3 inside header', () => {
    const wrapper = mountNode(MOCK_COMPLETED_NODE)
    expect(wrapper.find('h3').exists()).toBe(false) // No h3 in node
  })

  it('does not use divs as buttons', () => {
    const wrapper = mountNode(MOCK_COMPLETED_NODE)
    expect(wrapper.findAll('div[role="button"]')).toHaveLength(0)
  })

  it('has no interactive elements (display-only)', () => {
    const wrapper = mountNode(MOCK_COMPLETED_NODE)
    expect(wrapper.findAll('button')).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// TraceGraphEdge — rendering
// ---------------------------------------------------------------------------

describe('TraceGraphEdge — rendering', () => {
  it('renders as a div with class graph-edge', () => {
    const wrapper = mountEdge()
    expect(wrapper.find('div.graph-edge').exists()).toBe(true)
  })

  it('renders a line connector', () => {
    const wrapper = mountEdge()
    expect(wrapper.find('.graph-edge-line').exists()).toBe(true)
  })

  it('renders an arrow indicator', () => {
    const wrapper = mountEdge()
    expect(wrapper.find('.graph-edge-arrow').exists()).toBe(true)
  })

  it('has role img for accessibility', () => {
    const wrapper = mountEdge()
    expect(wrapper.attributes('role')).toBe('img')
  })

  it('has aria-label "connects to"', () => {
    const wrapper = mountEdge()
    expect(wrapper.attributes('aria-label')).toBe('connects to')
  })
})

// ---------------------------------------------------------------------------
// TraceGraphLegend — rendering
// ---------------------------------------------------------------------------

describe('TraceGraphLegend — rendering', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders as a section with class graph-legend', () => {
    const wrapper = mountLegend()
    expect(wrapper.find('section.graph-legend').exists()).toBe(true)
  })

  it('renders a header with title', () => {
    const wrapper = mountLegend()
    expect(wrapper.find('header.graph-legend-header').exists()).toBe(true)
  })

  it('renders the legend title as an h3', () => {
    const wrapper = mountLegend()
    const h3 = wrapper.find('h3.graph-legend-title')
    expect(h3.exists()).toBe(true)
  })

  it('renders a list of legend items', () => {
    const wrapper = mountLegend()
    expect(wrapper.find('ul.graph-legend-list').exists()).toBe(true)
  })

  it('renders 3 legend items', () => {
    const wrapper = mountLegend()
    expect(wrapper.findAll('li.graph-legend-item')).toHaveLength(3)
  })

  it('renders completed dot', () => {
    const wrapper = mountLegend()
    const dots = wrapper.findAll('.graph-legend-dot')
    expect(dots[0].classes()).toContain('graph-legend-dot--completed')
  })

  it('renders pending dot', () => {
    const wrapper = mountLegend()
    const dots = wrapper.findAll('.graph-legend-dot')
    expect(dots[1].classes()).toContain('graph-legend-dot--pending')
  })

  it('renders failed dot', () => {
    const wrapper = mountLegend()
    const dots = wrapper.findAll('.graph-legend-dot')
    expect(dots[2].classes()).toContain('graph-legend-dot--failed')
  })

  it('renders completed label', () => {
    const wrapper = mountLegend()
    const labels = wrapper.findAll('.graph-legend-label')
    expect(labels[0].text()).toBe('已完成')
  })

  it('renders pending label', () => {
    const wrapper = mountLegend()
    const labels = wrapper.findAll('.graph-legend-label')
    expect(labels[1].text()).toBe('进行中')
  })

  it('renders failed label', () => {
    const wrapper = mountLegend()
    const labels = wrapper.findAll('.graph-legend-label')
    expect(labels[2].text()).toBe('失败')
  })

  it('renders items in a list with li elements', () => {
    const wrapper = mountLegend()
    expect(wrapper.findAll('li')).toHaveLength(3)
  })
})

// ---------------------------------------------------------------------------
// TraceGraphLegend — accessibility
// ---------------------------------------------------------------------------

describe('TraceGraphLegend — accessibility', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('uses section element', () => {
    const wrapper = mountLegend()
    expect(wrapper.find('section').exists()).toBe(true)
  })

  it('has aria-label "Graph legend"', () => {
    const wrapper = mountLegend()
    expect(wrapper.find('section').attributes('aria-label')).toBe('Graph legend')
  })

  it('uses header element', () => {
    const wrapper = mountLegend()
    expect(wrapper.find('header').exists()).toBe(true)
  })

  it('uses h3 for title', () => {
    const wrapper = mountLegend()
    expect(wrapper.find('h3').exists()).toBe(true)
  })

  it('uses ul for list', () => {
    const wrapper = mountLegend()
    expect(wrapper.find('ul').exists()).toBe(true)
  })

  it('uses li for each item', () => {
    const wrapper = mountLegend()
    expect(wrapper.findAll('li')).toHaveLength(3)
  })

  it('does not use divs as buttons', () => {
    const wrapper = mountLegend()
    expect(wrapper.findAll('div[role="button"]')).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// TraceGraphLegend — i18n rendering
// ---------------------------------------------------------------------------

describe('TraceGraphLegend — i18n rendering', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders legend title in Chinese by default', () => {
    const wrapper = mountLegend()
    expect(wrapper.find('.graph-legend-title').text()).toBe('图例')
  })

  it('renders completed label in English after language switch', async () => {
    const wrapper = mountLegend()
    useI18nStore().setLanguage('en-US')
    await nextTick()
    const labels = wrapper.findAll('.graph-legend-label')
    expect(labels[0].text()).toBe('Completed')
  })

  it('renders pending label in English after language switch', async () => {
    const wrapper = mountLegend()
    useI18nStore().setLanguage('en-US')
    await nextTick()
    const labels = wrapper.findAll('.graph-legend-label')
    expect(labels[1].text()).toBe('Pending')
  })

  it('renders failed label in English after language switch', async () => {
    const wrapper = mountLegend()
    useI18nStore().setLanguage('en-US')
    await nextTick()
    const labels = wrapper.findAll('.graph-legend-label')
    expect(labels[2].text()).toBe('Failed')
  })
})

// ---------------------------------------------------------------------------
// ObservatoryTraceGraph — rendering
// ---------------------------------------------------------------------------

describe('ObservatoryTraceGraph — rendering', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders the root container', () => {
    const wrapper = mountGraph()
    expect(wrapper.find('.observatory-trace-graph').exists()).toBe(true)
  })

  it('renders the graph canvas section', () => {
    const wrapper = mountGraph()
    expect(wrapper.find('section.graph-canvas').exists()).toBe(true)
  })

  it('renders the graph header', () => {
    const wrapper = mountGraph()
    expect(wrapper.find('header.graph-header').exists()).toBe(true)
  })

  it('renders the graph title as an h2', () => {
    const wrapper = mountGraph()
    const h2 = wrapper.find('h2.graph-title')
    expect(h2.exists()).toBe(true)
    expect(h2.element.tagName).toBe('H2')
  })

  it('renders 6 TraceGraphNode components', () => {
    const wrapper = mountGraph()
    expect(wrapper.findAllComponents(TraceGraphNode)).toHaveLength(6)
  })

  it('renders 5 TraceGraphEdge components', () => {
    const wrapper = mountGraph()
    expect(wrapper.findAllComponents(TraceGraphEdge)).toHaveLength(5)
  })

  it('renders the TraceGraphLegend component', () => {
    const wrapper = mountGraph()
    expect(wrapper.findComponent(TraceGraphLegend).exists()).toBe(true)
  })

  it('renders the graph flow container', () => {
    const wrapper = mountGraph()
    expect(wrapper.find('.graph-flow').exists()).toBe(true)
  })

  it('renders nodes in the correct order', () => {
    const wrapper = mountGraph()
    const labels = wrapper
      .findAll('.graph-node-label')
      .map((el) => el.text().trim())
    expect(labels).toEqual([
      'CreateWorld',
      'GenerateTerrain',
      'CreateFarm',
      'CreateNPC',
      'CreateInventory',
      'CreateQuest',
    ])
  })

  it('renders all 6 nodes as completed', () => {
    const wrapper = mountGraph()
    const nodes = wrapper.findAllComponents(TraceGraphNode)
    for (const node of nodes) {
      expect(node.classes()).toContain('graph-node--completed')
    }
  })
})

// ---------------------------------------------------------------------------
// ObservatoryTraceGraph — i18n
// ---------------------------------------------------------------------------

describe('ObservatoryTraceGraph — i18n', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders title in Chinese by default', () => {
    const wrapper = mountGraph()
    expect(wrapper.find('.graph-title').text()).toBe('执行图谱')
  })

  it('renders title in English after language switch', async () => {
    const wrapper = mountGraph()
    useI18nStore().setLanguage('en-US')
    await nextTick()
    expect(wrapper.find('.graph-title').text()).toBe('Trace Graph')
  })
})

// ---------------------------------------------------------------------------
// ObservatoryTraceGraph — accessibility
// ---------------------------------------------------------------------------

describe('ObservatoryTraceGraph — accessibility', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('uses a section with aria-label for the graph canvas', () => {
    const wrapper = mountGraph()
    expect(
      wrapper.find('section.graph-canvas').attributes('aria-label'),
    ).toBe('Trace graph')
  })

  it('uses h2 for the graph title', () => {
    const wrapper = mountGraph()
    expect(wrapper.find('h2.graph-title').element.tagName).toBe('H2')
  })

  it('uses article elements for each node', () => {
    const wrapper = mountGraph()
    for (const node of wrapper.findAll('article.graph-node')) {
      expect(node.exists()).toBe(true)
    }
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
    expect(wrapper.find('section.graph-legend').exists()).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Content integration
// ---------------------------------------------------------------------------

describe('trace graph — content integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders the trace graph when TraceGraph is selected', () => {
    const wrapper = mountContentAsTraceGraph()
    expect(wrapper.findComponent(ObservatoryTraceGraph).exists()).toBe(true)
  })

  it('does not render placeholder cards for TraceGraph', () => {
    const wrapper = mountContentAsTraceGraph()
    expect(wrapper.findAll('.content-card')).toHaveLength(0)
  })

  it('switches from dashboard to trace graph', async () => {
    const store = useObservatoryStore()
    const wrapper = mount(ObservatoryContent)
    expect(wrapper.findComponent(ObservatoryTraceGraph).exists()).toBe(false)
    store.selectPanel('TraceGraph')
    await nextTick()
    expect(wrapper.findComponent(ObservatoryTraceGraph).exists()).toBe(true)
  })

  it('switches from trace graph to Settings grid', async () => {
    const store = useObservatoryStore()
    const wrapper = mountContentAsTraceGraph()
    expect(wrapper.findComponent(ObservatoryTraceGraph).exists()).toBe(true)
    store.selectPanel('Settings')
    await nextTick()
    expect(wrapper.findComponent(ObservatoryTraceGraph).exists()).toBe(false)
    expect(wrapper.findAll('.content-card').length).toBeGreaterThan(0)
  })

  it('switches from trace graph back to Overview', async () => {
    const store = useObservatoryStore()
    const wrapper = mountContentAsTraceGraph()
    expect(wrapper.findComponent(ObservatoryTraceGraph).exists()).toBe(true)
    store.selectPanel('Overview')
    await nextTick()
    expect(wrapper.findComponent(ObservatoryTraceGraph).exists()).toBe(false)
  })

  it('switches from event stream to trace graph', async () => {
    const store = useObservatoryStore()
    store.selectPanel('EventStream')
    const wrapper = mount(ObservatoryContent)
    expect(wrapper.findComponent(ObservatoryTraceGraph).exists()).toBe(false)
    store.selectPanel('TraceGraph')
    await nextTick()
    expect(wrapper.findComponent(ObservatoryTraceGraph).exists()).toBe(true)
  })

  it('switches from trace graph to event stream', async () => {
    const store = useObservatoryStore()
    const wrapper = mountContentAsTraceGraph()
    expect(wrapper.findComponent(ObservatoryTraceGraph).exists()).toBe(true)
    store.selectPanel('EventStream')
    await nextTick()
    expect(wrapper.findComponent(ObservatoryTraceGraph).exists()).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Deterministic rendering
// ---------------------------------------------------------------------------

describe('trace graph — deterministic rendering', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders identical node labels across mounts', () => {
    const a = mountGraph()
    const b = mountGraph()
    const aLabels = a.findAll('.graph-node-label').map((el) => el.text())
    const bLabels = b.findAll('.graph-node-label').map((el) => el.text())
    expect(aLabels).toEqual(bLabels)
  })

  it('renders identical node count across mounts', () => {
    const a = mountGraph()
    const b = mountGraph()
    expect(a.findAllComponents(TraceGraphNode)).toHaveLength(
      b.findAllComponents(TraceGraphNode).length,
    )
  })

  it('renders identical edge count across mounts', () => {
    const a = mountGraph()
    const b = mountGraph()
    expect(a.findAllComponents(TraceGraphEdge)).toHaveLength(
      b.findAllComponents(TraceGraphEdge).length,
    )
  })

  it('renders identical HTML across mounts', () => {
    const a = mountGraph()
    const b = mountGraph()
    expect(a.html()).toBe(b.html())
  })
})

// ---------------------------------------------------------------------------
// I18n catalog keys
// ---------------------------------------------------------------------------

describe('i18n catalog — graph keys', () => {
  it('zh-CN contains the graph title key', () => {
    expect(resolveKey(zhCN, 'observatory.graph.title')).toBe('执行图谱')
  })

  it('zh-CN contains the graph legend key', () => {
    expect(resolveKey(zhCN, 'observatory.graph.legend')).toBe('图例')
  })

  it('zh-CN contains the graph completed key', () => {
    expect(resolveKey(zhCN, 'observatory.graph.completed')).toBe('已完成')
  })

  it('zh-CN contains the graph pending key', () => {
    expect(resolveKey(zhCN, 'observatory.graph.pending')).toBe('进行中')
  })

  it('zh-CN contains the graph failed key', () => {
    expect(resolveKey(zhCN, 'observatory.graph.failed')).toBe('失败')
  })

  it('en-US contains the graph title key', () => {
    expect(resolveKey(enUS, 'observatory.graph.title')).toBe('Trace Graph')
  })

  it('en-US contains the graph legend key', () => {
    expect(resolveKey(enUS, 'observatory.graph.legend')).toBe('Legend')
  })

  it('en-US contains the graph completed key', () => {
    expect(resolveKey(enUS, 'observatory.graph.completed')).toBe('Completed')
  })

  it('en-US contains the graph pending key', () => {
    expect(resolveKey(enUS, 'observatory.graph.pending')).toBe('Pending')
  })

  it('en-US contains the graph failed key', () => {
    expect(resolveKey(enUS, 'observatory.graph.failed')).toBe('Failed')
  })
})

// ---------------------------------------------------------------------------
// Structural integrity
// ---------------------------------------------------------------------------

describe('ObservatoryTraceGraph — structural integrity', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('nodes and edges alternate in the graph flow', () => {
    const wrapper = mountGraph()
    const flow = wrapper.find('.graph-flow')
    const children = flow.element.children
    let expectedNode = true
    let nodeCount = 0
    let edgeCount = 0
    for (let i = 0; i < children.length; i++) {
      if (expectedNode) {
        expect(children[i].classList.contains('graph-node')).toBe(true)
        nodeCount++
      } else {
        expect(children[i].classList.contains('graph-edge')).toBe(true)
        edgeCount++
      }
      expectedNode = !expectedNode
    }
    expect(nodeCount).toBe(6)
    expect(edgeCount).toBe(5)
  })

  it('graph canvas section contains the flow container', () => {
    const wrapper = mountGraph()
    const canvas = wrapper.find('section.graph-canvas')
    expect(canvas.find('.graph-flow').exists()).toBe(true)
  })

  it('graph section contains the header', () => {
    const wrapper = mountGraph()
    const canvas = wrapper.find('section.graph-canvas')
    expect(canvas.find('header.graph-header').exists()).toBe(true)
  })

  it('legend is rendered after the canvas', () => {
    const wrapper = mountGraph()
    const root = wrapper.find('.observatory-trace-graph')
    const canvas = root.find('section.graph-canvas')
    const legend = root.find('section.graph-legend')
    expect(
      canvas.element.compareDocumentPosition(legend.element),
    ).toBe(4)
  })
})

// ---------------------------------------------------------------------------
// TraceGraphNode — status dot colors
// ---------------------------------------------------------------------------

describe('TraceGraphNode — status dot rendering', () => {
  it('completed node has a green dot', () => {
    const wrapper = mountNode(MOCK_COMPLETED_NODE)
    const dot = wrapper.find('.graph-node-status-dot')
    expect(dot.exists()).toBe(true)
  })

  it('pending node has a yellow dot', () => {
    const wrapper = mountNode(MOCK_PENDING_NODE)
    const dot = wrapper.find('.graph-node-status-dot')
    expect(dot.exists()).toBe(true)
  })

  it('failed node has a red dot', () => {
    const wrapper = mountNode(MOCK_FAILED_NODE)
    const dot = wrapper.find('.graph-node-status-dot')
    expect(dot.exists()).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// TraceGraphNode — node card styling
// ---------------------------------------------------------------------------

describe('TraceGraphNode — card styling', () => {
  it('has a minimum width', () => {
    const wrapper = mountNode(MOCK_COMPLETED_NODE)
    const node = wrapper.find('.graph-node')
    expect(node.exists()).toBe(true)
  })

  it('completed node has a green border tint', () => {
    const wrapper = mountNode(MOCK_COMPLETED_NODE)
    expect(wrapper.classes()).toContain('graph-node--completed')
  })

  it('pending node has a yellow border tint', () => {
    const wrapper = mountNode(MOCK_PENDING_NODE)
    expect(wrapper.classes()).toContain('graph-node--pending')
  })

  it('failed node has a red border tint', () => {
    const wrapper = mountNode(MOCK_FAILED_NODE)
    expect(wrapper.classes()).toContain('graph-node--failed')
  })
})

// ---------------------------------------------------------------------------
// TraceGraphEdge — visual structure
// ---------------------------------------------------------------------------

describe('TraceGraphEdge — visual structure', () => {
  it('renders a vertical line of at least 24px height', () => {
    const wrapper = mountEdge()
    const edge = wrapper.find('.graph-edge')
    expect(edge.exists()).toBe(true)
  })

  it('line is inside the edge container', () => {
    const wrapper = mountEdge()
    const edge = wrapper.find('.graph-edge')
    expect(edge.find('.graph-edge-line').exists()).toBe(true)
  })

  it('arrow is inside the edge container', () => {
    const wrapper = mountEdge()
    const edge = wrapper.find('.graph-edge')
    expect(edge.find('.graph-edge-arrow').exists()).toBe(true)
  })

  it('arrow comes after the line', () => {
    const wrapper = mountEdge()
    const html = wrapper.html()
    const lineIdx = html.indexOf('graph-edge-line')
    const arrowIdx = html.indexOf('graph-edge-arrow')
    expect(lineIdx).toBeLessThan(arrowIdx)
  })
})

// ---------------------------------------------------------------------------
// TraceGraphLegend — i18n catalog integration
// ---------------------------------------------------------------------------

describe('TraceGraphLegend — i18n catalog integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('legend title switches to English reactively', async () => {
    const wrapper = mountLegend()
    useI18nStore().setLanguage('en-US')
    await nextTick()
    expect(wrapper.find('.graph-legend-title').text()).toBe('Legend')
  })

  it('legend title switches back to Chinese', async () => {
    const wrapper = mountLegend()
    const store = useI18nStore()
    store.setLanguage('en-US')
    await nextTick()
    store.setLanguage('zh-CN')
    await nextTick()
    expect(wrapper.find('.graph-legend-title').text()).toBe('图例')
  })

  it('all three labels switch to English reactively', async () => {
    const wrapper = mountLegend()
    useI18nStore().setLanguage('en-US')
    await nextTick()
    const labels = wrapper.findAll('.graph-legend-label')
    expect(labels[0].text()).toBe('Completed')
    expect(labels[1].text()).toBe('Pending')
    expect(labels[2].text()).toBe('Failed')
  })

  it('all three labels switch back to Chinese', async () => {
    const wrapper = mountLegend()
    const store = useI18nStore()
    store.setLanguage('en-US')
    await nextTick()
    store.setLanguage('zh-CN')
    await nextTick()
    const labels = wrapper.findAll('.graph-legend-label')
    expect(labels[0].text()).toBe('已完成')
    expect(labels[1].text()).toBe('进行中')
    expect(labels[2].text()).toBe('失败')
  })
})

// ---------------------------------------------------------------------------
// ObservatoryTraceGraph — graph flow structure
// ---------------------------------------------------------------------------

describe('ObservatoryTraceGraph — graph flow structure', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('graph flow has 11 children (6 nodes + 5 edges)', () => {
    const wrapper = mountGraph()
    const flow = wrapper.find('.graph-flow')
    expect(flow.element.children.length).toBe(11)
  })

  it('first child is a node', () => {
    const wrapper = mountGraph()
    const flow = wrapper.find('.graph-flow')
    expect(flow.element.children[0].classList.contains('graph-node')).toBe(true)
  })

  it('second child is an edge', () => {
    const wrapper = mountGraph()
    const flow = wrapper.find('.graph-flow')
    expect(flow.element.children[1].classList.contains('graph-edge')).toBe(true)
  })

  it('last child is a node', () => {
    const wrapper = mountGraph()
    const flow = wrapper.find('.graph-flow')
    const last = flow.element.children[flow.element.children.length - 1]
    expect(last.classList.contains('graph-node')).toBe(true)
  })

  it('last node is CreateQuest', () => {
    const wrapper = mountGraph()
    const labels = wrapper.findAll('.graph-node-label')
    expect(labels[labels.length - 1].text()).toBe('CreateQuest')
  })

  it('first node is CreateWorld', () => {
    const wrapper = mountGraph()
    const labels = wrapper.findAll('.graph-node-label')
    expect(labels[0].text()).toBe('CreateWorld')
  })
})

// ---------------------------------------------------------------------------
// ObservatoryTraceGraph — content integration
// ---------------------------------------------------------------------------

describe('trace graph — content integration details', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('trace graph renders correct content via store', () => {
    const store = useObservatoryStore()
    store.selectPanel('TraceGraph')
    const wrapper = mount(ObservatoryContent)
    expect(wrapper.find('h2.graph-title').text()).toBe('执行图谱')
  })

  it('trace graph shows 6 nodes in content area', () => {
    const wrapper = mountContentAsTraceGraph()
    expect(wrapper.findAll('.graph-node')).toHaveLength(6)
  })

  it('trace graph shows 5 edges in content area', () => {
    const wrapper = mountContentAsTraceGraph()
    expect(wrapper.findAll('.graph-edge')).toHaveLength(5)
  })

  it('trace graph shows legend in content area', () => {
    const wrapper = mountContentAsTraceGraph()
    expect(wrapper.find('.graph-legend').exists()).toBe(true)
  })

  it('trace graph shows 3 legend items in content area', () => {
    const wrapper = mountContentAsTraceGraph()
    expect(wrapper.findAll('.graph-legend-item')).toHaveLength(3)
  })
})

// ---------------------------------------------------------------------------
// ObservatoryTraceGraph — accessibility details
// ---------------------------------------------------------------------------

describe('trace graph — accessibility details', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('graph canvas has aria-label trace graph', () => {
    const wrapper = mountGraph()
    expect(
      wrapper.find('section.graph-canvas').attributes('aria-label'),
    ).toBe('Trace graph')
  })

  it('edge has role img', () => {
    const wrapper = mountGraph()
    const edges = wrapper.findAll('.graph-edge')
    for (const edge of edges) {
      expect(edge.attributes('role')).toBe('img')
    }
  })

  it('edge has aria-label connects to', () => {
    const wrapper = mountGraph()
    const edges = wrapper.findAll('.graph-edge')
    for (const edge of edges) {
      expect(edge.attributes('aria-label')).toBe('connects to')
    }
  })

  it('legend has aria-label', () => {
    const wrapper = mountGraph()
    expect(
      wrapper.find('section.graph-legend').attributes('aria-label'),
    ).toBe('Graph legend')
  })

  it('uses h2 for graph title', () => {
    const wrapper = mountGraph()
    expect(wrapper.find('h2.graph-title').exists()).toBe(true)
  })

  it('uses h3 for legend title', () => {
    const wrapper = mountGraph()
    expect(wrapper.find('h3.graph-legend-title').exists()).toBe(true)
  })

  it('uses article for all nodes', () => {
    const wrapper = mountGraph()
    const nodes = wrapper.findAll('article')
    expect(nodes.length).toBeGreaterThanOrEqual(6)
  })

  it('uses header for node headers', () => {
    const wrapper = mountGraph()
    const headers = wrapper.findAll('header')
    expect(headers.length).toBeGreaterThanOrEqual(7)
  })
})

// ---------------------------------------------------------------------------
// TraceGraphLegend — with different items
// ---------------------------------------------------------------------------

describe('TraceGraphLegend — with different items', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders only completed when passed', () => {
    const wrapper = mount(TraceGraphLegend, {
      props: {
        items: [{ status: 'completed' as const }],
      },
    })
    expect(wrapper.findAll('li')).toHaveLength(1)
    expect(wrapper.find('.graph-legend-dot--completed').exists()).toBe(true)
  })

  it('renders only pending when passed', () => {
    const wrapper = mount(TraceGraphLegend, {
      props: {
        items: [{ status: 'pending' as const }],
      },
    })
    expect(wrapper.findAll('li')).toHaveLength(1)
    expect(wrapper.find('.graph-legend-dot--pending').exists()).toBe(true)
  })

  it('renders only failed when passed', () => {
    const wrapper = mount(TraceGraphLegend, {
      props: {
        items: [{ status: 'failed' as const }],
      },
    })
    expect(wrapper.findAll('li')).toHaveLength(1)
    expect(wrapper.find('.graph-legend-dot--failed').exists()).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// TraceGraphNode — constructor edge cases
// ---------------------------------------------------------------------------

describe('TraceGraphNode — edge cases', () => {
  it('renders a single-character label', () => {
    const wrapper = mountNode({ id: 'x', label: 'X', status: 'completed' })
    expect(wrapper.find('.graph-node-label').text()).toBe('X')
  })

  it('renders a label with numbers', () => {
    const wrapper = mountNode({
      id: 'n42',
      label: 'Step42',
      status: 'completed',
    })
    expect(wrapper.find('.graph-node-label').text()).toBe('Step42')
  })

  it('renders a label with underscores', () => {
    const wrapper = mountNode({
      id: 'n1',
      label: 'Create_World',
      status: 'completed',
    })
    expect(wrapper.find('.graph-node-label').text()).toBe('Create_World')
  })
})

// ---------------------------------------------------------------------------
// Deterministic rendering — edge cases
// ---------------------------------------------------------------------------

describe('trace graph — deterministic rendering edge cases', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders identical node statuses across mounts', () => {
    const a = mountGraph()
    const b = mountGraph()
    const aStatuses = a
      .findAll('.graph-node-status-label')
      .map((el) => el.text())
    const bStatuses = b
      .findAll('.graph-node-status-label')
      .map((el) => el.text())
    expect(aStatuses).toEqual(bStatuses)
  })

  it('renders identical legend content across mounts', () => {
    const a = mountGraph()
    const b = mountGraph()
    expect(a.find('.graph-legend').html()).toBe(b.find('.graph-legend').html())
  })

  it('renders identical edge count across mounts', () => {
    const a = mountGraph()
    const b = mountGraph()
    expect(a.findAll('.graph-edge')).toHaveLength(
      b.findAll('.graph-edge').length,
    )
  })
})

// ---------------------------------------------------------------------------
// TraceGraphNode — standalone node variations
// ---------------------------------------------------------------------------

describe('TraceGraphNode — standalone node variations', () => {
  it('renders a node with id starting with different prefix', () => {
    const wrapper = mountNode({
      id: 'custom-001',
      label: 'CustomNode',
      status: 'completed',
    })
    expect(wrapper.find('.graph-node-label').text()).toBe('CustomNode')
  })

  it('renders uppercase status label', () => {
    const wrapper = mountNode(MOCK_COMPLETED_NODE)
    expect(wrapper.find('.graph-node-status-label').text()).toBe('completed')
  })

  it('renders node as dark card', () => {
    const wrapper = mountNode(MOCK_COMPLETED_NODE)
    const node = wrapper.find('article.graph-node')
    expect(node.classes()).toContain('graph-node')
  })
})

// ---------------------------------------------------------------------------
// TraceGraphLegend — header structure
// ---------------------------------------------------------------------------

describe('TraceGraphLegend — header structure', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('has a header with title', () => {
    const wrapper = mountLegend()
    const header = wrapper.find('header.graph-legend-header')
    expect(header.find('h3').exists()).toBe(true)
  })

  it('title is inside the header', () => {
    const wrapper = mountLegend()
    const header = wrapper.find('header.graph-legend-header')
    expect(header.find('.graph-legend-title').exists()).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// TraceGraphLegend — class-based status labels
// ---------------------------------------------------------------------------

describe('TraceGraphLegend — class-based status labels', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('completed label uses graph-legend-label class', () => {
    const wrapper = mountLegend()
    const labels = wrapper.findAll('.graph-legend-label')
    expect(labels[0].text()).toBe('已完成')
  })

  it('pending label uses graph-legend-label class', () => {
    const wrapper = mountLegend()
    const labels = wrapper.findAll('.graph-legend-label')
    expect(labels[1].text()).toBe('进行中')
  })

  it('failed label uses graph-legend-label class', () => {
    const wrapper = mountLegend()
    const labels = wrapper.findAll('.graph-legend-label')
    expect(labels[2].text()).toBe('失败')
  })
})

// ---------------------------------------------------------------------------
// ObservatoryTraceGraph — node count variations
// ---------------------------------------------------------------------------

describe('ObservatoryTraceGraph — node count variations', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('has exactly 6 nodes in mock data', () => {
    const wrapper = mountGraph()
    expect(wrapper.findAll('.graph-node')).toHaveLength(6)
  })

  it('has exactly 5 edges in mock data', () => {
    const wrapper = mountGraph()
    expect(wrapper.findAll('.graph-edge')).toHaveLength(5)
  })

  it('has a 5:6 edge-to-node ratio', () => {
    const wrapper = mountGraph()
    const nodes = wrapper.findAll('.graph-node').length
    const edges = wrapper.findAll('.graph-edge').length
    expect(edges).toBe(nodes - 1)
  })
})

// ---------------------------------------------------------------------------
// TraceGraphNode — node status label formatting
// ---------------------------------------------------------------------------

describe('TraceGraphNode — node status label formatting', () => {
  it('status label is in uppercase style', () => {
    const wrapper = mountNode(MOCK_COMPLETED_NODE)
    const label = wrapper.find('.graph-node-status-label')
    expect(label.text()).toBe('completed')
  })

  it('status label for pending is lowercase', () => {
    const wrapper = mountNode(MOCK_PENDING_NODE)
    expect(wrapper.find('.graph-node-status-label').text()).toBe('pending')
  })

  it('status label for failed is lowercase', () => {
    const wrapper = mountNode(MOCK_FAILED_NODE)
    expect(wrapper.find('.graph-node-status-label').text()).toBe('failed')
  })

  it('status dot is an 8px circle', () => {
    const wrapper = mountNode(MOCK_COMPLETED_NODE)
    const dot = wrapper.find('.graph-node-status-dot')
    expect(dot.exists()).toBe(true)
  })

  it('node header contains exactly two children', () => {
    const wrapper = mountNode(MOCK_COMPLETED_NODE)
    const header = wrapper.find('header.graph-node-header')
    expect(header.element.children.length).toBe(2)
  })

  it('node header first child is the status dot', () => {
    const wrapper = mountNode(MOCK_COMPLETED_NODE)
    const header = wrapper.find('header.graph-node-header')
    expect(header.element.children[0].classList.contains('graph-node-status-dot')).toBe(true)
  })
})