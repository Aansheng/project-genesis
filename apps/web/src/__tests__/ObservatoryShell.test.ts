import { describe, it, expect, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { mount, type VueWrapper, type DOMWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

import {
  useObservatoryStore,
  OBSERVATORY_PANELS,
  type ObservatoryPanel,
} from '../stores/observatory'
import ObservatoryShell from '../components/observatory/ObservatoryShell.vue'
import ObservatorySidebar from '../components/observatory/ObservatorySidebar.vue'
import ObservatoryHeader from '../components/observatory/ObservatoryHeader.vue'
import ObservatoryContent from '../components/observatory/ObservatoryContent.vue'
import ObservatoryOverview from '../components/observatory/ObservatoryOverview.vue'
import ObservatoryTraceViewer from '../components/observatory/trace/ObservatoryTraceViewer.vue'
import ObservatoryTimelineViewer from '../components/observatory/timeline/ObservatoryTimelineViewer.vue'
import ObservatoryHistoryViewer from '../components/observatory/history/ObservatoryHistoryViewer.vue'
import ObservatoryDiffViewer from '../components/observatory/diff/ObservatoryDiffViewer.vue'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mountShell(): VueWrapper {
  return mount(ObservatoryShell)
}

function mountSidebar(attachTo?: HTMLElement): VueWrapper {
  return mount(ObservatorySidebar, attachTo ? { attachTo } : undefined)
}

function mountContent(): VueWrapper {
  return mount(ObservatoryContent)
}

function sidebarButtons(wrapper: VueWrapper): DOMWrapper<Element>[] {
  return wrapper.findAll('button.sidebar-button')
}

// ---------------------------------------------------------------------------
// Observatory Store
// ---------------------------------------------------------------------------

describe('observatory store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('exposes default state: selectedPanel=Overview, status=Ready, version=v1.29', () => {
    const store = useObservatoryStore()
    expect(store.selectedPanel).toBe('Overview')
    expect(store.status).toBe('Ready')
    expect(store.version).toBe('v1.29')
  })

  it('defaults selectedPanel to Overview', () => {
    const store = useObservatoryStore()
    expect(store.selectedPanel).toBe('Overview')
  })

  it('defaults status to Ready', () => {
    const store = useObservatoryStore()
    expect(store.status).toBe('Ready')
  })

  it('defaults version to v1.29', () => {
    const store = useObservatoryStore()
    expect(store.version).toBe('v1.29')
  })

  it('selectPanel updates selectedPanel', () => {
    const store = useObservatoryStore()
    store.selectPanel('Trace')
    expect(store.selectedPanel).toBe('Trace')
  })

  it('selectPanel is reactive across all panels', () => {
    const store = useObservatoryStore()
    for (const panel of OBSERVATORY_PANELS) {
      store.selectPanel(panel)
      expect(store.selectedPanel).toBe(panel)
    }
  })

  it('setStatus updates status', () => {
    const store = useObservatoryStore()
    store.setStatus('Busy')
    expect(store.status).toBe('Busy')
  })

  it('setVersion updates version', () => {
    const store = useObservatoryStore()
    store.setVersion('v1.30')
    expect(store.version).toBe('v1.30')
  })

  it('exports OBSERVATORY_PANELS with exactly 7 items', () => {
    expect(OBSERVATORY_PANELS).toHaveLength(7)
  })

  it('exports OBSERVATORY_PANELS in spec order', () => {
    expect(OBSERVATORY_PANELS).toEqual([
      'Overview',
      'Trace',
      'Timeline',
      'History',
      'Diff',
      'Runtime',
      'Settings',
    ])
  })
})

// ---------------------------------------------------------------------------
// Observatory Header
// ---------------------------------------------------------------------------

describe('observatory header', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders the Genesis Observatory title', () => {
    const wrapper = mount(ObservatoryHeader)
    expect(wrapper.find('.header-title').text()).toBe('Genesis Observatory')
  })

  it('renders the status badge with Ready', () => {
    const wrapper = mount(ObservatoryHeader)
    expect(wrapper.find('.header-badge').text()).toContain('Ready')
  })

  it('renders the version v1.29', () => {
    const wrapper = mount(ObservatoryHeader)
    expect(wrapper.find('.header-version').text()).toBe('v1.29')
  })

  it('renders the Sprint 6 label on the right side', () => {
    const wrapper = mount(ObservatoryHeader)
    expect(wrapper.find('.header-sprint').text()).toBe('Sprint 6')
  })

  it('updates the status badge when the store status changes', async () => {
    const store = useObservatoryStore()
    const wrapper = mount(ObservatoryHeader)
    store.setStatus('Building')
    await nextTick()
    expect(wrapper.find('.header-badge').text()).toContain('Building')
  })

  it('updates the version when the store version changes', async () => {
    const store = useObservatoryStore()
    const wrapper = mount(ObservatoryHeader)
    store.setVersion('v1.30')
    await nextTick()
    expect(wrapper.find('.header-version').text()).toBe('v1.30')
  })

  it('exposes an accessible status role', () => {
    const wrapper = mount(ObservatoryHeader)
    expect(wrapper.find('.header-badge').attributes('role')).toBe('status')
  })

  it('exposes an accessible banner landmark', () => {
    const wrapper = mount(ObservatoryHeader)
    expect(wrapper.find('header').attributes('role')).toBe('banner')
  })

  it('exposes an accessible label on the version element', () => {
    const wrapper = mount(ObservatoryHeader)
    expect(wrapper.find('.header-version').attributes('aria-label')).toBe(
      'Observatory version',
    )
  })
})

// ---------------------------------------------------------------------------
// Observatory Sidebar
// ---------------------------------------------------------------------------

describe('observatory sidebar', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders all 7 menu items', () => {
    const wrapper = mountSidebar()
    expect(sidebarButtons(wrapper)).toHaveLength(7)
  })

  it('renders menu items in spec order', () => {
    const wrapper = mountSidebar()
    const labels = sidebarButtons(wrapper).map((b) => b.text())
    expect(labels).toEqual([
      'Overview',
      'Trace',
      'Timeline',
      'History',
      'Diff',
      'Runtime',
      'Settings',
    ])
  })

  it('renders menu items as buttons (keyboard accessible)', () => {
    const wrapper = mountSidebar()
    for (const button of sidebarButtons(wrapper)) {
      expect(button.attributes('type')).toBe('button')
    }
  })

  it('marks Overview as active by default', () => {
    const wrapper = mountSidebar()
    const overview = sidebarButtons(wrapper)[0]
    expect(overview.classes()).toContain('sidebar-button--active')
  })

  it('marks only Overview active by default', () => {
    const wrapper = mountSidebar()
    const active = sidebarButtons(wrapper).filter((b) =>
      b.classes().includes('sidebar-button--active'),
    )
    expect(active).toHaveLength(1)
    expect(active[0].text()).toBe('Overview')
  })

  it('selects Trace in the store when clicked', async () => {
    const store = useObservatoryStore()
    const wrapper = mountSidebar()
    await sidebarButtons(wrapper)[1].trigger('click')
    expect(store.selectedPanel).toBe('Trace')
  })

  it('moves the active class to the clicked item', async () => {
    const wrapper = mountSidebar()
    await sidebarButtons(wrapper)[3].trigger('click')
    await nextTick()
    const active = sidebarButtons(wrapper).filter((b) =>
      b.classes().includes('sidebar-button--active'),
    )
    expect(active).toHaveLength(1)
    expect(active[0].text()).toBe('History')
  })

  it('sets aria-current=page on the active item', async () => {
    const wrapper = mountSidebar()
    await sidebarButtons(wrapper)[2].trigger('click')
    await nextTick()
    const timeline = sidebarButtons(wrapper)[2]
    expect(timeline.attributes('aria-current')).toBe('page')
  })

  it('leaves aria-current unset on inactive items', () => {
    const wrapper = mountSidebar()
    expect(sidebarButtons(wrapper)[1].attributes('aria-current')).toBeUndefined()
  })

  it('exposes an accessible nav label', () => {
    const wrapper = mountSidebar()
    expect(wrapper.find('nav').attributes('aria-label')).toBe('Observatory panels')
  })

  it('selects Settings when clicked (last item)', async () => {
    const store = useObservatoryStore()
    const wrapper = mountSidebar()
    await sidebarButtons(wrapper)[6].trigger('click')
    expect(store.selectedPanel).toBe('Settings')
  })

  it('moves selection to the next panel with ArrowDown', async () => {
    const store = useObservatoryStore()
    const el = document.createElement('div')
    document.body.appendChild(el)
    const wrapper = mountSidebar(el)
    await nextTick()
    await wrapper.find('nav').trigger('keydown', { key: 'ArrowDown' })
    expect(store.selectedPanel).toBe('Trace')
    wrapper.unmount()
    el.remove()
  })

  it('moves selection to the previous panel with ArrowUp', async () => {
    const store = useObservatoryStore()
    store.selectPanel('History')
    const el = document.createElement('div')
    document.body.appendChild(el)
    const wrapper = mountSidebar(el)
    await nextTick()
    await wrapper.find('nav').trigger('keydown', { key: 'ArrowUp' })
    expect(store.selectedPanel).toBe('Timeline')
    wrapper.unmount()
    el.remove()
  })

  it('jumps to the first panel with Home', async () => {
    const store = useObservatoryStore()
    store.selectPanel('Runtime')
    const wrapper = mountSidebar()
    await nextTick()
    await wrapper.find('nav').trigger('keydown', { key: 'Home' })
    expect(store.selectedPanel).toBe('Overview')
  })

  it('jumps to the last panel with End', async () => {
    const store = useObservatoryStore()
    const wrapper = mountSidebar()
    await nextTick()
    await wrapper.find('nav').trigger('keydown', { key: 'End' })
    expect(store.selectedPanel).toBe('Settings')
  })

  it('clamps ArrowDown at the last panel', async () => {
    const store = useObservatoryStore()
    store.selectPanel('Settings')
    const wrapper = mountSidebar()
    await nextTick()
    await wrapper.find('nav').trigger('keydown', { key: 'ArrowDown' })
    expect(store.selectedPanel).toBe('Settings')
  })

  it('clamps ArrowUp at the first panel', async () => {
    const store = useObservatoryStore()
    const wrapper = mountSidebar()
    await nextTick()
    await wrapper.find('nav').trigger('keydown', { key: 'ArrowUp' })
    expect(store.selectedPanel).toBe('Overview')
  })

  it('ignores unrelated keys', async () => {
    const store = useObservatoryStore()
    const wrapper = mountSidebar()
    await nextTick()
    await wrapper.find('nav').trigger('keydown', { key: 'Tab' })
    await wrapper.find('nav').trigger('keydown', { key: 'Enter' })
    expect(store.selectedPanel).toBe('Overview')
  })
})

// ---------------------------------------------------------------------------
// Observatory Content
// ---------------------------------------------------------------------------

describe('observatory content', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  function mountContentAs(panel: ObservatoryPanel): VueWrapper {
    const store = useObservatoryStore()
    store.selectPanel(panel)
    return mount(ObservatoryContent)
  }

  it('renders the overview dashboard when Overview is selected', () => {
    const wrapper = mountContent()
    expect(wrapper.findComponent(ObservatoryOverview).exists()).toBe(true)
  })

  it('does not render placeholder cards when Overview is selected', () => {
    const wrapper = mountContent()
    expect(wrapper.findAll('.content-card')).toHaveLength(0)
  })

  it('renders 6 placeholder cards for non-Overview, non-Trace, non-Timeline, non-History, non-Diff panels', () => {
    const wrapper = mountContentAs('Runtime')
    expect(wrapper.findAll('.content-card')).toHaveLength(6)
  })

  it('switches from dashboard to grid when a panel is selected', async () => {
    const store = useObservatoryStore()
    const wrapper = mountContent()
    expect(wrapper.findComponent(ObservatoryOverview).exists()).toBe(true)
    store.selectPanel('Runtime')
    await nextTick()
    expect(wrapper.findComponent(ObservatoryOverview).exists()).toBe(false)
    expect(wrapper.findAll('.content-card')).toHaveLength(6)
  })

  it('switches from grid back to dashboard when Overview is re-selected', async () => {
    const store = useObservatoryStore()
    const wrapper = mountContentAs('Runtime')
    expect(wrapper.findAll('.content-card')).toHaveLength(6)
    store.selectPanel('Overview')
    await nextTick()
    expect(wrapper.findComponent(ObservatoryOverview).exists()).toBe(true)
    expect(wrapper.findAll('.content-card')).toHaveLength(0)
  })

  it('renders the trace viewer when Trace is selected', () => {
    const wrapper = mountContentAs('Trace')
    expect(wrapper.findComponent(ObservatoryTraceViewer).exists()).toBe(true)
  })

  it('does not render placeholder cards when Trace is selected', () => {
    const wrapper = mountContentAs('Trace')
    expect(wrapper.findAll('.content-card')).toHaveLength(0)
  })

  it('does not render the overview dashboard when Trace is selected', () => {
    const wrapper = mountContentAs('Trace')
    expect(wrapper.findComponent(ObservatoryOverview).exists()).toBe(false)
  })

  it('switches from dashboard to trace viewer when Trace is selected', async () => {
    const store = useObservatoryStore()
    const wrapper = mountContent()
    expect(wrapper.findComponent(ObservatoryOverview).exists()).toBe(true)
    store.selectPanel('Trace')
    await nextTick()
    expect(wrapper.findComponent(ObservatoryOverview).exists()).toBe(false)
    expect(wrapper.findComponent(ObservatoryTraceViewer).exists()).toBe(true)
  })

  it('switches from grid to trace viewer when Trace is selected', async () => {
    const store = useObservatoryStore()
    const wrapper = mountContentAs('Runtime')
    expect(wrapper.findAll('.content-card')).toHaveLength(6)
    store.selectPanel('Trace')
    await nextTick()
    expect(wrapper.findAll('.content-card')).toHaveLength(0)
    expect(wrapper.findComponent(ObservatoryTraceViewer).exists()).toBe(true)
  })

  it('switches from trace viewer to grid when another panel is selected', async () => {
    const store = useObservatoryStore()
    const wrapper = mountContentAs('Trace')
    expect(wrapper.findComponent(ObservatoryTraceViewer).exists()).toBe(true)
    store.selectPanel('Runtime')
    await nextTick()
    expect(wrapper.findComponent(ObservatoryTraceViewer).exists()).toBe(false)
    expect(wrapper.findAll('.content-card')).toHaveLength(6)
  })

  it('switches from trace viewer back to dashboard when Overview is re-selected', async () => {
    const store = useObservatoryStore()
    const wrapper = mountContentAs('Trace')
    expect(wrapper.findComponent(ObservatoryTraceViewer).exists()).toBe(true)
    store.selectPanel('Overview')
    await nextTick()
    expect(wrapper.findComponent(ObservatoryTraceViewer).exists()).toBe(false)
    expect(wrapper.findComponent(ObservatoryOverview).exists()).toBe(true)
  })

  it('renders the timeline viewer when Timeline is selected', () => {
    const wrapper = mountContentAs('Timeline')
    expect(wrapper.findComponent(ObservatoryTimelineViewer).exists()).toBe(true)
  })

  it('does not render placeholder cards when Timeline is selected', () => {
    const wrapper = mountContentAs('Timeline')
    expect(wrapper.findAll('.content-card')).toHaveLength(0)
  })

  it('does not render the overview dashboard when Timeline is selected', () => {
    const wrapper = mountContentAs('Timeline')
    expect(wrapper.findComponent(ObservatoryOverview).exists()).toBe(false)
  })

  it('does not render the trace viewer when Timeline is selected', () => {
    const wrapper = mountContentAs('Timeline')
    expect(wrapper.findComponent(ObservatoryTraceViewer).exists()).toBe(false)
  })

  it('switches from dashboard to timeline viewer when Timeline is selected', async () => {
    const store = useObservatoryStore()
    const wrapper = mountContent()
    expect(wrapper.findComponent(ObservatoryOverview).exists()).toBe(true)
    store.selectPanel('Timeline')
    await nextTick()
    expect(wrapper.findComponent(ObservatoryOverview).exists()).toBe(false)
    expect(wrapper.findComponent(ObservatoryTimelineViewer).exists()).toBe(true)
  })

  it('switches from trace viewer to timeline viewer', async () => {
    const store = useObservatoryStore()
    const wrapper = mountContentAs('Trace')
    expect(wrapper.findComponent(ObservatoryTraceViewer).exists()).toBe(true)
    store.selectPanel('Timeline')
    await nextTick()
    expect(wrapper.findComponent(ObservatoryTraceViewer).exists()).toBe(false)
    expect(wrapper.findComponent(ObservatoryTimelineViewer).exists()).toBe(true)
  })

  it('switches from grid to timeline viewer when Timeline is selected', async () => {
    const store = useObservatoryStore()
    const wrapper = mountContentAs('Runtime')
    expect(wrapper.findAll('.content-card')).toHaveLength(6)
    store.selectPanel('Timeline')
    await nextTick()
    expect(wrapper.findAll('.content-card')).toHaveLength(0)
    expect(wrapper.findComponent(ObservatoryTimelineViewer).exists()).toBe(true)
  })

  it('switches from timeline viewer to grid when another panel is selected', async () => {
    const store = useObservatoryStore()
    const wrapper = mountContentAs('Timeline')
    expect(wrapper.findComponent(ObservatoryTimelineViewer).exists()).toBe(true)
    store.selectPanel('Runtime')
    await nextTick()
    expect(wrapper.findComponent(ObservatoryTimelineViewer).exists()).toBe(false)
    expect(wrapper.findAll('.content-card')).toHaveLength(6)
  })

  it('switches from timeline viewer back to dashboard when Overview is re-selected', async () => {
    const store = useObservatoryStore()
    const wrapper = mountContentAs('Timeline')
    expect(wrapper.findComponent(ObservatoryTimelineViewer).exists()).toBe(true)
    store.selectPanel('Overview')
    await nextTick()
    expect(wrapper.findComponent(ObservatoryTimelineViewer).exists()).toBe(false)
    expect(wrapper.findComponent(ObservatoryOverview).exists()).toBe(true)
  })

  it('renders the history viewer when History is selected', () => {
    const wrapper = mountContentAs('History')
    expect(wrapper.findComponent(ObservatoryHistoryViewer).exists()).toBe(true)
  })

  it('does not render placeholder cards when History is selected', () => {
    const wrapper = mountContentAs('History')
    expect(wrapper.findAll('.content-card')).toHaveLength(0)
  })

  it('does not render the overview dashboard when History is selected', () => {
    const wrapper = mountContentAs('History')
    expect(wrapper.findComponent(ObservatoryOverview).exists()).toBe(false)
  })

  it('does not render the trace viewer when History is selected', () => {
    const wrapper = mountContentAs('History')
    expect(wrapper.findComponent(ObservatoryTraceViewer).exists()).toBe(false)
  })

  it('does not render the timeline viewer when History is selected', () => {
    const wrapper = mountContentAs('History')
    expect(wrapper.findComponent(ObservatoryTimelineViewer).exists()).toBe(false)
  })

  it('switches from dashboard to history viewer when History is selected', async () => {
    const store = useObservatoryStore()
    const wrapper = mountContent()
    expect(wrapper.findComponent(ObservatoryOverview).exists()).toBe(true)
    store.selectPanel('History')
    await nextTick()
    expect(wrapper.findComponent(ObservatoryOverview).exists()).toBe(false)
    expect(wrapper.findComponent(ObservatoryHistoryViewer).exists()).toBe(true)
  })

  it('switches from trace viewer to history viewer', async () => {
    const store = useObservatoryStore()
    const wrapper = mountContentAs('Trace')
    expect(wrapper.findComponent(ObservatoryTraceViewer).exists()).toBe(true)
    store.selectPanel('History')
    await nextTick()
    expect(wrapper.findComponent(ObservatoryTraceViewer).exists()).toBe(false)
    expect(wrapper.findComponent(ObservatoryHistoryViewer).exists()).toBe(true)
  })

  it('switches from timeline viewer to history viewer', async () => {
    const store = useObservatoryStore()
    const wrapper = mountContentAs('Timeline')
    expect(wrapper.findComponent(ObservatoryTimelineViewer).exists()).toBe(true)
    store.selectPanel('History')
    await nextTick()
    expect(wrapper.findComponent(ObservatoryTimelineViewer).exists()).toBe(false)
    expect(wrapper.findComponent(ObservatoryHistoryViewer).exists()).toBe(true)
  })

  it('switches from history viewer to grid when another panel is selected', async () => {
    const store = useObservatoryStore()
    const wrapper = mountContentAs('History')
    expect(wrapper.findComponent(ObservatoryHistoryViewer).exists()).toBe(true)
    store.selectPanel('Runtime')
    await nextTick()
    expect(wrapper.findComponent(ObservatoryHistoryViewer).exists()).toBe(false)
    expect(wrapper.findAll('.content-card')).toHaveLength(6)
  })

  it('switches from history viewer back to dashboard when Overview is re-selected', async () => {
    const store = useObservatoryStore()
    const wrapper = mountContentAs('History')
    expect(wrapper.findComponent(ObservatoryHistoryViewer).exists()).toBe(true)
    store.selectPanel('Overview')
    await nextTick()
    expect(wrapper.findComponent(ObservatoryHistoryViewer).exists()).toBe(false)
    expect(wrapper.findComponent(ObservatoryOverview).exists()).toBe(true)
  })

  it('renders the diff viewer when Diff is selected', () => {
    const wrapper = mountContentAs('Diff')
    expect(wrapper.findComponent(ObservatoryDiffViewer).exists()).toBe(true)
  })

  it('does not render placeholder cards when Diff is selected', () => {
    const wrapper = mountContentAs('Diff')
    expect(wrapper.findAll('.content-card')).toHaveLength(0)
  })

  it('does not render the overview dashboard when Diff is selected', () => {
    const wrapper = mountContentAs('Diff')
    expect(wrapper.findComponent(ObservatoryOverview).exists()).toBe(false)
  })

  it('does not render the trace viewer when Diff is selected', () => {
    const wrapper = mountContentAs('Diff')
    expect(wrapper.findComponent(ObservatoryTraceViewer).exists()).toBe(false)
  })

  it('does not render the timeline viewer when Diff is selected', () => {
    const wrapper = mountContentAs('Diff')
    expect(wrapper.findComponent(ObservatoryTimelineViewer).exists()).toBe(false)
  })

  it('does not render the history viewer when Diff is selected', () => {
    const wrapper = mountContentAs('Diff')
    expect(wrapper.findComponent(ObservatoryHistoryViewer).exists()).toBe(false)
  })

  it('switches from dashboard to diff viewer when Diff is selected', async () => {
    const store = useObservatoryStore()
    const wrapper = mountContent()
    expect(wrapper.findComponent(ObservatoryOverview).exists()).toBe(true)
    store.selectPanel('Diff')
    await nextTick()
    expect(wrapper.findComponent(ObservatoryOverview).exists()).toBe(false)
    expect(wrapper.findComponent(ObservatoryDiffViewer).exists()).toBe(true)
  })

  it('switches from history viewer to diff viewer', async () => {
    const store = useObservatoryStore()
    const wrapper = mountContentAs('History')
    expect(wrapper.findComponent(ObservatoryHistoryViewer).exists()).toBe(true)
    store.selectPanel('Diff')
    await nextTick()
    expect(wrapper.findComponent(ObservatoryHistoryViewer).exists()).toBe(false)
    expect(wrapper.findComponent(ObservatoryDiffViewer).exists()).toBe(true)
  })

  it('switches from diff viewer to grid when another panel is selected', async () => {
    const store = useObservatoryStore()
    const wrapper = mountContentAs('Diff')
    expect(wrapper.findComponent(ObservatoryDiffViewer).exists()).toBe(true)
    store.selectPanel('Runtime')
    await nextTick()
    expect(wrapper.findComponent(ObservatoryDiffViewer).exists()).toBe(false)
    expect(wrapper.findAll('.content-card')).toHaveLength(6)
  })

  it('switches from diff viewer back to dashboard when Overview is re-selected', async () => {
    const store = useObservatoryStore()
    const wrapper = mountContentAs('Diff')
    expect(wrapper.findComponent(ObservatoryDiffViewer).exists()).toBe(true)
    store.selectPanel('Overview')
    await nextTick()
    expect(wrapper.findComponent(ObservatoryDiffViewer).exists()).toBe(false)
    expect(wrapper.findComponent(ObservatoryOverview).exists()).toBe(true)
  })

  it('includes an Overview card in the placeholder grid', () => {
    const wrapper = mountContentAs('Runtime')
    expect(wrapper.text()).toContain('Overview')
  })

  it('includes a Trace card', () => {
    const wrapper = mountContentAs('Runtime')
    expect(wrapper.text()).toContain('Trace')
  })

  it('includes a Timeline card', () => {
    const wrapper = mountContentAs('Runtime')
    expect(wrapper.text()).toContain('Timeline')
  })

  it('includes a History card', () => {
    const wrapper = mountContentAs('Runtime')
    expect(wrapper.text()).toContain('History')
  })

  it('includes a Diff card', () => {
    const wrapper = mountContentAs('Runtime')
    expect(wrapper.text()).toContain('Diff')
  })

  it('includes a Runtime card', () => {
    const wrapper = mountContentAs('Runtime')
    expect(wrapper.text()).toContain('Runtime')
  })

  it('does not render a Settings card', () => {
    const wrapper = mountContentAs('Runtime')
    const settings = wrapper.findAll('.content-card').filter((c) =>
      c.text().includes('Settings'),
    )
    expect(settings).toHaveLength(0)
  })

  it('each card contains Coming Soon', () => {
    const wrapper = mountContentAs('Runtime')
    for (const card of wrapper.findAll('.content-card')) {
      expect(card.text()).toContain('Coming Soon')
    }
  })

  it('marks the current store panel card as active', async () => {
    const store = useObservatoryStore()
    const wrapper = mountContentAs('Overview')
    store.selectPanel('Runtime')
    await nextTick()
    const active = wrapper.findAll('.content-card').filter((c) =>
      c.classes().includes('content-card--active'),
    )
    expect(active).toHaveLength(1)
    expect(active[0].text()).toContain('Runtime')
  })

  it('marks the selected panel card as active', () => {
    const wrapper = mountContentAs('Runtime')
    const active = wrapper.findAll('.content-card').filter((c) =>
      c.classes().includes('content-card--active'),
    )
    expect(active).toHaveLength(1)
    expect(active[0].text()).toContain('Runtime')
  })

  it('exposes an accessible content landmark', () => {
    const wrapper = mountContent()
    expect(wrapper.find('main').attributes('aria-label')).toBe(
      'Observatory content',
    )
  })
})

// ---------------------------------------------------------------------------
// Observatory Shell
// ---------------------------------------------------------------------------

describe('observatory shell', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders the shell root', () => {
    const wrapper = mountShell()
    expect(wrapper.find('.observatory-shell').exists()).toBe(true)
  })

  it('contains the header', () => {
    const wrapper = mountShell()
    expect(wrapper.findComponent(ObservatoryHeader).exists()).toBe(true)
  })

  it('contains the sidebar', () => {
    const wrapper = mountShell()
    expect(wrapper.findComponent(ObservatorySidebar).exists()).toBe(true)
  })

  it('contains the content area', () => {
    const wrapper = mountShell()
    expect(wrapper.findComponent(ObservatoryContent).exists()).toBe(true)
  })

  it('lays out header across the full top row via grid area classes', () => {
    const wrapper = mountShell()
    expect(
      wrapper.find('.observatory-area--header').attributes('class'),
    ).toContain('observatory-area--header')
    expect(
      wrapper.find('.observatory-area--sidebar').attributes('class'),
    ).toContain('observatory-area--sidebar')
    expect(
      wrapper.find('.observatory-area--content').attributes('class'),
    ).toContain('observatory-area--content')
  })

  it('renders title, status, version and sprint inside the shell', () => {
    const wrapper = mountShell()
    expect(wrapper.text()).toContain('Genesis Observatory')
    expect(wrapper.text()).toContain('Ready')
    expect(wrapper.text()).toContain('v1.29')
    expect(wrapper.text()).toContain('Sprint 6')
  })

  it('selects a panel from the shell sidebar and syncs the content card', async () => {
    const wrapper = mountShell()
    const buttons = wrapper.findAll('button.sidebar-button')
    await buttons[5].trigger('click') // Runtime
    await nextTick()
    const activeContent = wrapper.findAll('.content-card').filter((c) =>
      c.classes().includes('content-card--active'),
    )
    expect(activeContent).toHaveLength(1)
    expect(activeContent[0].text()).toContain('Runtime')
  })

  it('renders the trace viewer when Trace is selected from the sidebar', async () => {
    const wrapper = mountShell()
    const buttons = wrapper.findAll('button.sidebar-button')
    await buttons[1].trigger('click') // Trace
    await nextTick()
    expect(wrapper.findComponent(ObservatoryTraceViewer).exists()).toBe(true)
    expect(wrapper.findAll('.content-card')).toHaveLength(0)
  })

  it('returns to the placeholder grid when a non-Overview non-Trace non-Timeline non-History non-Diff panel is selected', async () => {
    const wrapper = mountShell()
    const buttons = wrapper.findAll('button.sidebar-button')
    await buttons[1].trigger('click') // Trace
    await nextTick()
    expect(wrapper.findComponent(ObservatoryTraceViewer).exists()).toBe(true)
    await buttons[5].trigger('click') // Runtime
    await nextTick()
    expect(wrapper.findComponent(ObservatoryTraceViewer).exists()).toBe(false)
    expect(wrapper.findAll('.content-card')).toHaveLength(6)
  })

  it('renders the timeline viewer when Timeline is selected from the sidebar', async () => {
    const wrapper = mountShell()
    const buttons = wrapper.findAll('button.sidebar-button')
    await buttons[2].trigger('click') // Timeline
    await nextTick()
    expect(wrapper.findComponent(ObservatoryTimelineViewer).exists()).toBe(true)
    expect(wrapper.findAll('.content-card')).toHaveLength(0)
  })

  it('switches from the trace viewer to the timeline viewer via the sidebar', async () => {
    const wrapper = mountShell()
    const buttons = wrapper.findAll('button.sidebar-button')
    await buttons[1].trigger('click') // Trace
    await nextTick()
    expect(wrapper.findComponent(ObservatoryTraceViewer).exists()).toBe(true)
    await buttons[2].trigger('click') // Timeline
    await nextTick()
    expect(wrapper.findComponent(ObservatoryTraceViewer).exists()).toBe(false)
    expect(wrapper.findComponent(ObservatoryTimelineViewer).exists()).toBe(true)
  })

  it('renders the history viewer when History is selected from the sidebar', async () => {
    const wrapper = mountShell()
    const buttons = wrapper.findAll('button.sidebar-button')
    await buttons[3].trigger('click') // History
    await nextTick()
    expect(wrapper.findComponent(ObservatoryHistoryViewer).exists()).toBe(true)
    expect(wrapper.findAll('.content-card')).toHaveLength(0)
  })

  it('switches from the timeline viewer to the history viewer via the sidebar', async () => {
    const wrapper = mountShell()
    const buttons = wrapper.findAll('button.sidebar-button')
    await buttons[2].trigger('click') // Timeline
    await nextTick()
    expect(wrapper.findComponent(ObservatoryTimelineViewer).exists()).toBe(true)
    await buttons[3].trigger('click') // History
    await nextTick()
    expect(wrapper.findComponent(ObservatoryTimelineViewer).exists()).toBe(false)
    expect(wrapper.findComponent(ObservatoryHistoryViewer).exists()).toBe(true)
  })

  it('switches from the history viewer to the placeholder grid via the sidebar', async () => {
    const wrapper = mountShell()
    const buttons = wrapper.findAll('button.sidebar-button')
    await buttons[3].trigger('click') // History
    await nextTick()
    expect(wrapper.findComponent(ObservatoryHistoryViewer).exists()).toBe(true)
    await buttons[5].trigger('click') // Runtime
    await nextTick()
    expect(wrapper.findComponent(ObservatoryHistoryViewer).exists()).toBe(false)
    expect(wrapper.findAll('.content-card')).toHaveLength(6)
  })

  it('renders the diff viewer when Diff is selected from the sidebar', async () => {
    const wrapper = mountShell()
    const buttons = wrapper.findAll('button.sidebar-button')
    await buttons[4].trigger('click') // Diff
    await nextTick()
    expect(wrapper.findComponent(ObservatoryDiffViewer).exists()).toBe(true)
    expect(wrapper.findAll('.content-card')).toHaveLength(0)
  })

  it('switches from the history viewer to the diff viewer via the sidebar', async () => {
    const wrapper = mountShell()
    const buttons = wrapper.findAll('button.sidebar-button')
    await buttons[3].trigger('click') // History
    await nextTick()
    expect(wrapper.findComponent(ObservatoryHistoryViewer).exists()).toBe(true)
    await buttons[4].trigger('click') // Diff
    await nextTick()
    expect(wrapper.findComponent(ObservatoryHistoryViewer).exists()).toBe(false)
    expect(wrapper.findComponent(ObservatoryDiffViewer).exists()).toBe(true)
  })

  it('switches from the diff viewer to the placeholder grid via the sidebar', async () => {
    const wrapper = mountShell()
    const buttons = wrapper.findAll('button.sidebar-button')
    await buttons[4].trigger('click') // Diff
    await nextTick()
    expect(wrapper.findComponent(ObservatoryDiffViewer).exists()).toBe(true)
    await buttons[5].trigger('click') // Runtime
    await nextTick()
    expect(wrapper.findComponent(ObservatoryDiffViewer).exists()).toBe(false)
    expect(wrapper.findAll('.content-card')).toHaveLength(6)
  })
})